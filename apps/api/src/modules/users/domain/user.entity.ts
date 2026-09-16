export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  role_id: number;
  is_active: boolean;
  last_login_at: Date | null;
  failed_login_attempts: number;
  locked_until: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithRole {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string | null;
  role_id: number;
  role_name: string;
  is_active: boolean;
  last_login_at: Date | null;
  failed_login_attempts: number;
  locked_until: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role_id: number;
}

export interface UpdateUserDTO {
  email?: string;
  full_name?: string;
  phone?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  id: number;
  name: string;
  module: string;
  action: string;
  description: string | null;
  created_at: Date;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  created_at: Date;
}
