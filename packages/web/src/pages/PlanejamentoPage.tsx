import { useState, useEffect } from 'react';
import { Lock, Unlock, Copy } from 'lucide-react';
import {
  useSemanas,
  useSemanaAtual,
  usePlanejamento,
  useCreateSemana,
  useFecharSemana,
  useReabrirSemana,
  useCopiarSemana,
  useCreateAlocacao,
  useDeleteAlocacao,
  useUpdateAlocacaoStatus,
  useUpsertObservacao,
  useItens,
} from '../hooks';
import { LoadingPage, Modal } from '../components/ui';
import { WeekSelector, PlanejamentoGrid } from '../components/planejamento';
import { formatWeekRange, getNextWeekStart, getPreviousWeekStart } from '@planejamento/shared';
import type { Semana, StatusExecucao } from '@planejamento/shared';

export function PlanejamentoPage() {
  const { data: semanaAtual, isLoading: loadingSemanaAtual } = useSemanaAtual();
  const { data: semanasData, isLoading: loadingSemanas } = useSemanas({ pageSize: 50 });
  const { data: itens } = useItens({ ativo: true });

  const [selectedSemanaId, setSelectedSemanaId] = useState<number | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyFromId, setCopyFromId] = useState<number | ''>('');

  const createSemana = useCreateSemana();
  const fecharSemana = useFecharSemana();
  const reabrirSemana = useReabrirSemana();
  const copiarSemana = useCopiarSemana();
  const createAlocacao = useCreateAlocacao();
  const deleteAlocacao = useDeleteAlocacao();
  const updateStatus = useUpdateAlocacaoStatus();
  const upsertObservacao = useUpsertObservacao();

  // Selecionar semana atual quando carregada
  useEffect(() => {
    if (semanaAtual && !selectedSemanaId) {
      setSelectedSemanaId(semanaAtual.id);
    }
  }, [semanaAtual, selectedSemanaId]);

  const { data: planejamento, isLoading: loadingPlanejamento } = usePlanejamento(
    selectedSemanaId || 0
  );

  const semanas = semanasData?.data || [];
  const selectedSemana = semanas.find((s) => s.id === selectedSemanaId);

  const handleSelectSemana = (semana: Semana) => {
    setSelectedSemanaId(semana.id);
  };

  const handleCreateNextWeek = async () => {
    if (selectedSemana) {
      const nextStart = getNextWeekStart(selectedSemana.dataInicio);
      const nova = await createSemana.mutateAsync(nextStart);
      setSelectedSemanaId(nova.id);
    }
  };

  const handleCreatePreviousWeek = async () => {
    if (selectedSemana) {
      const prevStart = getPreviousWeekStart(selectedSemana.dataInicio);
      const nova = await createSemana.mutateAsync(prevStart);
      setSelectedSemanaId(nova.id);
    }
  };

  const handleFechar = async () => {
    if (selectedSemanaId && confirm('Tem certeza que deseja fechar esta semana? Ela não poderá mais ser editada.')) {
      await fecharSemana.mutateAsync({ id: selectedSemanaId });
    }
  };

  const handleReabrir = async () => {
    if (selectedSemanaId && confirm('Tem certeza que deseja reabrir esta semana?')) {
      await reabrirSemana.mutateAsync(selectedSemanaId);
    }
  };

  const handleCopiar = async () => {
    if (selectedSemanaId && copyFromId) {
      await copiarSemana.mutateAsync({
        destinoId: selectedSemanaId,
        origemId: Number(copyFromId),
      });
      setIsCopyModalOpen(false);
      setCopyFromId('');
    }
  };

  const handleAddAlocacao = async (pessoaId: number, data: string, itemId: number) => {
    if (selectedSemanaId) {
      await createAlocacao.mutateAsync({
        semanaId: selectedSemanaId,
        pessoaId,
        data,
        itemId,
      });
    }
  };

  const handleRemoveAlocacao = async (alocacaoId: number) => {
    if (selectedSemanaId) {
      await deleteAlocacao.mutateAsync({
        id: alocacaoId,
        semanaId: selectedSemanaId,
      });
    }
  };

  const handleUpdateStatus = async (alocacaoId: number, status: StatusExecucao) => {
    if (selectedSemanaId) {
      await updateStatus.mutateAsync({
        id: alocacaoId,
        semanaId: selectedSemanaId,
        statusExecucao: status,
      });
    }
  };

  const handleSaveObservacao = async (pessoaId: number, texto: string) => {
    if (selectedSemanaId) {
      await upsertObservacao.mutateAsync({
        semanaId: selectedSemanaId,
        pessoaId,
        texto,
      });
    }
  };

  if (loadingSemanaAtual || loadingSemanas) {
    return <LoadingPage />;
  }

  if (!selectedSemana || !planejamento) {
    return <LoadingPage />;
  }

  const isLocked = selectedSemana.status === 'fechada';
  const semanasParaCopiar = semanas.filter((s) => s.id !== selectedSemanaId);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planejamento Semanal</h1>
          <p className="text-gray-600">
            {formatWeekRange(selectedSemana.dataInicio, selectedSemana.dataFim)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <WeekSelector
            semana={selectedSemana}
            semanas={semanas}
            onSelect={handleSelectSemana}
            onCreateNext={handleCreateNextWeek}
            onCreatePrevious={handleCreatePreviousWeek}
          />

          {/* Status badge */}
          <span
            className={`badge ${
              isLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}
          >
            {isLocked ? 'Fechada' : 'Aberta'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mb-4">
        {!isLocked && (
          <>
            <button
              onClick={() => setIsCopyModalOpen(true)}
              className="btn btn-secondary btn-sm"
              disabled={semanasParaCopiar.length === 0}
            >
              <Copy className="w-4 h-4" />
              Copiar de outra semana
            </button>
            <button onClick={handleFechar} className="btn btn-secondary btn-sm">
              <Lock className="w-4 h-4" />
              Fechar semana
            </button>
          </>
        )}

        {isLocked && (
          <button onClick={handleReabrir} className="btn btn-secondary btn-sm">
            <Unlock className="w-4 h-4" />
            Reabrir semana
          </button>
        )}
      </div>

      {/* Grid */}
      {loadingPlanejamento ? (
        <LoadingPage />
      ) : (
        <PlanejamentoGrid
          planejamento={planejamento}
          itens={itens || []}
          onAddAlocacao={handleAddAlocacao}
          onRemoveAlocacao={handleRemoveAlocacao}
          onUpdateStatus={handleUpdateStatus}
          onSaveObservacao={handleSaveObservacao}
        />
      )}

      {/* Modal de copiar */}
      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => {
          setIsCopyModalOpen(false);
          setCopyFromId('');
        }}
        title="Copiar de outra semana"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecione a semana de origem para copiar as alocações.
            As alocações existentes na semana atual serão mantidas.
          </p>

          <div>
            <label className="label">Semana de origem</label>
            <select
              value={copyFromId}
              onChange={(e) => setCopyFromId(Number(e.target.value) || '')}
              className="input"
            >
              <option value="">Selecione uma semana</option>
              {semanasParaCopiar.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatWeekRange(s.dataInicio, s.dataFim)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsCopyModalOpen(false);
                setCopyFromId('');
              }}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleCopiar}
              className="btn btn-primary"
              disabled={!copyFromId || copiarSemana.isPending}
            >
              Copiar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
