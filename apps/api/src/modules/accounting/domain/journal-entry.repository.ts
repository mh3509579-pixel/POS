import {
  JournalEntry,
  JournalEntryLine,
  CreateJournalEntryDTO,
  JournalEntryWithLines,
} from '../domain/journal-entry.entity.js';

export interface IJournalEntryRepository {
  findById(id: number): Promise<JournalEntryWithLines | null>;
  findByEntryNumber(entryNumber: string): Promise<JournalEntryWithLines | null>;
  findByDateRange(startDate: Date, endDate: Date): Promise<JournalEntry[]>;
  findByReference(referenceType: string, referenceId: number): Promise<JournalEntryWithLines | null>;
  create(data: CreateJournalEntryDTO): Promise<JournalEntryWithLines>;
  updateStatus(id: number, status: string, reason?: string): Promise<JournalEntry | null>;
  getNextEntryNumber(): Promise<string>;
  findAll(limit?: number, offset?: number): Promise<JournalEntry[]>;
  count(): Promise<number>;
}
