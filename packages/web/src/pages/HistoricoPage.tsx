import { useState } from 'react';
import { Calendar, Lock, Unlock, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSemanas } from '../hooks';
import { LoadingPage, EmptyState } from '../components/ui';
import { formatWeekRange } from '@planejamento/shared';

export function HistoricoPage() {
  const [page, setPage] = useState(1);
  const { data: semanasData, isLoading } = useSemanas({ page, pageSize: 10 });

  if (isLoading) return <LoadingPage />;

  const semanas = semanasData?.data || [];
  const totalPages = semanasData?.totalPages || 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Semanas</h1>
        <p className="text-gray-600">Visualize o planejamento de semanas anteriores</p>
      </div>

      {semanas.length === 0 ? (
        <EmptyState
          title="Nenhuma semana encontrada"
          description="Comece criando uma semana no Planejamento"
          icon={<Calendar className="w-8 h-8" />}
        />
      ) : (
        <>
          <div className="grid gap-4">
            {semanas.map((semana) => (
              <div key={semana.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {formatWeekRange(semana.dataInicio, semana.dataFim)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {semana.status === 'fechada' && semana.fechadaEm
                          ? `Fechada em ${new Date(semana.fechadaEm).toLocaleDateString('pt-BR')}`
                          : 'Em andamento'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`badge ${
                        semana.status === 'fechada'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {semana.status === 'fechada' ? (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          Fechada
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3 mr-1" />
                          Aberta
                        </>
                      )}
                    </span>

                    <Link
                      to={`/?semana=${semana.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Visualizar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-ghost btn-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-ghost btn-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
