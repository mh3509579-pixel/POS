import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from './notification.controller.js';
import { authenticate } from '../../../infrastructure/middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.put('/read-all', authenticate, markAllAsRead);
router.put('/:id/read', authenticate, markAsRead);
router.delete('/:id', authenticate, deleteNotification);

export { router as notificationRoutes };
