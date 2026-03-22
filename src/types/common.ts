export interface PaginationQueryDto {
  from?: number;
  size?: number;
}

export interface AuthenticatedUserDto {
  id: number;
  email: string;
  role: 'ADMIN' | 'CHIPPER' | 'USER';
}
