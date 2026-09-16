import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../domain/auth.service.js';
import { UserRepository } from '../infrastructure/user.repository.js';
import { AuthRequest } from '../../../infrastructure/middleware/auth.middleware.js';

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
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
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

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userRepo.update(parseInt(req.params.id), req.body);
    if (!user) {
      res.status(404).json({ status: 'error', message: 'User not found' });
      return;
    }
    res.json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const success = await userRepo.delete(parseInt(req.params.id));
    if (!success) {
      res.status(404).json({ status: 'error', message: 'User not found' });
      return;
    }
    res.json({ status: 'success', message: 'User deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getAllRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roles = await userRepo.getAllRoles();
    res.json({ status: 'success', data: roles });
  } catch (error) {
    next(error);
  }
}
