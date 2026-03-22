import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { AccountService } from '../src/services/accountService';
import { AccountRepository } from '../src/repositories/accountRepository';
import { ConflictError, ForbiddenError } from '../src/errors/httpErrors';

jest.mock('../src/repositories/accountRepository');
jest.mock('bcrypt');
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
}));

describe('AccountService', () => {
  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new account', async () => {
    const findByEmailSpy = jest.spyOn(AccountRepository.prototype, 'findByEmail');
    const createSpy = jest.spyOn(AccountRepository.prototype, 'create');
    const service = new AccountService();

    findByEmailSpy.mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
    createSpy.mockResolvedValue({
      id: 1,
      firstName: 'Ivan',
      lastName: 'Ivanov',
      email: 'ivan@test.com',
      password: 'hashed-password',
      role: Role.USER,
    } as never);

    const result = await service.register({
      firstName: 'Ivan',
      lastName: 'Ivanov',
      email: 'ivan@test.com',
      password: 'secret123',
    });

    expect(result.account.email).toBe('ivan@test.com');
    expect(result.token).toBe('mock-token');
  });

  it('throws conflict if email already exists on register', async () => {
    const findByEmailSpy = jest.spyOn(AccountRepository.prototype, 'findByEmail');
    const service = new AccountService();

    findByEmailSpy.mockResolvedValue({
      id: 1,
      firstName: 'Ivan',
      lastName: 'Ivanov',
      email: 'ivan@test.com',
      password: 'hashed-password',
      role: Role.USER,
    } as never);

    await expect(service.register({
      firstName: 'Ivan',
      lastName: 'Ivanov',
      email: 'ivan@test.com',
      password: 'secret123',
    })).rejects.toBeInstanceOf(ConflictError);
  });

  it('forbids account creation for non-admin', async () => {
    const service = new AccountService();

    await expect(service.createAccount({
      firstName: 'Ivan',
      lastName: 'Ivanov',
      email: 'ivan@test.com',
      password: 'secret123',
      role: Role.USER,
    }, Role.USER)).rejects.toBeInstanceOf(ForbiddenError);
  });
});