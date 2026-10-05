import { Sale, SaleItem, CreateSaleDTO, SaleWithItems } from '../domain/sale.entity.js';
import {
  query,
  queryOne,
  execute,
  withTransaction,
  TransactionContext,
} from '../../../infrastructure/database/connection.js';
import {
  validateSaleDTO,
  calculateSaleTotal,
  calculatePaymentStatus,
  round2,
  ConflictError,
} from '../domain/sale.rules.js';
import { toDateOnly, nextDateOnly } from '../../../infrastructure/utils/date.js';

export class SaleRepository {
  async findById(id: number): Promise<SaleWithItems | null> {
    const sale = await queryOne<any>(
      `SELECT s.*, c.name as customer_name, u.full_name as user_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [id]
    );
    if (!sale) return null;

    const items = await query<any[]>(
      `SELECT si.*, m.name as medicine_name, mb.batch_number as batch_number
       FROM sale_items si
       LEFT JOIN medicines m ON si.medicine_id = m.id
       LEFT JOIN medicine_batches mb ON si.batch_id = mb.id
       WHERE si.sale_id = ?`,
      [id]
    );

    return {
      id: sale.id,
      invoice_number: sale.invoice_number,
      customer_id: sale.customer_id,
      user_id: sale.user_id,
      subtotal: sale.subtotal,
      discount: sale.discount_amount,
      tax: sale.tax_amount,
      total: sale.total_amount,
      payment_method: sale.payment_method,
      amount_paid: sale.paid_amount,
      change_amount: sale.change_amount,
      status: sale.status,
      notes: sale.notes,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
      items: items.map((item: any) => ({
        id: item.id,
        sale_id: item.sale_id,
        medicine_id: item.medicine_id,
        batch_number: item.batch_number,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: item.total,
        created_at: item.created_at,
        medicine_name: item.medicine_name,
      })),
      customer_name: sale.customer_name,
      user_name: sale.user_name,
    };
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<SaleWithItems | null> {
    const sale = await queryOne<any>(
      `SELECT s.*, c.name as customer_name, u.full_name as user_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.invoice_number = ?`,
      [invoiceNumber]
    );
    if (!sale) return null;

    const items = await query<any[]>(
      `SELECT si.*, m.name as medicine_name, mb.batch_number as batch_number
       FROM sale_items si
       LEFT JOIN medicines m ON si.medicine_id = m.id
       LEFT JOIN medicine_batches mb ON si.batch_id = mb.id
       WHERE si.sale_id = ?`,
      [sale.id]
    );

    return {
      id: sale.id,
      invoice_number: sale.invoice_number,
      customer_id: sale.customer_id,
      user_id: sale.user_id,
      subtotal: sale.subtotal,
      discount: sale.discount_amount,
      tax: sale.tax_amount,
      total: sale.total_amount,
      payment_method: sale.payment_method,
      amount_paid: sale.paid_amount,
      change_amount: sale.change_amount,
      status: sale.status,
      notes: sale.notes,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
      items: items.map((item: any) => ({
        id: item.id,
        sale_id: item.sale_id,
        medicine_id: item.medicine_id,
        batch_number: item.batch_number,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: item.total,
        created_at: item.created_at,
        medicine_name: item.medicine_name,
      })),
      customer_name: sale.customer_name,
      user_name: sale.user_name,
    };
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<any[]> {
    return query<any[]>(
      `SELECT s.*, c.name as customer_name, u.full_name as user_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    return query<any[]>(
      `SELECT s.*, c.name as customer_name, u.full_name as user_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.created_at BETWEEN ? AND ? ORDER BY s.created_at DESC`,
      [startDate, endDate]
    );
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM sales');
    return result?.count || 0;
  }

  async create(data: CreateSaleDTO, userId: number): Promise<SaleWithItems> {
    const dto = validateSaleDTO(data);

    const subtotal = round2(dto.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0));
    const discount = round2(dto.discount || 0);
    const total = calculateSaleTotal(subtotal, discount, dto.tax_rate ?? 0.05);
    const tax = round2(total - (subtotal - discount));
    const amountPaid = round2(dto.amount_paid);
    const changeAmount = round2(Math.max(0, amountPaid - total));
    const paymentStatus = calculatePaymentStatus(amountPaid, total);

    const saleId = await withTransaction(async (tx) => {
      const invoiceNumber = await this.getNextInvoiceNumber(tx);
      const paymentNumber = await this.getNextPaymentNumber(tx);

      const saleResult = await tx.execute(
        `INSERT INTO sales (invoice_number, customer_id, user_id, subtotal, discount_amount, tax_amount, total_amount, paid_amount, change_amount, payment_method, payment_status, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
        [
          invoiceNumber,
          dto.customer_id || null,
          userId,
          subtotal,
          discount,
          tax,
          total,
          amountPaid,
          changeAmount,
          dto.payment_method,
          paymentStatus,
          dto.notes || null,
        ]
      );

      const newSaleId = saleResult.insertId;

      if (dto.customer_id) {
        await tx.execute(
          `INSERT INTO payments (payment_number, payment_type, entity_type, entity_id, amount, payment_method, reference_type, reference_id, user_id, notes)
           VALUES (?, 'receivable', 'customer', ?, ?, ?, 'sale', ?, ?, ?)`,
          [
            paymentNumber,
            dto.customer_id,
            total,
            dto.payment_method,
            newSaleId,
            userId,
            `Payment for ${invoiceNumber}`,
          ]
        );
      }

      for (const item of dto.items) {
        const batchId = await this.resolveAndReserveBatch(tx, item, invoiceNumber);

        const itemTotal = round2(item.unit_price * item.quantity - (item.discount || 0));

        await tx.execute(
          `INSERT INTO sale_items (sale_id, medicine_id, batch_id, quantity, unit_price, discount, total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [newSaleId, item.medicine_id, batchId, item.quantity, item.unit_price, item.discount || 0, itemTotal]
        );

        await tx.execute(
          `INSERT INTO stock_movements (medicine_id, batch_id, movement_type, quantity, reference_type, reference_id, user_id, notes)
           VALUES (?, ?, 'sale', ?, 'sale', ?, ?, ?)`,
          [item.medicine_id, batchId, -item.quantity, newSaleId, userId, `Sale #${invoiceNumber}`]
        );
      }

      return newSaleId;
    });

    return this.findById(saleId) as Promise<SaleWithItems>;
  }

