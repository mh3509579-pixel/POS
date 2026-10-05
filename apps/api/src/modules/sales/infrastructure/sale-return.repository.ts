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
  withTransaction,
  TransactionContext,
} from '../../../infrastructure/database/connection.js';
import { round2, ValidationError, ConflictError } from '../domain/sale.rules.js';

export class SaleReturnRepository {
  async generateReturnNumber(tx?: TransactionContext): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RET-SALE-${year}-`;
    const last = tx
      ? await tx.queryOne<{ return_number: string }>(
          "SELECT return_number FROM sale_returns WHERE return_number LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE",
          [`${prefix}%`]
        )
      : await queryOne<{ return_number: string }>(
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
    const saleReturn = await withTransaction(async (tx) => {
      const sale = await tx.queryOne<{ id: number; customer_id: number | null; status: string }>(
        'SELECT id, customer_id, status FROM sales WHERE id = ? FOR UPDATE',
        [data.sale_id]
      );

      if (!sale) {
        throw new ValidationError(`Sale ${data.sale_id} not found`);
      }

      if (sale.status === 'voided') {
        throw new ConflictError('A voided sale cannot be returned');
      }

      const returnNumber = await this.generateReturnNumber(tx);

      // Resolve every line against the real sale_items row. medicine_id,
      // batch_id and unit_price are never taken from the client.
      interface ResolvedLine {
        sale_item_id: number;
        medicine_id: number;
        batch_id: number;
        quantity: number;
        unit_price: number;
        total: number;
      }

      const resolved: ResolvedLine[] = [];
      const seen = new Map<number, number>();

      for (const [index, raw] of data.items.entries()) {
        const saleItemId = Number(raw?.sale_item_id);
        if (!Number.isInteger(saleItemId) || saleItemId <= 0) {
          throw new ValidationError(`items[${index}].sale_item_id must be a positive integer`);
        }

        const quantity = Number(raw?.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new ValidationError(`items[${index}].quantity must be a whole number greater than zero`);
        }

        const saleItem = await tx.queryOne<{
          id: number;
          medicine_id: number;
          batch_id: number;
          quantity: number;
          unit_price: string | number;
        }>(
          'SELECT id, medicine_id, batch_id, quantity, unit_price FROM sale_items WHERE id = ? AND sale_id = ? FOR UPDATE',
          [saleItemId, data.sale_id]
        );

        if (!saleItem) {
          throw new ValidationError(`Sale item ${saleItemId} does not belong to sale ${data.sale_id}`);
        }

        const previouslyReturned = await tx.queryOne<{ returned: number }>(
          `SELECT COALESCE(SUM(sri.quantity), 0) as returned
           FROM sale_return_items sri
           JOIN sale_returns sr ON sri.sale_return_id = sr.id
           WHERE sri.sale_item_id = ? AND sr.status = 'completed'`,
          [saleItemId]
        );

        const alreadyThisRequest = seen.get(saleItemId) ?? 0;
        const returnedSoFar = Number(previouslyReturned?.returned ?? 0) + alreadyThisRequest;
        const sold = Number(saleItem.quantity);

        if (returnedSoFar + quantity > sold) {
          throw new ConflictError(
            `Cannot return ${quantity} of sale item ${saleItemId}: only ${sold - returnedSoFar} of ${sold} remain returnable`
          );
        }

        seen.set(saleItemId, alreadyThisRequest + quantity);

        const unitPrice = Number(saleItem.unit_price ?? 0);

        resolved.push({
          sale_item_id: saleItem.id,
          medicine_id: saleItem.medicine_id,
          batch_id: saleItem.batch_id,
          quantity,
          unit_price: unitPrice,
          total: round2(unitPrice * quantity),
        });
      }

      const subtotal = round2(resolved.reduce((sum, line) => sum + line.total, 0));

      const saleReturnResult = await tx.execute(
        `INSERT INTO sale_returns (return_number, sale_id, customer_id, user_id, subtotal, total_amount, refund_method, reason, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
        [
          returnNumber,
          data.sale_id,
          data.customer_id ?? sale.customer_id ?? null,
          userId,
          subtotal,
          subtotal,
          data.refund_method,
          data.reason || null,
        ]
      );

      const saleReturnId = saleReturnResult.insertId;

      for (const line of resolved) {
        await tx.execute(
          `INSERT INTO sale_return_items (sale_return_id, sale_item_id, medicine_id, batch_id, quantity, unit_price, total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            saleReturnId,
            line.sale_item_id,
            line.medicine_id,
            line.batch_id,
            line.quantity,
            line.unit_price,
            line.total,
          ]
        );

        await tx.execute('UPDATE medicine_batches SET quantity = quantity + ? WHERE id = ?', [
          line.quantity,
          line.batch_id,
        ]);

        await tx.execute(
          `INSERT INTO stock_movements (medicine_id, batch_id, movement_type, quantity, reference_type, reference_id, user_id, notes)
           VALUES (?, ?, 'sale_return', ?, 'sale_return', ?, ?, ?)`,
          [
            line.medicine_id,
            line.batch_id,
            line.quantity,
            saleReturnId,
            userId,
            `Return #${returnNumber}`,
          ]
        );
      }

      if (await this.checkAllItemsReturned(tx, data.sale_id)) {
        await tx.execute("UPDATE sales SET status = 'returned' WHERE id = ?", [data.sale_id]);
      }

      return { saleReturnId, returnNumber };
    });

    return (await this.findById(saleReturn.saleReturnId)) as SaleReturnWithItems;
  }

  private async checkAllItemsReturned(tx: TransactionContext, saleId: number): Promise<boolean> {
    const result = await tx.queryOne<{ total: number; returned: number }>(
      `SELECT
         (SELECT COALESCE(SUM(si.quantity), 0) FROM sale_items si WHERE si.sale_id = ?) as total,
         (SELECT COALESCE(SUM(sri.quantity), 0) FROM sale_return_items sri
          JOIN sale_returns sr ON sri.sale_return_id = sr.id
          WHERE sr.sale_id = ? AND sr.status = 'completed') as returned`,
      [saleId, saleId]
    );
    if (!result) return false;
    return Number(result.total) > 0 && Number(result.total) <= Number(result.returned);
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
