import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../../infrastructure/middleware/auth.middleware.js';
import { getPool } from '../../../infrastructure/database/connection.js';
import { logAudit } from '../../../infrastructure/utils/audit-logger.js';

const router = Router();
router.use(authenticate);

router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM settings ORDER BY module, setting_key') as any[];
    const settings: Record<string, any> = {};
    (rows as any[]).forEach((row) => {
      settings[row.setting_key] = {
        value: row.setting_value,
        type: row.setting_type,
        module: row.module,
        description: row.description,
      };
    });
    res.json({ status: 'success', data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
  }
});

router.get('/settings/:module', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT * FROM settings WHERE module = ? ORDER BY setting_key',
      [req.params.module]
    ) as any[];
    const settings: Record<string, any> = {};
    (rows as any[]).forEach((row) => {
      settings[row.setting_key] = {
        value: row.setting_value,
        type: row.setting_type,
        description: row.description,
      };
    });
    res.json({ status: 'success', data: settings });
  } catch (error) {
    console.error('Get module settings error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
  }
});

router.put('/settings', authorize('settings.manage'), async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        "INSERT INTO settings (setting_key, setting_value, module) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
        [key, String(value), req.body._module || null, String(value)]
      );
    }
    await logAudit({
      user_id: (req as any).user?.userId,
      action: 'update',
      entity_type: 'setting',
      new_values: settings,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });
    res.json({ status: 'success', message: 'Settings saved' });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save settings' });
  }
});

export { router as settingsRoutes };
