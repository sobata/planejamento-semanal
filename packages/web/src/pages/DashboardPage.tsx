import { useState, useEffect } from 'react';
import { TrendingUp, Users, Zap, Flame, Star, Trophy } from 'lucide-react';
import { useSemanas, useSemanaAtual, useEstatisticasSemana } from '../hooks';
import { LoadingPage } from '../components/ui';
import { formatWeekRange } from '@planejamento/shared';
import type { NivelPoder, EstatisticasSetor, EstatisticasPessoa } from '@planejamento/shared';

// Configuração dos níveis de poder DBZ
const NIVEIS_PODER: Record<
  NivelPoder,
  { nome: string; cor: string; corBg: string; emoji: string; aura: string }
> = {
  humano: {
    nome: 'Humano',
    cor: 'text-gray-600',
    corBg: 'bg-gray-100',
    emoji: '👤',
    aura: '',
  },
  saiyajin: {
    nome: 'Saiyajin',
    cor: 'text-amber-700',
    corBg: 'bg-amber-50',
    emoji: '🔥',
    aura: 'ring-2 ring-amber-300',
  },
  super_saiyajin: {
    nome: 'Super Saiyajin',
    cor: 'text-yellow-600',
    corBg: 'bg-yellow-50',
    emoji: '⚡',
    aura: 'ring-4 ring-yellow-400 animate-pulse',
  },
  super_saiyajin_2: {
    nome: 'Super Saiyajin 2',
    cor: 'text-yellow-500',
    corBg: 'bg-gradient-to-br from-yellow-50 to-blue-50',
    emoji: '⚡⚡',
    aura: 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-200',
  },
  super_saiyajin_3: {
    nome: 'Super Saiyajin 3',
    cor: 'text-yellow-400',
    corBg: 'bg-gradient-to-br from-yellow-100 to-orange-50',
    emoji: '💫',
    aura: 'ring-4 ring-yellow-500 shadow-xl shadow-yellow-300 animate-pulse',
  },
  super_saiyajin_4: {
    nome: 'Super Saiyajin 4',
    cor: 'text-red-600',
    corBg: 'bg-gradient-to-br from-red-100 to-orange-100',
    emoji: '🐉',
    aura: 'ring-4 ring-red-500 shadow-2xl shadow-red-400',
  },
};

// Componente de Esfera do Dragão
function DragonBall({ numero, ativa }: { numero: number; ativa: boolean }) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
        ativa
          ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-300 scale-110'
          : 'bg-gray-200 text-gray-400'
      }`}
      title={`${numero} estrela${numero > 1 ? 's' : ''}`}
    >
      {'★'.repeat(Math.min(numero, 4))}
    </div>
  );
}

// Barra de Ki
function KiBar({ percentual, nivel }: { percentual: number; nivel: NivelPoder }) {
  const config = NIVEIS_PODER[nivel];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-600">Nível de Ki</span>
        <span className={`text-sm font-bold ${config.cor}`}>
          {config.emoji} {config.nome}
        </span>
      </div>
      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-out rounded-full ${
            nivel === 'super_saiyajin_4'
              ? 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500'
              : nivel === 'super_saiyajin_3'
              ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
              : nivel === 'super_saiyajin_2'
              ? 'bg-gradient-to-r from-yellow-400 to-blue-400'
              : nivel === 'super_saiyajin'
              ? 'bg-gradient-to-r from-yellow-300 to-yellow-500'
              : nivel === 'saiyajin'
              ? 'bg-gradient-to-r from-amber-400 to-amber-600'
              : 'bg-gray-400'
          }`}
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  );
}

