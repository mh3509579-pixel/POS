import {
  JournalEntry,
  JournalEntryLine,
  CreateJournalEntryDTO,
  JournalEntryWithLines,
} from '../../modules/accounting/domain/journal-entry.entity.js';
import { IJournalEntryRepository } from '../../modules/accounting/domain/journal-entry.repository.js';
import { query, queryOne, execute, beginTransaction, commitTransaction, rollbackTransaction } from '../database/connection.js';

export class JournalEntryRepository implements IJournalEntryRepository {
  async findById(id: number): Promise<JournalEntryWithLines | null> {
    const entry = await queryOne<JournalEntry>('SELECT * FROM journal_entries WHERE id = ?', [id]);
    if (!entry) return null;

    const lines = await query<JournalEntryLine[]>(
      'SELECT * FROM journal_entry_lines WHERE journal_entry_id = ?',
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

    const lines = await query<JournalEntryLine[]>(
      'SELECT * FROM journal_entry_lines WHERE journal_entry_id = ?',
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

    const lines = await query<JournalEntryLine[]>(
      'SELECT * FROM journal_entry_lines WHERE journal_entry_id = ?',
      [entry.id]
    );

    return { ...entry, lines };
  }

  async create(data: CreateJournalEntryDTO): Promise<JournalEntryWithLines> {
    const connection = await beginTransaction();

    try {
      const entryNumber = await this.getNextEntryNumber();

      const entryResult = await execute(
        `INSERT INTO journal_entries (entry_number, entry_date, description, reference_type, reference_id, status, created_by)
         VALUES (?, ?, ?, ?, ?, 'draft', ?)`,
        [entryNumber, data.entry_date, data.description, data.reference_type || null, data.reference_id || null, data.created_by || null]
      );

      const entryId = entryResult.insertId;

      for (const line of data.lines) {
        await execute(
          'INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)',
          [entryId, line.account_id, line.debit, line.credit, line.description || null]
        );
      }

      await commitTransaction(connection);

      return this.findById(entryId) as Promise<JournalEntryWithLines>;
    } catch (error) {
      await rollbackTransaction(connection);
      throw error;
    }
  }

  async updateStatus(id: number, status: string, reason?: string): Promise<JournalEntry | null> {
    const now = new Date();
    if (status === 'posted') {
      await execute(
        'UPDATE journal_entries SET status = ?, posted_at = ? WHERE id = ?',
        [status, now, id]
      );
    } else if (status === 'voided') {
      await execute(
        'UPDATE journal_entries SET status = ?, voided_at = ?, void_reason = ? WHERE id = ?',
        [status, now, reason || null, id]
      );
    } else {
      await execute('UPDATE journal_entries SET status = ? WHERE id = ?', [status, id]);
    }
    return queryOne<JournalEntry>('SELECT * FROM journal_entries WHERE id = ?', [id]);
  }

  async getNextEntryNumber(): Promise<string> {
    const last = await queryOne<{ entry_number: string }>(
      "SELECT entry_number FROM journal_entries ORDER BY id DESC LIMIT 1"
    );

    if (!last) {
      return 'JE-2026-000001';
    }

    const parts = last.entry_number.split('-');
    const year = parts[1];
    const seq = parseInt(parts[2]) + 1;
    return `JE-${year}-${String(seq).padStart(6, '0')}`;
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
