import { db } from '../config/database.js';
import type { Alocacao, AlocacaoComItem, CreateAlocacaoDTO, StatusExecucao } from '@planejamento/shared';
import { itemRepository } from './item.repository.js';

interface AlocacaoRow {
  id: number;
  semana_id: number;
  pessoa_id: number;
  data: string;
  item_id: number;
  ordem: number;
  status_execucao: StatusExecucao | null;
  comentario: string | null;
  created_at: string;
  updated_at: string | null;
}

function rowToAlocacao(row: AlocacaoRow): Alocacao {
  return {
    id: row.id,
    semanaId: row.semana_id,
    pessoaId: row.pessoa_id,
    data: row.data,
    itemId: row.item_id,
    ordem: row.ordem,
    statusExecucao: row.status_execucao || 'pendente',
    comentario: row.comentario,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export const alocacaoRepository = {
  findBySemana(semanaId: number): Alocacao[] {
    const rows = db
      .prepare('SELECT * FROM alocacao WHERE semana_id = ? ORDER BY data, pessoa_id, ordem')
      .all(semanaId) as AlocacaoRow[];
    return rows.map(rowToAlocacao);
  },

  findBySemanaWithItem(semanaId: number): AlocacaoComItem[] {
    const alocacoes = this.findBySemana(semanaId);
    return alocacoes.map(alocacao => ({
      ...alocacao,
      item: itemRepository.findById(alocacao.itemId)!,
    }));
  },

  findBySemanaAndPessoa(semanaId: number, pessoaId: number): Alocacao[] {
    const rows = db
      .prepare('SELECT * FROM alocacao WHERE semana_id = ? AND pessoa_id = ? ORDER BY data, ordem')
      .all(semanaId, pessoaId) as AlocacaoRow[];
    return rows.map(rowToAlocacao);
  },

  findBySemanaAndPessoaWithItem(semanaId: number, pessoaId: number): AlocacaoComItem[] {
    const alocacoes = this.findBySemanaAndPessoa(semanaId, pessoaId);
    return alocacoes.map(alocacao => ({
      ...alocacao,
      item: itemRepository.findById(alocacao.itemId)!,
    }));
  },

  findById(id: number): Alocacao | null {
    const row = db.prepare('SELECT * FROM alocacao WHERE id = ?').get(id) as AlocacaoRow | undefined;
    return row ? rowToAlocacao(row) : null;
  },

  create(semanaId: number, data: CreateAlocacaoDTO): Alocacao {
    // Calcular ordem se não fornecida
    let ordem = data.ordem;
    if (ordem === undefined) {
      const maxOrdem = db
        .prepare(
          'SELECT MAX(ordem) as max FROM alocacao WHERE semana_id = ? AND pessoa_id = ? AND data = ?'
        )
        .get(semanaId, data.pessoaId, data.data) as { max: number | null };
      ordem = (maxOrdem.max ?? -1) + 1;
    }

    const stmt = db.prepare(
      'INSERT INTO alocacao (semana_id, pessoa_id, data, item_id, ordem) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(semanaId, data.pessoaId, data.data, data.itemId, ordem);
    return this.findById(result.lastInsertRowid as number)!;
  },

  updateOrdem(id: number, ordem: number): Alocacao | null {
    db.prepare('UPDATE alocacao SET ordem = ? WHERE id = ?').run(ordem, id);
    return this.findById(id);
  },

  updateStatusExecucao(id: number, statusExecucao: StatusExecucao): Alocacao | null {
    db.prepare('UPDATE alocacao SET status_execucao = ? WHERE id = ?').run(statusExecucao, id);
    return this.findById(id);
  },

  updateComentario(id: number, comentario: string | null): Alocacao | null {
    db.prepare('UPDATE alocacao SET comentario = ? WHERE id = ?').run(comentario, id);
    return this.findById(id);
  },

  mover(id: number, novaPessoaId: number, novaData: string): Alocacao | null {
    // Calcular nova ordem no destino
    const alocacao = this.findById(id);
    if (!alocacao) return null;

    const maxOrdem = db
      .prepare(
        'SELECT MAX(ordem) as max FROM alocacao WHERE semana_id = ? AND pessoa_id = ? AND data = ?'
      )
      .get(alocacao.semanaId, novaPessoaId, novaData) as { max: number | null };
    const novaOrdem = (maxOrdem.max ?? -1) + 1;

    db.prepare('UPDATE alocacao SET pessoa_id = ?, data = ?, ordem = ? WHERE id = ?').run(
      novaPessoaId,
      novaData,
      novaOrdem,
      id
    );
    return this.findById(id);
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM alocacao WHERE id = ?').run(id);
    return result.changes > 0;
  },

  deleteBySemanaAndPessoaAndData(semanaId: number, pessoaId: number, data: string): number {
    const result = db
      .prepare('DELETE FROM alocacao WHERE semana_id = ? AND pessoa_id = ? AND data = ?')
      .run(semanaId, pessoaId, data);
    return result.changes;
  },

  bulkCreate(semanaId: number, pessoaId: number, data: string, itemIds: number[]): Alocacao[] {
    // Remover alocações existentes para esse dia
    this.deleteBySemanaAndPessoaAndData(semanaId, pessoaId, data);

    // Criar novas alocações
    const stmt = db.prepare(
      'INSERT INTO alocacao (semana_id, pessoa_id, data, item_id, ordem) VALUES (?, ?, ?, ?, ?)'
    );

    const insertMany = db.transaction((items: number[]) => {
      const created: Alocacao[] = [];
      items.forEach((itemId, index) => {
        const result = stmt.run(semanaId, pessoaId, data, itemId, index);
        created.push(this.findById(result.lastInsertRowid as number)!);
      });
      return created;
    });

    return insertMany(itemIds);
  },

  copyFromSemana(origemId: number, destinoId: number): number {
    // Copiar todas as alocações de uma semana para outra
    // Ajustando as datas para os dias correspondentes da nova semana
    const origemSemana = db.prepare('SELECT data_inicio FROM semana WHERE id = ?').get(origemId) as {
      data_inicio: string;
    } | undefined;
    const destinoSemana = db.prepare('SELECT data_inicio FROM semana WHERE id = ?').get(destinoId) as {
      data_inicio: string;
    } | undefined;

    if (!origemSemana || !destinoSemana) {
      return 0;
    }

    const origemInicio = new Date(origemSemana.data_inicio);
    const destinoInicio = new Date(destinoSemana.data_inicio);
    const diffDays = Math.round((destinoInicio.getTime() - origemInicio.getTime()) / (1000 * 60 * 60 * 24));

    // Buscar alocações da origem
    const alocacoesOrigem = this.findBySemana(origemId);

    const stmt = db.prepare(
      'INSERT OR IGNORE INTO alocacao (semana_id, pessoa_id, data, item_id, ordem) VALUES (?, ?, ?, ?, ?)'
    );

    const insertMany = db.transaction((alocacoes: Alocacao[]) => {
      let count = 0;
      for (const alocacao of alocacoes) {
        // Calcular nova data
        const dataOrigem = new Date(alocacao.data);
        const novaData = new Date(dataOrigem);
        novaData.setDate(novaData.getDate() + diffDays);
        const novaDataStr = novaData.toISOString().split('T')[0];

        const result = stmt.run(
          destinoId,
          alocacao.pessoaId,
          novaDataStr,
          alocacao.itemId,
          alocacao.ordem
        );
        if (result.changes > 0) count++;
      }
      return count;
    });

    return insertMany(alocacoesOrigem);
  },

  // Agrupar alocações por pessoa e data
  groupByPessoaAndData(alocacoes: AlocacaoComItem[]): Map<number, Map<string, AlocacaoComItem[]>> {
    const result = new Map<number, Map<string, AlocacaoComItem[]>>();

    for (const alocacao of alocacoes) {
      if (!result.has(alocacao.pessoaId)) {
        result.set(alocacao.pessoaId, new Map());
      }

      const pessoaMap = result.get(alocacao.pessoaId)!;
      if (!pessoaMap.has(alocacao.data)) {
        pessoaMap.set(alocacao.data, []);
      }

      pessoaMap.get(alocacao.data)!.push(alocacao);
    }

    // Ordenar por ordem dentro de cada dia
    for (const pessoaMap of result.values()) {
      for (const [data, alocacoes] of pessoaMap.entries()) {
        pessoaMap.set(
          data,
          alocacoes.sort((a, b) => a.ordem - b.ordem)
        );
      }
    }

    return result;
  },
};
