import { db } from '../config/database.js';
import type { Item, ItemComSetor, CreateItemDTO, UpdateItemDTO } from '@planejamento/shared';
import { setorRepository } from './setor.repository.js';

interface ItemRow {
  id: number;
  titulo: string;
  descricao: string | null;
  setor_sugerido_id: number | null;
  cor: string;
  ativo: number;
  created_at: string;
  updated_at: string;
}

function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    setorSugeridoId: row.setor_sugerido_id,
    cor: row.cor,
    ativo: row.ativo === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const itemRepository = {
  findAll(filters?: { setorSugeridoId?: number; ativo?: boolean }): Item[] {
    let query = 'SELECT * FROM item WHERE 1=1';
    const params: (number | string)[] = [];

    if (filters?.setorSugeridoId !== undefined) {
      query += ' AND setor_sugerido_id = ?';
      params.push(filters.setorSugeridoId);
    }

    if (filters?.ativo !== undefined) {
      query += ' AND ativo = ?';
      params.push(filters.ativo ? 1 : 0);
    }

    query += ' ORDER BY titulo';

    const rows = db.prepare(query).all(...params) as ItemRow[];
    return rows.map(rowToItem);
  },

  findAllWithSetor(filters?: { setorSugeridoId?: number; ativo?: boolean }): ItemComSetor[] {
    const itens = this.findAll(filters);
    return itens.map(item => ({
      ...item,
      setorSugerido: item.setorSugeridoId ? setorRepository.findById(item.setorSugeridoId) : null,
    }));
  },

  findById(id: number): Item | null {
    const row = db.prepare('SELECT * FROM item WHERE id = ?').get(id) as ItemRow | undefined;
    return row ? rowToItem(row) : null;
  },

  findByIdWithSetor(id: number): ItemComSetor | null {
    const item = this.findById(id);
    if (!item) return null;

    return {
      ...item,
      setorSugerido: item.setorSugeridoId ? setorRepository.findById(item.setorSugeridoId) : null,
    };
  },

  create(data: CreateItemDTO): Item {
    const stmt = db.prepare(
      'INSERT INTO item (titulo, descricao, setor_sugerido_id, cor) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(
      data.titulo,
      data.descricao ?? null,
      data.setorSugeridoId ?? null,
      data.cor ?? '#6366f1'
    );
    return this.findById(result.lastInsertRowid as number)!;
  },

  update(id: number, data: UpdateItemDTO): Item | null {
    const current = this.findById(id);
    if (!current) return null;

    const titulo = data.titulo ?? current.titulo;
    const descricao = data.descricao !== undefined ? data.descricao : current.descricao;
    const setorSugeridoId =
      data.setorSugeridoId !== undefined ? data.setorSugeridoId : current.setorSugeridoId;
    const cor = data.cor ?? current.cor;

    db.prepare(
      'UPDATE item SET titulo = ?, descricao = ?, setor_sugerido_id = ?, cor = ? WHERE id = ?'
    ).run(titulo, descricao, setorSugeridoId, cor, id);

    return this.findById(id);
  },

  toggleAtivo(id: number): Item | null {
    const current = this.findById(id);
    if (!current) return null;

    const novoAtivo = current.ativo ? 0 : 1;
    db.prepare('UPDATE item SET ativo = ? WHERE id = ?').run(novoAtivo, id);
    return this.findById(id);
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM item WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
