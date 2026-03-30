import { Role } from '@prisma/client';

export interface RegistrationRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface CreateAccountRequestDto extends RegistrationRequestDto {
  role: Role;
}

export type UpdateAccountRequestDto = CreateAccountRequestDto;

export interface AccountSearchQueryDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  from?: number;
  size?: number;
}

export interface AccountResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}
