import { Router } from 'express';
import { itemRepository } from '../repositories/item.repository.js';
import { setorRepository } from '../repositories/setor.repository.js';
import { AppError } from '../middleware/error-handler.js';
import type { CreateItemDTO, UpdateItemDTO } from '@planejamento/shared';

const router = Router();

// GET /api/itens - Listar itens
router.get('/', (req, res) => {
  const setorSugeridoId = req.query.setor_sugerido_id
    ? parseInt(req.query.setor_sugerido_id as string)
    : undefined;
  const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;

  const itens = itemRepository.findAllWithSetor({ setorSugeridoId, ativo });
  res.json({ data: itens });
});

// GET /api/itens/:id - Obter item por ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = itemRepository.findByIdWithSetor(id);

  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Item não encontrado');
  }

  res.json({ data: item });
});

// POST /api/itens - Criar item
router.post('/', (req, res) => {
  const data: CreateItemDTO = req.body;

  if (!data.titulo || data.titulo.trim() === '') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Título é obrigatório');
  }

  // Verificar setor sugerido se fornecido
  if (data.setorSugeridoId !== undefined && data.setorSugeridoId !== null) {
    const setor = setorRepository.findById(data.setorSugeridoId);
    if (!setor) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Setor sugerido não encontrado');
    }
  }

  const item = itemRepository.create({
    titulo: data.titulo.trim(),
    descricao: data.descricao?.trim(),
    setorSugeridoId: data.setorSugeridoId,
    cor: data.cor,
  });

  res.status(201).json({ data: itemRepository.findByIdWithSetor(item.id) });
});

// PUT /api/itens/:id - Atualizar item
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const data: UpdateItemDTO = req.body;

  const existing = itemRepository.findById(id);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Item não encontrado');
  }

  if (data.titulo !== undefined && data.titulo.trim() === '') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Título não pode ser vazio');
  }

  if (data.setorSugeridoId !== undefined && data.setorSugeridoId !== null) {
    const setor = setorRepository.findById(data.setorSugeridoId);
    if (!setor) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Setor sugerido não encontrado');
    }
  }

  itemRepository.update(id, {
    titulo: data.titulo?.trim(),
    descricao: data.descricao?.trim(),
    setorSugeridoId: data.setorSugeridoId,
    cor: data.cor,
  });

  res.json({ data: itemRepository.findByIdWithSetor(id) });
});

// PATCH /api/itens/:id/ativo - Toggle status ativo
router.patch('/:id/ativo', (req, res) => {
  const id = parseInt(req.params.id);

  const existing = itemRepository.findById(id);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Item não encontrado');
  }

  itemRepository.toggleAtivo(id);
  res.json({ data: itemRepository.findByIdWithSetor(id) });
});

// DELETE /api/itens/:id - Excluir item
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);

  const existing = itemRepository.findById(id);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Item não encontrado');
  }

  itemRepository.delete(id);
  res.status(204).send();
});

export default router;
