import api from './api.service';

class ReportsService {
  async getSalesReport(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString();
    const response = await api.get<{ status: string; data: any }>(
      `/reports/sales${query ? `?${query}` : ''}`
    );
    return response.data.data;
  }

  async getPurchasesReport(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString();
    const response = await api.get<{ status: string; data: any }>(
      `/reports/purchases${query ? `?${query}` : ''}`
    );
    return response.data.data;
  }

  async getExpensesReport(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString();
    const response = await api.get<{ status: string; data: any }>(
      `/reports/expenses${query ? `?${query}` : ''}`
    );
    return response.data.data;
  }

  async getProfitLoss(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString();
    const response = await api.get<{ status: string; data: any }>(
      `/reports/profit-loss${query ? `?${query}` : ''}`
    );
    return response.data.data;
  }
}

export const reportsService = new ReportsService();
