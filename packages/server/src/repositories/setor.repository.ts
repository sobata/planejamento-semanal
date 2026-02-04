import { db } from '../config/database.js';
import type { Setor, CreateSetorDTO, UpdateSetorDTO } from '@planejamento/shared';

interface SetorRow {
  id: number;
  nome: string;
  ordem: number;
  created_at: string;
  updated_at: string;
}

function rowToSetor(row: SetorRow): Setor {
  return {
    id: row.id,
    nome: row.nome,
    ordem: row.ordem,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const setorRepository = {
  findAll(): Setor[] {
    const rows = db.prepare('SELECT * FROM setor ORDER BY ordem, nome').all() as SetorRow[];
    return rows.map(rowToSetor);
  },

  findById(id: number): Setor | null {
    const row = db.prepare('SELECT * FROM setor WHERE id = ?').get(id) as SetorRow | undefined;
    return row ? rowToSetor(row) : null;
  },

  findByNome(nome: string): Setor | null {
    const row = db.prepare('SELECT * FROM setor WHERE nome = ?').get(nome) as SetorRow | undefined;
    return row ? rowToSetor(row) : null;
  },

  create(data: CreateSetorDTO): Setor {
    const stmt = db.prepare('INSERT INTO setor (nome, ordem) VALUES (?, ?)');
    const result = stmt.run(data.nome, data.ordem ?? 0);
    return this.findById(result.lastInsertRowid as number)!;
  },

  update(id: number, data: UpdateSetorDTO): Setor | null {
    const current = this.findById(id);
    if (!current) return null;

    const nome = data.nome ?? current.nome;
    const ordem = data.ordem ?? current.ordem;

    db.prepare('UPDATE setor SET nome = ?, ordem = ? WHERE id = ?').run(nome, ordem, id);
    return this.findById(id);
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM setor WHERE id = ?').run(id);
    return result.changes > 0;
  },

  hasRelatedPessoas(id: number): boolean {
    const row = db.prepare('SELECT COUNT(*) as count FROM pessoa WHERE setor_id = ?').get(id) as { count: number };
    return row.count > 0;
  },
};
