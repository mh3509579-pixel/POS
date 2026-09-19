import { execute } from '../database/connection.js';

export interface AuditLogData {
  user_id: number;
  action: string;        // 'create', 'update', 'delete', 'login', 'logout', 'sale', 'purchase', 'expense'
  entity_type: string;   // 'customer', 'medicine', 'sale', 'purchase', 'expense', 'user', 'setting'
  entity_id?: number;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip_address?: string;
  user_agent?: string;
}

export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.action,
        data.entity_type,
        data.entity_id || null,
        data.old_values ? JSON.stringify(data.old_values) : null,
        data.new_values ? JSON.stringify(data.new_values) : null,
        data.ip_address || null,
        data.user_agent || null,
      ]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
