export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}
