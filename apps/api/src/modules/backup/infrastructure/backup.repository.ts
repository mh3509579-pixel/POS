import { BackupRecord, CreateBackupDTO } from '../domain/backup.entity.js';
import { query, queryOne, execute } from '../../../infrastructure/database/connection.js';

export class BackupRepository {
  async findById(id: number): Promise<BackupRecord | null> {
    return queryOne<BackupRecord>('SELECT * FROM backups WHERE id = ?', [id]);
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<BackupRecord[]> {
    return query<BackupRecord[]>(
      'SELECT * FROM backups ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  async create(data: CreateBackupDTO, userId: number, filePath?: string, fileSize?: number): Promise<BackupRecord> {
    const result = await execute(
      `INSERT INTO backups (backup_number, backup_type, status, file_path, file_size, notes, created_by)
       VALUES (?, ?, 'completed', ?, ?, ?, ?)`,
      [
        `BK-${Date.now()}`,
        data.backup_type,
        filePath || null,
        fileSize || null,
        data.notes || null,
        userId,
      ]
    );

    return this.findById(result.insertId) as Promise<BackupRecord>;
  }

  async updateStatus(id: number, status: string, filePath?: string, fileSize?: number): Promise<void> {
    const fields: string[] = ['status = ?'];
    const values: any[] = [status];

    if (filePath) {
      fields.push('file_path = ?');
      values.push(filePath);
    }
    if (fileSize !== undefined) {
      fields.push('file_size = ?');
      values.push(fileSize);
    }

    values.push(id);
    await execute(`UPDATE backups SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  async updateNotes(id: number, notes: string): Promise<void> {
    await execute('UPDATE backups SET notes = ? WHERE id = ?', [notes, id]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await execute('DELETE FROM backups WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async getLatest(): Promise<BackupRecord | null> {
    return queryOne<BackupRecord>(
      'SELECT * FROM backups WHERE status = ? ORDER BY created_at DESC LIMIT 1',
      ['completed']
    );
  }
}
