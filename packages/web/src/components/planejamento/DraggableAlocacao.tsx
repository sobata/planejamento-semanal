import { useDraggable } from '@dnd-kit/core';
import { useState, useRef, useEffect } from 'react';
import { Check, X, Clock, MessageSquare, Pencil, Link2, Lock, Unlock } from 'lucide-react';
import type { AlocacaoComItem, StatusExecucao, ItemComSetor } from '@planejamento/shared';

interface DraggableAlocacaoProps {
  alocacao: AlocacaoComItem;
  isLocked: boolean;
  availableItems: ItemComSetor[];
  onRemove: () => void;
  onUpdateStatus: (status: StatusExecucao) => void;
  onUpdateComentario: (comentario: string | null) => void;
  onUpdateItemTitulo: (titulo: string) => void;
  onUpdateDependencia: (dependeDeItemId: number | null) => void;
}

export function DraggableAlocacao({
  alocacao,
  isLocked,
  availableItems,
  onRemove,
  onUpdateStatus,
  onUpdateComentario,
  onUpdateItemTitulo,
  onUpdateDependencia,
}: DraggableAlocacaoProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `alocacao-${alocacao.id}`,
    data: {
      type: 'alocacao',
      alocacao,
    },
    disabled: isLocked || !alocacao.dependenciaLiberada,
  });

  const [showMenu, setShowMenu] = useState(false);
  const [showComentarioInput, setShowComentarioInput] = useState(false);
  const [showTituloInput, setShowTituloInput] = useState(false);
  const [showDependenciaInput, setShowDependenciaInput] = useState(false);
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
        setShowDependenciaInput(false);
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
    // Se está bloqueado por dependência, mostrar estilo especial
    if (!alocacao.dependenciaLiberada) {
      return {
        bg: 'bg-gray-200 dark:bg-gray-700',
        border: 'border-gray-400 dark:border-gray-500 border-dashed',
        icon: <Lock className="w-3 h-3 text-gray-500" />,
        textColor: 'text-gray-500 dark:text-gray-400',
      };
    }

    switch (alocacao.statusExecucao) {
      case 'realizado':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          border: 'border-green-400 dark:border-green-600',
          icon: <Check className="w-3 h-3 text-green-600" />,
          textColor: '',
        };
      case 'nao_realizado':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          border: 'border-red-400 dark:border-red-600',
          icon: <X className="w-3 h-3 text-red-600" />,
          textColor: '',
        };
      default:
        return {
          bg: '',
          border: 'border-transparent',
          icon: null,
          textColor: '',
        };
    }
  };

  const statusStyles = getStatusStyles();
  const hasComentario = !!alocacao.comentario;
  const hasDependencia = !!alocacao.dependeDeItemId;

  // Filtrar itens disponíveis para dependência (excluir o próprio item)
  const dependencyOptions = availableItems.filter(item => item.id !== alocacao.itemId);

  return (
    <div
      className="relative group"
      ref={menuRef}
      style={{
        visibility: isDragging ? 'hidden' : 'visible',
      }}
    >
      {/* Ponto de conexão para arrastar dependência - FORA do elemento draggable */}
      {!isLocked && (
        <div
          data-connection-point="true"
          data-alocacao-id={alocacao.id}
          data-item-id={alocacao.itemId}
          data-item-color={alocacao.item.cor}
          className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500 border-2 border-white dark:border-dark-800 cursor-crosshair hover:bg-orange-500 hover:scale-125 transition-all z-20 opacity-0 group-hover:opacity-100 hover:opacity-100"
          title="Arraste para conectar a outro item"
          onMouseDown={(e) => {
            // Impedir que o dnd-kit capture este evento
            e.stopPropagation();
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.opacity = '1';
          }}
        />
      )}

      <div
        ref={setNodeRef}
        data-alocacao-id={alocacao.id}
        data-item-id={alocacao.itemId}
        {...(alocacao.dependenciaLiberada ? listeners : {})}
        {...(alocacao.dependenciaLiberada ? attributes : {})}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border-2 transition-all ${statusStyles.bg} ${statusStyles.border} ${statusStyles.textColor} ${
          !isLocked && alocacao.dependenciaLiberada ? 'cursor-grab active:cursor-grabbing' : ''
        } ${!alocacao.dependenciaLiberada ? 'opacity-75' : ''}`}
        style={{
          backgroundColor: statusStyles.bg || !alocacao.dependenciaLiberada ? undefined : alocacao.item.cor,
          color: statusStyles.bg || statusStyles.textColor ? undefined : '#fff',
          touchAction: 'none',
        }}
        title={
          !alocacao.dependenciaLiberada && alocacao.itemDependente
            ? `Aguardando: ${alocacao.itemDependente.titulo}`
            : alocacao.comentario || undefined
        }
      >
        {/* Badge content - clickable for menu */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="inline-flex items-center gap-1"
        >
          {statusStyles.icon}
          {hasDependencia && alocacao.dependenciaLiberada && (
            <Unlock className="w-3 h-3 opacity-70" />
          )}
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

      {/* Indicador de dependência (quando bloqueado) */}
      {!alocacao.dependenciaLiberada && alocacao.itemDependente && (
        <div className="absolute -bottom-4 left-0 right-0 text-[10px] text-gray-500 dark:text-gray-400 truncate text-center">
          <span className="bg-white dark:bg-dark-800 px-1 rounded">
            Aguarda: {alocacao.itemDependente.titulo}
          </span>
        </div>
      )}

      {/* Menu dropdown */}
      {showMenu && !showComentarioInput && !showTituloInput && !showDependenciaInput && (
        <div className="absolute z-50 top-full left-0 mt-1 w-52 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-600 overflow-hidden">
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
            disabled={!alocacao.dependenciaLiberada}
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
            disabled={!alocacao.dependenciaLiberada}
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
            disabled={!alocacao.dependenciaLiberada}
          >
            <X className="w-4 h-4 text-red-600" />
            Nao realizado
          </button>

          <div className="border-t dark:border-dark-600">
            <button
              onClick={() => setShowDependenciaInput(true)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-700 ${
                hasDependencia ? 'text-orange-600' : ''
              }`}
              disabled={isLocked}
            >
              <Link2 className={`w-4 h-4 ${hasDependencia ? 'text-orange-500' : 'text-gray-400'}`} />
              {hasDependencia ? 'Editar dependencia' : 'Depende de...'}
            </button>
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

          {/* Info de dependência atual */}
          {hasDependencia && alocacao.itemDependente && (
            <div className="px-3 py-2 text-xs bg-orange-50 dark:bg-orange-900/20 border-t dark:border-dark-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-orange-700 dark:text-orange-400">
                  <Link2 className="w-3 h-3" />
                  <span className="font-medium">Depende de:</span>
                </div>
                {!isLocked && (
                  <button
                    onClick={() => {
                      onUpdateDependencia(null);
                      setShowMenu(false);
                    }}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-0.5"
                    title="Remover dependencia"
                  >
                    <X className="w-3 h-3" />
                    <span>Remover</span>
                  </button>
                )}
              </div>
              <p className="mt-0.5 text-orange-600 dark:text-orange-300 truncate">
                {alocacao.itemDependente.titulo}
              </p>
              {alocacao.dependenciaLiberada ? (
                <span className="inline-flex items-center gap-1 mt-1 text-green-600">
                  <Unlock className="w-3 h-3" /> Liberado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 mt-1 text-gray-500">
                  <Lock className="w-3 h-3" /> Aguardando
                </span>
              )}
            </div>
          )}

          {hasComentario && (
            <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 border-t dark:border-dark-600">
              <span className="font-medium">Comentario:</span>
              <p className="mt-0.5 line-clamp-2">{alocacao.comentario}</p>
            </div>
          )}
        </div>
      )}

      {/* Dependencia input */}
      {showMenu && showDependenciaInput && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-600 overflow-hidden">
          <div className="p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              Depende de qual item?
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              Este item so podera ser marcado como realizado apos o item selecionado ser concluido por qualquer pessoa.
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {/* Opção para remover dependência */}
              <button
                onClick={() => {
                  onUpdateDependencia(null);
                  setShowDependenciaInput(false);
                  setShowMenu(false);
                }}
                className={`w-full px-2 py-1.5 text-left text-sm rounded hover:bg-gray-100 dark:hover:bg-dark-700 ${
                  !hasDependencia ? 'bg-gray-100 dark:bg-dark-600' : ''
                }`}
              >
                <span className="text-gray-500">Sem dependencia</span>
              </button>

              {dependencyOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onUpdateDependencia(item.id);
                    setShowDependenciaInput(false);
                    setShowMenu(false);
                  }}
                  className={`w-full px-2 py-1.5 text-left text-sm rounded hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center gap-2 ${
                    alocacao.dependeDeItemId === item.id ? 'bg-orange-50 dark:bg-orange-900/30' : ''
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.cor }}
                  />
                  <span className="truncate">{item.titulo}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={() => setShowDependenciaInput(false)}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
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
