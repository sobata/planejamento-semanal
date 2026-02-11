import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi } from '../api';
import type { CreateItemDTO, UpdateItemDTO } from '@planejamento/shared';

export function useItens(filters?: { setorSugeridoId?: number; ativo?: boolean }) {
  return useQuery({
    queryKey: ['itens', filters],
    queryFn: () => itemApi.list(filters),
  });
}

export function useItem(id: number) {
  return useQuery({
    queryKey: ['itens', id],
    queryFn: () => itemApi.get(id),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateItemDTO) => itemApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens'] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateItemDTO }) =>
      itemApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens'] });
    },
  });
}

export function useUpdateItemTitulo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, titulo }: { id: number; titulo: string; semanaId: number }) =>
      itemApi.update(id, { titulo }),
    onSuccess: (_, { semanaId }) => {
      queryClient.invalidateQueries({ queryKey: ['itens'] });
      queryClient.invalidateQueries({ queryKey: ['planejamento', semanaId] });
    },
  });
}

export function useToggleItemAtivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => itemApi.toggleAtivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens'] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => itemApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens'] });
    },
  });
}
