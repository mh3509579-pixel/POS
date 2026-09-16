import { Sale, SaleItem, CreateSaleDTO, SaleWithItems } from '../domain/sale.entity.js';
import { query, queryOne, execute, beginTransaction, commitTransaction, rollbackTransaction } from '../../../infrastructure/database/connection.js';

export class SaleRepository {
  async findById(id: number): Promise<SaleWithItems | null> {
    const sale = await queryOne<Sale>('SELECT * FROM sales WHERE id = ?', [id]);
    if (!sale) return null;

    const items = await query<SaleItem[]>('SELECT * FROM sale_items WHERE sale_id = ?', [id]);
    return { ...sale, items };
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<SaleWithItems | null> {
    const sale = await queryOne<Sale>('SELECT * FROM sales WHERE invoice_number = ?', [invoiceNumber]);
    if (!sale) return null;

    const items = await query<SaleItem[]>('SELECT * FROM sale_items WHERE sale_id = ?', [sale.id]);
    return { ...sale, items };
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Sale[]> {
    return query<Sale[]>('SELECT * FROM sales ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return query<Sale[]>(
      'SELECT * FROM sales WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC',
      [startDate, endDate]
    );
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM sales');
    return result?.count || 0;
  }

  async create(data: CreateSaleDTO, userId: number): Promise<SaleWithItems> {
    const connection = await beginTransaction();

    try {
      // Generate invoice number
      const invoiceNumber = await this.getNextInvoiceNumber();

      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const discount = data.discount || 0;
      const taxable = subtotal - discount;
      const taxRate = data.tax_rate || 0.05;
      const tax = taxable * taxRate;
      const total = taxable + tax;

      // Create sale
      const saleResult = await execute(
        `INSERT INTO sales (invoice_number, customer_id, user_id, subtotal, discount, tax, total, payment_method, amount_paid, change_amount, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
        [
          invoiceNumber,
          data.customer_id || null,
          userId,
          subtotal,
          discount,
          tax,
          total,
          data.payment_method,
          data.amount_paid,
          Math.max(0, data.amount_paid - total),
          data.notes || null,
        ]
      );

      const saleId = saleResult.insertId;

      // Create sale items
      for (const item of data.items) {
        const itemTotal = item.unit_price * item.quantity - (item.discount || 0);
        await execute(
          `INSERT INTO sale_items (sale_id, medicine_id, batch_number, quantity, unit_price, discount, total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [saleId, item.medicine_id, item.batch_number, item.quantity, item.unit_price, item.discount || 0, itemTotal]
        );

        // Update medicine stock
        await execute(
          'UPDATE medicine_batches SET stock = stock - ? WHERE medicine_id = ? AND batch_number = ?',
          [item.quantity, item.medicine_id, item.batch_number]
        );

        // Create stock movement
        await execute(
          `INSERT INTO stock_movements (medicine_id, batch_number, quantity, movement_type, reference_type, reference_id, notes)
           VALUES (?, ?, ?, 'sale', 'sale', ?, ?)`,
          [item.medicine_id, item.batch_number, item.quantity, saleId, `Sale #${invoiceNumber}`]
        );
      }

      await commitTransaction(connection);

      return this.findById(saleId) as Promise<SaleWithItems>;
    } catch (error) {
      await rollbackTransaction(connection);
      throw error;
    }
  }

  async getNextInvoiceNumber(): Promise<string> {
    const last = await queryOne<{ invoice_number: string }>(
      "SELECT invoice_number FROM sales ORDER BY id DESC LIMIT 1"
    );

    if (!last) {
      return 'INV-2026-000001';
    }

    const parts = last.invoice_number.split('-');
    const year = parts[1];
    const seq = parseInt(parts[2]) + 1;
    return `INV-${year}-${String(seq).padStart(6, '0')}`;
  }

  async getDailySales(date: Date): Promise<{ total_sales: number; total_amount: number }> {
    const result = await queryOne<{ total_sales: number; total_amount: number }>(
      `SELECT COUNT(*) as total_sales, COALESCE(SUM(total), 0) as total_amount 
       FROM sales WHERE DATE(created_at) = ? AND status = 'completed'`,
      [date]
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
        COALESCE(SUM(total), 0) as total_amount,
        COALESCE(SUM(discount), 0) as total_discount,
        COALESCE(SUM(tax), 0) as total_tax
       FROM sales 
       WHERE created_at BETWEEN ? AND ? AND status = 'completed'`,
      [startDate, endDate]
    );
    return result || { total_sales: 0, total_amount: 0, total_discount: 0, total_tax: 0 };
  }
}
