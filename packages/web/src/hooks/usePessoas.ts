import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pessoaApi } from '../api';
import type { CreatePessoaDTO, UpdatePessoaDTO } from '@planejamento/shared';

export function usePessoas(filters?: { setorId?: number; ativo?: boolean }) {
  return useQuery({
    queryKey: ['pessoas', filters],
    queryFn: () => pessoaApi.list(filters),
  });
}

export function usePessoa(id: number) {
  return useQuery({
    queryKey: ['pessoas', id],
    queryFn: () => pessoaApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePessoa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePessoaDTO) => pessoaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      queryClient.invalidateQueries({ queryKey: ['planejamento'] });
    },
  });
}

export function useUpdatePessoa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePessoaDTO }) =>
      pessoaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      queryClient.invalidateQueries({ queryKey: ['planejamento'] });
    },
  });
}

export function useTogglePessoaAtivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => pessoaApi.toggleAtivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      queryClient.invalidateQueries({ queryKey: ['planejamento'] });
    },
  });
}

export function useDeletePessoa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => pessoaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      queryClient.invalidateQueries({ queryKey: ['planejamento'] });
    },
  });
}
