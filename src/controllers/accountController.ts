import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { AccountService } from '../services/accountService';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/httpErrors';
import { toAccountResponse } from '../mappers/accountMapper';
import { AccountSearchQueryDto, CreateAccountRequestDto, RegistrationRequestDto, UpdateAccountRequestDto } from '../types/account';

export class AccountController {
  private accountService: AccountService;

  constructor() {
    this.accountService = new AccountService();
  }

  // POST /registration
  async register(req: Request, res: Response) {
    if (req.user) {
      throw new ForbiddenError('Registration is not available for authenticated users');
    }

    const { firstName, lastName, email, password } = req.body as RegistrationRequestDto;
    const result = await this.accountService.register({ firstName, lastName, email, password });

    res.status(201).json(toAccountResponse(result.account));
  }

  // GET /accounts/{accountId}
  async getAccountById(req: Request, res: Response) {
    const id = parseInt(req.params.accountId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid account ID');
    }

    if (req.user!.role !== Role.ADMIN && req.user!.id !== id) {
      throw new ForbiddenError('Access denied');
    }

    const account = await this.accountService.getAccountById(id);
    if (!account) {
      if (req.user!.role === Role.ADMIN) {
        throw new NotFoundError('Account not found');
      }
      throw new ForbiddenError('Access denied');
    }

    res.json(toAccountResponse(account));
  }

  // GET /accounts/search
  async searchAccounts(req: Request, res: Response) {
    if (req.user!.role !== Role.ADMIN) {
      throw new ForbiddenError('Access denied');
    }

    const query = req.query as unknown as AccountSearchQueryDto;

    if ((query.from !== undefined && query.from < 0) || (query.size !== undefined && query.size <= 0)) {
      throw new BadRequestError('Invalid pagination params');
    }

    const accounts = await this.accountService.searchAccounts(query);
    res.json(accounts.map(toAccountResponse));
  }

  // POST /accounts
  async createAccount(req: Request, res: Response) {
    const { firstName, lastName, email, password, role } = req.body as CreateAccountRequestDto;
    const currentUserRole = req.user!.role;

    const account = await this.accountService.createAccount({ firstName, lastName, email, password, role }, currentUserRole);

    res.status(201).json(toAccountResponse(account));
  }

  // PUT /accounts/{accountId}
  async updateAccount(req: Request, res: Response) {
    const id = parseInt(req.params.accountId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid account ID');
    }

    const { firstName, lastName, email, password, role } = req.body as UpdateAccountRequestDto;
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;

    const account = await this.accountService.updateAccount(id, { firstName, lastName, email, password, role }, currentUserId, currentUserRole);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    res.json(toAccountResponse(account));
  }

  // DELETE /accounts/{accountId}
  async deleteAccount(req: Request, res: Response) {
    const id = parseInt(req.params.accountId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid account ID');
    }

    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;

    await this.accountService.deleteAccount(id, currentUserId, currentUserRole);

    res.status(200).send();
  }
}
