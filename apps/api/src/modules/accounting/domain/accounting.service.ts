import { CreateJournalEntryDTO, JournalEntryWithLines } from '../domain/journal-entry.entity.js';

export interface IAccountingService {
  createJournalEntry(data: CreateJournalEntryDTO): Promise<JournalEntryWithLines>;
  postJournalEntry(id: number): Promise<JournalEntryWithLines>;
  voidJournalEntry(id: number, reason: string): Promise<JournalEntryWithLines>;
  getAccountBalance(accountId: number): Promise<number>;
  getTrialBalance(startDate: Date, endDate: Date): Promise<any[]>;
  getAccountStatement(accountId: number, startDate: Date, endDate: Date): Promise<any>;
  recordSale(saleId: number, amount: number, paymentMethod: string, lines: { account_id: number; debit: number; credit: number }[]): Promise<JournalEntryWithLines>;
  recordPurchase(purchaseId: number, amount: number, supplierId: number, lines: { account_id: number; debit: number; credit: number }[]): Promise<JournalEntryWithLines>;
  recordExpense(expenseId: number, amount: number, categoryId: number, lines: { account_id: number; debit: number; credit: number }[]): Promise<JournalEntryWithLines>;
}
