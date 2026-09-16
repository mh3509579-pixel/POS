import { Request, Response, NextFunction } from 'express';
import { BackupService } from '../application/backup.service.js';
import { AuthRequest } from '../../../infrastructure/middleware/auth.middleware.js';

const backupService = new BackupService();

export async function getAllBackups(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const backups = await backupService.getAllBackups();
    res.json({ status: 'success', data: backups });
  } catch (error) {
    next(error);
  }
}

export async function createBackup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { backup_type, notes } = req.body;
    const userId = req.user?.userId || 0;

    const backup = await backupService.createBackup({ backup_type, notes }, userId);
    res.status(201).json({ status: 'success', data: backup });
  } catch (error) {
    next(error);
  }
}

export async function restoreBackup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    await backupService.restoreBackup(id);
    res.json({ status: 'success', message: 'Backup restored successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteBackup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const success = await backupService.deleteBackup(id);
    if (!success) {
      res.status(404).json({ status: 'error', message: 'Backup not found' });
      return;
    }
    res.json({ status: 'success', message: 'Backup deleted' });
  } catch (error) {
    next(error);
  }
}
