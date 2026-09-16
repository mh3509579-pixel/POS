import { CreateJournalEntryDTO, JournalEntryWithLines } from '../domain/journal-entry.entity.js';
import { IAccountingService } from '../domain/accounting.service.js';
import { IJournalEntryRepository } from '../domain/journal-entry.repository.js';
import { IGeneralLedgerRepository } from '../domain/general-ledger.repository.js';
import { IAccountRepository } from '../domain/account.repository.js';

export class AccountingService implements IAccountingService {
  constructor(
    private journalEntryRepo: IJournalEntryRepository,
    private generalLedgerRepo: IGeneralLedgerRepository,
    private accountRepo: IAccountRepository
  ) {}

  async createJournalEntry(data: CreateJournalEntryDTO): Promise<JournalEntryWithLines> {
    // Validate that debits equal credits
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Total debits must equal total credits');
    }

    // Validate accounts exist
    for (const line of data.lines) {
      const account = await this.accountRepo.findById(line.account_id);
      if (!account) {
        throw new Error(`Account not found: ${line.account_id}`);
      }
    }

    return this.journalEntryRepo.create(data);
  }

  async postJournalEntry(id: number): Promise<JournalEntryWithLines> {
    const entry = await this.journalEntryRepo.findById(id);
    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (entry.status !== 'draft') {
      throw new Error('Only draft entries can be posted');
    }

    // Update general ledger for each line
    for (const line of entry.lines) {
      // Add to general ledger
      await execute(
        `INSERT INTO general_ledger (account_id, journal_entry_id, entry_date, debit, credit, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [line.account_id, entry.id, entry.entry_date, line.debit, line.credit, line.description]
      );

      // Update account balance
      await this.generalLedgerRepo.updateAccountBalance(line.account_id, line.debit, line.credit);
    }

    // Update entry status
    const updated = await this.journalEntryRepo.updateStatus(id, 'posted');
    return this.journalEntryRepo.findById(id) as Promise<JournalEntryWithLines>;
  }

  async voidJournalEntry(id: number, reason: string): Promise<JournalEntryWithLines> {
    const entry = await this.journalEntryRepo.findById(id);
    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (entry.status !== 'posted') {
      throw new Error('Only posted entries can be voided');
    }

    // Reverse the ledger entries
    for (const line of entry.lines) {
      await execute(
        `INSERT INTO general_ledger (account_id, journal_entry_id, entry_date, debit, credit, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [line.account_id, entry.id, entry.entry_date, line.credit, line.debit, `VOID: ${line.description || entry.description}`]
      );

      // Update account balance (reverse)
      await this.generalLedgerRepo.updateAccountBalance(line.account_id, line.credit, line.debit);
    }

    // Update entry status
    await this.journalEntryRepo.updateStatus(id, 'voided', reason);
    return this.journalEntryRepo.findById(id) as Promise<JournalEntryWithLines>;
  }

  async getAccountBalance(accountId: number): Promise<number> {
    const balance = await this.generalLedgerRepo.getAccountBalance(accountId);
    return balance?.net_balance || 0;
  }

  async getTrialBalance(startDate: Date, endDate: Date): Promise<any[]> {
    return this.generalLedgerRepo.getTrialBalance(startDate, endDate);
  }

  async getAccountStatement(accountId: number, startDate: Date, endDate: Date): Promise<any> {
    return this.generalLedgerRepo.getAccountStatement(accountId, startDate, endDate);
  }

  async recordSale(
    saleId: number,
    amount: number,
    paymentMethod: string,
    lines: { account_id: number; debit: number; credit: number }[]
  ): Promise<JournalEntryWithLines> {
    // Determine cash/bank account based on payment method
    let cashAccountCode = '1010'; // Cash in Hand
    if (paymentMethod === 'card') {
      cashAccountCode = '1020'; // Bank Account
    }

    const cashAccount = await this.accountRepo.findByCode(cashAccountCode);
    if (!cashAccount) {
      throw new Error(`Cash account not found: ${cashAccountCode}`);
    }

    const salesRevenueAccount = await this.accountRepo.findByCode('4010');
    if (!salesRevenueAccount) {
      throw new Error('Sales Revenue account not found');
    }

    // Create journal entry
    const entryData: CreateJournalEntryDTO = {
      entry_date: new Date(),
      description: `Sale #${saleId}`,
      reference_type: 'sale',
      reference_id: saleId,
      lines: [
        // Debit: Cash/Bank
        { account_id: cashAccount.id, debit: amount, credit: 0, description: `Cash received for sale #${saleId}` },
        // Credit: Sales Revenue
        { account_id: salesRevenueAccount.id, debit: 0, credit: amount, description: `Revenue from sale #${saleId}` },
        // Add additional lines if provided (e.g., for inventory)
        ...lines,
      ],
    };

    const entry = await this.createJournalEntry(entryData);
    return this.postJournalEntry(entry.id);
  }

  async recordPurchase(
    purchaseId: number,
    amount: number,
    supplierId: number,
    lines: { account_id: number; debit: number; credit: number }[]
  ): Promise<JournalEntryWithLines> {
    const inventoryAccount = await this.accountRepo.findByCode('1040');
    if (!inventoryAccount) {
      throw new Error('Inventory account not found');
    }

    const accountsPayableAccount = await this.accountRepo.findByCode('2010');
    if (!accountsPayableAccount) {
      throw new Error('Accounts Payable account not found');
    }

    const purchaseAccount = await this.accountRepo.findByCode('5010');
    if (!purchaseAccount) {
      throw new Error('Purchase account not found');
    }

    // Create journal entry
    const entryData: CreateJournalEntryDTO = {
      entry_date: new Date(),
      description: `Purchase #${purchaseId} from Supplier #${supplierId}`,
      reference_type: 'purchase',
      reference_id: purchaseId,
      lines: [
        // Debit: Inventory
        { account_id: inventoryAccount.id, debit: amount, credit: 0, description: `Inventory received for purchase #${purchaseId}` },
        // Debit: Purchase Expense
        { account_id: purchaseAccount.id, debit: amount, credit: 0, description: `Cost of goods for purchase #${purchaseId}` },
        // Credit: Accounts Payable
        { account_id: accountsPayableAccount.id, debit: 0, credit: amount, description: `Amount owed to Supplier #${supplierId}` },
        // Add additional lines if provided
        ...lines,
      ],
    };

    const entry = await this.createJournalEntry(entryData);
    return this.postJournalEntry(entry.id);
  }

  async recordExpense(
    expenseId: number,
    amount: number,
    categoryId: number,
    lines: { account_id: number; debit: number; credit: number }[]
  ): Promise<JournalEntryWithLines> {
    const cashAccount = await this.accountRepo.findByCode('1010');
    if (!cashAccount) {
      throw new Error('Cash account not found');
    }

    // Get the expense account based on category
    const expenseAccount = await this.accountRepo.findById(categoryId);
    if (!expenseAccount) {
      throw new Error('Expense account not found');
    }

    // Create journal entry
    const entryData: CreateJournalEntryDTO = {
      entry_date: new Date(),
      description: `Expense #${expenseId}: ${expenseAccount.name}`,
      reference_type: 'expense',
      reference_id: expenseId,
      lines: [
        // Debit: Expense Account
        { account_id: expenseAccount.id, debit: amount, credit: 0, description: `Expense: ${expenseAccount.name}` },
        // Credit: Cash
        { account_id: cashAccount.id, debit: 0, credit: amount, description: `Cash paid for expense #${expenseId}` },
        // Add additional lines if provided
        ...lines,
      ],
    };

    const entry = await this.createJournalEntry(entryData);
    return this.postJournalEntry(entry.id);
  }
}

// Helper function to execute queries
async function execute(sql: string, params?: any[]): Promise<any> {
  const { execute: exec } = await import('../database/connection.js');
  return exec(sql, params);
}
