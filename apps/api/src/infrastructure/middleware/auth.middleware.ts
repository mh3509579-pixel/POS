import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../infrastructure/config/env.js';
import { UserRepository } from '../../modules/users/infrastructure/user.repository.js';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    role_id: number;
    permissions?: string[];
  };
}

const userRepo = new UserRepository();

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ status: 'error', message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  let decoded: any;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ status: 'error', message: 'Token expired' });
      return;
    }
    res.status(401).json({ status: 'error', message: 'Invalid token' });
    return;
  }

  let permissions: string[] = [];
  try {
    permissions = await userRepo.getUserPermissions(decoded.userId);
  } catch {
    permissions = [];
  }

  req.user = {
    userId: decoded.userId,
    username: decoded.username,
    role_id: decoded.role_id,
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

    if (req.user.role_id === 1 || req.user.role_id === 2) {
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
