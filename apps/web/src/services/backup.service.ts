import api from './api.service';

export interface Backup {
  id: number;
  backup_number: string;
  backup_type: 'full' | 'partial';
  status: 'pending' | 'completed' | 'failed';
  file_path: string | null;
  file_size: number | null;
  notes: string | null;
  created_by: number;
  created_at: string;
}

class BackupService {
  async getAll(): Promise<Backup[]> {
    const response = await api.get<{ status: string; data: Backup[] }>('/backup');
    return response.data.data;
  }

  async create(type: 'full' | 'partial' = 'full', notes?: string): Promise<Backup> {
    const response = await api.post<{ status: string; data: Backup }>('/backup', {
      backup_type: type,
      notes,
    });
    return response.data.data;
  }

  async restore(backupId: number): Promise<void> {
    await api.post(`/backup/${backupId}/restore`);
  }

  async download(backupId: number): Promise<Blob> {
    const response = await api.get(`/backup/${backupId}/download`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  }

  async getSettings(): Promise<any> {
    const response = await api.get<{ status: string; data: any }>('/backup/settings');
    return response.data.data;
  }

  async updateSettings(settings: any): Promise<void> {
    await api.put('/backup/settings', settings);
  }
}

export const backupService = new BackupService();
