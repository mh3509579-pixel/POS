import api from './api.service';

export const accountingService = {
  async getAllAccounts() {
    const response = await api.get<{ status: string; data: any[] }>('/accounting/accounts');
    return response.data;
  },

  async getAccount(id: number) {
    const response = await api.get<{ status: string; data: any }>(`/accounting/accounts/${id}`);
    return response.data;
  },

  async createAccount(data: any) {
    const response = await api.post<{ status: string; data: any }>('/accounting/accounts', data);
    return response.data;
  },

  async updateAccount(id: number, data: any) {
    const response = await api.put<{ status: string; data: any }>(`/accounting/accounts/${id}`, data);
    return response.data;
  },

  async getAllJournalEntries(params?: { start_date?: string; end_date?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    const query = searchParams.toString();
    const response = await api.get<{ status: string; data: any[] }>(`/accounting/journal-entries${query ? `?${query}` : ''}`);
    return response.data;
  },

  async getJournalEntry(id: number) {
    const response = await api.get<{ status: string; data: any }>(`/accounting/journal-entries/${id}`);
    return response.data;
  },

  async createJournalEntry(data: any) {
    const response = await api.post<{ status: string; data: any }>('/accounting/journal-entries', data);
    return response.data;
  },

  async postJournalEntry(id: number) {
    const response = await api.post<{ status: string; data: any }>(`/accounting/journal-entries/${id}/post`);
    return response.data;
  },

  async voidJournalEntry(id: number, reason: string) {
    const response = await api.post<{ status: string; data: any }>(`/accounting/journal-entries/${id}/void`, { reason });
    return response.data;
  },

  async getTrialBalance(params?: { start_date?: string; end_date?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    const query = searchParams.toString();
    const response = await api.get<{ status: string; data: any[] }>(`/accounting/trial-balance${query ? `?${query}` : ''}`);
    return response.data;
  },

  async getAccountStatement(accountId: number, params?: { start_date?: string; end_date?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    const query = searchParams.toString();
    const response = await api.get<{ status: string; data: any }>(`/accounting/accounts/${accountId}/statement${query ? `?${query}` : ''}`);
    return response.data;
  },

  async getAccountBalance(accountId: number) {
    const response = await api.get<{ status: string; data: { balance: number } }>(`/accounting/accounts/${accountId}/balance`);
    return response.data;
  },
};

export const salesService = {
  async createSale(data: any) {
    const response = await api.post<{ status: string; data: any }>('/transactions/sales', data);
    return response.data;
  },

  async getSale(id: number) {
    const response = await api.get<{ status: string; data: any }>(`/transactions/sales/${id}`);
    return response.data;
  },

  async getAllSales(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    const query = searchParams.toString();
    const response = await api.get<{ status: string; data: any[] }>(`/transactions/sales${query ? `?${query}` : ''}`);
    return response.data;
  },

  async getDailySales(date?: string) {
    const searchParams = new URLSearchParams();
    if (date) searchParams.append('date', date);
    const query = searchParams.toString();
    const response = await api.get<{ status: string; data: any }>(`/transactions/sales/daily${query ? `?${query}` : ''}`);
    return response.data;
  },
};

export const purchasesService = {
  async createPurchase(data: any) {
    const response = await api.post<{ status: string; data: any }>('/transactions/purchases', data);
    return response.data;
  },

  async getPurchase(id: number) {
    const response = await api.get<{ status: string; data: any }>(`/transactions/purchases/${id}`);
    return response.data;
  },

  async getAllPurchases(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    const query = searchParams.toString();
    const response = await api.get<{ status: string; data: any[] }>(`/transactions/purchases${query ? `?${query}` : ''}`);
    return response.data;
  },
};

export const expensesService = {
  async createExpense(data: any) {
    const response = await api.post<{ status: string; data: any }>('/transactions/expenses', data);
    return response.data;
  },

  async getExpense(id: number) {
    const response = await api.get<{ status: string; data: any }>(`/transactions/expenses/${id}`);
    return response.data;
  },

  async getAllExpenses(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    const query = searchParams.toString();
    const response = await api.get<{ status: string; data: any[] }>(`/transactions/expenses${query ? `?${query}` : ''}`);
    return response.data;
  },

  async getAllCategories() {
    const response = await api.get<{ status: string; data: any[] }>('/transactions/expense-categories');
    return response.data;
  },
};
