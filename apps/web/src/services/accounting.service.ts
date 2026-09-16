const API_BASE = '/api';

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export const accountingService = {
  // Accounts
  async getAllAccounts() {
    return apiRequest<{ status: string; data: any[] }>('/accounting/accounts');
  },

  async getAccount(id: number) {
    return apiRequest<{ status: string; data: any }>(`/accounting/accounts/${id}`);
  },

  async createAccount(data: any) {
    return apiRequest<{ status: string; data: any }>('/accounting/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAccount(id: number, data: any) {
    return apiRequest<{ status: string; data: any }>(`/accounting/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Journal Entries
  async getAllJournalEntries(params?: { start_date?: string; end_date?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    const query = searchParams.toString();
    return apiRequest<{ status: string; data: any[] }>(`/accounting/journal-entries${query ? `?${query}` : ''}`);
  },

  async getJournalEntry(id: number) {
    return apiRequest<{ status: string; data: any }>(`/accounting/journal-entries/${id}`);
  },

  async createJournalEntry(data: any) {
    return apiRequest<{ status: string; data: any }>('/accounting/journal-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async postJournalEntry(id: number) {
    return apiRequest<{ status: string; data: any }>(`/accounting/journal-entries/${id}/post`, {
      method: 'POST',
    });
  },

  async voidJournalEntry(id: number, reason: string) {
    return apiRequest<{ status: string; data: any }>(`/accounting/journal-entries/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Trial Balance
  async getTrialBalance(params?: { start_date?: string; end_date?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    const query = searchParams.toString();
    return apiRequest<{ status: string; data: any[] }>(`/accounting/trial-balance${query ? `?${query}` : ''}`);
  },

  // Account Statement
  async getAccountStatement(accountId: number, params?: { start_date?: string; end_date?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    const query = searchParams.toString();
    return apiRequest<{ status: string; data: any }>(`/accounting/accounts/${accountId}/statement${query ? `?${query}` : ''}`);
  },

  // Account Balance
  async getAccountBalance(accountId: number) {
    return apiRequest<{ status: string; data: { balance: number } }>(`/accounting/accounts/${accountId}/balance`);
  },
};

export const salesService = {
  async createSale(data: any) {
    return apiRequest<{ status: string; data: any }>('/transactions/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSale(id: number) {
    return apiRequest<{ status: string; data: any }>(`/transactions/sales/${id}`);
  },

  async getAllSales(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    const query = searchParams.toString();
    return apiRequest<{ status: string; data: any[] }>(`/transactions/sales${query ? `?${query}` : ''}`);
  },

  async getDailySales(date?: string) {
    const searchParams = new URLSearchParams();
    if (date) searchParams.append('date', date);
    const query = searchParams.toString();
    return apiRequest<{ status: string; data: any }>(`/transactions/sales/daily${query ? `?${query}` : ''}`);
  },
};

export const purchasesService = {
  async createPurchase(data: any) {
    return apiRequest<{ status: string; data: any }>('/transactions/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPurchase(id: number) {
    return apiRequest<{ status: string; data: any }>(`/transactions/purchases/${id}`);
  },

  async getAllPurchases(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    const query = searchParams.toString();
    return apiRequest<{ status: string; data: any[] }>(`/transactions/purchases${query ? `?${query}` : ''}`);
  },
};

export const expensesService = {
  async createExpense(data: any) {
    return apiRequest<{ status: string; data: any }>('/transactions/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getExpense(id: number) {
    return apiRequest<{ status: string; data: any }>(`/transactions/expenses/${id}`);
  },

  async getAllExpenses(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    const query = searchParams.toString();
    return apiRequest<{ status: string; data: any[] }>(`/transactions/expenses${query ? `?${query}` : ''}`);
  },

  async getAllCategories() {
    return apiRequest<{ status: string; data: any[] }>('/transactions/expense-categories');
  },
};
