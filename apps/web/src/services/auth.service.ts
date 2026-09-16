import api from './api.service';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string | null;
  role_id: number;
  role_name: string;
  is_active: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch {
        this.user = null;
      }
    }
  }

  async login(data: LoginPayload): Promise<LoginResponse> {
    const response = await api.post<{ status: string; data: LoginResponse }>('/auth/login', data);
    const result = response.data.data;

    this.token = result.token;
    this.user = result.user;

    localStorage.setItem('auth_token', result.token);
    localStorage.setItem('auth_user', JSON.stringify(result.user));

    api.defaults.headers.common['Authorization'] = `Bearer ${result.token}`;

    return result;
  }

  logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    delete api.defaults.headers.common['Authorization'];
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  initializeAuth(): void {
    if (this.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async getProfile(): Promise<User> {
    const response = await api.get<{ status: string; data: User }>('/auth/profile');
    return response.data.data;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { oldPassword, newPassword });
  }

  async getAllUsers(): Promise<User[]> {
    const response = await api.get<{ status: string; data: User[] }>('/auth/users');
    return response.data.data;
  }

  async getAllRoles(): Promise<{ id: number; name: string; description: string }[]> {
    const response = await api.get<{ status: string; data: { id: number; name: string; description: string }[] }>('/auth/roles');
    return response.data.data;
  }
}

export const authService = new AuthService();
