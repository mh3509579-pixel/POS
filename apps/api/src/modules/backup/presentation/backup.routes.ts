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
import { ValidationError } from '../../sales/domain/sale.rules.js';
import { Request, Response } from 'express';

const router = Router();
const backupService = new BackupService();

router.get('/settings', authenticate, authorize('backup.view'), async (_req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const [rows] = (await pool.query(
      'SELECT setting_key, setting_value FROM settings WHERE module = ? ORDER BY setting_key',
      ['backup']
    )) as any[];
    const settings: Record<string, any> = {};
    rows.forEach((row: any) => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json({ status: 'success', data: settings });
  } catch (error) {
    console.error('Get backup settings error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch backup settings' });
  }
});

/** Only these keys may be written into the backup settings module. */
const ALLOWED_BACKUP_SETTING_KEYS = new Set(['backup_enabled', 'backup_frequency', 'backup_retention_days']);

router.put('/settings', authenticate, authorize('backup.create'), async (req: Request, res: Response) => {
  try {
    const entries = Object.entries((req.body ?? {}) as Record<string, unknown>);

    if (entries.length === 0) {
      res.status(400).json({ status: 'error', message: 'No settings supplied' });
      return;
    }

    const invalid = entries.filter(([key]) => !ALLOWED_BACKUP_SETTING_KEYS.has(key));
    if (invalid.length > 0) {
      res.status(400).json({
        status: 'error',
        message: `Unsupported backup setting(s): ${invalid.map(([key]) => key).join(', ')}`,
      });
      return;
    }

    const pool = await getPool();
    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value, module)
         VALUES (?, ?, 'backup')
         ON DUPLICATE KEY UPDATE setting_value = ?`,
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
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ status: 'error', message: 'Invalid backup id' });
      return;
    }

    const jsonData = await backupService.downloadBackup(id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; backup-${id}.json`);
    res.send(jsonData);
  } catch (error: any) {
    console.error('Download backup error:', error);
    if (error instanceof ValidationError) {
      res.status(400).json({ status: 'error', message: error.message });
      return;
    }
    if (error.message === 'Backup not found') {
      res.status(404).json({ status: 'error', message: error.message });
      return;
    }
    if (error.message === 'Backup is not completed' || error.message === 'Backup contains no data') {
      res.status(409).json({ status: 'error', message: error.message });
      return;
    }
    res.status(500).json({ status: 'error', message: 'Download failed' });
  }
});

export { router as backupRoutes };
