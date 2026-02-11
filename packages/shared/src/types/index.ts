// Setor (Departamento/Setor)
export interface Setor {
  id: number;
  nome: string;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSetorDTO {
  nome: string;
  ordem?: number;
}

export interface UpdateSetorDTO {
  nome?: string;
  ordem?: number;
}

// Pessoa (Colaborador)
export interface Pessoa {
  id: number;
  nome: string;
  setorId: number;
  ativo: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export interface PessoaComSetor extends Pessoa {
  setor: Setor;
}

export interface CreatePessoaDTO {
  nome: string;
  setorId: number;
  ordem?: number;
}

export interface UpdatePessoaDTO {
  nome?: string;
  setorId?: number;
  ordem?: number;
}

// Item (Catálogo de Atividades)
export interface Item {
  id: number;
  titulo: string;
  descricao: string | null;
  setorSugeridoId: number | null;
  cor: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItemComSetor extends Item {
  setorSugerido: Setor | null;
}

export interface CreateItemDTO {
  titulo: string;
  descricao?: string;
  setorSugeridoId?: number;
  cor?: string;
}

export interface UpdateItemDTO {
  titulo?: string;
  descricao?: string;
  setorSugeridoId?: number | null;
  cor?: string;
}

// Semana (Período de Planejamento)
export type SemanaStatus = 'aberta' | 'fechada';

export interface Semana {
  id: number;
  dataInicio: string; // ISO date (segunda-feira)
  dataFim: string;    // ISO date (sexta-feira)
  status: SemanaStatus;
  fechadaEm: string | null;
  fechadaPor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSemanaDTO {
  dataReferencia?: string; // Qualquer data dentro da semana desejada
}

// Alocação (Pessoa + Dia + Item)
export type StatusExecucao = 'pendente' | 'realizado' | 'nao_realizado';

export interface Alocacao {
  id: number;
  semanaId: number;
  pessoaId: number;
  data: string; // ISO date
  itemId: number;
  ordem: number;
  statusExecucao: StatusExecucao;
  comentario: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlocacaoComItem extends Alocacao {
  item: Item;
}

export interface CreateAlocacaoDTO {
  pessoaId: number;
  data: string;
  itemId: number;
  ordem?: number;
}

export interface UpdateAlocacaoStatusDTO {
  statusExecucao: StatusExecucao;
}

export interface UpdateAlocacaoComentarioDTO {
  comentario: string | null;
}

export interface BulkAlocacaoDTO {
  pessoaId: number;
  data: string;
  itemIds: number[]; // Lista ordenada de IDs de itens
}

// Observação (Por pessoa/semana)
export interface Observacao {
  id: number;
  semanaId: number;
  pessoaId: number;
  texto: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertObservacaoDTO {
  texto: string;
}

// Tipos agregados para o Planejamento
export interface PessoaPlanejamento {
  pessoa: Pessoa;
  alocacoes: Record<string, AlocacaoComItem[]>; // date -> alocações
  observacao: string | null;
}

export interface SetorPlanejamento {
  setor: Setor;
  pessoas: PessoaPlanejamento[];
}

export interface PlanejamentoResponse {
  semana: Semana;
  setores: SetorPlanejamento[];
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

// Paginação
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Estatísticas e Dashboard
export type NivelPoder =
  | 'humano'
  | 'saiyajin'
  | 'super_saiyajin'
  | 'super_saiyajin_2'
  | 'super_saiyajin_3'
  | 'super_saiyajin_4';

export interface EstatisticasSetor {
  setor: Setor;
  total: number;
  realizados: number;
  naoRealizados: number;
  pendentes: number;
  percentualRealizado: number;
  nivelPoder: NivelPoder;
}

export interface EstatisticasPessoa {
  pessoa: Pessoa;
  total: number;
  realizados: number;
  percentualRealizado: number;
}

export interface EstatisticasSemana {
  semana: Semana;
  totais: {
    total: number;
    realizados: number;
    naoRealizados: number;
    pendentes: number;
    percentualRealizado: number;
    nivelPoder: NivelPoder;
    esferasDragao: number; // 0-7 baseado no percentual
  };
  porSetor: EstatisticasSetor[];
  topGuerreiros: EstatisticasPessoa[]; // Top 3
  streakDias: number; // Dias consecutivos com 100%
}
