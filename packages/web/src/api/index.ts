import { api } from './client';
import type {
  Setor,
  CreateSetorDTO,
  UpdateSetorDTO,
  PessoaComSetor,
  CreatePessoaDTO,
  UpdatePessoaDTO,
  ItemComSetor,
  CreateItemDTO,
  UpdateItemDTO,
  Semana,
  PlanejamentoResponse,
  CreateAlocacaoDTO,
  Alocacao,
  Observacao,
  PaginatedResponse,
  SemanaStatus,
  StatusExecucao,
} from '@planejamento/shared';

// === Setores ===
export const setorApi = {
  list: async (): Promise<Setor[]> => {
    const { data } = await api.get<{ data: Setor[] }>('/setores');
    return data.data;
  },
  get: async (id: number): Promise<Setor> => {
    const { data } = await api.get<{ data: Setor }>(`/setores/${id}`);
    return data.data;
  },
  create: async (dto: CreateSetorDTO): Promise<Setor> => {
    const { data } = await api.post<{ data: Setor }>('/setores', dto);
    return data.data;
  },
  update: async (id: number, dto: UpdateSetorDTO): Promise<Setor> => {
    const { data } = await api.put<{ data: Setor }>(`/setores/${id}`, dto);
    return data.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/setores/${id}`);
  },
};

// === Pessoas ===
export const pessoaApi = {
  list: async (filters?: { setorId?: number; ativo?: boolean }): Promise<PessoaComSetor[]> => {
    const params = new URLSearchParams();
    if (filters?.setorId) params.append('setor_id', String(filters.setorId));
    if (filters?.ativo !== undefined) params.append('ativo', String(filters.ativo));
    const { data } = await api.get<{ data: PessoaComSetor[] }>(`/pessoas?${params}`);
    return data.data;
  },
  get: async (id: number): Promise<PessoaComSetor> => {
    const { data } = await api.get<{ data: PessoaComSetor }>(`/pessoas/${id}`);
    return data.data;
  },
  create: async (dto: CreatePessoaDTO): Promise<PessoaComSetor> => {
    const { data } = await api.post<{ data: PessoaComSetor }>('/pessoas', dto);
    return data.data;
  },
  update: async (id: number, dto: UpdatePessoaDTO): Promise<PessoaComSetor> => {
    const { data } = await api.put<{ data: PessoaComSetor }>(`/pessoas/${id}`, dto);
    return data.data;
  },
  toggleAtivo: async (id: number): Promise<PessoaComSetor> => {
    const { data } = await api.patch<{ data: PessoaComSetor }>(`/pessoas/${id}/ativo`);
    return data.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/pessoas/${id}`);
  },
};

// === Itens ===
export const itemApi = {
  list: async (filters?: { setorSugeridoId?: number; ativo?: boolean }): Promise<ItemComSetor[]> => {
    const params = new URLSearchParams();
    if (filters?.setorSugeridoId) params.append('setor_sugerido_id', String(filters.setorSugeridoId));
    if (filters?.ativo !== undefined) params.append('ativo', String(filters.ativo));
    const { data } = await api.get<{ data: ItemComSetor[] }>(`/itens?${params}`);
    return data.data;
  },
  get: async (id: number): Promise<ItemComSetor> => {
    const { data } = await api.get<{ data: ItemComSetor }>(`/itens/${id}`);
    return data.data;
  },
  create: async (dto: CreateItemDTO): Promise<ItemComSetor> => {
    const { data } = await api.post<{ data: ItemComSetor }>('/itens', dto);
    return data.data;
  },
  update: async (id: number, dto: UpdateItemDTO): Promise<ItemComSetor> => {
    const { data } = await api.put<{ data: ItemComSetor }>(`/itens/${id}`, dto);
    return data.data;
  },
  toggleAtivo: async (id: number): Promise<ItemComSetor> => {
    const { data } = await api.patch<{ data: ItemComSetor }>(`/itens/${id}/ativo`);
    return data.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/itens/${id}`);
  },
};

// === Semanas ===
export const semanaApi = {
  list: async (filters?: { status?: SemanaStatus; page?: number; pageSize?: number }): Promise<PaginatedResponse<Semana>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    const { data } = await api.get<PaginatedResponse<Semana>>(`/semanas?${params}`);
    return data;
  },
  getCurrent: async (): Promise<Semana> => {
    const { data } = await api.get<{ data: Semana }>('/semanas/atual');
    return data.data;
  },
  get: async (id: number): Promise<Semana> => {
    const { data } = await api.get<{ data: Semana }>(`/semanas/${id}`);
    return data.data;
  },
  create: async (dataReferencia?: string): Promise<Semana> => {
    const { data } = await api.post<{ data: Semana }>('/semanas', { dataReferencia });
    return data.data;
  },
  fechar: async (id: number, usuario?: string): Promise<Semana> => {
    const { data } = await api.patch<{ data: Semana }>(`/semanas/${id}/fechar`, { usuario });
    return data.data;
  },
  reabrir: async (id: number): Promise<Semana> => {
    const { data } = await api.patch<{ data: Semana }>(`/semanas/${id}/reabrir`);
    return data.data;
  },
  getPlanejamento: async (semanaId: number): Promise<PlanejamentoResponse> => {
    const { data } = await api.get<{ data: PlanejamentoResponse }>(`/semanas/${semanaId}/planejamento`);
    return data.data;
  },
  copiarDe: async (destinoId: number, origemId: number): Promise<{ count: number }> => {
    const { data } = await api.post<{ data: { count: number } }>(`/semanas/${destinoId}/copiar-de/${origemId}`);
    return data.data;
  },
};

// === Alocações ===
export const alocacaoApi = {
  list: async (semanaId: number): Promise<Alocacao[]> => {
    const { data } = await api.get<{ data: Alocacao[] }>(`/semanas/${semanaId}/alocacoes`);
    return data.data;
  },
  create: async (semanaId: number, dto: CreateAlocacaoDTO): Promise<Alocacao> => {
    const { data } = await api.post<{ data: Alocacao }>(`/semanas/${semanaId}/alocacoes`, dto);
    return data.data;
  },
  bulkCreate: async (semanaId: number, pessoaId: number, date: string, itemIds: number[]): Promise<Alocacao[]> => {
    const { data } = await api.post<{ data: Alocacao[] }>(`/semanas/${semanaId}/alocacoes/bulk`, {
      pessoaId,
      data: date,
      itemIds,
    });
    return data.data;
  },
  updateStatus: async (id: number, statusExecucao: StatusExecucao): Promise<Alocacao> => {
    const { data } = await api.patch<{ data: Alocacao }>(`/semanas/alocacoes/${id}/status`, { statusExecucao });
    return data.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/semanas/alocacoes/${id}`);
  },
};

// === Observações ===
export const observacaoApi = {
  list: async (semanaId: number): Promise<Observacao[]> => {
    const { data } = await api.get<{ data: Observacao[] }>(`/semanas/${semanaId}/observacoes`);
    return data.data;
  },
  get: async (semanaId: number, pessoaId: number): Promise<Observacao | null> => {
    const { data } = await api.get<{ data: Observacao | null }>(`/semanas/${semanaId}/pessoas/${pessoaId}/observacao`);
    return data.data;
  },
  upsert: async (semanaId: number, pessoaId: number, texto: string): Promise<Observacao | null> => {
    const { data } = await api.put<{ data: Observacao | null }>(`/semanas/${semanaId}/pessoas/${pessoaId}/observacao`, { texto });
    return data.data;
  },
};
