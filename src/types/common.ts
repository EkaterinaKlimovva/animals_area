export interface PaginationQueryDto {
  from?: number;
  size?: number;
}

export interface AuthenticatedUserDto {
  id: number;
  email: string;
  role: 'ADMIN' | 'CHIPPER' | 'USER';
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export type UserRole = 'ADMIN' | 'CHIPPER' | 'USER';

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ValidationError {
  field: string;
  message: string;
}

export interface DatabaseError extends Error {
  code?: string;
  meta?: Record<string, unknown>;
}
