import { CreateSaleDTO, SaleWithItems } from '../domain/sale.entity.js';
import { SaleRepository } from '../infrastructure/sale.repository.js';
import { AccountingService } from '../../accounting/application/accounting.service.js';
import { AccountRepository } from '../../accounting/infrastructure/account.repository.js';
import { JournalEntryRepository } from '../../accounting/infrastructure/journal-entry.repository.js';
import { GeneralLedgerRepository } from '../../accounting/infrastructure/general-ledger.repository.js';

export class SaleService {
  private saleRepo: SaleRepository;
  private accountingService: AccountingService;

  constructor() {
    this.saleRepo = new SaleRepository();
    const accountRepo = new AccountRepository();
    const journalEntryRepo = new JournalEntryRepository();
    const generalLedgerRepo = new GeneralLedgerRepository();
    this.accountingService = new AccountingService(journalEntryRepo, generalLedgerRepo, accountRepo);
  }

  async createSale(data: CreateSaleDTO, userId: number): Promise<SaleWithItems> {
    // Create the sale
    const sale = await this.saleRepo.create(data, userId);

    // Record in accounting
    await this.accountingService.recordSale(
      sale.id,
      sale.total,
      sale.payment_method,
      []
    );

    return sale;
  }

  async getSaleById(id: number): Promise<SaleWithItems | null> {
    return this.saleRepo.findById(id);
  }

  async getSaleByInvoice(invoiceNumber: string): Promise<SaleWithItems | null> {
    return this.saleRepo.findByInvoiceNumber(invoiceNumber);
  }

  async getAllSales(limit?: number, offset?: number): Promise<SaleWithItems[]> {
    const sales = await this.saleRepo.findAll(limit, offset);
    const salesWithItems: SaleWithItems[] = [];

    for (const sale of sales) {
      const fullSale = await this.saleRepo.findById(sale.id);
      if (fullSale) {
        salesWithItems.push(fullSale);
      }
    }

    return salesWithItems;
  }

  async getDailySales(date: Date): Promise<{ total_sales: number; total_amount: number }> {
    return this.saleRepo.getDailySales(date);
  }

  async getSalesSummary(startDate: Date, endDate: Date) {
    return this.saleRepo.getSalesSummary(startDate, endDate);
  }
}
