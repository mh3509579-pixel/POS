import { CreatePurchaseReturnDTO, PurchaseReturnWithItems } from '../domain/purchase-return.entity.js';
import { query, queryOne, execute, beginTransaction, commitTransaction, rollbackTransaction } from '../../../infrastructure/database/connection.js';
import mysql from 'mysql2/promise';

export class PurchaseReturnRepository {
  async generateReturnNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RET-PO-${year}-`;
    const last = await queryOne<{ return_number: string }>(
      "SELECT return_number FROM purchase_returns WHERE return_number LIKE ? ORDER BY id DESC LIMIT 1",
      [`${prefix}%`]
    );

    if (!last) {
      return `${prefix}000001`;
    }

    const seq = parseInt(last.return_number.split('-')[3]) + 1;
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  async create(data: CreatePurchaseReturnDTO, userId: number): Promise<PurchaseReturnWithItems> {
    const connection = await beginTransaction();

    try {
      const returnNumber = await this.generateReturnNumber();
      const totalAmount = data.items.reduce((sum, item) => sum + (item.purchase_price * item.quantity), 0);

      const result = await execute(
        `INSERT INTO purchase_returns (return_number, purchase_id, supplier_id, user_id, total_amount, refund_method, reason, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          returnNumber,
          data.purchase_id,
          data.supplier_id || null,
          userId,
          totalAmount,
          data.refund_method,
          data.reason || null,
        ]
      );

      const purchaseReturnId = result.insertId;

      for (const item of data.items) {
        const itemTotal = item.purchase_price * item.quantity;
        await execute(
          `INSERT INTO purchase_return_items (purchase_return_id, purchase_item_id, medicine_id, batch_id, quantity, purchase_price, total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [purchaseReturnId, item.purchase_item_id, item.medicine_id, item.batch_id || null, item.quantity, item.purchase_price, itemTotal]
        );

        if (item.batch_id) {
          const batch = await queryOne<{ id: number; quantity: number }>(
            'SELECT id, quantity FROM medicine_batches WHERE id = ?',
            [item.batch_id]
          );

          if (!batch) {
            throw new Error(`Batch with id ${item.batch_id} not found`);
          }

          if (batch.quantity < item.quantity) {
            throw new Error(`Insufficient batch quantity. Available: ${batch.quantity}, Requested: ${item.quantity}`);
          }

          await execute(
            'UPDATE medicine_batches SET quantity = quantity - ? WHERE id = ?',
            [item.quantity, item.batch_id]
          );

          await execute(
            `INSERT INTO stock_movements (medicine_id, batch_id, movement_type, quantity, reference_type, reference_id, user_id, notes)
             VALUES (?, ?, 'purchase_return', ?, 'purchase_return', ?, ?, ?)`,
            [item.medicine_id, item.batch_id, -item.quantity, purchaseReturnId, userId, `Purchase Return #${returnNumber}`]
          );
        }
      }

      if (data.supplier_id) {
        await execute(
          'UPDATE suppliers SET current_balance = current_balance - ? WHERE id = ?',
          [totalAmount, data.supplier_id]
        );
      }

      await commitTransaction(connection);

      return this.findById(purchaseReturnId) as Promise<PurchaseReturnWithItems>;
    } catch (error) {
      await rollbackTransaction(connection);
      throw error;
    }
  }

  async findById(id: number): Promise<PurchaseReturnWithItems | null> {
    const purchaseReturn = await queryOne<any>(
      `SELECT pr.*, s.name as supplier_name, u.full_name as user_name, p.purchase_number
       FROM purchase_returns pr
       LEFT JOIN suppliers s ON pr.supplier_id = s.id
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN purchases p ON pr.purchase_id = p.id
       WHERE pr.id = ?`,
      [id]
    );
    if (!purchaseReturn) return null;

    const items = await query<any[]>(
      `SELECT pri.*, m.name as medicine_name
       FROM purchase_return_items pri
       LEFT JOIN medicines m ON pri.medicine_id = m.id
       WHERE pri.purchase_return_id = ?`,
      [id]
    );

    return {
      id: purchaseReturn.id,
      return_number: purchaseReturn.return_number,
      purchase_id: purchaseReturn.purchase_id,
      supplier_id: purchaseReturn.supplier_id,
      user_id: purchaseReturn.user_id,
      total_amount: purchaseReturn.total_amount,
      refund_method: purchaseReturn.refund_method,
      reason: purchaseReturn.reason,
      status: purchaseReturn.status,
      created_at: purchaseReturn.created_at,
      items: items.map((item: any) => ({
        id: item.id,
        purchase_return_id: item.purchase_return_id,
        purchase_item_id: item.purchase_item_id,
        medicine_id: item.medicine_id,
        batch_id: item.batch_id,
        quantity: item.quantity,
        purchase_price: item.purchase_price,
        total: item.total,
        medicine_name: item.medicine_name,
      })),
      supplier_name: purchaseReturn.supplier_name,
      user_name: purchaseReturn.user_name,
      purchase_number: purchaseReturn.purchase_number,
    };
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<any[]> {
    return query<any[]>(
      `SELECT pr.*, s.name as supplier_name, u.full_name as user_name, p.purchase_number
       FROM purchase_returns pr
       LEFT JOIN suppliers s ON pr.supplier_id = s.id
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN purchases p ON pr.purchase_id = p.id
       ORDER BY pr.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  async findByPurchaseId(purchaseId: number): Promise<any[]> {
    return query<any[]>(
      `SELECT pr.*, s.name as supplier_name, u.full_name as user_name
       FROM purchase_returns pr
       LEFT JOIN suppliers s ON pr.supplier_id = s.id
       LEFT JOIN users u ON pr.user_id = u.id
       WHERE pr.purchase_id = ?
       ORDER BY pr.created_at DESC`,
      [purchaseId]
    );
  }
}
