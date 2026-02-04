import type {
  PlanejamentoResponse,
  SetorPlanejamento,
  PessoaPlanejamento,
  AlocacaoComItem,
} from '@planejamento/shared';
import { setorRepository } from '../repositories/setor.repository.js';
import { pessoaRepository } from '../repositories/pessoa.repository.js';
import { semanaRepository } from '../repositories/semana.repository.js';
import { alocacaoRepository } from '../repositories/alocacao.repository.js';
import { observacaoRepository } from '../repositories/observacao.repository.js';

export const planejamentoService = {
  /**
   * Obtém os dados completos de planejamento para uma semana.
   * Agrupa pessoas por setor e inclui alocações e observações.
   */
  getPlanejamento(semanaId: number): PlanejamentoResponse | null {
    const semana = semanaRepository.findById(semanaId);
    if (!semana) {
      return null;
    }

    // Buscar todos os setores
    const setores = setorRepository.findAll();

    // Buscar todas as pessoas ativas
    const pessoas = pessoaRepository.findAll({ ativo: true });

    // Buscar todas as alocações da semana com os itens
    const alocacoes = alocacaoRepository.findBySemanaWithItem(semanaId);

    // Agrupar alocações por pessoa e data
    const alocacoesPorPessoa = alocacaoRepository.groupByPessoaAndData(alocacoes);

    // Buscar observações da semana
    const observacoes = observacaoRepository.findBySemana(semanaId);
    const observacoesPorPessoa = observacaoRepository.toMap(observacoes);

    // Montar resposta agrupada por setor
    const setoresPlanejamento: SetorPlanejamento[] = [];

    for (const setor of setores) {
      const pessoasDoSetor = pessoas.filter(p => p.setorId === setor.id);

      if (pessoasDoSetor.length === 0) {
        continue; // Pular setores sem pessoas ativas
      }

      const pessoasPlanejamento: PessoaPlanejamento[] = pessoasDoSetor.map(pessoa => {
        const alocacoesDaPessoa = alocacoesPorPessoa.get(pessoa.id);
        const alocacoesRecord: Record<string, AlocacaoComItem[]> = {};

        if (alocacoesDaPessoa) {
          for (const [data, alocs] of alocacoesDaPessoa.entries()) {
            alocacoesRecord[data] = alocs;
          }
        }

        return {
          pessoa,
          alocacoes: alocacoesRecord,
          observacao: observacoesPorPessoa.get(pessoa.id) ?? null,
        };
      });

      setoresPlanejamento.push({
        setor,
        pessoas: pessoasPlanejamento,
      });
    }

    return {
      semana,
      setores: setoresPlanejamento,
    };
  },

  /**
   * Copia alocações de uma semana para outra.
   * Retorna o número de alocações copiadas.
   */
  copiarSemana(origemId: number, destinoId: number): { sucesso: boolean; count: number; erro?: string } {
    const origem = semanaRepository.findById(origemId);
    const destino = semanaRepository.findById(destinoId);

    if (!origem) {
      return { sucesso: false, count: 0, erro: 'Semana de origem não encontrada' };
    }

    if (!destino) {
      return { sucesso: false, count: 0, erro: 'Semana de destino não encontrada' };
    }

    if (destino.status === 'fechada') {
      return { sucesso: false, count: 0, erro: 'Semana de destino está fechada' };
    }

    const count = alocacaoRepository.copyFromSemana(origemId, destinoId);

    return { sucesso: true, count };
  },
};
