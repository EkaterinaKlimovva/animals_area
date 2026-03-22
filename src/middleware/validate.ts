import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { BadRequestError } from '../errors/httpErrors';

type RequestSchemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export const validate = (schemas: RequestSchemas) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (schemas.params) {
      const parsedParams = schemas.params.parse(req.params);
      Object.assign(req.params, parsedParams);
    }

    if (schemas.query) {
      const parsedQuery = schemas.query.parse(req.query);
      Object.assign(req.query, parsedQuery);
    }

    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', JSON.stringify(error.issues, null, 2));
      return next(new BadRequestError(error.issues[0]?.message ?? 'Validation error'));
    }

    console.error('Validation error (non-Zod):', error);
    return next(error);
  }
};
