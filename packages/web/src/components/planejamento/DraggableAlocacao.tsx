import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState, useRef, useEffect } from 'react';
import { Check, X, Clock, MessageSquare, Pencil } from 'lucide-react';
import type { AlocacaoComItem, StatusExecucao } from '@planejamento/shared';

interface DraggableAlocacaoProps {
  alocacao: AlocacaoComItem;
  isLocked: boolean;
  onRemove: () => void;
  onUpdateStatus: (status: StatusExecucao) => void;
  onUpdateComentario: (comentario: string | null) => void;
  onUpdateItemTitulo: (titulo: string) => void;
}

export function DraggableAlocacao({
  alocacao,
  isLocked,
  onRemove,
  onUpdateStatus,
  onUpdateComentario,
  onUpdateItemTitulo,
}: DraggableAlocacaoProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `alocacao-${alocacao.id}`,
    data: {
      type: 'alocacao',
      alocacao,
    },
    disabled: isLocked,
  });

  const [showMenu, setShowMenu] = useState(false);
  const [showComentarioInput, setShowComentarioInput] = useState(false);
  const [showTituloInput, setShowTituloInput] = useState(false);
  const [comentarioText, setComentarioText] = useState(alocacao.comentario || '');
  const [tituloText, setTituloText] = useState(alocacao.item.titulo);
  const menuRef = useRef<HTMLDivElement>(null);
  const comentarioInputRef = useRef<HTMLTextAreaElement>(null);
  const tituloInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowComentarioInput(false);
        setShowTituloInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showComentarioInput && comentarioInputRef.current) {
      comentarioInputRef.current.focus();
    }
  }, [showComentarioInput]);

  useEffect(() => {
    if (showTituloInput && tituloInputRef.current) {
      tituloInputRef.current.focus();
      tituloInputRef.current.select();
    }
  }, [showTituloInput]);

  useEffect(() => {
    setComentarioText(alocacao.comentario || '');
  }, [alocacao.comentario]);

  useEffect(() => {
    setTituloText(alocacao.item.titulo);
  }, [alocacao.item.titulo]);

  const handleSaveComentario = () => {
    const trimmed = comentarioText.trim();
    onUpdateComentario(trimmed || null);
    setShowComentarioInput(false);
    setShowMenu(false);
  };

  const handleSaveTitulo = () => {
    const trimmed = tituloText.trim();
    if (trimmed && trimmed !== alocacao.item.titulo) {
      onUpdateItemTitulo(trimmed);
    }
    setShowTituloInput(false);
    setShowMenu(false);
  };

  const getStatusStyles = () => {
    switch (alocacao.statusExecucao) {
      case 'realizado':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          border: 'border-green-400 dark:border-green-600',
          icon: <Check className="w-3 h-3 text-green-600" />,
        };
      case 'nao_realizado':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          border: 'border-red-400 dark:border-red-600',
          icon: <X className="w-3 h-3 text-red-600" />,
        };
      default:
        return {
          bg: '',
          border: 'border-transparent',
          icon: null,
        };
    }
  };

  const statusStyles = getStatusStyles();
  const hasComentario = !!alocacao.comentario;

  return (
    <div
      className="relative"
      ref={menuRef}
      style={{
        visibility: isDragging ? 'hidden' : 'visible',
      }}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border-2 transition-shadow ${statusStyles.bg} ${statusStyles.border} ${
          !isLocked ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        style={{
          backgroundColor: statusStyles.bg ? undefined : alocacao.item.cor,
          color: statusStyles.bg ? undefined : '#fff',
          touchAction: 'none',
        }}
        title={alocacao.comentario || undefined}
      >
        {/* Badge content - clickable for menu */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="inline-flex items-center gap-1"
        >
          {statusStyles.icon}
          {hasComentario && <MessageSquare className="w-3 h-3 opacity-70" />}
          {alocacao.item.titulo}
        </button>

        {/* Remove button */}
        {!isLocked && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-0.5 hover:opacity-70 cursor-pointer"
          >
            x
          </span>
        )}
      </div>

      {/* Menu dropdown */}
      {showMenu && !showComentarioInput && !showTituloInput && (
        <div className="absolute z-50 top-full left-0 mt-1 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-600 overflow-hidden">
          <div className="p-1 text-xs text-gray-500 dark:text-gray-400 border-b dark:border-dark-600 bg-gray-50 dark:bg-dark-700">
            Status de execucao
          </div>
          <button
            onClick={() => {
              onUpdateStatus('pendente');
              setShowMenu(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-700 ${
              alocacao.statusExecucao === 'pendente' ? 'bg-gray-100 dark:bg-dark-600' : ''
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
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-700 ${
              alocacao.statusExecucao === 'realizado' ? 'bg-green-50 dark:bg-green-900/30' : ''
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
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-700 ${
              alocacao.statusExecucao === 'nao_realizado' ? 'bg-red-50 dark:bg-red-900/30' : ''
            }`}
          >
            <X className="w-4 h-4 text-red-600" />
            Nao realizado
          </button>

          <div className="border-t dark:border-dark-600">
            <button
              onClick={() => setShowTituloInput(true)}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-700"
            >
              <Pencil className="w-4 h-4 text-gray-400" />
              Editar titulo
            </button>
            <button
              onClick={() => setShowComentarioInput(true)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-700 ${
                hasComentario ? 'text-blue-600' : ''
              }`}
              disabled={isLocked}
            >
              <MessageSquare className={`w-4 h-4 ${hasComentario ? 'text-blue-500' : 'text-gray-400'}`} />
              {hasComentario ? 'Editar comentario' : 'Adicionar comentario'}
            </button>
          </div>

          {hasComentario && (
            <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 border-t dark:border-dark-600">
              <span className="font-medium">Comentario:</span>
              <p className="mt-0.5 line-clamp-2">{alocacao.comentario}</p>
            </div>
          )}
        </div>
      )}

      {/* Titulo input */}
      {showMenu && showTituloInput && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-600 overflow-hidden">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Editar titulo do item</div>
            <input
              ref={tituloInputRef}
              type="text"
              value={tituloText}
              onChange={(e) => setTituloText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveTitulo();
                } else if (e.key === 'Escape') {
                  setShowTituloInput(false);
                  setTituloText(alocacao.item.titulo);
                }
              }}
              className="input"
              placeholder="Titulo do item..."
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setShowTituloInput(false);
                  setTituloText(alocacao.item.titulo);
                }}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTitulo}
                className="px-2 py-1 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded"
                disabled={!tituloText.trim()}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comentario input */}
      {showMenu && showComentarioInput && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-600 overflow-hidden">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Comentario</div>
            <textarea
              ref={comentarioInputRef}
              value={comentarioText}
              onChange={(e) => setComentarioText(e.target.value)}
              className="input resize-none"
              rows={3}
              placeholder="Digite um comentario..."
              disabled={isLocked}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setShowComentarioInput(false);
                  setComentarioText(alocacao.comentario || '');
                }}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
              >
                Cancelar
              </button>
              {hasComentario && (
                <button
                  onClick={() => {
                    onUpdateComentario(null);
                    setShowComentarioInput(false);
                    setShowMenu(false);
                  }}
                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  disabled={isLocked}
                >
                  Remover
                </button>
              )}
              <button
                onClick={handleSaveComentario}
                className="px-2 py-1 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded"
                disabled={isLocked}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
