import { Request, Response, NextFunction } from 'express';
import { NotificationRepository } from '../infrastructure/notification.repository.js';
import { AuthRequest } from '../../../infrastructure/middleware/auth.middleware.js';

const notificationRepo = new NotificationRepository();

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId || 0;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const notifications = await notificationRepo.findByUserId(userId, limit, offset);
    const unreadCount = await notificationRepo.countUnread(userId);

    res.json({ status: 'success', data: notifications, unread_count: unreadCount });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const success = await notificationRepo.markAsRead(id);
    if (!success) {
      res.status(404).json({ status: 'error', message: 'Notification not found' });
      return;
    }
    res.json({ status: 'success', message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId || 0;
    await notificationRepo.markAllAsRead(userId);
    res.json({ status: 'success', message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const success = await notificationRepo.delete(id);
    if (!success) {
      res.status(404).json({ status: 'error', message: 'Notification not found' });
      return;
    }
    res.json({ status: 'success', message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
}
