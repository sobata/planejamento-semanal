import type { Request, Response, NextFunction } from 'express';
import type { ApiError } from '@planejamento/shared';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const response: ApiError = {
      error: err.code,
      message: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Erro genérico
  const response: ApiError = {
    error: 'INTERNAL_ERROR',
    message: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  };
  res.status(500).json(response);
}
