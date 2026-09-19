import { Router } from 'express';
import {
  getAllBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
} from './backup.controller.js';
import { authenticate, authorize } from '../../../infrastructure/middleware/auth.middleware.js';
import { getPool } from '../../../infrastructure/database/connection.js';
import { BackupService } from '../application/backup.service.js';
import { Request, Response } from 'express';

const router = Router();
const backupService = new BackupService();

router.get('/settings', authenticate, async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query("SELECT * FROM settings WHERE setting_key LIKE 'backup_%'") as any[];
    const settings: Record<string, any> = {};
    rows.forEach((row: any) => { settings[row.setting_key] = row.setting_value; });
    res.json({ status: 'success', data: settings });
  } catch (error) {
    res.json({ status: 'success', data: { auto_backup: 'true', backup_frequency: 'twice_daily' } });
  }
});

router.put('/settings', authenticate, authorize('backup.create'), async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        "INSERT INTO settings (setting_key, setting_value, module) VALUES (?, ?, 'backup') ON DUPLICATE KEY UPDATE setting_value = ?",
        [key, String(value), String(value)]
      );
    }
    res.json({ status: 'success', message: 'Backup settings saved' });
  } catch (error) {
    console.error('Save backup settings error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save settings' });
  }
});

router.get('/', authenticate, authorize('backup.view'), getAllBackups);
router.post('/', authenticate, authorize('backup.create'), createBackup);
router.post('/:id/restore', authenticate, authorize('backup.restore'), restoreBackup);
router.delete('/:id', authenticate, authorize('backup.delete'), deleteBackup);

router.get('/:id/download', authenticate, authorize('backup.view'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const jsonData = await backupService.downloadBackup(Number(id));
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; backup-${id}.json`);
    res.send(jsonData);
  } catch (error: any) {
    console.error('Download backup error:', error);
    if (error.message === 'Backup not found') {
      res.status(404).json({ status: 'error', message: error.message });
      return;
    }
    res.status(500).json({ status: 'error', message: 'Download failed' });
  }
});

export { router as backupRoutes };
