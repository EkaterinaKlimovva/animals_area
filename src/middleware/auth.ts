import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../errors/httpErrors';
import { AccountRepository } from '../repositories/accountRepository';

// Extend Request interface to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      email: string;
      role: Role;
    };
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next(new UnauthorizedError('Access token required'));
  }

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    if (!token) {
      return next(new UnauthorizedError('Access token required'));
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
      if (err) {
        return next(new UnauthorizedError('Invalid or expired token'));
      }

      req.user = decoded as { id: number; email: string; role: Role };
      next();
    });

    return;
  }

  if (authHeader.startsWith('Basic ')) {
    void authenticateBasic(authHeader, req, next);
    return;
  }

  return next(new UnauthorizedError('Invalid authorization header'));
};

export const optionalAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return next();
  }

  if (authHeader.startsWith('Bearer ') || authHeader.startsWith('Basic ')) {
    return authenticateToken(req, res, next);
  }

  return next();
};

async function authenticateBasic(
  authHeader: string,
  req: Request,
  next: NextFunction,
) {
  try {
    const encoded = authHeader.split(' ')[1];
    if (!encoded) {
      return next(new UnauthorizedError('Invalid basic authorization header'));
    }

    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex < 0) {
      return next(new UnauthorizedError('Invalid basic authorization header'));
    }

    const email = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    if (!email || !password) {
      return next(new UnauthorizedError('Invalid basic authorization header'));
    }

    const accountRepository = new AccountRepository();
    const account = await accountRepository.findByEmail(email);
    if (!account) {
      return next(new UnauthorizedError('Invalid authentication credentials'));
    }

    const matches = await bcrypt.compare(password, account.password);
    if (!matches) {
      return next(new UnauthorizedError('Invalid authentication credentials'));
    }

    req.user = { id: account.id, email: account.email, role: account.role };
    next();
  } catch {
    return next(new UnauthorizedError('Invalid authentication credentials'));
  }
}

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};
