import { Router } from 'express';
import { semanaRepository } from '../repositories/semana.repository.js';
import { alocacaoRepository } from '../repositories/alocacao.repository.js';
import { observacaoRepository } from '../repositories/observacao.repository.js';
import { planejamentoService } from '../services/planejamento.service.js';
import { AppError } from '../middleware/error-handler.js';
import { weekLockGuard, checkWeekLock } from '../middleware/week-lock-guard.js';
import type { CreateAlocacaoDTO, UpsertObservacaoDTO, SemanaStatus, StatusExecucao } from '@planejamento/shared';

const router = Router();

// GET /api/semanas - Listar semanas
router.get('/', (req, res) => {
  const status = req.query.status as SemanaStatus | undefined;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;

  const result = semanaRepository.findAll({ status }, { page, pageSize });
  res.json(result);
});

// GET /api/semanas/atual - Obter ou criar semana atual
router.get('/atual', (_req, res) => {
  const semana = semanaRepository.findOrCreateCurrent();
  res.json({ data: semana });
});

// GET /api/semanas/:id - Obter semana por ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const semana = semanaRepository.findById(id);

  if (!semana) {
    throw new AppError(404, 'NOT_FOUND', 'Semana não encontrada');
  }

  res.json({ data: semana });
});

// POST /api/semanas - Criar semana
router.post('/', (req, res) => {
  const { dataReferencia } = req.body;

  const semana = semanaRepository.create(dataReferencia);
  res.status(201).json({ data: semana });
});

// PATCH /api/semanas/:id/fechar - Fechar semana
router.patch('/:id/fechar', (req, res) => {
  const id = parseInt(req.params.id);
  const { usuario } = req.body;

  const semana = semanaRepository.findById(id);
  if (!semana) {
    throw new AppError(404, 'NOT_FOUND', 'Semana não encontrada');
  }

  if (semana.status === 'fechada') {
    throw new AppError(400, 'ALREADY_CLOSED', 'Semana já está fechada');
  }

  const updated = semanaRepository.fechar(id, usuario);
  res.json({ data: updated });
});

// PATCH /api/semanas/:id/reabrir - Reabrir semana
router.patch('/:id/reabrir', (req, res) => {
  const id = parseInt(req.params.id);

  const semana = semanaRepository.findById(id);
  if (!semana) {
    throw new AppError(404, 'NOT_FOUND', 'Semana não encontrada');
  }

  if (semana.status === 'aberta') {
    throw new AppError(400, 'ALREADY_OPEN', 'Semana já está aberta');
  }

  const updated = semanaRepository.reabrir(id);
  res.json({ data: updated });
});

// GET /api/planejamento/:semanaId - Obter dados completos de planejamento
router.get('/:semanaId/planejamento', (req, res) => {
  const semanaId = parseInt(req.params.semanaId);

  const planejamento = planejamentoService.getPlanejamento(semanaId);
  if (!planejamento) {
    throw new AppError(404, 'NOT_FOUND', 'Semana não encontrada');
  }

  res.json({ data: planejamento });
});

// POST /api/semanas/:semanaId/copiar-de/:origemId - Copiar alocações de outra semana
router.post('/:semanaId/copiar-de/:origemId', weekLockGuard, (req, res) => {
  const semanaId = parseInt(req.params.semanaId);
  const origemId = parseInt(req.params.origemId);

  const result = planejamentoService.copiarSemana(origemId, semanaId);

  if (!result.sucesso) {
    throw new AppError(400, 'COPY_ERROR', result.erro!);
  }

  res.json({
    data: {
      message: `${result.count} alocações copiadas com sucesso`,
      count: result.count,
    },
  });
});

// === Rotas de Alocações ===

// GET /api/semanas/:semanaId/alocacoes - Listar alocações da semana
router.get('/:semanaId/alocacoes', (req, res) => {
  const semanaId = parseInt(req.params.semanaId);

  const semana = semanaRepository.findById(semanaId);
  if (!semana) {
    throw new AppError(404, 'NOT_FOUND', 'Semana não encontrada');
  }

  const alocacoes = alocacaoRepository.findBySemanaWithItem(semanaId);
  res.json({ data: alocacoes });
});

