import { Purchase, PurchaseItem, CreatePurchaseDTO, PurchaseWithItems } from '../domain/purchase.entity.js';
import { query, queryOne, execute, beginTransaction, commitTransaction, rollbackTransaction } from '../../../infrastructure/database/connection.js';

export class PurchaseRepository {
  async findById(id: number): Promise<PurchaseWithItems | null> {
    const purchase = await queryOne<any>(
      `SELECT p.*, s.name as supplier_name, u.full_name as user_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );
    if (!purchase) return null;

    const items = await query<any[]>(
      `SELECT pi.*, m.name as medicine_name
       FROM purchase_items pi
       LEFT JOIN medicines m ON pi.medicine_id = m.id
       WHERE pi.purchase_id = ?`,
      [id]
    );

    return {
      id: purchase.id,
      purchase_number: purchase.purchase_number,
      supplier_id: purchase.supplier_id,
      user_id: purchase.user_id,
      invoice_ref: purchase.invoice_ref,
      subtotal: purchase.subtotal,
      discount_amount: purchase.discount_amount,
      tax_amount: purchase.tax_amount,
      total_amount: purchase.total_amount,
      paid_amount: purchase.paid_amount,
      payment_method: purchase.payment_method,
      payment_status: purchase.payment_status,
      status: purchase.status,
      notes: purchase.notes,
      created_at: purchase.created_at,
      updated_at: purchase.updated_at,
      items: items.map((item: any) => ({
        id: item.id,
        purchase_id: item.purchase_id,
        medicine_id: item.medicine_id,
        batch_id: item.batch_id,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        quantity: item.quantity,
        purchase_price: item.purchase_price,
        sale_price: item.sale_price,
        total: item.total,
        created_at: item.created_at,
        medicine_name: item.medicine_name,
      })),
      supplier_name: purchase.supplier_name,
      user_name: purchase.user_name,
    };
  }

  async findByPurchaseNumber(purchaseNumber: string): Promise<PurchaseWithItems | null> {
    const purchase = await queryOne<any>(
      `SELECT p.*, s.name as supplier_name, u.full_name as user_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.purchase_number = ?`,
      [purchaseNumber]
    );
    if (!purchase) return null;

    const items = await query<any[]>(
      `SELECT pi.*, m.name as medicine_name
       FROM purchase_items pi
       LEFT JOIN medicines m ON pi.medicine_id = m.id
       WHERE pi.purchase_id = ?`,
      [purchase.id]
    );

    return {
      id: purchase.id,
      purchase_number: purchase.purchase_number,
      supplier_id: purchase.supplier_id,
      user_id: purchase.user_id,
      invoice_ref: purchase.invoice_ref,
      subtotal: purchase.subtotal,
      discount_amount: purchase.discount_amount,
      tax_amount: purchase.tax_amount,
      total_amount: purchase.total_amount,
      paid_amount: purchase.paid_amount,
      payment_method: purchase.payment_method,
      payment_status: purchase.payment_status,
      status: purchase.status,
      notes: purchase.notes,
      created_at: purchase.created_at,
      updated_at: purchase.updated_at,
      items: items.map((item: any) => ({
        id: item.id,
        purchase_id: item.purchase_id,
        medicine_id: item.medicine_id,
        batch_id: item.batch_id,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        quantity: item.quantity,
        purchase_price: item.purchase_price,
        sale_price: item.sale_price,
        total: item.total,
        created_at: item.created_at,
        medicine_name: item.medicine_name,
      })),
      supplier_name: purchase.supplier_name,
      user_name: purchase.user_name,
    };
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<any[]> {
    return query<any[]>(
      `SELECT p.*, s.name as supplier_name, u.full_name as user_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    return query<any[]>(
      `SELECT p.*, s.name as supplier_name, u.full_name as user_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.created_at BETWEEN ? AND ? ORDER BY p.created_at DESC`,
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
      const purchaseNumber = await this.getNextPurchaseNumber();
      const paymentNumber = await this.getNextPaymentNumber();

      const subtotal = data.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const discount = data.discount || 0;
      const taxable = subtotal - discount;
      const taxRate = data.tax_rate || 0;
      const tax = taxable * taxRate;
      const total = taxable + tax;

      const purchaseResult = await execute(
        `INSERT INTO purchases (purchase_number, supplier_id, user_id, invoice_ref, subtotal, discount_amount, tax_amount, total_amount, status, notes)
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

      if (data.supplier_id) {
        await execute(
          `INSERT INTO payments (payment_number, payment_type, entity_type, entity_id, amount, payment_method, reference_type, reference_id, user_id, notes)
           VALUES (?, 'payable', 'supplier', ?, ?, ?, 'purchase', ?, ?, ?)`,
          [
            paymentNumber,
            data.supplier_id,
            total,
            'bank_transfer',
            purchaseId,
            userId,
            `Payment for ${purchaseNumber}`,
          ]
        );
      }

      for (const item of data.items) {
        const itemTotal = item.unit_price * item.quantity;
        await execute(
          `INSERT INTO purchase_items (purchase_id, medicine_id, batch_number, expiry_date, quantity, purchase_price, sale_price, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [purchaseId, item.medicine_id, item.batch_number, item.expiry_date, item.quantity, item.unit_price, item.sale_price, itemTotal]
        );

        const existingBatch = await queryOne<{ id: number }>(
          'SELECT id FROM medicine_batches WHERE medicine_id = ? AND batch_number = ?',
          [item.medicine_id, item.batch_number]
        );

        if (existingBatch) {
          await execute(
            'UPDATE medicine_batches SET quantity = quantity + ?, expiry_date = ? WHERE id = ?',
            [item.quantity, item.expiry_date, existingBatch.id]
          );
        } else {
          await execute(
            `INSERT INTO medicine_batches (medicine_id, batch_number, expiry_date, quantity, purchase_price, sale_price)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [item.medicine_id, item.batch_number, item.expiry_date, item.quantity, item.unit_price, item.sale_price]
          );
        }

        const batch = await queryOne<{ id: number }>(
          'SELECT id FROM medicine_batches WHERE medicine_id = ? AND batch_number = ?',
          [item.medicine_id, item.batch_number]
        );

        if (batch) {
          await execute(
            `INSERT INTO stock_movements (medicine_id, batch_id, movement_type, quantity, reference_type, reference_id, user_id, notes)
             VALUES (?, ?, 'purchase', ?, 'purchase', ?, ?, ?)`,
            [item.medicine_id, batch.id, item.quantity, purchaseId, userId, `Purchase #${purchaseNumber}`]
          );
        }
      }

      await execute(
        'UPDATE suppliers SET current_balance = current_balance + ? WHERE id = ?',
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
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;
    const last = await queryOne<{ purchase_number: string }>(
      "SELECT purchase_number FROM purchases WHERE purchase_number LIKE ? ORDER BY id DESC LIMIT 1",
      [`${prefix}%`]
    );

    if (!last) {
      return `${prefix}000001`;
    }

    const seq = parseInt(last.purchase_number.split('-')[2]) + 1;
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  async getNextPaymentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-PO-${year}-`;
    const last = await queryOne<{ payment_number: string }>(
      "SELECT payment_number FROM payments WHERE payment_number LIKE ? ORDER BY id DESC LIMIT 1",
      [`${prefix}%`]
    );

    if (!last) {
      return `${prefix}000001`;
    }

    const seq = parseInt(last.payment_number.split('-')[3]) + 1;
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  async getDailyPurchases(date: Date): Promise<{ total_purchases: number; total_amount: number }> {
    const result = await queryOne<{ total_purchases: number; total_amount: number }>(
      `SELECT COUNT(*) as total_purchases, COALESCE(SUM(total_amount), 0) as total_amount 
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
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(discount_amount), 0) as total_discount,
        COALESCE(SUM(tax_amount), 0) as total_tax
       FROM purchases 
       WHERE created_at BETWEEN ? AND ? AND status = 'received'`,
      [startDate, endDate]
    );
    return result || { total_purchases: 0, total_amount: 0, total_discount: 0, total_tax: 0 };
  }
}
