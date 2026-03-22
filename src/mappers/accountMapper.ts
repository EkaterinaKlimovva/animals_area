import { Account } from '@prisma/client';
import { AccountResponseDto } from '../types/account';

export const toAccountResponse = (account: Account): AccountResponseDto => ({
  id: account.id,
  firstName: account.firstName,
  lastName: account.lastName,
  email: account.email,
  role: account.role,
});
