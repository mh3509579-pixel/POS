import { Supplier, CreateSupplierDTO, UpdateSupplierDTO } from '../domain/supplier.entity.js';
import { query, queryOne, execute } from '../../../infrastructure/database/connection.js';

export class SupplierRepository {
  async findById(id: number): Promise<Supplier | null> {
    return queryOne<Supplier>('SELECT * FROM suppliers WHERE id = ?', [id]);
  }

  async findAll(limit: number = 100, offset: number = 0, search?: string, type?: string): Promise<Supplier[]> {
    let sql = 'SELECT * FROM suppliers WHERE is_active = TRUE';
    const params: any[] = [];

    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR contact_person LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return query<Supplier[]>(sql, params);
  }

  async count(search?: string, type?: string): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM suppliers WHERE is_active = TRUE';
    const params: any[] = [];

    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR contact_person LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    const result = await queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  async create(data: CreateSupplierDTO): Promise<Supplier> {
    const result = await execute(
      `INSERT INTO suppliers (name, type, phone, email, address, city, contact_person, tax_number, payment_terms_days, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name, data.type || 'local',
        data.phone || null, data.email || null,
        data.address || null, data.city || null,
        data.contact_person || null, data.tax_number || null,
        data.payment_terms_days || 30, data.notes || null,
      ]
    );

    return this.findById(result.insertId) as Promise<Supplier>;
  }

  async update(id: number, data: UpdateSupplierDTO): Promise<Supplier | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
    if (data.city !== undefined) { fields.push('city = ?'); values.push(data.city); }
    if (data.contact_person !== undefined) { fields.push('contact_person = ?'); values.push(data.contact_person); }
    if (data.tax_number !== undefined) { fields.push('tax_number = ?'); values.push(data.tax_number); }
    if (data.payment_terms_days !== undefined) { fields.push('payment_terms_days = ?'); values.push(data.payment_terms_days); }
    if (data.rating !== undefined) { fields.push('rating = ?'); values.push(data.rating); }
    if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await execute(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await execute('UPDATE suppliers SET is_active = FALSE WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async updateBalance(id: number, amount: number): Promise<void> {
    await execute('UPDATE suppliers SET current_balance = current_balance + ? WHERE id = ?', [amount, id]);
  }

  async addPurchase(id: number, amount: number): Promise<void> {
    await execute(
      'UPDATE suppliers SET total_purchases = total_purchases + ? WHERE id = ?',
      [amount, id]
    );
  }

  async getTopSuppliers(limit: number = 10): Promise<Supplier[]> {
    return query<Supplier[]>(
      'SELECT * FROM suppliers WHERE is_active = TRUE ORDER BY total_purchases DESC LIMIT ?',
      [limit]
    );
  }

  async getSupplierStats(): Promise<{
    total: number;
    local: number;
    national: number;
    international: number;
    total_payable: number;
    avg_rating: number;
  }> {
    const stats = await queryOne<{
      total: number;
      local: number;
      national: number;
      international: number;
      total_payable: number;
      avg_rating: number;
    }>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN type = 'local' THEN 1 ELSE 0 END) as local,
        SUM(CASE WHEN type = 'national' THEN 1 ELSE 0 END) as national,
        SUM(CASE WHEN type = 'international' THEN 1 ELSE 0 END) as international,
        COALESCE(SUM(current_balance), 0) as total_payable,
        COALESCE(AVG(rating), 0) as avg_rating
       FROM suppliers WHERE is_active = TRUE`
    );

    return stats || {
      total: 0, local: 0, national: 0, international: 0, total_payable: 0, avg_rating: 0,
    };
  }
}
