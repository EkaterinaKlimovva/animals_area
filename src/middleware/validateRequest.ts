import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { BadRequestError } from '../errors/httpErrors';
import { HTTP_STATUS } from '../constants/validation';
import type { ValidationError } from '../types/common';

interface ValidationSchema {
  parse(data: unknown): unknown;
}

export const validateRequest = (
  schema: ValidationSchema, 
  target: 'body' | 'query' | 'params'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const validatedData = schema.parse(data);
      req[target] = validatedData as typeof req[typeof target];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        
        const errorMessage = validationErrors.map(e => e.message).join(', ');
        return next(new BadRequestError(errorMessage));
      }
      next(error);
    }
  };
};
