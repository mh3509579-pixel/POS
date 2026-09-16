import { Purchase, PurchaseItem, CreatePurchaseDTO, PurchaseWithItems } from '../domain/purchase.entity.js';
import { query, queryOne, execute, beginTransaction, commitTransaction, rollbackTransaction } from '../../../infrastructure/database/connection.js';

export class PurchaseRepository {
  async findById(id: number): Promise<PurchaseWithItems | null> {
    const purchase = await queryOne<Purchase>('SELECT * FROM purchases WHERE id = ?', [id]);
    if (!purchase) return null;

    const items = await query<PurchaseItem[]>('SELECT * FROM purchase_items WHERE purchase_id = ?', [id]);
    return { ...purchase, items };
  }

  async findByPurchaseNumber(purchaseNumber: string): Promise<PurchaseWithItems | null> {
    const purchase = await queryOne<Purchase>('SELECT * FROM purchases WHERE purchase_number = ?', [purchaseNumber]);
    if (!purchase) return null;

    const items = await query<PurchaseItem[]>('SELECT * FROM purchase_items WHERE purchase_id = ?', [purchase.id]);
    return { ...purchase, items };
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Purchase[]> {
    return query<Purchase[]>('SELECT * FROM purchases ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Purchase[]> {
    return query<Purchase[]>(
      'SELECT * FROM purchases WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC',
      [startDate, endDate]
    );
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM purchases');
    return result?.count || 0;
  }

  async create(data: CreatePurchaseDTO, userId: number): Promise<PurchaseWithItems> {
    const connection = await beginTransaction();

    try {
      // Generate purchase number
      const purchaseNumber = await this.getNextPurchaseNumber();

      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const discount = data.discount || 0;
      const taxable = subtotal - discount;
      const taxRate = data.tax_rate || 0;
      const tax = taxable * taxRate;
      const total = taxable + tax;

      // Create purchase
      const purchaseResult = await execute(
        `INSERT INTO purchases (purchase_number, supplier_id, user_id, invoice_number, subtotal, discount, tax, total, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'received', ?)`,
        [
          purchaseNumber,
          data.supplier_id,
          userId,
          data.invoice_number || null,
          subtotal,
          discount,
          tax,
          total,
          data.notes || null,
        ]
      );

      const purchaseId = purchaseResult.insertId;

      // Create purchase items and update inventory
      for (const item of data.items) {
        const itemTotal = item.unit_price * item.quantity - (item.discount || 0);
        await execute(
          `INSERT INTO purchase_items (purchase_id, medicine_id, batch_number, expiry_date, quantity, unit_price, sale_price, discount, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [purchaseId, item.medicine_id, item.batch_number, item.expiry_date, item.quantity, item.unit_price, item.sale_price, item.discount || 0, itemTotal]
        );

        // Check if batch exists
        const existingBatch = await queryOne<{ id: number }>(
          'SELECT id FROM medicine_batches WHERE medicine_id = ? AND batch_number = ?',
          [item.medicine_id, item.batch_number]
        );

        if (existingBatch) {
          // Update existing batch
          await execute(
            'UPDATE medicine_batches SET stock = stock + ?, expiry_date = ? WHERE medicine_id = ? AND batch_number = ?',
            [item.quantity, item.expiry_date, item.medicine_id, item.batch_number]
          );
        } else {
          // Create new batch
          await execute(
            `INSERT INTO medicine_batches (medicine_id, batch_number, expiry_date, stock, purchase_price, sale_price)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [item.medicine_id, item.batch_number, item.expiry_date, item.quantity, item.unit_price, item.sale_price]
          );
        }

        // Create stock movement
        await execute(
          `INSERT INTO stock_movements (medicine_id, batch_number, quantity, movement_type, reference_type, reference_id, notes)
           VALUES (?, ?, ?, 'purchase', 'purchase', ?, ?)`,
          [item.medicine_id, item.batch_number, item.quantity, purchaseId, `Purchase #${purchaseNumber}`]
        );
      }

      // Update supplier balance
      await execute(
        'UPDATE suppliers SET balance = balance + ? WHERE id = ?',
        [total, data.supplier_id]
      );

      await commitTransaction(connection);

      return this.findById(purchaseId) as Promise<PurchaseWithItems>;
    } catch (error) {
      await rollbackTransaction(connection);
      throw error;
    }
  }

  async getNextPurchaseNumber(): Promise<string> {
    const last = await queryOne<{ purchase_number: string }>(
      "SELECT purchase_number FROM purchases ORDER BY id DESC LIMIT 1"
    );

    if (!last) {
      return 'PO-2026-000001';
    }

    const parts = last.purchase_number.split('-');
    const year = parts[1];
    const seq = parseInt(parts[2]) + 1;
    return `PO-${year}-${String(seq).padStart(6, '0')}`;
  }

  async getDailyPurchases(date: Date): Promise<{ total_purchases: number; total_amount: number }> {
    const result = await queryOne<{ total_purchases: number; total_amount: number }>(
      `SELECT COUNT(*) as total_purchases, COALESCE(SUM(total), 0) as total_amount 
       FROM purchases WHERE DATE(created_at) = ? AND status = 'received'`,
      [date]
    );
    return result || { total_purchases: 0, total_amount: 0 };
  }

  async getPurchasesSummary(startDate: Date, endDate: Date): Promise<{
    total_purchases: number;
    total_amount: number;
    total_discount: number;
    total_tax: number;
  }> {
    const result = await queryOne<{
      total_purchases: number;
      total_amount: number;
      total_discount: number;
      total_tax: number;
    }>(
      `SELECT 
        COUNT(*) as total_purchases,
        COALESCE(SUM(total), 0) as total_amount,
        COALESCE(SUM(discount), 0) as total_discount,
        COALESCE(SUM(tax), 0) as total_tax
       FROM purchases 
       WHERE created_at BETWEEN ? AND ? AND status = 'received'`,
      [startDate, endDate]
    );
    return result || { total_purchases: 0, total_amount: 0, total_discount: 0, total_tax: 0 };
  }
}
