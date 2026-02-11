import { useState, useEffect, useMemo } from 'react';
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
  useUpdateAlocacaoComentario,
  useMoveAlocacao,
  useUpsertObservacao,
  useItens,
  useSetores,
  useUpdateItemTitulo,
} from '../hooks';
import { LoadingPage, Modal } from '../components/ui';
import { WeekSelector, PlanejamentoGrid, SetorFilter } from '../components/planejamento';
import { formatWeekRange, getNextWeekStart, getPreviousWeekStart } from '@planejamento/shared';
import type { Semana, StatusExecucao } from '@planejamento/shared';

export function PlanejamentoPage() {
  const { data: semanaAtual, isLoading: loadingSemanaAtual } = useSemanaAtual();
  const { data: semanasData, isLoading: loadingSemanas } = useSemanas({ pageSize: 50 });
  const { data: itens } = useItens({ ativo: true });
  const { data: setores } = useSetores();

  const [selectedSemanaId, setSelectedSemanaId] = useState<number | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyFromId, setCopyFromId] = useState<number | ''>('');

  // Filtro de setores com persistência em localStorage
  const [selectedSetores, setSelectedSetores] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('planejamento-setores-filter');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  // Persistir filtro de setores
  useEffect(() => {
    if (selectedSetores.size > 0) {
      localStorage.setItem('planejamento-setores-filter', JSON.stringify([...selectedSetores]));
    } else {
      localStorage.removeItem('planejamento-setores-filter');
    }
  }, [selectedSetores]);

  const createSemana = useCreateSemana();
  const fecharSemana = useFecharSemana();
  const reabrirSemana = useReabrirSemana();
  const copiarSemana = useCopiarSemana();
  const createAlocacao = useCreateAlocacao();
  const deleteAlocacao = useDeleteAlocacao();
  const updateStatus = useUpdateAlocacaoStatus();
  const updateComentario = useUpdateAlocacaoComentario();
  const moveAlocacao = useMoveAlocacao();
  const updateItemTitulo = useUpdateItemTitulo();
  const upsertObservacao = useUpsertObservacao();

  // Selecionar semana inicial quando carregada
  // Se a semana atual estiver fechada, seleciona a próxima semana aberta
  useEffect(() => {
    if (semanaAtual && semanasData?.data && !selectedSemanaId && !createSemana.isPending) {
      // Se a semana atual está fechada, procurar a próxima aberta
      if (semanaAtual.status === 'fechada') {
        // Semanas estão ordenadas DESC (mais recente primeiro)
        // Procurar uma semana aberta mais recente que a atual
        const proximaAberta = semanasData.data.find(
          (s) => s.status === 'aberta' && s.dataInicio > semanaAtual.dataInicio
        );

        if (proximaAberta) {
          setSelectedSemanaId(proximaAberta.id);
        } else {
          // Se não encontrou, criar a próxima semana automaticamente
          const nextStart = getNextWeekStart(semanaAtual.dataInicio);
          createSemana.mutate(nextStart, {
            onSuccess: (nova) => setSelectedSemanaId(nova.id),
          });
        }
      } else {
        setSelectedSemanaId(semanaAtual.id);
      }
    }
  }, [semanaAtual, semanasData?.data, selectedSemanaId, createSemana.isPending]);

  const { data: planejamento, isLoading: loadingPlanejamento } = usePlanejamento(
    selectedSemanaId || 0
  );

  const semanas = semanasData?.data || [];
  const selectedSemana = semanas.find((s) => s.id === selectedSemanaId);

  // Filtrar planejamento por setores selecionados
  const filteredPlanejamento = useMemo(() => {
    if (!planejamento || selectedSetores.size === 0) return planejamento;
    return {
      ...planejamento,
      setores: planejamento.setores.filter((s) => selectedSetores.has(s.setor.id)),
    };
  }, [planejamento, selectedSetores]);

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

  const handleUpdateComentario = async (alocacaoId: number, comentario: string | null) => {
    if (selectedSemanaId) {
      await updateComentario.mutateAsync({
        id: alocacaoId,
        semanaId: selectedSemanaId,
        comentario,
      });
    }
  };

  const handleUpdateItemTitulo = async (itemId: number, titulo: string) => {
    if (selectedSemanaId) {
      await updateItemTitulo.mutateAsync({
        id: itemId,
        titulo,
        semanaId: selectedSemanaId,
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

  const handleMoveAlocacao = async (alocacaoId: number, novaPessoaId: number, novaData: string) => {
    if (selectedSemanaId) {
      await moveAlocacao.mutateAsync({
        id: alocacaoId,
        semanaId: selectedSemanaId,
        pessoaId: novaPessoaId,
        data: novaData,
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Planejamento Semanal</h1>
          <p className="text-gray-600 dark:text-gray-400">
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
              isLocked ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            }`}
          >
            {isLocked ? 'Fechada' : 'Aberta'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
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

        {/* Filtro de setores */}
        {setores && setores.length > 0 && (
          <SetorFilter
            setores={setores}
            selectedIds={selectedSetores}
            onChange={setSelectedSetores}
          />
        )}
      </div>

      {/* Grid */}
      {loadingPlanejamento ? (
        <LoadingPage />
      ) : filteredPlanejamento ? (
        <PlanejamentoGrid
          planejamento={filteredPlanejamento}
          itens={itens || []}
          onAddAlocacao={handleAddAlocacao}
          onRemoveAlocacao={handleRemoveAlocacao}
          onUpdateStatus={handleUpdateStatus}
          onUpdateComentario={handleUpdateComentario}
          onUpdateItemTitulo={handleUpdateItemTitulo}
          onSaveObservacao={handleSaveObservacao}
          onMoveAlocacao={handleMoveAlocacao}
        />
      ) : null}

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
          <p className="text-sm text-gray-600 dark:text-gray-400">
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
