import { CreateExpenseDTO, CreateExpenseCategoryDTO, ExpenseWithCategory, ExpenseCategory } from '../domain/expense.entity.js';
import { ExpenseRepository } from '../infrastructure/expense.repository.js';
import { AccountingService } from '../../accounting/application/accounting.service.js';
import { AccountRepository } from '../../accounting/infrastructure/account.repository.js';
import { JournalEntryRepository } from '../../accounting/infrastructure/journal-entry.repository.js';
import { GeneralLedgerRepository } from '../../accounting/infrastructure/general-ledger.repository.js';

export class ExpenseService {
  private expenseRepo: ExpenseRepository;
  private accountingService: AccountingService;

  constructor() {
    this.expenseRepo = new ExpenseRepository();
    const accountRepo = new AccountRepository();
    const journalEntryRepo = new JournalEntryRepository();
    const generalLedgerRepo = new GeneralLedgerRepository();
    this.accountingService = new AccountingService(journalEntryRepo, generalLedgerRepo, accountRepo);
  }

  async createExpense(data: CreateExpenseDTO, userId: number): Promise<ExpenseWithCategory> {
    // Create the expense
    const expense = await this.expenseRepo.create(data, userId);

    // Record in accounting
    await this.accountingService.recordExpense(
      expense.id,
      expense.amount,
      expense.category_id,
      []
    );

    return expense;
  }

  async getExpenseById(id: number): Promise<ExpenseWithCategory | null> {
    return this.expenseRepo.findById(id);
  }

  async getExpenseByNumber(expenseNumber: string): Promise<ExpenseWithCategory | null> {
    return this.expenseRepo.findByExpenseNumber(expenseNumber);
  }

  async getAllExpenses(limit?: number, offset?: number): Promise<ExpenseWithCategory[]> {
    return this.expenseRepo.findAll(limit, offset);
  }

  async getExpensesByCategory(categoryId: number): Promise<ExpenseWithCategory[]> {
    return this.expenseRepo.findByCategory(categoryId);
  }

  async getDailyExpenses(date: Date): Promise<{ total_expenses: number; total_amount: number }> {
    return this.expenseRepo.getDailyExpenses(date);
  }

  async getExpensesSummary(startDate: Date, endDate: Date) {
    return this.expenseRepo.getExpensesSummary(startDate, endDate);
  }

  async getAllCategories(): Promise<ExpenseCategory[]> {
    return this.expenseRepo.getAllCategories();
  }

  async createCategory(data: CreateExpenseCategoryDTO): Promise<ExpenseCategory> {
    return this.expenseRepo.createCategory(data);
  }
}
