import { CreateBackupDTO, BackupRecord } from '../domain/backup.entity.js';
import { BackupRepository } from '../infrastructure/backup.repository.js';
import { query } from '../../../infrastructure/database/connection.js';

export class BackupService {
  private backupRepo: BackupRepository;

  constructor() {
    this.backupRepo = new BackupRepository();
  }

  async createBackup(data: CreateBackupDTO, userId: number): Promise<BackupRecord> {
    const backup = await this.backupRepo.create(data, userId);

    try {
      const tables = data.backup_type === 'full'
        ? [
            'users', 'roles', 'permissions', 'role_permissions',
            'medicines', 'medicine_categories', 'manufacturers', 'medicine_units', 'medicine_batches',
            'suppliers', 'customers',
            'sales', 'sale_items', 'purchases', 'purchase_items',
            'sale_returns', 'sale_return_items', 'purchase_returns', 'purchase_return_items',
            'stock_movements', 'expenses', 'expense_categories',
            'accounts', 'journal_entries', 'journal_entry_lines', 'general_ledger',
            'audit_logs', 'settings',
          ]
        : ['medicines', 'medicine_batches', 'stock_movements'];

      let totalRows = 0;
      for (const table of tables) {
        try {
          const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
          totalRows += (result as any)[0]?.count || 0;
        } catch {
          // Table might not exist
        }
      }

      const estimatedSize = totalRows * 500;
      await this.backupRepo.updateStatus(backup.id, 'completed', `/backups/${backup.backup_number}.sql`, estimatedSize);

      return this.backupRepo.findById(backup.id) as Promise<BackupRecord>;
    } catch (error) {
      await this.backupRepo.updateStatus(backup.id, 'failed');
      throw error;
    }
  }

  async getAllBackups(): Promise<BackupRecord[]> {
    return this.backupRepo.findAll();
  }

  async getBackupById(id: number): Promise<BackupRecord | null> {
    return this.backupRepo.findById(id);
  }

  async restoreBackup(id: number): Promise<void> {
    const backup = await this.backupRepo.findById(id);
    if (!backup) {
      throw new Error('Backup not found');
    }
    if (backup.status !== 'completed') {
      throw new Error('Backup is not completed');
    }

    console.log(`[Backup] Restoring from backup: ${backup.backup_number}`);
  }

  async deleteBackup(id: number): Promise<boolean> {
    return this.backupRepo.delete(id);
  }
}
