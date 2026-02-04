import { db } from '../config/database.js';
import type { Semana, SemanaStatus, PaginatedResponse, PaginationParams } from '@planejamento/shared';
import { getWeekBounds } from '@planejamento/shared';

interface SemanaRow {
  id: number;
  data_inicio: string;
  data_fim: string;
  status: SemanaStatus;
  fechada_em: string | null;
  fechada_por: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSemana(row: SemanaRow): Semana {
  return {
    id: row.id,
    dataInicio: row.data_inicio,
    dataFim: row.data_fim,
    status: row.status,
    fechadaEm: row.fechada_em,
    fechadaPor: row.fechada_por,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const semanaRepository = {
  findAll(
    filters?: { status?: SemanaStatus },
    pagination?: PaginationParams
  ): PaginatedResponse<Semana> {
    let query = 'SELECT * FROM semana WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM semana WHERE 1=1';
    const params: (string | number)[] = [];

    if (filters?.status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(filters.status);
    }

    // Contar total
    const { total } = db.prepare(countQuery).get(...params) as { total: number };

    // Paginação
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    query += ' ORDER BY data_inicio DESC LIMIT ? OFFSET ?';

    const rows = db.prepare(query).all(...params, pageSize, offset) as SemanaRow[];

    return {
      data: rows.map(rowToSemana),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  findById(id: number): Semana | null {
    const row = db.prepare('SELECT * FROM semana WHERE id = ?').get(id) as SemanaRow | undefined;
    return row ? rowToSemana(row) : null;
  },

  findByDataInicio(dataInicio: string): Semana | null {
    const row = db.prepare('SELECT * FROM semana WHERE data_inicio = ?').get(dataInicio) as
      | SemanaRow
      | undefined;
    return row ? rowToSemana(row) : null;
  },

  findOrCreateCurrent(): Semana {
    const bounds = getWeekBounds(new Date());
    const existing = this.findByDataInicio(bounds.inicio);

    if (existing) {
      return existing;
    }

    return this.create(bounds.inicio);
  },

  create(dataReferencia?: string): Semana {
    const bounds = getWeekBounds(dataReferencia ? new Date(dataReferencia) : new Date());

    // Verificar se já existe
    const existing = this.findByDataInicio(bounds.inicio);
    if (existing) {
      return existing;
    }

    const stmt = db.prepare('INSERT INTO semana (data_inicio, data_fim, status) VALUES (?, ?, ?)');
    const result = stmt.run(bounds.inicio, bounds.fim, 'aberta');
    return this.findById(result.lastInsertRowid as number)!;
  },

  fechar(id: number, usuario?: string): Semana | null {
    const semana = this.findById(id);
    if (!semana || semana.status === 'fechada') {
      return semana;
    }

    db.prepare('UPDATE semana SET status = ?, fechada_em = CURRENT_TIMESTAMP, fechada_por = ? WHERE id = ?').run(
      'fechada',
      usuario ?? null,
      id
    );

    return this.findById(id);
  },

  reabrir(id: number): Semana | null {
    const semana = this.findById(id);
    if (!semana || semana.status === 'aberta') {
      return semana;
    }

    db.prepare('UPDATE semana SET status = ?, fechada_em = NULL, fechada_por = NULL WHERE id = ?').run(
      'aberta',
      id
    );

    return this.findById(id);
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM semana WHERE id = ?').run(id);
    return result.changes > 0;
  },

  findPrevious(dataInicio: string): Semana | null {
    const row = db.prepare(
      'SELECT * FROM semana WHERE data_inicio < ? ORDER BY data_inicio DESC LIMIT 1'
    ).get(dataInicio) as SemanaRow | undefined;
    return row ? rowToSemana(row) : null;
  },

  findNext(dataInicio: string): Semana | null {
    const row = db.prepare(
      'SELECT * FROM semana WHERE data_inicio > ? ORDER BY data_inicio ASC LIMIT 1'
    ).get(dataInicio) as SemanaRow | undefined;
    return row ? rowToSemana(row) : null;
  },
};
