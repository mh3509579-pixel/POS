import { Router } from 'express';
import {
  login,
  register,
  getProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllRoles,
} from './auth.controller.js';
import { authenticate, authorize } from '../../../infrastructure/middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', authenticate, authorize('users.create'), register);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.post('/change-password', authenticate, changePassword);

// User management
router.get('/users', authenticate, authorize('users.view'), getAllUsers);
router.get('/users/:id', authenticate, authorize('users.view'), getUserById);
router.put('/users/:id', authenticate, authorize('users.update'), updateUser);
router.delete('/users/:id', authenticate, authorize('users.delete'), deleteUser);

// Roles
router.get('/roles', authenticate, getAllRoles);

export { router as authRoutes };
