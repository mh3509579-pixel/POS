import api from './api.service';

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string;
  username: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  old_values: string | null;
  new_values: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

class AuditService {
  async getAll(params?: { limit?: number; offset?: number; action?: string; entity_type?: string; start_date?: string; end_date?: string }): Promise<{ data: AuditLog[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));
    if (params?.action) searchParams.append('action', params.action);
    if (params?.entity_type) searchParams.append('entity_type', params.entity_type);
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    const query = searchParams.toString();
    const response = await api.get<{ status: string; data: AuditLog[]; total: number }>(
      `/audit-logs${query ? `?${query}` : ''}`
    );
    return { data: response.data.data, total: response.data.total };
  }

  async getStats(): Promise<{ total: number; today: number; failed: number }> {
    const response = await api.get<{ status: string; data: { total: number; today: number; failed: number } }>(
      '/audit-logs/stats'
    );
    return response.data.data;
  }
}

export const auditService = new AuditService();
