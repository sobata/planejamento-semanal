import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { getWeekDaysDetailed } from '@planejamento/shared';
import { DroppableDayCell } from './DroppableDayCell';
import { ObservacaoCell } from './ObservacaoCell';
import type {
  PlanejamentoResponse,
  SetorPlanejamento,
  ItemComSetor,
  StatusExecucao,
  AlocacaoComItem,
} from '@planejamento/shared';

interface PlanejamentoGridProps {
  planejamento: PlanejamentoResponse;
  itens: ItemComSetor[];
  onAddAlocacao: (pessoaId: number, data: string, itemId: number) => void;
  onRemoveAlocacao: (alocacaoId: number) => void;
  onUpdateStatus: (alocacaoId: number, status: StatusExecucao) => void;
  onUpdateComentario: (alocacaoId: number, comentario: string | null) => void;
  onUpdateItemTitulo: (itemId: number, titulo: string) => void;
  onSaveObservacao: (pessoaId: number, texto: string) => void;
  onMoveAlocacao?: (alocacaoId: number, novaPessoaId: number, novaData: string) => void;
}

export function PlanejamentoGrid({
  planejamento,
  itens,
  onAddAlocacao,
  onRemoveAlocacao,
  onUpdateStatus,
  onUpdateComentario,
  onUpdateItemTitulo,
  onSaveObservacao,
  onMoveAlocacao,
}: PlanejamentoGridProps) {
  const [collapsedSetores, setCollapsedSetores] = useState<Set<number>>(new Set());
  const [activeAlocacao, setActiveAlocacao] = useState<AlocacaoComItem | null>(null);

  const isLocked = planejamento.semana.status === 'fechada';
  const weekDays = getWeekDaysDetailed(planejamento.semana.dataInicio);

  // Configurar sensor com distancia minima para evitar conflitos com cliques
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Precisa arrastar pelo menos 8px para ativar
      },
    })
  );

  const toggleSetor = (setorId: number) => {
    setCollapsedSetores((prev) => {
      const next = new Set(prev);
      if (next.has(setorId)) {
        next.delete(setorId);
      } else {
        next.add(setorId);
      }
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'alocacao') {
      setActiveAlocacao(active.data.current.alocacao);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveAlocacao(null);

    if (!over || !onMoveAlocacao) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'alocacao' && overData?.type === 'cell') {
      const alocacao = activeData.alocacao as AlocacaoComItem;
      const { pessoaId: novaPessoaId, date: novaData } = overData as { pessoaId: number; date: string };

      // So move se mudou de celula
      if (alocacao.pessoaId !== novaPessoaId || alocacao.data !== novaData) {
        onMoveAlocacao(alocacao.id, novaPessoaId, novaData);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="card overflow-visible">
        <table className="w-full border-collapse" style={{ overflow: 'visible' }}>
          <thead>
            <tr className="bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 w-48 sticky left-0 bg-gray-50 dark:bg-dark-700">
                Pessoa
              </th>
              {weekDays.map((day) => (
                <th
                  key={day.date}
                  className="text-center px-2 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[120px]"
                >
                  <div>{day.dayShort}</div>
                  <div className="text-xs text-gray-400">{day.dayNumber}</div>
                </th>
              ))}
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[150px]">
                Observacao
              </th>
            </tr>
          </thead>
          <tbody>
            {planejamento.setores.map((setorPlan) => (
              <SetorSection
                key={setorPlan.setor.id}
                setorPlan={setorPlan}
                weekDays={weekDays}
                itens={itens}
                isLocked={isLocked}
                isCollapsed={collapsedSetores.has(setorPlan.setor.id)}
                onToggle={() => toggleSetor(setorPlan.setor.id)}
                onAddAlocacao={onAddAlocacao}
                onRemoveAlocacao={onRemoveAlocacao}
                onUpdateStatus={onUpdateStatus}
                onUpdateComentario={onUpdateComentario}
                onUpdateItemTitulo={onUpdateItemTitulo}
                onSaveObservacao={onSaveObservacao}
              />
            ))}
          </tbody>
        </table>

        {planejamento.setores.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Nenhuma pessoa ativa encontrada. Cadastre pessoas para comecar o planejamento.
          </div>
        )}
      </div>

      {/* Drag Overlay - mostra o item sendo arrastado */}
      <DragOverlay dropAnimation={null}>
        {activeAlocacao ? (
          <div
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border-2 shadow-lg cursor-grabbing"
            style={{
              backgroundColor: activeAlocacao.item.cor,
              color: '#fff',
              borderColor: 'transparent',
            }}
          >
            {activeAlocacao.item.titulo}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface SetorSectionProps {
  setorPlan: SetorPlanejamento;
  weekDays: Array<{ date: string; dayShort: string; dayNumber: number }>;
  itens: ItemComSetor[];
  isLocked: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onAddAlocacao: (pessoaId: number, data: string, itemId: number) => void;
  onRemoveAlocacao: (alocacaoId: number) => void;
  onUpdateStatus: (alocacaoId: number, status: StatusExecucao) => void;
  onUpdateComentario: (alocacaoId: number, comentario: string | null) => void;
  onUpdateItemTitulo: (itemId: number, titulo: string) => void;
  onSaveObservacao: (pessoaId: number, texto: string) => void;
}

function SetorSection({
  setorPlan,
  weekDays,
  itens,
  isLocked,
  isCollapsed,
  onToggle,
  onAddAlocacao,
  onRemoveAlocacao,
  onUpdateStatus,
  onUpdateComentario,
  onUpdateItemTitulo,
  onSaveObservacao,
}: SetorSectionProps) {
  return (
    <>
      {/* Header do setor */}
      <tr
        className="bg-primary-50 dark:bg-primary-900/30 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
        onClick={onToggle}
      >
        <td
          colSpan={weekDays.length + 2}
          className="px-4 py-2 text-sm font-semibold text-primary-800 dark:text-primary-300"
        >
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {setorPlan.setor.nome}
            <span className="text-xs font-normal text-primary-600 dark:text-primary-400">
              ({setorPlan.pessoas.length} pessoas)
            </span>
          </div>
        </td>
      </tr>

      {/* Linhas de pessoas */}
      {!isCollapsed &&
        setorPlan.pessoas.map((pessoaPlan) => (
          <tr
            key={pessoaPlan.pessoa.id}
            className="border-b dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700"
          >
            <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-dark-800">
              {pessoaPlan.pessoa.nome}
            </td>
            {weekDays.map((day) => (
              <td
                key={day.date}
                className="border-l dark:border-dark-600 overflow-visible relative"
              >
                <DroppableDayCell
                  pessoaId={pessoaPlan.pessoa.id}
                  date={day.date}
                  alocacoes={pessoaPlan.alocacoes[day.date] || []}
                  itens={itens}
                  isLocked={isLocked}
                  onAddItem={(item) =>
                    onAddAlocacao(pessoaPlan.pessoa.id, day.date, item.id)
                  }
                  onRemoveItem={onRemoveAlocacao}
                  onUpdateStatus={onUpdateStatus}
                  onUpdateComentario={onUpdateComentario}
                  onUpdateItemTitulo={onUpdateItemTitulo}
                />
              </td>
            ))}
            <td className="border-l dark:border-dark-600">
              <ObservacaoCell
                texto={pessoaPlan.observacao}
                isLocked={isLocked}
                onSave={(texto) => onSaveObservacao(pessoaPlan.pessoa.id, texto)}
              />
            </td>
          </tr>
        ))}
    </>
  );
}
