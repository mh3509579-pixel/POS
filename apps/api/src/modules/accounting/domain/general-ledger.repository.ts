import { GeneralLedger, AccountBalance, LedgerEntryWithDetails, TrialBalanceRow } from '../domain/general-ledger.entity.js';

export interface IGeneralLedgerRepository {
  findByAccountId(accountId: number, startDate?: Date, endDate?: Date): Promise<LedgerEntryWithDetails[]>;
  getAccountBalance(accountId: number): Promise<AccountBalance | null>;
  getAllAccountBalances(): Promise<AccountBalance[]>;
  updateAccountBalance(accountId: number, debit: number, credit: number): Promise<AccountBalance>;
  getTrialBalance(startDate: Date, endDate: Date): Promise<TrialBalanceRow[]>;
  getAccountStatement(accountId: number, startDate: Date, endDate: Date): Promise<{
    opening_balance: number;
    entries: LedgerEntryWithDetails[];
    closing_balance: number;
  }>;
}
