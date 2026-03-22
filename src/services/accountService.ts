import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Account, Role } from '@prisma/client';
import { AccountRepository } from '../repositories/accountRepository';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../errors/httpErrors';

export class AccountService {
  private accountRepository: AccountRepository;

  constructor() {
    this.accountRepository = new AccountRepository();
  }

  async register(data: { firstName: string; lastName: string; email: string; password: string; role?: Role }): Promise<{ account: Account; token: string }> {
    if (!data.firstName?.trim() || !data.lastName?.trim() || !data.email?.trim() || !data.password?.trim()) {
      throw new BadRequestError('Invalid registration payload');
    }

    const existingAccount = await this.accountRepository.findByEmail(data.email);
    if (existingAccount) {
      throw new ConflictError('Account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const account = await this.accountRepository.create({
      ...data,
      password: hashedPassword,
    });

    const token = this.generateToken(account);

    return { account, token };
  }

  async getAccountById(id: number): Promise<Account | null> {
    return this.accountRepository.findById(id);
  }

  async searchAccounts(query: { firstName?: string; lastName?: string; email?: string; from?: number; size?: number }): Promise<Account[]> {
    return this.accountRepository.searchAccounts(query);
  }

  async createAccount(data: { firstName: string; lastName: string; email: string; password: string; role?: Role }, currentUserRole: Role): Promise<Account> {
    if (currentUserRole !== Role.ADMIN) {
      throw new ForbiddenError('Only admins can create accounts');
    }

    const existingAccount = await this.accountRepository.findByEmail(data.email);
    if (existingAccount) {
      throw new ConflictError('Account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.accountRepository.create({
      ...data,
      password: hashedPassword,
    });
  }

  async updateAccount(id: number, data: Partial<{ firstName: string; lastName: string; email: string; password: string; role: Role }>, currentUserId: number, currentUserRole: Role): Promise<Account | null> {
    if (currentUserRole !== Role.ADMIN && currentUserId !== id) {
      throw new ForbiddenError('You can only update your own account');
    }

    const account = await this.accountRepository.findById(id);
    if (!account) {
      if (currentUserRole === Role.ADMIN) {
        throw new NotFoundError('Account not found');
      }
      throw new ForbiddenError('Account not found');
    }

    if (currentUserRole !== Role.ADMIN && data.role !== undefined && data.role !== account.role) {
      throw new ForbiddenError('Only admin can change role');
    }

    if (data.email && data.email !== account.email) {
      const emailOwner = await this.accountRepository.findByEmail(data.email);
      if (emailOwner) {
        throw new ConflictError('Account with this email already exists');
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.accountRepository.update(id, data);
  }

  async deleteAccount(id: number, currentUserId: number, currentUserRole: Role): Promise<boolean> {
    if (currentUserRole !== Role.ADMIN && currentUserId !== id) {
      throw new ForbiddenError('You can only delete your own account');
    }

    const account = await this.accountRepository.findById(id);
    if (!account) {
      if (currentUserRole === Role.ADMIN) {
        throw new NotFoundError('Account not found');
      }
      throw new ForbiddenError('Account not found');
    }

    const linkedToAnimals = await this.accountRepository.isLinkedToAnimals(id);
    if (linkedToAnimals) {
      throw new BadRequestError('Account is linked to animals');
    }

    return this.accountRepository.delete(id);
  }

  private generateToken(account: Account): string {
    return jwt.sign(
      { id: account.id, email: account.email, role: account.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
  }
}