// Card de estatística principal
function MainStatCard({
  titulo,
  percentual,
  nivel,
  total,
  realizados,
  esferasDragao,
}: {
  titulo: string;
  percentual: number;
  nivel: NivelPoder;
  total: number;
  realizados: number;
  esferasDragao: number;
}) {
  const config = NIVEIS_PODER[nivel];

  return (
    <div className={`card p-6 ${config.corBg} ${config.aura} transition-all duration-500`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{titulo}</h3>
        <span className="text-3xl">{config.emoji}</span>
      </div>

      <div className="text-center mb-4">
        <div className={`text-6xl font-bold ${config.cor}`}>{percentual}%</div>
        <p className="text-sm text-gray-600 mt-1">
          {realizados} de {total} tarefas realizadas
        </p>
      </div>

      <KiBar percentual={percentual} nivel={nivel} />

      {/* Esferas do Dragão */}
      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2 text-center">Esferas do Dragão</p>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <DragonBall key={n} numero={n} ativa={n <= esferasDragao} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Card de setor
function SetorCard({ stats }: { stats: EstatisticasSetor }) {
  const config = NIVEIS_PODER[stats.nivelPoder];

  return (
    <div className={`card p-4 ${config.corBg} ${config.aura} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-800">{stats.setor.nome}</h4>
        <span className="text-xl">{config.emoji}</span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className={`text-3xl font-bold ${config.cor}`}>{stats.percentualRealizado}%</div>
          <p className="text-xs text-gray-500">{config.nome}</p>
        </div>
        <div className="text-right text-xs text-gray-600">
          <p>{stats.realizados}/{stats.total} realizados</p>
          {stats.pendentes > 0 && <p className="text-amber-600">{stats.pendentes} pendentes</p>}
          {stats.naoRealizados > 0 && (
            <p className="text-red-600">{stats.naoRealizados} n/ realizados</p>
          )}
        </div>
      </div>

      {/* Mini barra de progresso */}
      <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            stats.percentualRealizado >= 80
              ? 'bg-green-500'
              : stats.percentualRealizado >= 50
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${stats.percentualRealizado}%` }}
        />
      </div>
    </div>
  );
}

// Card de guerreiro (top 3)
function GuerreiroCard({
  stats,
  posicao,
}: {
  stats: EstatisticasPessoa;
  posicao: number;
}) {
  const medalhas = ['🥇', '🥈', '🥉'];
  const cores = [
    'from-yellow-100 to-amber-100 ring-yellow-400',
    'from-gray-100 to-slate-200 ring-gray-400',
    'from-orange-100 to-amber-200 ring-orange-400',
  ];

  return (
    <div
      className={`card p-4 bg-gradient-to-br ${cores[posicao]} ring-2 transition-all duration-300 hover:scale-105`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{medalhas[posicao]}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{stats.pessoa.nome}</h4>
          <p className="text-sm text-gray-600">
            {stats.realizados} tarefa{stats.realizados !== 1 ? 's' : ''} realizada{stats.realizados !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">{stats.percentualRealizado}%</div>
        </div>
      </div>
    </div>
  );
}

// Componente de streak
function StreakIndicator({ dias }: { dias: number }) {
  if (dias === 0) return null;

  return (
    <div className="card p-4 bg-gradient-to-r from-purple-100 to-pink-100 ring-2 ring-purple-300">
      <div className="flex items-center gap-3">
        <Flame className="w-8 h-8 text-orange-500" />
        <div>
          <p className="text-sm text-gray-600">Dias consecutivos com 100%</p>
          <p className="text-2xl font-bold text-purple-700">
            {dias} dia{dias > 1 ? 's' : ''} 🔥
          </p>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data: semanaAtual, isLoading: loadingSemanaAtual } = useSemanaAtual();
  const { data: semanasData, isLoading: loadingSemanas } = useSemanas({ pageSize: 10 });
  const [selectedSemanaId, setSelectedSemanaId] = useState<number | null>(null);

  // Selecionar semana atual quando carregada
  useEffect(() => {
    if (semanaAtual && !selectedSemanaId) {
      setSelectedSemanaId(semanaAtual.id);
    }
  }, [semanaAtual, selectedSemanaId]);

  const { data: estatisticas, isLoading: loadingStats } = useEstatisticasSemana(
    selectedSemanaId || 0
  );

  if (loadingSemanaAtual || loadingSemanas) {
    return <LoadingPage />;
  }

  const semanas = semanasData?.data || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-500" />
            Dashboard de Performance
          </h1>
          <p className="text-gray-600">Estatísticas e gamificação Dragon Ball Z</p>
        </div>

        {/* Seletor de semana */}
        <div>
          <select
            value={selectedSemanaId || ''}
            onChange={(e) => setSelectedSemanaId(Number(e.target.value))}
            className="input"
          >
            {semanas.map((s) => (
              <option key={s.id} value={s.id}>
                {formatWeekRange(s.dataInicio, s.dataFim)}
                {s.status === 'fechada' ? ' (Fechada)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingStats ? (
        <LoadingPage />
      ) : estatisticas ? (
        <div className="space-y-6">
          {/* Card principal - Total */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MainStatCard
                titulo="Performance Total da Semana"
                percentual={estatisticas.totais.percentualRealizado}
                nivel={estatisticas.totais.nivelPoder}
                total={estatisticas.totais.total}
                realizados={estatisticas.totais.realizados}
                esferasDragao={estatisticas.totais.esferasDragao}
              />
            </div>

            {/* Resumo rápido */}
            <div className="space-y-4">
              <div className="card p-4 bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Realizadas</p>
                    <p className="text-xl font-bold text-green-700">
                      {estatisticas.totais.realizados}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-4 bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Zap className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pendentes</p>
                    <p className="text-xl font-bold text-amber-700">
                      {estatisticas.totais.pendentes}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-4 bg-red-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Star className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Não Realizadas</p>
                    <p className="text-xl font-bold text-red-700">
                      {estatisticas.totais.naoRealizados}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Streak */}
          {estatisticas.streakDias > 0 && (
            <StreakIndicator dias={estatisticas.streakDias} />
          )}

          {/* Top Guerreiros */}
          {estatisticas.topGuerreiros.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Guerreiros Z
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {estatisticas.topGuerreiros.map((guerreiro, idx) => (
                  <GuerreiroCard key={guerreiro.pessoa.id} stats={guerreiro} posicao={idx} />
                ))}
              </div>
            </div>
          )}

          {/* Estatísticas por Setor */}
          {estatisticas.porSetor.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Nível de Poder por Setor
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {estatisticas.porSetor.map((setor) => (
                  <SetorCard key={setor.setor.id} stats={setor} />
                ))}
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {estatisticas.totais.total === 0 && (
            <div className="card p-8 text-center">
              <p className="text-gray-500 text-lg">
                Nenhuma tarefa alocada nesta semana.
              </p>
              <p className="text-gray-400 mt-2">
                Vá para o Planejamento e adicione algumas tarefas para ver as estatísticas!
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
