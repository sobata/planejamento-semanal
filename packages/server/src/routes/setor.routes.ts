import { Router } from 'express';
import { setorRepository } from '../repositories/setor.repository.js';
import { AppError } from '../middleware/error-handler.js';
import type { CreateSetorDTO, UpdateSetorDTO } from '@planejamento/shared';

const router = Router();

// GET /api/setores - Listar todos os setores
router.get('/', (_req, res) => {
  const setores = setorRepository.findAll();
  res.json({ data: setores });
});

// GET /api/setores/:id - Obter setor por ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const setor = setorRepository.findById(id);

  if (!setor) {
    throw new AppError(404, 'NOT_FOUND', 'Setor não encontrado');
  }

  res.json({ data: setor });
});

// POST /api/setores - Criar setor
router.post('/', (req, res) => {
  const data: CreateSetorDTO = req.body;

  if (!data.nome || data.nome.trim() === '') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Nome é obrigatório');
  }

  // Verificar se já existe
  const existing = setorRepository.findByNome(data.nome.trim());
  if (existing) {
    throw new AppError(400, 'DUPLICATE', 'Já existe um setor com este nome');
  }

  const setor = setorRepository.create({
    nome: data.nome.trim(),
    ordem: data.ordem,
  });

  res.status(201).json({ data: setor });
});

// PUT /api/setores/:id - Atualizar setor
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const data: UpdateSetorDTO = req.body;

  const existing = setorRepository.findById(id);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Setor não encontrado');
  }

  if (data.nome !== undefined) {
    if (data.nome.trim() === '') {
      throw new AppError(400, 'VALIDATION_ERROR', 'Nome não pode ser vazio');
    }

    // Verificar duplicidade
    const duplicado = setorRepository.findByNome(data.nome.trim());
    if (duplicado && duplicado.id !== id) {
      throw new AppError(400, 'DUPLICATE', 'Já existe um setor com este nome');
    }
  }

  const setor = setorRepository.update(id, {
    nome: data.nome?.trim(),
    ordem: data.ordem,
  });

  res.json({ data: setor });
});

// DELETE /api/setores/:id - Excluir setor
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);

  const existing = setorRepository.findById(id);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Setor não encontrado');
  }

  // Verificar se tem pessoas relacionadas
  if (setorRepository.hasRelatedPessoas(id)) {
    throw new AppError(
      400,
      'HAS_RELATIONS',
      'Não é possível excluir setor com pessoas vinculadas'
    );
  }

  setorRepository.delete(id);
  res.status(204).send();
});

export default router;
