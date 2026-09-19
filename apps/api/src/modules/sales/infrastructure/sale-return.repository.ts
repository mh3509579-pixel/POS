import {
  SaleReturn,
  SaleReturnItem,
  CreateSaleReturnDTO,
  SaleReturnWithItems,
} from '../domain/sale-return.entity.js';
import {
  query,
  queryOne,
  execute,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} from '../../../infrastructure/database/connection.js';

export class SaleReturnRepository {
  async generateReturnNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RET-SALE-${year}-`;
    const last = await queryOne<{ return_number: string }>(
      "SELECT return_number FROM sale_returns WHERE return_number LIKE ? ORDER BY id DESC LIMIT 1",
      [`${prefix}%`]
    );

    if (!last) {
      return `${prefix}000001`;
    }

    const seq = parseInt(last.return_number.split('-')[3]) + 1;
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  async create(
    data: CreateSaleReturnDTO,
    userId: number
  ): Promise<SaleReturnWithItems> {
    const connection = await beginTransaction();

    try {
      const returnNumber = await this.generateReturnNumber();

      const subtotal = data.items.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      );

      const saleResult = await execute(
        `INSERT INTO sale_returns (return_number, sale_id, customer_id, user_id, subtotal, total_amount, refund_method, reason, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          returnNumber,
          data.sale_id,
          data.customer_id || null,
          userId,
          subtotal,
          subtotal,
          data.refund_method,
          data.reason || null,
        ]
      );

      const saleReturnId = saleResult.insertId;

      for (const item of data.items) {
        const itemTotal = item.unit_price * item.quantity;

        await execute(
          `INSERT INTO sale_return_items (sale_return_id, sale_item_id, medicine_id, batch_id, quantity, unit_price, total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            saleReturnId,
            item.sale_item_id,
            item.medicine_id,
            item.batch_id || null,
            item.quantity,
            item.unit_price,
            itemTotal,
          ]
        );

        if (item.batch_id) {
          await execute(
            'UPDATE medicine_batches SET quantity = quantity + ? WHERE id = ?',
            [item.quantity, item.batch_id]
          );

          await execute(
            `INSERT INTO stock_movements (medicine_id, batch_id, movement_type, quantity, reference_type, reference_id, user_id, notes)
             VALUES (?, ?, 'sale_return', ?, 'sale_return', ?, ?, ?)`,
            [
              item.medicine_id,
              item.batch_id,
              item.quantity,
              saleReturnId,
              userId,
              `Return #${returnNumber}`,
            ]
          );
        }
      }

      const allItemsReturned = await this.checkAllItemsReturned(
        data.sale_id
      );
      if (allItemsReturned) {
        await execute(
          "UPDATE sales SET status = 'returned' WHERE id = ?",
          [data.sale_id]
        );
      }

      await commitTransaction(connection);

      return (await this.findById(saleReturnId)) as SaleReturnWithItems;
    } catch (error) {
      await rollbackTransaction(connection);
      throw error;
    }
  }

  private async checkAllItemsReturned(saleId: number): Promise<boolean> {
    const result = await queryOne<{ total: number; returned: number }>(
      `SELECT
         (SELECT COALESCE(SUM(si.quantity), 0) FROM sale_items si WHERE si.sale_id = ?) as total,
         (SELECT COALESCE(SUM(sri.quantity), 0) FROM sale_return_items sri
          JOIN sale_returns sr ON sri.sale_return_id = sr.id
          WHERE sr.sale_id = ? AND sr.status != 'rejected') as returned`,
      [saleId, saleId]
    );
    if (!result) return false;
    return result.total > 0 && result.total <= result.returned;
  }

  async findById(id: number): Promise<SaleReturnWithItems | null> {
    const saleReturn = await queryOne<any>(
      `SELECT sr.*, u.full_name as user_name, c.name as customer_name, s.invoice_number
       FROM sale_returns sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN customers c ON sr.customer_id = c.id
       LEFT JOIN sales s ON sr.sale_id = s.id
       WHERE sr.id = ?`,
      [id]
    );
    if (!saleReturn) return null;

    const items = await query<any[]>(
      `SELECT sri.*, m.name as medicine_name
       FROM sale_return_items sri
       LEFT JOIN medicines m ON sri.medicine_id = m.id
       WHERE sri.sale_return_id = ?`,
      [id]
    );

    return {
      id: saleReturn.id,
      return_number: saleReturn.return_number,
      sale_id: saleReturn.sale_id,
      customer_id: saleReturn.customer_id,
      user_id: saleReturn.user_id,
      subtotal: saleReturn.subtotal,
      total_amount: saleReturn.total_amount,
      refund_method: saleReturn.refund_method,
      reason: saleReturn.reason,
      status: saleReturn.status,
      created_at: saleReturn.created_at,
      user_name: saleReturn.user_name,
      customer_name: saleReturn.customer_name,
      invoice_number: saleReturn.invoice_number,
      items: items.map((item: any) => ({
        id: item.id,
        sale_return_id: item.sale_return_id,
        sale_item_id: item.sale_item_id,
        medicine_id: item.medicine_id,
        batch_id: item.batch_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        medicine_name: item.medicine_name,
      })),
    };
  }

  async findAll(
    limit: number = 50,
    offset: number = 0
  ): Promise<SaleReturnWithItems[]> {
    const returns = await query<any[]>(
      `SELECT sr.*, u.full_name as user_name, c.name as customer_name, s.invoice_number
       FROM sale_returns sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN customers c ON sr.customer_id = c.id
       LEFT JOIN sales s ON sr.sale_id = s.id
       ORDER BY sr.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const result: SaleReturnWithItems[] = [];
    for (const ret of returns) {
      const full = await this.findById(ret.id);
      if (full) result.push(full);
    }
    return result;
  }

  async findBySaleId(saleId: number): Promise<SaleReturnWithItems[]> {
    const returns = await query<any[]>(
      `SELECT sr.*, u.full_name as user_name, c.name as customer_name, s.invoice_number
       FROM sale_returns sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN customers c ON sr.customer_id = c.id
       LEFT JOIN sales s ON sr.sale_id = s.id
       WHERE sr.sale_id = ?
       ORDER BY sr.created_at DESC`,
      [saleId]
    );

    const result: SaleReturnWithItems[] = [];
    for (const ret of returns) {
      const full = await this.findById(ret.id);
      if (full) result.push(full);
    }
    return result;
  }
}
