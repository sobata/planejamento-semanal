import { useState, useRef, useEffect } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { ItemSelector } from './ItemSelector';
import type { AlocacaoComItem, ItemComSetor, StatusExecucao } from '@planejamento/shared';

interface DayCellProps {
  alocacoes: AlocacaoComItem[];
  itens: ItemComSetor[];
  isLocked: boolean;
  onAddItem: (item: ItemComSetor) => void;
  onRemoveItem: (alocacaoId: number) => void;
  onUpdateStatus: (alocacaoId: number, status: StatusExecucao) => void;
}

export function DayCell({
  alocacoes,
  itens,
  isLocked,
  onAddItem,
  onRemoveItem,
  onUpdateStatus,
}: DayCellProps) {
  return (
    <div className="min-h-[60px] p-1.5 flex flex-wrap gap-1 items-start content-start">
      {alocacoes.map((alocacao) => (
        <AlocacaoBadge
          key={alocacao.id}
          alocacao={alocacao}
          isLocked={isLocked}
          onRemove={() => onRemoveItem(alocacao.id)}
          onUpdateStatus={(status) => onUpdateStatus(alocacao.id, status)}
        />
      ))}

      {!isLocked && (
        <ItemSelector
          itens={itens}
          onSelect={onAddItem}
          disabled={isLocked}
        />
      )}
    </div>
  );
}

interface AlocacaoBadgeProps {
  alocacao: AlocacaoComItem;
  isLocked: boolean;
  onRemove: () => void;
  onUpdateStatus: (status: StatusExecucao) => void;
}

function AlocacaoBadge({ alocacao, isLocked, onRemove, onUpdateStatus }: AlocacaoBadgeProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusStyles = () => {
    switch (alocacao.statusExecucao) {
      case 'realizado':
        return {
          bg: 'bg-green-100',
          border: 'border-green-400',
          icon: <Check className="w-3 h-3 text-green-600" />,
        };
      case 'nao_realizado':
        return {
          bg: 'bg-red-100',
          border: 'border-red-400',
          icon: <X className="w-3 h-3 text-red-600" />,
        };
      default: // pendente
        return {
          bg: '',
          border: 'border-transparent',
          icon: null,
        };
    }
  };

  const statusStyles = getStatusStyles();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border-2 transition-all ${statusStyles.bg} ${statusStyles.border}`}
        style={{
          backgroundColor: statusStyles.bg ? undefined : alocacao.item.cor,
          color: statusStyles.bg ? '#374151' : '#fff',
        }}
      >
        {statusStyles.icon}
        {alocacao.item.titulo}
        {!isLocked && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-0.5 hover:opacity-70 cursor-pointer"
          >
            ×
          </span>
        )}
      </button>

      {showMenu && (
        <div className="absolute z-50 top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-1 text-xs text-gray-500 border-b bg-gray-50">
            Status de execução
          </div>
          <button
            onClick={() => {
              onUpdateStatus('pendente');
              setShowMenu(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
              alocacao.statusExecucao === 'pendente' ? 'bg-gray-100' : ''
            }`}
          >
            <Clock className="w-4 h-4 text-gray-400" />
            Pendente
          </button>
          <button
            onClick={() => {
              onUpdateStatus('realizado');
              setShowMenu(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
              alocacao.statusExecucao === 'realizado' ? 'bg-green-50' : ''
            }`}
          >
            <Check className="w-4 h-4 text-green-600" />
            Realizado
          </button>
          <button
            onClick={() => {
              onUpdateStatus('nao_realizado');
              setShowMenu(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
              alocacao.statusExecucao === 'nao_realizado' ? 'bg-red-50' : ''
            }`}
          >
            <X className="w-4 h-4 text-red-600" />
            Não realizado
          </button>
        </div>
      )}
    </div>
  );
}
