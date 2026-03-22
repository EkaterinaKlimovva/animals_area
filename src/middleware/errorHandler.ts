import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/httpErrors';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  if (error instanceof Error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(500).json({ error: 'Internal server error' });
};