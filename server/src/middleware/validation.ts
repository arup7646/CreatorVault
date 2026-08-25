import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/errors';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        const messages = Object.entries(errors).map(
          ([field, msgs]) => `${field}: ${msgs.join(', ')}`
        );
        throw new AppError(messages.join('; '), 400, 'VALIDATION_ERROR');
      }

      req.body = result.data.body;
      req.query = result.data.query as any;
      req.params = result.data.params as any;
      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else if (error instanceof ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        next(new AppError(messages.join('; '), 400, 'VALIDATION_ERROR'));
      } else {
        next(error);
      }
    }
  };
};