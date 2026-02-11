import { useQuery } from '@tanstack/react-query';
import { estatisticasApi } from '../api';

export function useEstatisticasSemana(semanaId: number) {
  return useQuery({
    queryKey: ['estatisticas', 'semana', semanaId],
    queryFn: () => estatisticasApi.getSemana(semanaId),
    enabled: !!semanaId,
  });
}
