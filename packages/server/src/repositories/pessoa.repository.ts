import { db } from '../config/database.js';
import type { Pessoa, PessoaComSetor, CreatePessoaDTO, UpdatePessoaDTO } from '@planejamento/shared';
import { setorRepository } from './setor.repository.js';

interface PessoaRow {
  id: number;
  nome: string;
  setor_id: number;
  ativo: number;
  ordem: number;
  created_at: string;
  updated_at: string;
}

function rowToPessoa(row: PessoaRow): Pessoa {
  return {
    id: row.id,
    nome: row.nome,
    setorId: row.setor_id,
    ativo: row.ativo === 1,
    ordem: row.ordem,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const pessoaRepository = {
  findAll(filters?: { setorId?: number; ativo?: boolean }): Pessoa[] {
    let query = 'SELECT * FROM pessoa WHERE 1=1';
    const params: (number | string)[] = [];

    if (filters?.setorId !== undefined) {
      query += ' AND setor_id = ?';
      params.push(filters.setorId);
    }

    if (filters?.ativo !== undefined) {
      query += ' AND ativo = ?';
      params.push(filters.ativo ? 1 : 0);
    }

    query += ' ORDER BY ordem, nome';

    const rows = db.prepare(query).all(...params) as PessoaRow[];
    return rows.map(rowToPessoa);
  },

  findAllWithSetor(filters?: { setorId?: number; ativo?: boolean }): PessoaComSetor[] {
    const pessoas = this.findAll(filters);
    return pessoas.map(pessoa => ({
      ...pessoa,
      setor: setorRepository.findById(pessoa.setorId)!,
    }));
  },

  findById(id: number): Pessoa | null {
    const row = db.prepare('SELECT * FROM pessoa WHERE id = ?').get(id) as PessoaRow | undefined;
    return row ? rowToPessoa(row) : null;
  },

  findByIdWithSetor(id: number): PessoaComSetor | null {
    const pessoa = this.findById(id);
    if (!pessoa) return null;

    return {
      ...pessoa,
      setor: setorRepository.findById(pessoa.setorId)!,
    };
  },

  create(data: CreatePessoaDTO): Pessoa {
    const stmt = db.prepare('INSERT INTO pessoa (nome, setor_id, ordem) VALUES (?, ?, ?)');
    const result = stmt.run(data.nome, data.setorId, data.ordem ?? 0);
    return this.findById(result.lastInsertRowid as number)!;
  },

  update(id: number, data: UpdatePessoaDTO): Pessoa | null {
    const current = this.findById(id);
    if (!current) return null;

    const nome = data.nome ?? current.nome;
    const setorId = data.setorId ?? current.setorId;
    const ordem = data.ordem ?? current.ordem;

    db.prepare('UPDATE pessoa SET nome = ?, setor_id = ?, ordem = ? WHERE id = ?').run(
      nome,
      setorId,
      ordem,
      id
    );
    return this.findById(id);
  },

  toggleAtivo(id: number): Pessoa | null {
    const current = this.findById(id);
    if (!current) return null;

    const novoAtivo = current.ativo ? 0 : 1;
    db.prepare('UPDATE pessoa SET ativo = ? WHERE id = ?').run(novoAtivo, id);
    return this.findById(id);
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM pessoa WHERE id = ?').run(id);
    return result.changes > 0;
  },

  findBySetorGrouped(): Map<number, Pessoa[]> {
    const pessoas = this.findAll({ ativo: true });
    const grouped = new Map<number, Pessoa[]>();

    for (const pessoa of pessoas) {
      if (!grouped.has(pessoa.setorId)) {
        grouped.set(pessoa.setorId, []);
      }
      grouped.get(pessoa.setorId)!.push(pessoa);
    }

    return grouped;
  },
};
