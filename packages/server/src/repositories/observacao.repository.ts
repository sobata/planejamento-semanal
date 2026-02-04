import { db } from '../config/database.js';
import type { Observacao, UpsertObservacaoDTO } from '@planejamento/shared';

interface ObservacaoRow {
  id: number;
  semana_id: number;
  pessoa_id: number;
  texto: string;
  created_at: string;
  updated_at: string;
}

function rowToObservacao(row: ObservacaoRow): Observacao {
  return {
    id: row.id,
    semanaId: row.semana_id,
    pessoaId: row.pessoa_id,
    texto: row.texto,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const observacaoRepository = {
  findBySemana(semanaId: number): Observacao[] {
    const rows = db
      .prepare('SELECT * FROM observacao WHERE semana_id = ?')
      .all(semanaId) as ObservacaoRow[];
    return rows.map(rowToObservacao);
  },

  findBySemanaAndPessoa(semanaId: number, pessoaId: number): Observacao | null {
    const row = db
      .prepare('SELECT * FROM observacao WHERE semana_id = ? AND pessoa_id = ?')
      .get(semanaId, pessoaId) as ObservacaoRow | undefined;
    return row ? rowToObservacao(row) : null;
  },

  findById(id: number): Observacao | null {
    const row = db.prepare('SELECT * FROM observacao WHERE id = ?').get(id) as
      | ObservacaoRow
      | undefined;
    return row ? rowToObservacao(row) : null;
  },

  upsert(semanaId: number, pessoaId: number, data: UpsertObservacaoDTO): Observacao {
    const existing = this.findBySemanaAndPessoa(semanaId, pessoaId);

    if (existing) {
      db.prepare('UPDATE observacao SET texto = ? WHERE id = ?').run(data.texto, existing.id);
      return this.findById(existing.id)!;
    }

    const stmt = db.prepare(
      'INSERT INTO observacao (semana_id, pessoa_id, texto) VALUES (?, ?, ?)'
    );
    const result = stmt.run(semanaId, pessoaId, data.texto);
    return this.findById(result.lastInsertRowid as number)!;
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM observacao WHERE id = ?').run(id);
    return result.changes > 0;
  },

  deleteBySemanaAndPessoa(semanaId: number, pessoaId: number): boolean {
    const result = db
      .prepare('DELETE FROM observacao WHERE semana_id = ? AND pessoa_id = ?')
      .run(semanaId, pessoaId);
    return result.changes > 0;
  },

  // Converte array de observações em mapa pessoa_id -> texto
  toMap(observacoes: Observacao[]): Map<number, string> {
    return new Map(observacoes.map(obs => [obs.pessoaId, obs.texto]));
  },
};