  /**
   * Picks the batch to sell from and atomically reserves the stock.
   *
   * Rules enforced (Agent.md sections 13/15/41):
   *  - expired batches are never sellable
   *  - inactive batches are never sellable
   *  - stock can never go negative
   *  - when the client does not name a batch, the earliest-expiring valid batch
   *    is chosen (FEFO), matching inventory sorting used elsewhere
   */
  private async resolveAndReserveBatch(
    tx: TransactionContext,
    item: CreateSaleDTO['items'][number],
    invoiceNumber: string
  ): Promise<number> {
    let batch: { id: number } | null = null;

    if (item.batch_number) {
      batch = await tx.queryOne<{ id: number }>(
        `SELECT id FROM medicine_batches
         WHERE medicine_id = ? AND batch_number = ?
           AND is_active = TRUE
           AND (expiry_date IS NULL OR expiry_date >= CURDATE())`,
        [item.medicine_id, item.batch_number]
      );

      if (!batch) {
        const expired = await tx.queryOne<{ id: number }>(
          'SELECT id FROM medicine_batches WHERE medicine_id = ? AND batch_number = ?',
          [item.medicine_id, item.batch_number]
        );
        throw new ConflictError(
          expired
            ? `Batch ${item.batch_number} is expired or inactive and cannot be sold`
            : `Batch ${item.batch_number} not found for this medicine`
        );
      }
    } else {
      batch = await tx.queryOne<{ id: number }>(
        `SELECT id FROM medicine_batches
         WHERE medicine_id = ? AND is_active = TRUE AND quantity >= ?
           AND (expiry_date IS NULL OR expiry_date >= CURDATE())
         ORDER BY expiry_date ASC, id ASC
         LIMIT 1`,
        [item.medicine_id, item.quantity]
      );

      if (!batch) {
        throw new ConflictError(
          `Insufficient or no unexpired stock available for medicine #${item.medicine_id}`
        );
      }
    }

    const batchId = batch.id;

    // `quantity >= ?` makes the decrement fail (0 rows affected) rather than
    // driving stock negative, which closes the race between the check and the write.
    const reserved = await tx.execute(
      'UPDATE medicine_batches SET quantity = quantity - ? WHERE id = ? AND quantity >= ?',
      [item.quantity, batchId, item.quantity]
    );

    if (reserved.affectedRows === 0) {
      throw new ConflictError(`Insufficient stock in the selected batch for sale #${invoiceNumber}`);
    }

    return batchId;
  }

  async getNextInvoiceNumber(tx?: TransactionContext): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const last = await (tx
      ? tx.queryOne<{ invoice_number: string }>(
          "SELECT invoice_number FROM sales WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE",
          [`${prefix}%`]
        )
      : queryOne<{ invoice_number: string }>(
          "SELECT invoice_number FROM sales WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1",
          [`${prefix}%`]
        ));

    if (!last) {
      return `${prefix}000001`;
    }

    const seq = parseInt(last.invoice_number.split('-')[2]) + 1;
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  async getNextPaymentNumber(tx?: TransactionContext): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-SALE-${year}-`;
    const last = await (tx
      ? tx.queryOne<{ payment_number: string }>(
          "SELECT payment_number FROM payments WHERE payment_number LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE",
          [`${prefix}%`]
        )
      : queryOne<{ payment_number: string }>(
          "SELECT payment_number FROM payments WHERE payment_number LIKE ? ORDER BY id DESC LIMIT 1",
          [`${prefix}%`]
        ));

    if (!last) {
      return `${prefix}000001`;
    }

    const seq = parseInt(last.payment_number.split('-')[3]) + 1;
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  async getDailySales(date: Date): Promise<{ total_sales: number; total_amount: number }> {
    const day = toDateOnly(date);
    const result = await queryOne<{ total_sales: number; total_amount: number }>(
      `SELECT COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_amount
       FROM sales WHERE created_at >= ? AND created_at < ? AND status = 'completed'`,
      [day, nextDateOnly(day)]
    );
    return result || { total_sales: 0, total_amount: 0 };
  }

  async getSalesSummary(startDate: Date, endDate: Date): Promise<{
    total_sales: number;
    total_amount: number;
    total_discount: number;
    total_tax: number;
  }> {
    const result = await queryOne<{
      total_sales: number;
      total_amount: number;
      total_discount: number;
      total_tax: number;
    }>(
      `SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(discount_amount), 0) as total_discount,
        COALESCE(SUM(tax_amount), 0) as total_tax
       FROM sales 
       WHERE created_at BETWEEN ? AND ? AND status = 'completed'`,
      [startDate, endDate]
    );
    return result || { total_sales: 0, total_amount: 0, total_discount: 0, total_tax: 0 };
  }
}
