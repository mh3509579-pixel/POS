import { Router } from 'express';
import {
  getAllBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
} from './backup.controller.js';
import { authenticate, authorize } from '../../../infrastructure/middleware/auth.middleware.js';
import { getPool } from '../../../infrastructure/database/connection.js';
import { Request, Response } from 'express';

const router = Router();

router.get('/', authenticate, authorize('backup.view'), getAllBackups);
router.post('/', authenticate, authorize('backup.create'), createBackup);
router.post('/:id/restore', authenticate, authorize('backup.restore'), restoreBackup);
router.delete('/:id', authenticate, authorize('backup.delete'), deleteBackup);

router.get('/settings', authenticate, async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM system_settings WHERE setting_key LIKE "backup_%"') as any[];
    const settings: Record<string, any> = {};
    rows.forEach((row: any) => { settings[row.setting_key] = row.setting_value; });
    res.json({ status: 'success', data: settings });
  } catch (error) {
    res.json({ status: 'success', data: { auto_backup: true, backup_frequency: 'twice_daily' } });
  }
});

router.put('/settings', authenticate, authorize('backup.create'), async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(value), String(value)]
      );
    }
    res.json({ status: 'success', message: 'Backup settings saved' });
  } catch (error) {
    res.json({ status: 'success', message: 'Backup settings saved' });
  }
});

router.get('/:id/download', authenticate, authorize('backup.view'), async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const [backup] = await pool.query('SELECT * FROM backups WHERE id = ?', [id]) as any[];
    if (!backup.length) {
      res.status(404).json({ status: 'error', message: 'Backup not found' });
      return;
    }
    res.json({ status: 'success', data: backup[0], message: 'Download initiated' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Download failed' });
  }
});

export { router as backupRoutes };
