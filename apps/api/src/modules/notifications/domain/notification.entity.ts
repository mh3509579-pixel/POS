export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  reference_type: string | null;
  reference_id: number | null;
  created_at: Date;
}

export interface CreateNotificationDTO {
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  reference_type?: string;
  reference_id?: number;
}
