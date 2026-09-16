import { Notification, CreateNotificationDTO } from '../domain/notification.entity.js';
import { query, queryOne, execute } from '../../../infrastructure/database/connection.js';

export class NotificationRepository {
  async findById(id: number): Promise<Notification | null> {
    return queryOne<Notification>('SELECT * FROM notifications WHERE id = ?', [id]);
  }

  async findByUserId(userId: number, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    return query<Notification[]>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
  }

  async countUnread(userId: number): Promise<number> {
    const result = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result?.count || 0;
  }

  async create(data: CreateNotificationDTO): Promise<Notification> {
    const result = await execute(
      `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.title,
        data.message,
        data.type,
        data.reference_type || null,
        data.reference_id || null,
      ]
    );

    return this.findById(result.insertId) as Promise<Notification>;
  }

  async markAsRead(id: number): Promise<boolean> {
    const result = await execute('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async markAllAsRead(userId: number): Promise<void> {
    await execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [userId]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await execute('DELETE FROM notifications WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async deleteAll(userId: number): Promise<void> {
    await execute('DELETE FROM notifications WHERE user_id = ?', [userId]);
  }
}
