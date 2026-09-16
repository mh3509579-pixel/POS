import { Router } from 'express';
import {
  getAllBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
} from './backup.controller.js';
import { authenticate, authorize } from '../../../infrastructure/middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('backup.view'), getAllBackups);
router.post('/', authenticate, authorize('backup.create'), createBackup);
router.post('/:id/restore', authenticate, authorize('backup.restore'), restoreBackup);
router.delete('/:id', authenticate, authorize('backup.delete'), deleteBackup);

export { router as backupRoutes };
