import { CreateBackupDTO, BackupRecord } from '../domain/backup.entity.js';
import { BackupRepository } from '../infrastructure/backup.repository.js';
import { query, getPool } from '../../../infrastructure/database/connection.js';

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
            'audit_logs', 'settings', 'payments',
          ]
        : ['medicines', 'medicine_batches', 'stock_movements'];

      const backupData: Record<string, any[]> = {};
      for (const table of tables) {
        try {
          const rows = await query<any[]>(`SELECT * FROM ${table}`);
          backupData[table] = rows;
        } catch {
          // Table might not exist
        }
      }

      const jsonData = JSON.stringify(backupData);
      await this.backupRepo.updateStatus(backup.id, 'completed', undefined, jsonData.length);
      await this.backupRepo.updateNotes(backup.id, jsonData);

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
    if (!backup.notes) {
      throw new Error('Backup contains no data');
    }

    const backupData = JSON.parse(backup.notes) as Record<string, any[]>;
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (const [table, rows] of Object.entries(backupData)) {
        await connection.query(`TRUNCATE TABLE ${table}`);

        if (rows.length === 0) continue;

        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const insertSql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

        for (const row of rows) {
          const values = columns.map((col) => row[col]);
          await connection.query(insertSql, values);
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteBackup(id: number): Promise<boolean> {
    return this.backupRepo.delete(id);
  }

  async downloadBackup(id: number): Promise<string> {
    const backup = await this.backupRepo.findById(id);
    if (!backup) {
      throw new Error('Backup not found');
    }
    if (backup.status !== 'completed') {
      throw new Error('Backup is not completed');
    }
    if (!backup.notes) {
      throw new Error('Backup contains no data');
    }
    return backup.notes;
  }
}
