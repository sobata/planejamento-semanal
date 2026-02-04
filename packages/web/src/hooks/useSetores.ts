import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { setorApi } from '../api';
import type { CreateSetorDTO, UpdateSetorDTO } from '@planejamento/shared';

export function useSetores() {
  return useQuery({
    queryKey: ['setores'],
    queryFn: setorApi.list,
  });
}

export function useSetor(id: number) {
  return useQuery({
    queryKey: ['setores', id],
    queryFn: () => setorApi.get(id),
    enabled: !!id,
  });
}

export function useCreateSetor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSetorDTO) => setorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
    },
  });
}

export function useUpdateSetor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSetorDTO }) =>
      setorApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
    },
  });
}

export function useDeleteSetor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => setorApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
    },
  });
}
