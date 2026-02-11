import { Router } from 'express';
import { db } from '../config/database.js';
import type {
  EstatisticasSemana,
  EstatisticasSetor,
  EstatisticasPessoa,
  NivelPoder,
  Setor,
  Pessoa,
  Semana,
} from '@planejamento/shared';

const router = Router();

// Determina o nível de poder baseado no percentual
function getNivelPoder(percentual: number): NivelPoder {
  if (percentual >= 96) return 'super_saiyajin_4';
  if (percentual >= 81) return 'super_saiyajin_3';
  if (percentual >= 61) return 'super_saiyajin_2';
  if (percentual >= 41) return 'super_saiyajin';
  if (percentual >= 21) return 'saiyajin';
  return 'humano';
}

// Calcula quantas esferas do dragão (0-7)
function getEsferasDragao(percentual: number): number {
  if (percentual >= 100) return 7;
  if (percentual >= 85) return 6;
  if (percentual >= 70) return 5;
  if (percentual >= 55) return 4;
  if (percentual >= 40) return 3;
  if (percentual >= 25) return 2;
  if (percentual >= 10) return 1;
  return 0;
}

// GET /api/estatisticas/semana/:semanaId
router.get('/semana/:semanaId', (req, res) => {
  const semanaId = parseInt(req.params.semanaId);

  // Buscar semana
  const semana = db
    .prepare(
      `SELECT id, data_inicio as dataInicio, data_fim as dataFim, status,
              fechada_em as fechadaEm, fechada_por as fechadaPor,
              created_at as createdAt, updated_at as updatedAt
       FROM semana WHERE id = ?`
    )
    .get(semanaId) as Semana | undefined;

  if (!semana) {
    return res.status(404).json({ error: 'Semana não encontrada' });
  }

  // REGRA: Cada item único por pessoa conta apenas 1 vez na semana
  // Status do item:
  // - "realizado" se pelo menos 1 alocação está realizada
  // - "nao_realizado" se TODAS estão como não realizado
  // - "pendente" caso contrário

  // Estatísticas totais (itens únicos por pessoa)
  const totaisRow = db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN tem_realizado = 1 THEN 1 ELSE 0 END) as realizados,
        SUM(CASE WHEN tem_realizado = 0 AND todas_nao_realizadas = 1 THEN 1 ELSE 0 END) as naoRealizados,
        SUM(CASE WHEN tem_realizado = 0 AND todas_nao_realizadas = 0 THEN 1 ELSE 0 END) as pendentes
       FROM (
         SELECT
           pessoa_id,
           item_id,
           MAX(CASE WHEN status_execucao = 'realizado' THEN 1 ELSE 0 END) as tem_realizado,
           MIN(CASE WHEN status_execucao = 'nao_realizado' THEN 1 ELSE 0 END) as todas_nao_realizadas
         FROM alocacao
         WHERE semana_id = ?
         GROUP BY pessoa_id, item_id
       )`
    )
    .get(semanaId) as {
    total: number;
    realizados: number;
    naoRealizados: number;
    pendentes: number;
  };

  const percentualTotal =
    totaisRow.total > 0
      ? Math.round((totaisRow.realizados / totaisRow.total) * 100)
      : 0;

  // Estatísticas por setor (itens únicos por pessoa, apenas setores com alocações)
  const setoresRows = db
    .prepare(
      `SELECT
        s.id, s.nome, s.ordem,
        s.created_at as createdAt, s.updated_at as updatedAt,
        COUNT(*) as total,
        SUM(CASE WHEN tem_realizado = 1 THEN 1 ELSE 0 END) as realizados,
        SUM(CASE WHEN tem_realizado = 0 AND todas_nao_realizadas = 1 THEN 1 ELSE 0 END) as naoRealizados,
        SUM(CASE WHEN tem_realizado = 0 AND todas_nao_realizadas = 0 THEN 1 ELSE 0 END) as pendentes
       FROM setor s
       INNER JOIN pessoa p ON p.setor_id = s.id
       INNER JOIN (
         SELECT
           pessoa_id,
           item_id,
           MAX(CASE WHEN status_execucao = 'realizado' THEN 1 ELSE 0 END) as tem_realizado,
           MIN(CASE WHEN status_execucao = 'nao_realizado' THEN 1 ELSE 0 END) as todas_nao_realizadas
         FROM alocacao
         WHERE semana_id = ?
         GROUP BY pessoa_id, item_id
       ) itens_unicos ON itens_unicos.pessoa_id = p.id
       GROUP BY s.id
       HAVING COUNT(*) > 0
       ORDER BY s.ordem, s.nome`
    )
    .all(semanaId) as Array<{
    id: number;
    nome: string;
    ordem: number;
    createdAt: string;
    updatedAt: string;
    total: number;
    realizados: number;
    naoRealizados: number;
    pendentes: number;
  }>;

  const porSetor: EstatisticasSetor[] = setoresRows.map((row) => {
    const percentual =
      row.total > 0 ? Math.round((row.realizados / row.total) * 100) : 0;
    return {
      setor: {
        id: row.id,
        nome: row.nome,
        ordem: row.ordem,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      total: row.total,
      realizados: row.realizados,
      naoRealizados: row.naoRealizados,
      pendentes: row.pendentes,
      percentualRealizado: percentual,
      nivelPoder: getNivelPoder(percentual),
    };
  });

  // Top 3 guerreiros (pessoas com mais itens únicos realizados)
  const guerreirosRows = db
    .prepare(
      `SELECT
        p.id, p.nome, p.setor_id as setorId, p.ativo, p.ordem,
        p.created_at as createdAt, p.updated_at as updatedAt,
        COUNT(*) as total,
        SUM(CASE WHEN tem_realizado = 1 THEN 1 ELSE 0 END) as realizados
       FROM pessoa p
       INNER JOIN (
         SELECT
           pessoa_id,
           item_id,
           MAX(CASE WHEN status_execucao = 'realizado' THEN 1 ELSE 0 END) as tem_realizado
         FROM alocacao
         WHERE semana_id = ?
         GROUP BY pessoa_id, item_id
       ) itens_unicos ON itens_unicos.pessoa_id = p.id
       GROUP BY p.id
       HAVING COUNT(*) > 0
       ORDER BY realizados DESC, total DESC
       LIMIT 3`
    )
    .all(semanaId) as Array<{
    id: number;
    nome: string;
    setorId: number;
    ativo: number;
    ordem: number;
    createdAt: string;
    updatedAt: string;
    total: number;
    realizados: number;
  }>;

  const topGuerreiros: EstatisticasPessoa[] = guerreirosRows.map((row) => ({
    pessoa: {
      id: row.id,
      nome: row.nome,
      setorId: row.setorId,
      ativo: row.ativo === 1,
      ordem: row.ordem,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    total: row.total,
    realizados: row.realizados,
    percentualRealizado:
      row.total > 0 ? Math.round((row.realizados / row.total) * 100) : 0,
  }));

  // Streak de dias com 100% de itens únicos realizados
  // Para cada dia, considera itens únicos (pessoa+item) naquele dia
  const diasRows = db
    .prepare(
      `SELECT data,
        COUNT(DISTINCT pessoa_id || '-' || item_id) as total,
        COUNT(DISTINCT CASE WHEN status_execucao = 'realizado' THEN pessoa_id || '-' || item_id END) as realizados
       FROM alocacao
       WHERE semana_id = ?
       GROUP BY data
       ORDER BY data DESC`
    )
    .all(semanaId) as Array<{ data: string; total: number; realizados: number }>;

  let streakDias = 0;
  for (const dia of diasRows) {
    if (dia.realizados === dia.total && dia.total > 0) {
      streakDias++;
    } else {
      break;
    }
  }

  const response: EstatisticasSemana = {
    semana,
    totais: {
      total: totaisRow.total,
      realizados: totaisRow.realizados,
      naoRealizados: totaisRow.naoRealizados,
      pendentes: totaisRow.pendentes,
      percentualRealizado: percentualTotal,
      nivelPoder: getNivelPoder(percentualTotal),
      esferasDragao: getEsferasDragao(percentualTotal),
    },
    porSetor,
    topGuerreiros,
    streakDias,
  };

  res.json({ data: response });
});

export default router;
