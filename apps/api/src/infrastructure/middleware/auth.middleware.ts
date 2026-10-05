import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../infrastructure/config/env.js';
import { UserRepository } from '../../modules/users/infrastructure/user.repository.js';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    role_id: number;
    permissions: string[];
  };
}

/** Roles that bypass per-permission checks entirely. */
const SUPER_ADMIN_ROLE_IDS = new Set([1, 2]);

const userRepo = new UserRepository();

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ status: 'error', message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  let decoded: jwt.JwtPayload;
  try {
    // Pin the algorithm: without this an attacker can attempt algorithm
    // confusion (e.g. `alg: none` or an asymmetric key treated as an HMAC secret).
    decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ status: 'error', message: 'Token expired' });
      return;
    }
    res.status(401).json({ status: 'error', message: 'Invalid token' });
    return;
  }

  const userId = Number(decoded.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ status: 'error', message: 'Invalid token' });
    return;
  }

  // Re-read the account so a deactivated, locked or deleted user loses access
  // immediately, and so role_id comes from the database rather than the token
  // (a demoted user must not keep admin powers for the rest of the token's life).
  const account = await userRepo.findActiveAuthContext(userId);
  if (!account) {
    res.status(401).json({ status: 'error', message: 'Account is inactive or no longer exists' });
    return;
  }

  let permissions: string[] = [];
  try {
    permissions = await userRepo.getUserPermissions(userId);
  } catch {
    permissions = [];
  }

  req.user = {
    userId: account.id,
    username: account.username,
    role_id: account.role_id,
    permissions,
  };

  next();
}

export function authorize(...requiredPermissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Not authenticated' });
      return;
    }

    if (SUPER_ADMIN_ROLE_IDS.has(req.user.role_id)) {
      next();
      return;
    }

    if (requiredPermissions.length === 0) {
      next();
      return;
    }

    const hasPermission = requiredPermissions.some((p) => req.user?.permissions?.includes(p));

    if (!hasPermission) {
      res.status(403).json({ status: 'error', message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}