import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Role } from '@prisma/client';
import { AccountService } from '../services/accountService';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/httpErrors';

const requiredTrimmedString = (field: string, label: string) =>
  body(field)
    .custom((value) => typeof value === 'string' && value.trim().length > 0)
    .withMessage(`${label} is required`);

const optionalTrimmedString = (field: string, label: string) =>
  body(field)
    .optional()
    .custom((value) => typeof value === 'string' && value.trim().length > 0)
    .withMessage(`${label} cannot be empty`);

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

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const { firstName, lastName, email, password } = req.body;
    const result = await this.accountService.register({ firstName, lastName, email, password });

    res.status(201).json({
      id: result.account.id,
      firstName: result.account.firstName,
      lastName: result.account.lastName,
      email: result.account.email,
      role: result.account.role,
    });
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

    res.json({
      id: account.id,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      role: account.role,
    });
  }

  // GET /accounts/search
  async searchAccounts(req: Request, res: Response) {
    if (req.user!.role !== Role.ADMIN) {
      throw new ForbiddenError('Access denied');
    }

    const { firstName, lastName, email, from, size } = req.query;
    const query = {
      firstName: firstName as string,
      lastName: lastName as string,
      email: email as string,
      from: from ? parseInt(from as string, 10) : undefined,
      size: size ? parseInt(size as string, 10) : undefined,
    };

    if ((query.from !== undefined && query.from < 0) || (query.size !== undefined && query.size <= 0)) {
      throw new BadRequestError('Invalid pagination params');
    }

    const accounts = await this.accountService.searchAccounts(query);
    res.json(accounts.map(account => ({
      id: account.id,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      role: account.role,
    })));
  }

  // POST /accounts
  async createAccount(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const { firstName, lastName, email, password, role } = req.body;
    const currentUserRole = req.user!.role;

    const account = await this.accountService.createAccount({ firstName, lastName, email, password, role }, currentUserRole);

    res.status(201).json({
      id: account.id,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      role: account.role,
    });
  }

  // PUT /accounts/{accountId}
  async updateAccount(req: Request, res: Response) {
    const id = parseInt(req.params.accountId, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError('Invalid account ID');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array()[0].msg);
    }

    const { firstName, lastName, email, password, role } = req.body;
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;

    const account = await this.accountService.updateAccount(id, { firstName, lastName, email, password, role }, currentUserId, currentUserRole);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    res.json({
      id: account.id,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      role: account.role,
    });
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

// Validation rules
export const validateRegistration = [
  requiredTrimmedString('firstName', 'First name'),
  requiredTrimmedString('lastName', 'Last name'),
  body('email').isEmail().withMessage('Valid email is required'),
  requiredTrimmedString('password', 'Password'),
];

export const validateCreateAccount = [
  requiredTrimmedString('firstName', 'First name'),
  requiredTrimmedString('lastName', 'Last name'),
  body('email').isEmail().withMessage('Valid email is required'),
  requiredTrimmedString('password', 'Password'),
  body('role').isIn(['ADMIN', 'CHIPPER', 'USER']).withMessage('Invalid role'),
];

export const validateUpdateAccount = [
  optionalTrimmedString('firstName', 'First name'),
  optionalTrimmedString('lastName', 'Last name'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  optionalTrimmedString('password', 'Password'),
  body('role').optional().isIn(['ADMIN', 'CHIPPER', 'USER']).withMessage('Invalid role'),
];