import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../../../infrastructure/middleware/auth.middleware.js';
import { getPool, withTransaction } from '../../../infrastructure/database/connection.js';
import { logAudit } from '../../../infrastructure/utils/audit-logger.js';
import { ValidationError } from '../../sales/domain/sale.rules.js';

const router = Router();
router.use(authenticate);

/**
 * Setting keys the API accepts. Previously *any* key could be written, so a
 * caller with settings access could invent arbitrary settings rows.
 */
const ALLOWED_SETTING_KEYS = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/i;

const VALID_TYPES = new Set(['string', 'number', 'boolean', 'json']);

function serializeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const [rows] = (await pool.query(
      'SELECT setting_key, setting_value, setting_type, module, is_public, description FROM settings ORDER BY module, setting_key'
    )) as any[];

    const settings: Record<string, any> = {};
    rows.forEach((row: any) => {
      settings[row.setting_key] = {
        value: row.setting_value,
        type: row.setting_type,
        module: row.module,
        is_public: Boolean(row.is_public),
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
    const [rows] = (await pool.query(
      'SELECT setting_key, setting_value, setting_type, description FROM settings WHERE module = ? ORDER BY setting_key',
      [req.params.module]
    )) as any[];

    const settings: Record<string, any> = {};
    rows.forEach((row: any) => {
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

router.put('/settings', authorize('settings.update'), async (req: AuthRequest, res: Response) => {
  try {
    // `_module` is metadata about the request, not a setting. Iterating
    // req.body directly persisted a junk setting literally named "_module".
    const { _module, ...incoming } = (req.body ?? {}) as Record<string, unknown>;

    const entries = Object.entries(incoming);

    if (entries.length === 0) {
      res.status(400).json({ status: 'error', message: 'No settings supplied' });
      return;
    }

    for (const [key] of entries) {
      if (!ALLOWED_SETTING_KEYS.test(key)) {
        throw new ValidationError(`Invalid setting key: ${key}`);
      }
    }

    const moduleName = typeof _module === 'string' && _module ? _module : null;

    await withTransaction(async (tx) => {
      for (const [key, value] of entries) {
        await tx.execute(
          `INSERT INTO settings (setting_key, setting_value, module)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), module = VALUES(module)`,
          [key, serializeValue(value), moduleName]
        );
      }
    });

    try {
      await logAudit({
        user_id: req.user!.userId,
        action: 'update',
        entity_type: 'setting',
        new_values: incoming,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
      });
    } catch (auditError) {
      console.warn('[Settings] audit log failed:', auditError);
    }

    res.json({ status: 'success', message: 'Settings saved' });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ status: 'error', message: error.message });
      return;
    }
    console.error('Save settings error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save settings' });
  }
});

export { router as settingsRoutes };