import { Sale, SaleItem, CreateSaleDTO, SaleWithItems } from '../domain/sale.entity.js';
import { query, queryOne, execute, beginTransaction, commitTransaction, rollbackTransaction } from '../../../infrastructure/database/connection.js';

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
      `SELECT si.*, m.name as medicine_name
       FROM sale_items si
       LEFT JOIN medicines m ON si.medicine_id = m.id
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
        batch_number: String(item.batch_id),
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
      `SELECT si.*, m.name as medicine_name
       FROM sale_items si
       LEFT JOIN medicines m ON si.medicine_id = m.id
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
        batch_number: String(item.batch_id),
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
    const connection = await beginTransaction();

    try {
      const invoiceNumber = await this.getNextInvoiceNumber();

      const subtotal = data.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const discount = data.discount || 0;
      const taxable = subtotal - discount;
      const taxRate = data.tax_rate || 0.05;
      const tax = taxable * taxRate;
      const total = taxable + tax;

      const saleResult = await execute(
        `INSERT INTO sales (invoice_number, customer_id, user_id, subtotal, discount_amount, tax_amount, total_amount, paid_amount, change_amount, payment_method, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
        [
          invoiceNumber,
          data.customer_id || null,
          userId,
          subtotal,
          discount,
          tax,
          total,
          data.amount_paid,
          Math.max(0, data.amount_paid - total),
          data.payment_method,
          data.notes || null,
        ]
      );

      const saleId = saleResult.insertId;

      for (const item of data.items) {
        const itemTotal = item.unit_price * item.quantity - (item.discount || 0);

        let batchId = 0;
        if (item.batch_number) {
          const batch = await queryOne<any>(
            'SELECT id FROM medicine_batches WHERE medicine_id = ? AND batch_number = ?',
            [item.medicine_id, item.batch_number]
          );
          if (batch) {
            batchId = batch.id;
            await execute(
              'UPDATE medicine_batches SET quantity = quantity - ? WHERE id = ?',
              [item.quantity, batchId]
            );
          }
        }

        if (!batchId) {
          const defaultBatch = await queryOne<any>(
            'SELECT id FROM medicine_batches WHERE medicine_id = ? ORDER BY id LIMIT 1',
            [item.medicine_id]
          );
          if (defaultBatch) {
            batchId = defaultBatch.id;
            await execute(
              'UPDATE medicine_batches SET quantity = quantity - ? WHERE id = ?',
              [item.quantity, batchId]
            );
          }
        }

        await execute(
          `INSERT INTO sale_items (sale_id, medicine_id, batch_id, quantity, unit_price, discount, total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [saleId, item.medicine_id, batchId, item.quantity, item.unit_price, item.discount || 0, itemTotal]
        );

        if (batchId) {
          await execute(
            `INSERT INTO stock_movements (medicine_id, batch_id, movement_type, quantity, reference_type, reference_id, user_id, notes)
             VALUES (?, ?, 'sale', ?, 'sale', ?, ?, ?)`,
            [item.medicine_id, batchId, -item.quantity, saleId, userId, `Sale #${invoiceNumber}`]
          );
        }
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
      `SELECT COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_amount 
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
