import { CreatePurchaseDTO, PurchaseWithItems } from '../domain/purchase.entity.js';
import { PurchaseRepository } from '../infrastructure/purchase.repository.js';
import { AccountingService } from '../../accounting/application/accounting.service.js';
import { AccountRepository } from '../../accounting/infrastructure/account.repository.js';
import { JournalEntryRepository } from '../../accounting/infrastructure/journal-entry.repository.js';
import { GeneralLedgerRepository } from '../../accounting/infrastructure/general-ledger.repository.js';

export class PurchaseService {
  private purchaseRepo: PurchaseRepository;
  private accountingService: AccountingService;

  constructor() {
    this.purchaseRepo = new PurchaseRepository();
    const accountRepo = new AccountRepository();
    const journalEntryRepo = new JournalEntryRepository();
    const generalLedgerRepo = new GeneralLedgerRepository();
    this.accountingService = new AccountingService(journalEntryRepo, generalLedgerRepo, accountRepo);
  }

  async createPurchase(data: CreatePurchaseDTO, userId: number): Promise<PurchaseWithItems> {
    // Create the purchase
    const purchase = await this.purchaseRepo.create(data, userId);

    // Record in accounting
    await this.accountingService.recordPurchase(
      purchase.id,
      purchase.total,
      purchase.supplier_id,
      []
    );

    return purchase;
  }

  async getPurchaseById(id: number): Promise<PurchaseWithItems | null> {
    return this.purchaseRepo.findById(id);
  }

  async getPurchaseByNumber(purchaseNumber: string): Promise<PurchaseWithItems | null> {
    return this.purchaseRepo.findByPurchaseNumber(purchaseNumber);
  }

  async getAllPurchases(limit?: number, offset?: number): Promise<PurchaseWithItems[]> {
    const purchases = await this.purchaseRepo.findAll(limit, offset);
    const purchasesWithItems: PurchaseWithItems[] = [];

    for (const purchase of purchases) {
      const fullPurchase = await this.purchaseRepo.findById(purchase.id);
      if (fullPurchase) {
        purchasesWithItems.push(fullPurchase);
      }
    }

    return purchasesWithItems;
  }

  async getDailyPurchases(date: Date): Promise<{ total_purchases: number; total_amount: number }> {
    return this.purchaseRepo.getDailyPurchases(date);
  }

  async getPurchasesSummary(startDate: Date, endDate: Date) {
    return this.purchaseRepo.getPurchasesSummary(startDate, endDate);
  }
}
