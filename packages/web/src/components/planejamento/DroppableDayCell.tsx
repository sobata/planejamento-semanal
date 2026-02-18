import { useDroppable } from '@dnd-kit/core';
import { DraggableAlocacao } from './DraggableAlocacao';
import { ItemSelector } from './ItemSelector';
import type { AlocacaoComItem, ItemComSetor, StatusExecucao } from '@planejamento/shared';

interface DroppableDayCellProps {
  pessoaId: number;
  date: string;
  alocacoes: AlocacaoComItem[];
  itens: ItemComSetor[];
  isLocked: boolean;
  onAddItem: (item: ItemComSetor) => void;
  onRemoveItem: (alocacaoId: number) => void;
  onUpdateStatus: (alocacaoId: number, status: StatusExecucao) => void;
  onUpdateComentario: (alocacaoId: number, comentario: string | null) => void;
  onUpdateItemTitulo: (itemId: number, titulo: string) => void;
  onUpdateDependencia: (alocacaoId: number, dependeDeItemId: number | null) => void;
}

export function DroppableDayCell({
  pessoaId,
  date,
  alocacoes,
  itens,
  isLocked,
  onAddItem,
  onRemoveItem,
  onUpdateStatus,
  onUpdateComentario,
  onUpdateItemTitulo,
  onUpdateDependencia,
}: DroppableDayCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${pessoaId}-${date}`,
    data: {
      type: 'cell',
      pessoaId,
      date,
    },
    disabled: isLocked,
  });

  // Verificar se há itens bloqueados nesta célula para adicionar padding extra
  const hasBlockedItems = alocacoes.some(a => !a.dependenciaLiberada);

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] p-1.5 flex flex-wrap gap-1 items-start content-start transition-all duration-150 ${
        isOver && !isLocked
          ? 'bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-500 ring-inset scale-[1.02]'
          : ''
      } ${hasBlockedItems ? 'pb-5' : ''}`}
    >
      {alocacoes.map((alocacao) => (
        <DraggableAlocacao
          key={alocacao.id}
          alocacao={alocacao}
          isLocked={isLocked}
          availableItems={itens}
          onRemove={() => onRemoveItem(alocacao.id)}
          onUpdateStatus={(status) => onUpdateStatus(alocacao.id, status)}
          onUpdateComentario={(comentario) => onUpdateComentario(alocacao.id, comentario)}
          onUpdateItemTitulo={(titulo) => onUpdateItemTitulo(alocacao.item.id, titulo)}
          onUpdateDependencia={(dependeDeItemId) => onUpdateDependencia(alocacao.id, dependeDeItemId)}
        />
      ))}

      {!isLocked && (
        <ItemSelector itens={itens} onSelect={onAddItem} disabled={isLocked} />
      )}
    </div>
  );
}
