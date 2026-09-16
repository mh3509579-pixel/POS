import {
  JournalEntry,
  CreateJournalEntryDTO,
  JournalEntryWithLines,
} from '../domain/journal-entry.entity.js';
import { IJournalEntryRepository } from '../domain/journal-entry.repository.js';
import { query, queryOne, execute, beginTransaction, commitTransaction, rollbackTransaction } from '../../../infrastructure/database/connection.js';

export class JournalEntryRepository implements IJournalEntryRepository {
  async findById(id: number): Promise<JournalEntryWithLines | null> {
    const entry = await queryOne<JournalEntry>('SELECT * FROM journal_entries WHERE id = ?', [id]);
    if (!entry) return null;

    const lines = await query<any[]>(
      'SELECT * FROM journal_entry_lines WHERE journal_entry_id = ? ORDER BY id',
      [id]
    );

    return { ...entry, lines };
  }

  async findByEntryNumber(entryNumber: string): Promise<JournalEntryWithLines | null> {
    const entry = await queryOne<JournalEntry>(
      'SELECT * FROM journal_entries WHERE entry_number = ?',
      [entryNumber]
    );
    if (!entry) return null;

    const lines = await query<any[]>(
      'SELECT * FROM journal_entry_lines WHERE journal_entry_id = ? ORDER BY id',
      [entry.id]
    );

    return { ...entry, lines };
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<JournalEntry[]> {
    return query<JournalEntry[]>(
      'SELECT * FROM journal_entries WHERE entry_date BETWEEN ? AND ? ORDER BY entry_date DESC',
      [startDate, endDate]
    );
  }

  async findByReference(referenceType: string, referenceId: number): Promise<JournalEntryWithLines | null> {
    const entry = await queryOne<JournalEntry>(
      'SELECT * FROM journal_entries WHERE reference_type = ? AND reference_id = ?',
      [referenceType, referenceId]
    );
    if (!entry) return null;

    const lines = await query<any[]>(
      'SELECT * FROM journal_entry_lines WHERE journal_entry_id = ? ORDER BY id',
      [entry.id]
    );

    return { ...entry, lines };
  }

  async create(data: CreateJournalEntryDTO): Promise<JournalEntryWithLines> {
    const conn = await beginTransaction();
    try {
      const entryNumber = await this.getNextEntryNumber();

      const result = await execute(
        `INSERT INTO journal_entries (entry_number, entry_date, description, reference_type, reference_id, status)
         VALUES (?, ?, ?, ?, ?, 'draft')`,
        [
          entryNumber,
          data.entry_date,
          data.description,
          data.reference_type || null,
          data.reference_id || null,
        ]
      );

      const entryId = result.insertId;

      for (const line of data.lines) {
        await execute(
          `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
           VALUES (?, ?, ?, ?, ?)`,
          [entryId, line.account_id, line.debit, line.credit, line.description || null]
        );
      }

      await commitTransaction(conn);

      return this.findById(entryId) as Promise<JournalEntryWithLines>;
    } catch (error) {
      await rollbackTransaction(conn);
      throw error;
    }
  }

  async updateStatus(id: number, status: string, reason?: string): Promise<JournalEntry | null> {
    const fields = ['status = ?'];
    const values: any[] = [status];

    if (status === 'posted') {
      fields.push('posted_at = NOW()');
    } else if (status === 'voided') {
      fields.push('voided_at = NOW()');
      if (reason) {
        fields.push('void_reason = ?');
        values.push(reason);
      }
    }

    values.push(id);
    await execute(`UPDATE journal_entries SET ${fields.join(', ')} WHERE id = ?`, values);
    return queryOne<JournalEntry>('SELECT * FROM journal_entries WHERE id = ?', [id]);
  }

  async getNextEntryNumber(): Promise<string> {
    const result = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM journal_entries'
    );
    const nextNum = (result?.count || 0) + 1;
    return `JE-${new Date().getFullYear()}-${String(nextNum).padStart(6, '0')}`;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<JournalEntry[]> {
    return query<JournalEntry[]>(
      'SELECT * FROM journal_entries ORDER BY entry_date DESC, id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM journal_entries');
    return result?.count || 0;
  }
}
