import api from './api.service';

class SettingsService {
  async getAll(): Promise<Record<string, { value: string; type: string; module: string; description: string }>> {
    const response = await api.get<{ status: string; data: Record<string, any> }>('/settings');
    return response.data.data;
  }

  async getByModule(module: string): Promise<Record<string, { value: string; type: string; description: string }>> {
    const response = await api.get<{ status: string; data: Record<string, any> }>(`/settings/${module}`);
    return response.data.data;
  }

  async save(settings: Record<string, string>): Promise<void> {
    await api.put('/settings', settings);
  }
}

export const settingsService = new SettingsService();
