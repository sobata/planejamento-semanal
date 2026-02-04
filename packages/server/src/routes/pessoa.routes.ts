import { Router } from 'express';
import { pessoaRepository } from '../repositories/pessoa.repository.js';
import { setorRepository } from '../repositories/setor.repository.js';
import { AppError } from '../middleware/error-handler.js';
import type { CreatePessoaDTO, UpdatePessoaDTO } from '@planejamento/shared';

const router = Router();

// GET /api/pessoas - Listar pessoas
router.get('/', (req, res) => {
  const setorId = req.query.setor_id ? parseInt(req.query.setor_id as string) : undefined;
  const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;

  const pessoas = pessoaRepository.findAllWithSetor({ setorId, ativo });
  res.json({ data: pessoas });
});

// GET /api/pessoas/:id - Obter pessoa por ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const pessoa = pessoaRepository.findByIdWithSetor(id);

  if (!pessoa) {
    throw new AppError(404, 'NOT_FOUND', 'Pessoa não encontrada');
  }

  res.json({ data: pessoa });
});

// POST /api/pessoas - Criar pessoa
router.post('/', (req, res) => {
  const data: CreatePessoaDTO = req.body;

  if (!data.nome || data.nome.trim() === '') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Nome é obrigatório');
  }

  if (!data.setorId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Setor é obrigatório');
  }

  // Verificar se setor existe
  const setor = setorRepository.findById(data.setorId);
  if (!setor) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Setor não encontrado');
  }

  const pessoa = pessoaRepository.create({
    nome: data.nome.trim(),
    setorId: data.setorId,
    ordem: data.ordem,
  });

  res.status(201).json({ data: pessoaRepository.findByIdWithSetor(pessoa.id) });
});

// PUT /api/pessoas/:id - Atualizar pessoa
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const data: UpdatePessoaDTO = req.body;

  const existing = pessoaRepository.findById(id);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Pessoa não encontrada');
  }

  if (data.nome !== undefined && data.nome.trim() === '') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Nome não pode ser vazio');
  }

  if (data.setorId !== undefined) {
    const setor = setorRepository.findById(data.setorId);
    if (!setor) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Setor não encontrado');
    }
  }

  pessoaRepository.update(id, {
    nome: data.nome?.trim(),
    setorId: data.setorId,
    ordem: data.ordem,
  });

  res.json({ data: pessoaRepository.findByIdWithSetor(id) });
});

// PATCH /api/pessoas/:id/ativo - Toggle status ativo
router.patch('/:id/ativo', (req, res) => {
  const id = parseInt(req.params.id);

  const existing = pessoaRepository.findById(id);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Pessoa não encontrada');
  }

  pessoaRepository.toggleAtivo(id);
  res.json({ data: pessoaRepository.findByIdWithSetor(id) });
});

// DELETE /api/pessoas/:id - Excluir pessoa
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);

  const existing = pessoaRepository.findById(id);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Pessoa não encontrada');
  }

  pessoaRepository.delete(id);
  res.status(204).send();
});

export default router;
