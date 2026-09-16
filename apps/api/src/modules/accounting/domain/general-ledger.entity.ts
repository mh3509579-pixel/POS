export interface GeneralLedger {
  id: number;
  account_id: number;
  journal_entry_id: number;
  entry_date: Date;
  debit: number;
  credit: number;
  balance: number;
  description: string | null;
  created_at: Date;
}

export interface AccountBalance {
  id: number;
  account_id: number;
  debit_balance: number;
  credit_balance: number;
  net_balance: number;
  last_updated: Date;
}

export interface LedgerEntryWithDetails extends GeneralLedger {
  account_code: string;
  account_name: string;
  account_type: string;
  entry_number: string;
}

export interface TrialBalanceRow {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  total_debit: number;
  total_credit: number;
}
