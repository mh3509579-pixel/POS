import api from './api.service';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
}

class NotificationService {
  async getAll(limit = 50, offset = 0): Promise<{ data: Notification[]; unread_count: number }> {
    const response = await api.get<{ status: string; data: Notification[]; unread_count: number }>(
      `/notifications?limit=${limit}&offset=${offset}`
    );
    return { data: response.data.data, unread_count: response.data.unread_count };
  }

  async markAsRead(id: number): Promise<void> {
    await api.put(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all');
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/notifications/${id}`);
  }
}

export const notificationService = new NotificationService();
