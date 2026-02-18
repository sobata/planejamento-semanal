import { useState, useEffect, useCallback, useRef } from 'react';

interface ConnectionDragLayerProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onConnect: (fromAlocacaoId: number, toItemId: number) => void;
  isLocked: boolean;
}

interface DragState {
  isDragging: boolean;
  fromAlocacaoId: number | null;
  fromItemId: number | null;
  fromColor: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  hoveredAlocacaoId: number | null;
  hoveredItemId: number | null;
}

export function ConnectionDragLayer({
  containerRef,
  onConnect,
  isLocked,
}: ConnectionDragLayerProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    fromAlocacaoId: null,
    fromItemId: null,
    fromColor: '#6366f1',
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    hoveredAlocacaoId: null,
    hoveredItemId: null,
  });

  const containerRect = useRef<DOMRect | null>(null);

  // Atualizar rect do container
  useEffect(() => {
    if (containerRef.current) {
      containerRect.current = containerRef.current.getBoundingClientRect();
    }
  }, [containerRef]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (isLocked) return;

    const target = e.target as HTMLElement;
    const connector = target.closest('[data-connection-point]');

    if (connector) {
      e.preventDefault();
      e.stopPropagation();

      const alocacaoId = parseInt(connector.getAttribute('data-alocacao-id') || '0');
      const itemId = parseInt(connector.getAttribute('data-item-id') || '0');
      const color = connector.getAttribute('data-item-color') || '#6366f1';

      if (containerRef.current) {
        containerRect.current = containerRef.current.getBoundingClientRect();
        const scrollLeft = containerRef.current.scrollLeft || 0;
        const scrollTop = containerRef.current.scrollTop || 0;

        const rect = (connector as HTMLElement).getBoundingClientRect();
        const startX = rect.left - containerRect.current.left + scrollLeft + rect.width / 2;
        const startY = rect.top - containerRect.current.top + scrollTop + rect.height / 2;

        setDragState({
          isDragging: true,
          fromAlocacaoId: alocacaoId,
          fromItemId: itemId,
          fromColor: color,
          startX,
          startY,
          currentX: startX,
          currentY: startY,
          hoveredAlocacaoId: null,
          hoveredItemId: null,
        });
      }
    }
  }, [containerRef, isLocked]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !containerRef.current || !containerRect.current) return;

    const scrollLeft = containerRef.current.scrollLeft || 0;
    const scrollTop = containerRef.current.scrollTop || 0;

    const currentX = e.clientX - containerRect.current.left + scrollLeft;
    const currentY = e.clientY - containerRect.current.top + scrollTop;

    // Verificar se está sobre outro item
    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
    let hoveredAlocacaoId: number | null = null;
    let hoveredItemId: number | null = null;

    for (const el of elementsAtPoint) {
      const alocacaoEl = el.closest('[data-alocacao-id]');
      if (alocacaoEl) {
        const alocId = parseInt(alocacaoEl.getAttribute('data-alocacao-id') || '0');
        const itemId = parseInt(alocacaoEl.getAttribute('data-item-id') || '0');

        // Não pode conectar a si mesmo
        if (alocId !== dragState.fromAlocacaoId && itemId !== dragState.fromItemId) {
          hoveredAlocacaoId = alocId;
          hoveredItemId = itemId;
          break;
        }
      }
    }

    setDragState(prev => ({
      ...prev,
      currentX,
      currentY,
      hoveredAlocacaoId,
      hoveredItemId,
    }));
  }, [dragState.isDragging, dragState.fromAlocacaoId, dragState.fromItemId, containerRef]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging && dragState.hoveredItemId && dragState.fromAlocacaoId) {
      onConnect(dragState.fromAlocacaoId, dragState.hoveredItemId);
    }

    setDragState({
      isDragging: false,
      fromAlocacaoId: null,
      fromItemId: null,
      fromColor: '#6366f1',
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      hoveredAlocacaoId: null,
      hoveredItemId: null,
    });
  }, [dragState, onConnect]);

  // Registrar eventos globais
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Highlight do elemento hovered
  useEffect(() => {
    // Remover highlights anteriores
    document.querySelectorAll('[data-alocacao-id].ring-2').forEach(el => {
      el.classList.remove('ring-2', 'ring-green-500', 'ring-offset-2', 'scale-110');
    });

    // Adicionar highlight ao elemento hovered
    if (dragState.hoveredAlocacaoId) {
      const hoveredEl = document.querySelector(`[data-alocacao-id="${dragState.hoveredAlocacaoId}"]`);
      if (hoveredEl) {
        hoveredEl.classList.add('ring-2', 'ring-green-500', 'ring-offset-2', 'scale-110');
      }
    }

    return () => {
      document.querySelectorAll('[data-alocacao-id].ring-2').forEach(el => {
        el.classList.remove('ring-2', 'ring-green-500', 'ring-offset-2', 'scale-110');
      });
    };
  }, [dragState.hoveredAlocacaoId]);

  if (!dragState.isDragging) return null;

  // Calcular path curvo
  const { startX, startY, currentX, currentY } = dragState;
  const midX = (startX + currentX) / 2;
  const diffY = Math.abs(currentY - startY);
  const curveIntensity = Math.min(diffY * 0.3, 50);

  let path: string;
  if (diffY < 20 && Math.abs(currentX - startX) > 50) {
    // Linha mais reta horizontal
    const midY = Math.min(startY, currentY) - 20;
    path = `M ${startX} ${startY} Q ${midX} ${midY} ${currentX} ${currentY}`;
  } else {
    // Curva bezier
    const cp1x = startX + curveIntensity;
    const cp1y = startY;
    const cp2x = currentX - curveIntensity;
    const cp2y = currentY;
    path = `M ${startX} ${startY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${currentX} ${currentY}`;
  }

  const isValidTarget = !!dragState.hoveredItemId;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none z-50"
      style={{
        width: containerRef.current?.scrollWidth || '100%',
        height: containerRef.current?.scrollHeight || '100%',
        overflow: 'visible',
      }}
    >
      <defs>
        <linearGradient id="drag-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={dragState.fromColor} stopOpacity={0.9} />
          <stop offset="100%" stopColor={isValidTarget ? '#22c55e' : '#f59e0b'} stopOpacity={0.9} />
        </linearGradient>

        <filter id="drag-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <marker
          id="drag-arrow"
          markerWidth="12"
          markerHeight="8"
          refX="10"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 12 4, 0 8"
            fill={isValidTarget ? '#22c55e' : '#f59e0b'}
          />
        </marker>
      </defs>

      {/* Linha de fundo (glow) */}
      <path
        d={path}
        fill="none"
        stroke={isValidTarget ? '#22c55e' : '#f59e0b'}
        strokeWidth="8"
        strokeOpacity="0.3"
        filter="url(#drag-glow)"
      />

      {/* Linha principal */}
      <path
        d={path}
        fill="none"
        stroke="url(#drag-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        markerEnd="url(#drag-arrow)"
        className="transition-colors duration-150"
      >
        <animate
          attributeName="stroke-dasharray"
          values="0,1000;20,1000"
          dur="0.3s"
          fill="freeze"
        />
      </path>

      {/* Circulo de origem */}
      <circle
        cx={startX}
        cy={startY}
        r="8"
        fill={dragState.fromColor}
        stroke="white"
        strokeWidth="2"
        filter="url(#drag-glow)"
      >
        <animate
          attributeName="r"
          values="6;10;6"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Circulo do cursor */}
      <circle
        cx={currentX}
        cy={currentY}
        r={isValidTarget ? 10 : 6}
        fill={isValidTarget ? '#22c55e' : '#f59e0b'}
        stroke="white"
        strokeWidth="2"
        className="transition-all duration-150"
      >
        {isValidTarget && (
          <animate
            attributeName="r"
            values="8;12;8"
            dur="0.5s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* Texto de instrução */}
      {!isValidTarget && (
        <text
          x={currentX + 15}
          y={currentY - 10}
          fill="#f59e0b"
          fontSize="11"
          fontWeight="500"
          className="select-none"
        >
          Solte sobre um item
        </text>
      )}

      {isValidTarget && (
        <text
          x={currentX + 15}
          y={currentY - 10}
          fill="#22c55e"
          fontSize="11"
          fontWeight="600"
          className="select-none"
        >
          Solte para conectar!
        </text>
      )}
    </svg>
  );
}