// POST /api/semanas/:semanaId/alocacoes - Criar alocação
router.post('/:semanaId/alocacoes', weekLockGuard, (req, res) => {
  const semanaId = parseInt(req.params.semanaId);
  const data: CreateAlocacaoDTO = req.body;

  const semana = semanaRepository.findById(semanaId);
  if (!semana) {
    throw new AppError(404, 'NOT_FOUND', 'Semana não encontrada');
  }

  if (!data.pessoaId || !data.data || !data.itemId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'pessoaId, data e itemId são obrigatórios');
  }

  const alocacao = alocacaoRepository.create(semanaId, data);
  res.status(201).json({ data: alocacao });
});

// POST /api/semanas/:semanaId/alocacoes/bulk - Criar/atualizar alocações em lote
router.post('/:semanaId/alocacoes/bulk', weekLockGuard, (req, res) => {
  const semanaId = parseInt(req.params.semanaId);
  const { pessoaId, data, itemIds } = req.body;

  const semana = semanaRepository.findById(semanaId);
  if (!semana) {
    throw new AppError(404, 'NOT_FOUND', 'Semana não encontrada');
  }

  if (!pessoaId || !data || !Array.isArray(itemIds)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'pessoaId, data e itemIds são obrigatórios');
  }

  const alocacoes = alocacaoRepository.bulkCreate(semanaId, pessoaId, data, itemIds);
  res.json({ data: alocacoes });
});

// PATCH /api/alocacoes/:id/status - Atualizar status de execução da alocação
router.patch('/alocacoes/:id/status', (req, res) => {
  const id = parseInt(req.params.id);
  const { statusExecucao } = req.body as { statusExecucao: StatusExecucao };

  const alocacao = alocacaoRepository.findById(id);
  if (!alocacao) {
    throw new AppError(404, 'NOT_FOUND', 'Alocação não encontrada');
  }

  // Validar status
  const statusValidos: StatusExecucao[] = ['pendente', 'realizado', 'nao_realizado'];
  if (!statusValidos.includes(statusExecucao)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Status inválido. Use: pendente, realizado ou nao_realizado');
  }

  const updated = alocacaoRepository.updateStatusExecucao(id, statusExecucao);
  res.json({ data: updated });
});

// DELETE /api/alocacoes/:id - Remover alocação
router.delete('/alocacoes/:id', (req, res) => {
  const id = parseInt(req.params.id);

  const alocacao = alocacaoRepository.findById(id);
  if (!alocacao) {
    throw new AppError(404, 'NOT_FOUND', 'Alocação não encontrada');
  }

  // Verificar se semana está fechada
  checkWeekLock(alocacao.semanaId);

  alocacaoRepository.delete(id);
  res.status(204).send();
});

// === Rotas de Observações ===

// GET /api/semanas/:semanaId/observacoes - Listar observações da semana
router.get('/:semanaId/observacoes', (req, res) => {
  const semanaId = parseInt(req.params.semanaId);

  const semana = semanaRepository.findById(semanaId);
  if (!semana) {
    throw new AppError(404, 'NOT_FOUND', 'Semana não encontrada');
  }

  const observacoes = observacaoRepository.findBySemana(semanaId);
  res.json({ data: observacoes });
});

// GET /api/semanas/:semanaId/pessoas/:pessoaId/observacao - Obter observação
router.get('/:semanaId/pessoas/:pessoaId/observacao', (req, res) => {
  const semanaId = parseInt(req.params.semanaId);
  const pessoaId = parseInt(req.params.pessoaId);

  const observacao = observacaoRepository.findBySemanaAndPessoa(semanaId, pessoaId);
  res.json({ data: observacao });
});

// PUT /api/semanas/:semanaId/pessoas/:pessoaId/observacao - Criar/atualizar observação
router.put('/:semanaId/pessoas/:pessoaId/observacao', weekLockGuard, (req, res) => {
  const semanaId = parseInt(req.params.semanaId);
  const pessoaId = parseInt(req.params.pessoaId);
  const data: UpsertObservacaoDTO = req.body;

  const semana = semanaRepository.findById(semanaId);
  if (!semana) {
    throw new AppError(404, 'NOT_FOUND', 'Semana não encontrada');
  }

  if (!data.texto || data.texto.trim() === '') {
    // Se texto vazio, remover observação
    observacaoRepository.deleteBySemanaAndPessoa(semanaId, pessoaId);
    res.json({ data: null });
    return;
  }

  const observacao = observacaoRepository.upsert(semanaId, pessoaId, {
    texto: data.texto.trim(),
  });
  res.json({ data: observacao });
});

export default router;
