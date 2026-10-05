import { Purchase, PurchaseItem, CreatePurchaseDTO, PurchaseWithItems } from '../domain/purchase.entity.js';
import {
  query,
  queryOne,
  execute,
  withTransaction,
  TransactionContext,
} from '../../../infrastructure/database/connection.js';
import { validatePurchaseDTO } from '../domain/purchase.rules.js';
import { round2 } from '../../sales/domain/sale.rules.js';
import { toDateOnly, nextDateOnly } from '../../../infrastructure/utils/date.js';

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
    const dto = validatePurchaseDTO(data);

    const subtotal = round2(dto.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0));
    const discount = round2(dto.discount || 0);
    const tax = round2((subtotal - discount) * (dto.tax_rate ?? 0));
    const total = round2(subtotal - discount + tax);

    const purchaseId = await withTransaction(async (tx) => {
      const purchaseNumber = await this.getNextPurchaseNumber(tx);
      const paymentNumber = await this.getNextPaymentNumber(tx);

      const purchaseResult = await tx.execute(
        `INSERT INTO purchases (purchase_number, supplier_id, user_id, invoice_ref, subtotal, discount_amount, tax_amount, total_amount, payment_status, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'received', ?)`,
        [
          purchaseNumber,
          dto.supplier_id,
          userId,
          dto.invoice_number || null,
          subtotal,
          discount,
          tax,
          total,
          dto.notes || null,
        ]
      );

      const newPurchaseId = purchaseResult.insertId;

      if (dto.supplier_id) {
        await tx.execute(
          `INSERT INTO payments (payment_number, payment_type, entity_type, entity_id, amount, payment_method, reference_type, reference_id, user_id, notes)
           VALUES (?, 'payable', 'supplier', ?, ?, ?, 'purchase', ?, ?, ?)`,
          [
            paymentNumber,
            dto.supplier_id,
            total,
            'credit',
            newPurchaseId,
            userId,
            `Payment for ${purchaseNumber}`,
          ]
        );
      }

      for (const item of dto.items) {
        // Resolve (or create) the batch *before* inserting the item so
        // purchase_items.batch_id is populated. It used to always stay NULL,
        // which forced purchase returns to trust a client-supplied batch id.
        let batchId: number;

        const existingBatch = await tx.queryOne<{ id: number }>(
          'SELECT id FROM medicine_batches WHERE medicine_id = ? AND batch_number = ? FOR UPDATE',
          [item.medicine_id, item.batch_number]
        );

        if (existingBatch) {
          batchId = existingBatch.id;

          // Only add quantity here. Rewriting expiry_date on re-receipt used to
          // silently corrupt the stored expiry (and FEFO ordering) of an
          // existing batch while leaving its prices stale.
          await tx.execute(
            'UPDATE medicine_batches SET quantity = quantity + ? WHERE id = ?',
            [item.quantity, batchId]
          );
        } else {
          const insertBatch = await tx.execute(
            `INSERT INTO medicine_batches (medicine_id, batch_number, expiry_date, quantity, purchase_price, sale_price)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [item.medicine_id, item.batch_number, item.expiry_date, item.quantity, item.unit_price, item.sale_price]
          );
          batchId = insertBatch.insertId;
        }

        const itemTotal = round2(item.unit_price * item.quantity);

        await tx.execute(
          `INSERT INTO purchase_items (purchase_id, medicine_id, batch_id, batch_number, expiry_date, quantity, purchase_price, sale_price, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newPurchaseId,
            item.medicine_id,
            batchId,
            item.batch_number,
            item.expiry_date,
            item.quantity,
            item.unit_price,
            item.sale_price,
            itemTotal,
          ]
        );

        await tx.execute(
          `INSERT INTO stock_movements (medicine_id, batch_id, movement_type, quantity, reference_type, reference_id, user_id, notes)
           VALUES (?, ?, 'purchase', ?, 'purchase', ?, ?, ?)`,
          [item.medicine_id, batchId, item.quantity, newPurchaseId, userId, `Purchase #${purchaseNumber}`]
        );
      }

      await tx.execute(
        'UPDATE suppliers SET current_balance = current_balance + ? WHERE id = ?',
        [total, dto.supplier_id]
      );

      return newPurchaseId;
    });

    return this.findById(purchaseId) as Promise<PurchaseWithItems>;
  }

  async getNextPurchaseNumber(tx?: TransactionContext): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;
    const last = tx
      ? await tx.queryOne<{ purchase_number: string }>(
          "SELECT purchase_number FROM purchases WHERE purchase_number LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE",
          [`${prefix}%`]
        )
      : await queryOne<{ purchase_number: string }>(
          "SELECT purchase_number FROM purchases WHERE purchase_number LIKE ? ORDER BY id DESC LIMIT 1",
          [`${prefix}%`]
        );

    if (!last) {
      return `${prefix}000001`;
    }

    const seq = parseInt(last.purchase_number.split('-')[2]) + 1;
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  async getNextPaymentNumber(tx?: TransactionContext): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-PO-${year}-`;
    const last = tx
      ? await tx.queryOne<{ payment_number: string }>(
          "SELECT payment_number FROM payments WHERE payment_number LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE",
          [`${prefix}%`]
        )
      : await queryOne<{ payment_number: string }>(
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
    const day = toDateOnly(date);
    const result = await queryOne<{ total_purchases: number; total_amount: number }>(
      `SELECT COUNT(*) as total_purchases, COALESCE(SUM(total_amount), 0) as total_amount
       FROM purchases WHERE created_at >= ? AND created_at < ? AND status = 'received'`,
      [day, nextDateOnly(day)]
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
