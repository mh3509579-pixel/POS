export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  parent_id: number | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAccountDTO {
  code: string;
  name: string;
  type: AccountType;
  parent_id?: number | null;
  description?: string;
}

export interface UpdateAccountDTO {
  name?: string;
  description?: string;
  is_active?: boolean;
}
