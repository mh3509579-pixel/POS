import { CreateBackupDTO, BackupRecord } from '../domain/backup.entity.js';
import { BackupRepository } from '../infrastructure/backup.repository.js';
import { query, getPool } from '../../../infrastructure/database/connection.js';
import { ValidationError } from '../../sales/domain/sale.rules.js';

/**
 * The only tables a backup may read or restore.
 *
 * Identifiers cannot be passed as SQL parameters, so table names are always
 * interpolated. Restricting them to a hardcoded allow-list is what makes that
 * safe: previously the names came straight out of `backups.notes`, and
 * `POST /api/backup` wrote that column verbatim from `req.body.notes`, so a
 * caller could inject arbitrary SQL (or truncate `users`) via a stored payload.
 */
const BACKUP_TABLES = [
  'users', 'roles', 'permissions', 'role_permissions',
  'medicines', 'medicine_categories', 'manufacturers', 'medicine_units', 'medicine_batches',
  'suppliers', 'customers',
  'sales', 'sale_items', 'purchases', 'purchase_items',
  'sale_returns', 'sale_return_items', 'purchase_returns', 'purchase_return_items',
  'stock_movements', 'expenses', 'expense_categories',
  'accounts', 'journal_entries', 'journal_entry_lines', 'general_ledger',
  'audit_logs', 'settings', 'payments',
] as const;

const INVENTORY_TABLES = ['medicines', 'medicine_batches', 'stock_movements'] as const;

const ALLOWED_TABLES = new Set<string>([...BACKUP_TABLES, ...INVENTORY_TABLES]);

/** Tables restored child-first so foreign keys stay satisfied. */
const RESTORE_ORDER = [
  'roles', 'permissions', 'role_permissions',
  'medicine_categories', 'manufacturers', 'medicine_units', 'medicines',
  'medicine_batches',
  'suppliers', 'customers',
  'purchase_items', 'purchases',
  'sale_items', 'sales',
  'purchase_return_items', 'purchase_returns',
  'sale_return_items', 'sale_returns',
  'stock_movements', 'expenses', 'expense_categories',
  'accounts', 'journal_entry_lines', 'journal_entries', 'general_ledger',
  'payments', 'settings', 'audit_logs', 'users',
];

/**
 * Columns redacted from *exported* backups.
 *
 * This must NOT be applied during restore: `users.password_hash` is NOT NULL,
 * so dropping the column made every full restore abort on the users table. A
 * backup has to be able to bring logins back, so the stored payload is restored
 * verbatim and only the download copy is redacted.
 */
const REDACTED_ON_DOWNLOAD = new Map<string, Set<string>>([['users', new Set(['password_hash'])]]);

function assertAllowedTables(names: string[]): void {
  for (const name of names) {
    if (!ALLOWED_TABLES.has(name)) {
      throw new ValidationError(`Backup payload references a table that is not allowed: ${name}`);
    }
  }
}

/** Validates that every key of a row is a plain identifier for that table. */
function assertSafeColumns(table: string, columns: string[]): void {
  for (const column of columns) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(column)) {
      throw new ValidationError(`Backup payload for "${table}" contains an invalid column name`);
    }
  }
}

export class BackupService {
  private backupRepo: BackupRepository;

  constructor() {
    this.backupRepo = new BackupRepository();
  }

  async createBackup(data: CreateBackupDTO, userId: number): Promise<BackupRecord> {
    const backup = await this.backupRepo.create(data, userId);

    try {
      const tables = data.backup_type === 'full' ? BACKUP_TABLES : INVENTORY_TABLES;

      const backupData: Record<string, any[]> = {};
      for (const table of tables) {
        try {
          const rows = await query<any[]>(`SELECT * FROM \`${table}\``);
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
    const backup = await this.backupRepo.findWithPayload(id);
    if (!backup) {
      throw new Error('Backup not found');
    }
    if (backup.status !== 'completed') {
      throw new Error('Backup is not completed');
    }
    if (!backup.notes) {
      throw new Error('Backup contains no data');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(backup.notes);
    } catch {
      throw new ValidationError('Backup payload is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ValidationError('Backup payload must be an object of table -> rows');
    }

    const backupData = parsed as Record<string, unknown>;

    // Reject any table that is not on the allow-list before touching the database.
    assertAllowedTables(Object.keys(backupData));

    const entries = Object.entries(backupData).filter(
      (entry): entry is [string, Record<string, unknown>[]] =>
        Array.isArray(entry[1]) && (entry[1] as unknown[]).every((row) => row && typeof row === 'object' && !Array.isArray(row))
    );

    for (const [table, rows] of entries) {
      if (rows.length === 0) continue;
      assertSafeColumns(table, Object.keys(rows[0]));
    }

    // Restore children before parents, and delete with DELETE rather than
    // TRUNCATE: TRUNCATE performs an implicit COMMIT (so the surrounding
    // transaction could not roll it back) and is rejected outright on
    // FK-referenced tables, which left already-truncated tables empty.
    const ordered = entries
      .filter(([table]) => RESTORE_ORDER.includes(table))
      .sort((a, b) => RESTORE_ORDER.indexOf(a[0]) - RESTORE_ORDER.indexOf(b[0]));

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.beginTransaction();

      for (const [table, rows] of ordered) {
        await connection.query(`DELETE FROM \`${table}\``);

        if (rows.length === 0) continue;

        // Restored verbatim: column filtering here would silently drop NOT NULL
        // columns such as users.password_hash and break the restore.
        const columns = Object.keys(rows[0]);
        if (columns.length === 0) continue;

        const placeholders = columns.map(() => '?').join(', ');
        const insertSql = `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;

        for (const row of rows) {
          const values = columns.map((col) => row[col] ?? null);
          await connection.query(insertSql, values);
        }
      }

      await connection.commit();
    } catch (error) {
      try {
        await connection.rollback();
      } catch {
        // connection may already be invalid
      }
      throw error;
    } finally {
      try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      } catch {
        // ignore
      }
      connection.release();
    }
  }

  async deleteBackup(id: number): Promise<boolean> {
    return this.backupRepo.delete(id);
  }

  /**
   * Returns the backup JSON for download, with credential columns stripped.
   *
   * The download endpoint used to stream the stored payload straight back,
   * which handed every bcrypt hash for every user to anyone holding
   * `backup.view`. The stored payload itself is untouched, so restore still
   * works on this backup.
   */
  async downloadBackup(id: number): Promise<string> {
    const backup = await this.backupRepo.findWithPayload(id);
    if (!backup) {
      throw new Error('Backup not found');
    }
    if (backup.status !== 'completed') {
      throw new Error('Backup is not completed');
    }
    if (!backup.notes) {
      throw new Error('Backup contains no data');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(backup.notes);
    } catch {
      throw new ValidationError('Backup payload is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ValidationError('Backup payload must be an object of table -> rows');
    }

    const redacted: Record<string, unknown> = {};
    for (const [table, rows] of Object.entries(parsed as Record<string, unknown>)) {
      const hidden = REDACTED_ON_DOWNLOAD.get(table);

      if (!hidden || !Array.isArray(rows)) {
        redacted[table] = rows;
        continue;
      }

      redacted[table] = rows.map((row) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
        const copy: Record<string, unknown> = { ...(row as Record<string, unknown>) };
        for (const column of hidden) {
          if (column in copy) copy[column] = '[REDACTED]';
        }
        return copy;
      });
    }

    return JSON.stringify(redacted);
  }
}