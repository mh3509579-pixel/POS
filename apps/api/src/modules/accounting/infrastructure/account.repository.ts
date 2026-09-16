import { Account, CreateAccountDTO, UpdateAccountDTO } from '../domain/account.entity.js';
import { IAccountRepository } from '../domain/account.repository.js';
import { query, queryOne, execute } from '../../../infrastructure/database/connection.js';

export class AccountRepository implements IAccountRepository {
  async findAll(): Promise<Account[]> {
    return query<Account[]>('SELECT * FROM accounts WHERE is_active = TRUE ORDER BY code');
  }

  async findById(id: number): Promise<Account | null> {
    return queryOne<Account>('SELECT * FROM accounts WHERE id = ?', [id]);
  }

  async findByCode(code: string): Promise<Account | null> {
    return queryOne<Account>('SELECT * FROM accounts WHERE code = ?', [code]);
  }

  async findByType(type: string): Promise<Account[]> {
    return query<Account[]>('SELECT * FROM accounts WHERE type = ? AND is_active = TRUE ORDER BY code', [type]);
  }

  async create(data: CreateAccountDTO): Promise<Account> {
    const result = await execute(
      'INSERT INTO accounts (code, name, type, parent_id, description) VALUES (?, ?, ?, ?, ?)',
      [data.code, data.name, data.type, data.parent_id || null, data.description || null]
    );
    return this.findById(result.insertId) as Promise<Account>;
  }

  async update(id: number, data: UpdateAccountDTO): Promise<Account | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await execute(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await execute('UPDATE accounts SET is_active = FALSE WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async getChildren(parentId: number): Promise<Account[]> {
    return query<Account[]>('SELECT * FROM accounts WHERE parent_id = ? AND is_active = TRUE ORDER BY code', [parentId]);
  }
}
