import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  // PostgreSQL unique violation
  if (err.code === '23505') {
    res.status(409).json({
      success: false,
      message: 'A record with this unique value already exists.',
      errors: [err.detail],
    });
    return;
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    res.status(400).json({
      success: false,
      message: 'Referenced entity not found or constraint failed.',
      errors: [err.detail],
    });
    return;
  }

  // PostgreSQL check violation
  if (err.code === '23514') {
    res.status(400).json({
      success: false,
      message: 'Database check constraint violation.',
      errors: [err.detail],
    });
    return;
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || undefined,
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
};
