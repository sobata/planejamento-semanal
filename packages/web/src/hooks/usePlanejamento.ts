import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { semanaApi, alocacaoApi, observacaoApi } from '../api';
import type { SemanaStatus, StatusExecucao } from '@planejamento/shared';

// === Semanas ===
export function useSemanas(filters?: { status?: SemanaStatus; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['semanas', filters],
    queryFn: () => semanaApi.list(filters),
  });
}

export function useSemanaAtual() {
  return useQuery({
    queryKey: ['semanas', 'atual'],
    queryFn: semanaApi.getCurrent,
  });
}

export function useSemana(id: number) {
  return useQuery({
    queryKey: ['semanas', id],
    queryFn: () => semanaApi.get(id),
    enabled: !!id,
  });
}

export function useCreateSemana() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dataReferencia?: string) => semanaApi.create(dataReferencia),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semanas'] });
    },
  });
}

export function useFecharSemana() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, usuario }: { id: number; usuario?: string }) =>
      semanaApi.fechar(id, usuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semanas'] });
      queryClient.invalidateQueries({ queryKey: ['planejamento'] });
    },
  });
}

export function useReabrirSemana() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => semanaApi.reabrir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semanas'] });
      queryClient.invalidateQueries({ queryKey: ['planejamento'] });
    },
  });
}

// === Planejamento ===
export function usePlanejamento(semanaId: number) {
  return useQuery({
    queryKey: ['planejamento', semanaId],
    queryFn: () => semanaApi.getPlanejamento(semanaId),
    enabled: !!semanaId,
  });
}

export function useCopiarSemana() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ destinoId, origemId }: { destinoId: number; origemId: number }) =>
      semanaApi.copiarDe(destinoId, origemId),
    onSuccess: (_, { destinoId }) => {
      queryClient.invalidateQueries({ queryKey: ['planejamento', destinoId] });
    },
  });
}

// === Alocações ===
export function useCreateAlocacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      semanaId,
      pessoaId,
      data,
      itemId,
    }: {
      semanaId: number;
      pessoaId: number;
      data: string;
      itemId: number;
    }) => alocacaoApi.create(semanaId, { pessoaId, data, itemId }),
    onSuccess: (_, { semanaId }) => {
      queryClient.invalidateQueries({ queryKey: ['planejamento', semanaId] });
    },
  });
}

export function useBulkCreateAlocacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      semanaId,
      pessoaId,
      data,
      itemIds,
    }: {
      semanaId: number;
      pessoaId: number;
      data: string;
      itemIds: number[];
    }) => alocacaoApi.bulkCreate(semanaId, pessoaId, data, itemIds),
    onSuccess: (_, { semanaId }) => {
      queryClient.invalidateQueries({ queryKey: ['planejamento', semanaId] });
    },
  });
}

export function useDeleteAlocacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; semanaId: number }) =>
      alocacaoApi.delete(id),
    onSuccess: (_, { semanaId }) => {
      queryClient.invalidateQueries({ queryKey: ['planejamento', semanaId] });
    },
  });
}

export function useUpdateAlocacaoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      statusExecucao,
    }: {
      id: number;
      semanaId: number;
      statusExecucao: StatusExecucao;
    }) => alocacaoApi.updateStatus(id, statusExecucao),
    onSuccess: (_, { semanaId }) => {
      queryClient.invalidateQueries({ queryKey: ['planejamento', semanaId] });
    },
  });
}

// === Observações ===
export function useUpsertObservacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      semanaId,
      pessoaId,
      texto,
    }: {
      semanaId: number;
      pessoaId: number;
      texto: string;
    }) => observacaoApi.upsert(semanaId, pessoaId, texto),
    onSuccess: (_, { semanaId }) => {
      queryClient.invalidateQueries({ queryKey: ['planejamento', semanaId] });
    },
  });
}
