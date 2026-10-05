import { CreatePurchaseReturnDTO, PurchaseReturnWithItems } from '../domain/purchase-return.entity.js';
import { query, queryOne, withTransaction, TransactionContext } from '../../../infrastructure/database/connection.js';
import { round2, ValidationError, ConflictError } from '../../sales/domain/sale.rules.js';

export class PurchaseReturnRepository {
  async generateReturnNumber(tx?: TransactionContext): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RET-PO-${year}-`;
    const last = tx
      ? await tx.queryOne<{ return_number: string }>(
          "SELECT return_number FROM purchase_returns WHERE return_number LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE",
          [`${prefix}%`]
        )
      : await queryOne<{ return_number: string }>(
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
    const purchaseReturnId = await withTransaction(async (tx) => {
      const purchase = await tx.queryOne<{ id: number; supplier_id: number; status: string }>(
        'SELECT id, supplier_id, status FROM purchases WHERE id = ? FOR UPDATE',
        [data.purchase_id]
      );

      if (!purchase) {
        throw new ValidationError(`Purchase ${data.purchase_id} not found`);
      }

      if (purchase.status === 'cancelled') {
        throw new ConflictError('A cancelled purchase cannot be returned');
      }

      const returnNumber = await this.generateReturnNumber(tx);

      // Resolve every line against the real purchase_items row so medicine_id,
      // batch_id and purchase_price cannot be spoofed by the client.
      const resolved: {
        purchase_item_id: number;
        medicine_id: number;
        batch_id: number;
        quantity: number;
        purchase_price: number;
        total: number;
      }[] = [];

      const seen = new Map<number, number>();

      for (const [index, raw] of data.items.entries()) {
        const purchaseItemId = Number(raw?.purchase_item_id);
        if (!Number.isInteger(purchaseItemId) || purchaseItemId <= 0) {
          throw new ValidationError(`items[${index}].purchase_item_id must be a positive integer`);
        }

        const quantity = Number(raw?.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new ValidationError(`items[${index}].quantity must be a whole number greater than zero`);
        }

        const purchaseItem = await tx.queryOne<{
          id: number;
          medicine_id: number;
          batch_id: number | null;
          quantity: number;
          purchase_price: string | number;
        }>(
          `SELECT id, medicine_id, batch_id, quantity, purchase_price
           FROM purchase_items WHERE id = ? AND purchase_id = ? FOR UPDATE`,
          [purchaseItemId, data.purchase_id]
        );

        if (!purchaseItem) {
          throw new ValidationError(
            `Purchase item ${purchaseItemId} does not belong to purchase ${data.purchase_id}`
          );
        }

        if (!purchaseItem.batch_id) {
          throw new ConflictError(
            `Purchase item ${purchaseItemId} has no batch recorded; stock cannot be returned safely`
          );
        }

        const previouslyReturned = await tx.queryOne<{ returned: number }>(
          `SELECT COALESCE(SUM(pri.quantity), 0) as returned
           FROM purchase_return_items pri
           JOIN purchase_returns pr ON pri.purchase_return_id = pr.id
           WHERE pri.purchase_item_id = ? AND pr.status = 'completed'`,
          [purchaseItemId]
        );

        const alreadyThisRequest = seen.get(purchaseItemId) ?? 0;
        const returnedSoFar = Number(previouslyReturned?.returned ?? 0) + alreadyThisRequest;
        const purchased = Number(purchaseItem.quantity);

        if (returnedSoFar + quantity > purchased) {
          throw new ConflictError(
            `Cannot return ${quantity} of purchase item ${purchaseItemId}: only ${purchased - returnedSoFar} of ${purchased} remain returnable`
          );
        }

        seen.set(purchaseItemId, alreadyThisRequest + quantity);

        const batch = await tx.queryOne<{ id: number; quantity: number }>(
          'SELECT id, quantity FROM medicine_batches WHERE id = ? FOR UPDATE',
          [purchaseItem.batch_id]
        );

        if (!batch) {
          throw new ConflictError(`Batch ${purchaseItem.batch_id} no longer exists`);
        }

        if (Number(batch.quantity) < quantity) {
          throw new ConflictError(
            `Insufficient batch quantity. Available: ${batch.quantity}, requested: ${quantity}`
          );
        }

        const purchasePrice = Number(purchaseItem.purchase_price ?? 0);

        resolved.push({
          purchase_item_id: purchaseItem.id,
          medicine_id: purchaseItem.medicine_id,
          batch_id: purchaseItem.batch_id,
          quantity,
          purchase_price: purchasePrice,
          total: round2(purchasePrice * quantity),
        });
      }

      const totalAmount = round2(resolved.reduce((sum, line) => sum + line.total, 0));
      const supplierId = data.supplier_id ?? purchase.supplier_id ?? null;

      const result = await tx.execute(
        `INSERT INTO purchase_returns (return_number, purchase_id, supplier_id, user_id, total_amount, refund_method, reason, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
        [
          returnNumber,
          data.purchase_id,
          supplierId,
          userId,
          totalAmount,
          data.refund_method,
          data.reason || null,
        ]
      );

      const newPurchaseReturnId = result.insertId;

      for (const line of resolved) {
        await tx.execute(
          `INSERT INTO purchase_return_items (purchase_return_id, purchase_item_id, medicine_id, batch_id, quantity, purchase_price, total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            newPurchaseReturnId,
            line.purchase_item_id,
            line.medicine_id,
            line.batch_id,
            line.quantity,
            line.purchase_price,
            line.total,
          ]
        );

        await tx.execute('UPDATE medicine_batches SET quantity = quantity - ? WHERE id = ?', [
          line.quantity,
          line.batch_id,
        ]);

        await tx.execute(
          `INSERT INTO stock_movements (medicine_id, batch_id, movement_type, quantity, reference_type, reference_id, user_id, notes)
           VALUES (?, ?, 'purchase_return', ?, 'purchase_return', ?, ?, ?)`,
          [
            line.medicine_id,
            line.batch_id,
            -line.quantity,
            newPurchaseReturnId,
            userId,
            `Purchase Return #${returnNumber}`,
          ]
        );
      }

      if (supplierId) {
        await tx.execute(
          'UPDATE suppliers SET current_balance = current_balance - ? WHERE id = ?',
          [totalAmount, supplierId]
        );
      }

      return newPurchaseReturnId;
    });

    return this.findById(purchaseReturnId) as Promise<PurchaseReturnWithItems>;
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
