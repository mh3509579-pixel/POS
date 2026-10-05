import { User, UserWithRole, CreateUserDTO, UpdateUserDTO, Role } from '../domain/user.entity.js';
import { query, queryOne, execute } from '../../../infrastructure/database/connection.js';

export class UserRepository {
  async findById(id: number): Promise<UserWithRole | null> {
    const user = await queryOne<User>('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) return null;

    const role = await queryOne<{ name: string }>('SELECT name FROM roles WHERE id = ?', [user.role_id]);
    const { password_hash: _, ...userWithoutPassword } = user;
    const result: UserWithRole = {
      ...userWithoutPassword,
      role_name: role?.name || 'unknown',
    } as UserWithRole;
    return result;
  }

  async findByUsername(username: string): Promise<User | null> {
    return queryOne<User>('SELECT * FROM users WHERE username = ?', [username]);
  }

  async findByEmail(email: string): Promise<User | null> {
    return queryOne<User>('SELECT * FROM users WHERE email = ?', [email]);
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<UserWithRole[]> {
    const rows = await query<(User & { role_name: string })[]>(
      'SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    return rows.map(({ password_hash, ...rest }) => ({ ...rest } as UserWithRole));
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
    return result?.count || 0;
  }

  async create(data: CreateUserDTO, passwordHash: string): Promise<UserWithRole> {
    const result = await execute(
      'INSERT INTO users (username, email, password_hash, full_name, phone, role_id) VALUES (?, ?, ?, ?, ?, ?)',
      [data.username, data.email, passwordHash, data.full_name, data.phone || null, data.role_id]
    );

    return this.findById(result.insertId) as Promise<UserWithRole>;
  }

  async update(id: number, data: UpdateUserDTO): Promise<UserWithRole | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.full_name !== undefined) { fields.push('full_name = ?'); values.push(data.full_name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.role_id !== undefined) { fields.push('role_id = ?'); values.push(data.role_id); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  async updatePassword(id: number, passwordHash: string): Promise<boolean> {
    const result = await execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
    return result.affectedRows > 0;
  }

  async updateLastLogin(id: number): Promise<void> {
    await execute('UPDATE users SET last_login_at = NOW(), failed_login_attempts = 0 WHERE id = ?', [id]);
  }

  async incrementFailedLogin(id: number): Promise<void> {
    await execute('UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?', [id]);
  }

  async lockUser(id: number, minutes: number): Promise<void> {
    await execute('UPDATE users SET locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?', [minutes, id]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async setActive(id: number, isActive: boolean): Promise<boolean> {
    const result = await execute('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
    return result.affectedRows > 0;
  }

  /** Counts active users holding `roleId`, ignoring one account. */
  async countActiveWithRoleExcluding(roleId: number, excludeUserId: number): Promise<number> {
    const result = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE role_id = ? AND is_active = TRUE AND id <> ?',
      [roleId, excludeUserId]
    );
    return Number(result?.count ?? 0);
  }

  async getUserPermissions(userId: number): Promise<string[]> {
    const permissions = await query<{ name: string }[]>(
      `SELECT DISTINCT p.name FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN users u ON rp.role_id = u.role_id
       WHERE u.id = ? AND u.is_active = TRUE
         AND (u.locked_until IS NULL OR u.locked_until < NOW())`,
      [userId]
    );
    return permissions.map((p) => p.name);
  }

  /**
   * Minimal projection used by the auth middleware on every request.
   * Returns null when the account is missing, deactivated, or locked, so a
   * token for a disabled/deleted account stops working immediately instead of
   * remaining valid for the full token lifetime.
   */
  async findActiveAuthContext(userId: number): Promise<{ id: number; username: string; role_id: number } | null> {
    return queryOne<{ id: number; username: string; role_id: number }>(
      `SELECT id, username, role_id FROM users
       WHERE id = ? AND is_active = TRUE AND (locked_until IS NULL OR locked_until < NOW())`,
      [userId]
    );
  }

  // Role methods
  async getAllRoles(): Promise<Role[]> {
    return query<Role[]>('SELECT * FROM roles ORDER BY name');
  }

  async findRoleById(id: number): Promise<Role | null> {
    return queryOne<Role>('SELECT * FROM roles WHERE id = ?', [id]);
  }
}
