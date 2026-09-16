export type JournalEntryStatus = 'draft' | 'posted' | 'voided';

export interface JournalEntry {
  id: number;
  entry_number: string;
  entry_date: Date;
  description: string;
  reference_type: string | null;
  reference_id: number | null;
  status: JournalEntryStatus;
  created_by: number | null;
  posted_at: Date | null;
  voided_at: Date | null;
  void_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface JournalEntryLine {
  id: number;
  journal_entry_id: number;
  account_id: number;
  debit: number;
  credit: number;
  description: string | null;
  created_at: Date;
}

export interface CreateJournalEntryDTO {
  entry_date: Date;
  description: string;
  reference_type?: string;
  reference_id?: number;
  lines: CreateJournalEntryLineDTO[];
  created_by?: number;
}

export interface CreateJournalEntryLineDTO {
  account_id: number;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntryWithLines extends JournalEntry {
  lines: JournalEntryLine[];
}
