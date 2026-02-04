import type { Request, Response, NextFunction } from 'express';
import { semanaRepository } from '../repositories/semana.repository.js';
import { AppError } from './error-handler.js';

/**
 * Middleware que impede alterações em semanas fechadas.
 * Deve ser usado nas rotas de alocações e observações.
 */
export function weekLockGuard(req: Request, res: Response, next: NextFunction): void {
  // Apenas bloquear operações de escrita
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next();
    return;
  }

  const semanaId = parseInt(req.params.semanaId || req.params.id);

  if (isNaN(semanaId)) {
    next();
    return;
  }

  const semana = semanaRepository.findById(semanaId);

  if (!semana) {
    next();
    return;
  }

  if (semana.status === 'fechada') {
    throw new AppError(
      403,
      'WEEK_LOCKED',
      'Esta semana está fechada e não pode ser editada.'
    );
  }

  next();
}

/**
 * Versão async do guard para uso em handlers.
 */
export function checkWeekLock(semanaId: number): void {
  const semana = semanaRepository.findById(semanaId);

  if (semana && semana.status === 'fechada') {
    throw new AppError(
      403,
      'WEEK_LOCKED',
      'Esta semana está fechada e não pode ser editada.'
    );
  }
}
