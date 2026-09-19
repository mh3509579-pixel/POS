import { Customer, CreateCustomerDTO, UpdateCustomerDTO } from '../domain/customer.entity.js';
import { query, queryOne, execute } from '../../../infrastructure/database/connection.js';

export class CustomerRepository {
  async findById(id: number): Promise<Customer | null> {
    return queryOne<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
  }

  async findAll(limit: number = 100, offset: number = 0, search?: string, type?: string): Promise<Customer[]> {
    let sql = 'SELECT * FROM customers WHERE is_active = TRUE';
    const params: any[] = [];

    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return query<Customer[]>(sql, params);
  }

  async count(search?: string, type?: string): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM customers WHERE is_active = TRUE';
    const params: any[] = [];

    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    const result = await queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  async create(data: CreateCustomerDTO): Promise<Customer> {
    const result = await execute(
      `INSERT INTO customers (name, type, phone, email, cnic, address, city, credit_limit, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name, data.type || 'regular',
        data.phone || null, data.email || null,
        (data as any).cnic || null,
        data.address || null, data.city || null,
        data.credit_limit || 0, data.notes || null,
      ]
    );

    return this.findById(result.insertId) as Promise<Customer>;
  }

  async update(id: number, data: UpdateCustomerDTO): Promise<Customer | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if ((data as any).cnic !== undefined) { fields.push('cnic = ?'); values.push((data as any).cnic); }
    if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
    if (data.city !== undefined) { fields.push('city = ?'); values.push(data.city); }
    if (data.credit_limit !== undefined) { fields.push('credit_limit = ?'); values.push(data.credit_limit); }
    if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await execute(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await execute('UPDATE customers SET is_active = FALSE WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async updateBalance(id: number, amount: number): Promise<void> {
    await execute('UPDATE customers SET current_balance = current_balance + ? WHERE id = ?', [amount, id]);
  }

  async addPurchase(id: number, amount: number): Promise<void> {
    await execute(
      'UPDATE customers SET total_purchases = total_purchases + ? WHERE id = ?',
      [amount, id]
    );
  }

  async getTopCustomers(limit: number = 10): Promise<Customer[]> {
    return query<Customer[]>(
      'SELECT * FROM customers WHERE is_active = TRUE ORDER BY total_purchases DESC LIMIT ?',
      [limit]
    );
  }

  async getCustomerStats(): Promise<{
    total: number;
    regular: number;
    premium: number;
    wholesale: number;
    hospital: number;
    clinic: number;
    total_receivable: number;
  }> {
    const stats = await queryOne<{
      total: number;
      regular: number;
      premium: number;
      wholesale: number;
      hospital: number;
      clinic: number;
      total_receivable: number;
    }>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN type = 'regular' THEN 1 ELSE 0 END) as regular,
        SUM(CASE WHEN type = 'premium' THEN 1 ELSE 0 END) as premium,
        SUM(CASE WHEN type = 'wholesale' THEN 1 ELSE 0 END) as wholesale,
        SUM(CASE WHEN type = 'hospital' THEN 1 ELSE 0 END) as hospital,
        SUM(CASE WHEN type = 'clinic' THEN 1 ELSE 0 END) as clinic,
        COALESCE(SUM(current_balance), 0) as total_receivable
       FROM customers WHERE is_active = TRUE`
    );

    return stats || {
      total: 0, regular: 0, premium: 0, wholesale: 0, hospital: 0, clinic: 0, total_receivable: 0,
    };
  }
}
