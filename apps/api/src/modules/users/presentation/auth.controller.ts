import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../domain/auth.service.js';
import { UserRepository } from '../infrastructure/user.repository.js';
import { AuthRequest } from '../../../infrastructure/middleware/auth.middleware.js';
import { parsePagination } from '../../../infrastructure/utils/pagination.js';

const authService = new AuthService();
const userRepo = new UserRepository();

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ status: 'error', message: 'Username and password are required' });
      return;
    }

    const result = await authService.login({ username, password });
    res.json({ status: 'success', data: result });
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ status: 'error', message: error.message });
      return;
    }
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, email, password, full_name, phone, role_id } = req.body;

    if (!username || !email || !password || !full_name || !role_id) {
      res.status(400).json({ status: 'error', message: 'Missing required fields' });
      return;
    }

    const user = await authService.register({ username, email, password, full_name, phone, role_id });
    res.status(201).json({ status: 'success', data: user });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ status: 'error', message: error.message });
      return;
    }
    next(error);
  }
}

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Not authenticated' });
      return;
    }

    const user = await userRepo.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ status: 'error', message: 'User not found' });
      return;
    }

    res.json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Not authenticated' });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({ status: 'error', message: 'Old and new passwords are required' });
      return;
    }

    await authService.changePassword(req.user.userId, oldPassword, newPassword);
    res.json({ status: 'success', message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ status: 'error', message: error.message });
      return;
    }
    next(error);
  }
}

export async function getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit, offset } = parsePagination(req.query.limit, req.query.offset);
    const users = await userRepo.findAll(limit, offset);
    const total = await userRepo.count();
    res.json({ status: 'success', data: users, total });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userRepo.findById(parseInt(req.params.id));
    if (!user) {
      res.status(404).json({ status: 'error', message: 'User not found' });
      return;
    }
    res.json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const targetId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      res.status(400).json({ status: 'error', message: 'Invalid user id' });
      return;
    }

    const caller = req.user!;

    // Changing a role is a privilege-escalation surface of its own, so it needs
    // its own permission rather than riding along with `users.update`. Without
    // this, any caller holding users.update could set any role_id to 1.
    const wantsRoleChange = req.body?.role_id !== undefined;
    const wantsActiveChange = req.body?.is_active !== undefined;

    if ((wantsRoleChange && !caller.permissions?.includes('users.roles.manage') && !isSuperAdmin(caller.role_id)) ||
        (wantsActiveChange && !caller.permissions?.includes('users.update') && !isSuperAdmin(caller.role_id))) {
      res.status(403).json({ status: 'error', message: 'Insufficient permissions to change roles or account status' });
      return;
    }

    if (targetId === caller.userId && wantsActiveChange && req.body.is_active === false) {
      res.status(400).json({ status: 'error', message: 'You cannot deactivate your own account' });
      return;
    }

    const target = await userRepo.findById(targetId);
    if (!target) {
      res.status(404).json({ status: 'error', message: 'User not found' });
      return;
    }

    // Guard against removing the last account that can administer the system.
    const losingAdmin =
      wantsRoleChange && Number(req.body.role_id) !== Number(target.role_id) && Number(target.role_id) <= 2;

    if (losingAdmin) {
      const remaining = await countAdminsExcluding(targetId, target.role_id);
      if (remaining === 0) {
        res.status(400).json({ status: 'error', message: 'Cannot demote the last administrator' });
        return;
      }
    }

    // Never let a non-super-admin grant a super-admin role.
    if (wantsRoleChange && Number(req.body.role_id) <= 2 && !isSuperAdmin(caller.role_id)) {
      res.status(403).json({ status: 'error', message: 'Insufficient permissions to assign an administrator role' });
      return;
    }

    const payload: Record<string, unknown> = {};
    if (req.body?.email !== undefined) payload.email = req.body.email;
    if (req.body?.full_name !== undefined) payload.full_name = req.body.full_name;
    if (req.body?.phone !== undefined) payload.phone = req.body.phone;
    if (req.body?.role_id !== undefined) payload.role_id = req.body.role_id;
    if (req.body?.is_active !== undefined) payload.is_active = req.body.is_active;

    const user = await userRepo.update(targetId, payload);
    res.json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const targetId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      res.status(400).json({ status: 'error', message: 'Invalid user id' });
      return;
    }

    if (targetId === req.user!.userId) {
      res.status(400).json({ status: 'error', message: 'You cannot delete your own account' });
      return;
    }

    const target = await userRepo.findById(targetId);
    if (!target) {
      res.status(404).json({ status: 'error', message: 'User not found' });
      return;
    }

    if (Number(target.role_id) <= 2) {
      const remaining = await countAdminsExcluding(targetId, target.role_id);
      if (remaining === 0) {
        res.status(400).json({ status: 'error', message: 'Cannot delete the last administrator' });
        return;
      }
    }

    // sales, purchases and audit_logs reference users ON DELETE RESTRICT, so a
    // hard DELETE returned a raw 500 for anyone with transaction history.
    // Deactivate instead, which preserves the audit trail.
    const deactivated = await userRepo.setActive(targetId, false);
    if (!deactivated) {
      res.status(404).json({ status: 'error', message: 'User not found' });
      return;
    }

    res.json({
      status: 'success',
      message: 'User deactivated',
      detail:
        'The account was deactivated rather than deleted so its sales, purchase and audit history stays intact.',
    });
  } catch (error) {
    next(error);
  }
}

function isSuperAdmin(roleId: number): boolean {
  return roleId === 1 || roleId === 2;
}

async function countAdminsExcluding(excludeUserId: number, roleId: number): Promise<number> {
  return userRepo.countActiveWithRoleExcluding(roleId, excludeUserId);
}

export async function getAllRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roles = await userRepo.getAllRoles();
    res.json({ status: 'success', data: roles });
  } catch (error) {
    next(error);
  }
}
