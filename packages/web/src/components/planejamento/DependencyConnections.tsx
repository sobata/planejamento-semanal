import { useEffect, useState, useCallback, useRef } from 'react';
import type { AlocacaoComItem } from '@planejamento/shared';

interface Connection {
  id: string;
  fromId: number;
  toId: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromColor: string;
  toColor: string;
  isBlocked: boolean;
}

interface DependencyConnectionsProps {
  alocacoes: AlocacaoComItem[];
  containerRef: React.RefObject<HTMLElement | null>;
  highlightItemId?: number | null;
}

export function DependencyConnections({
  alocacoes,
  containerRef,
  highlightItemId,
}: DependencyConnectionsProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number | null>(null);

  const calculateConnections = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    setDimensions({
      width: container.scrollWidth,
      height: container.scrollHeight,
    });

    const newConnections: Connection[] = [];
    const alocacoesComDependencia = alocacoes.filter(a => a.dependeDeItemId);

    for (const alocacao of alocacoesComDependencia) {
      const fromElement = container.querySelector(`[data-alocacao-id="${alocacao.id}"]`);
      const dependenciaAlocacao = alocacoes.find(a => a.itemId === alocacao.dependeDeItemId);

      if (!dependenciaAlocacao) continue;

      const toElement = container.querySelector(`[data-alocacao-id="${dependenciaAlocacao.id}"]`);

      if (fromElement && toElement) {
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();

        const scrollLeft = container.scrollLeft || 0;
        const scrollTop = container.scrollTop || 0;

        // Conectar da borda esquerda do item dependente para a borda direita do item origem
        const fromX = fromRect.left - containerRect.left + scrollLeft - 2;
        const fromY = fromRect.top - containerRect.top + scrollTop + fromRect.height / 2;
        const toX = toRect.right - containerRect.left + scrollLeft + 2;
        const toY = toRect.top - containerRect.top + scrollTop + toRect.height / 2;

        newConnections.push({
          id: `${alocacao.id}-${dependenciaAlocacao.id}`,
          fromId: alocacao.id,
          toId: dependenciaAlocacao.id,
          from: { x: fromX, y: fromY },
          to: { x: toX, y: toY },
          fromColor: alocacao.item.cor,
          toColor: dependenciaAlocacao.item.cor,
          isBlocked: !alocacao.dependenciaLiberada,
        });
      }
    }

    setConnections(newConnections);
  }, [alocacoes, containerRef]);

  useEffect(() => {
    const updateConnections = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(calculateConnections);
    };

    updateConnections();

    const resizeObserver = new ResizeObserver(updateConnections);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const handleScroll = () => updateConnections();
    containerRef.current?.addEventListener('scroll', handleScroll);

    const timeout = setTimeout(updateConnections, 100);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
      containerRef.current?.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, [calculateConnections, containerRef, alocacoes]);

  // Criar path curvo elegante
  const createPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Curva horizontal suave
    const curvature = Math.min(distance * 0.4, 100);

    // Pontos de controle para curva bezier suave
    const cp1x = from.x - curvature;
    const cp1y = from.y;
    const cp2x = to.x + curvature;
    const cp2y = to.y;

    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${to.x} ${to.y}`;
  };

  if (connections.length === 0) return null;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none z-10"
      style={{
        width: dimensions.width || '100%',
        height: dimensions.height || '100%',
        overflow: 'visible',
      }}
    >
      <defs>
        {/* Gradientes elegantes para cada conexao */}
        {connections.map((conn) => (
          <linearGradient
            key={`gradient-${conn.id}`}
            id={`gradient-${conn.id}`}
            gradientUnits="userSpaceOnUse"
            x1={conn.from.x}
            y1={conn.from.y}
            x2={conn.to.x}
            y2={conn.to.y}
          >
            <stop
              offset="0%"
              stopColor={conn.isBlocked ? '#94a3b8' : conn.fromColor}
              stopOpacity={conn.isBlocked ? 0.6 : 0.8}
            />
            <stop
              offset="50%"
              stopColor={conn.isBlocked ? '#64748b' : '#a78bfa'}
              stopOpacity={conn.isBlocked ? 0.4 : 0.5}
            />
            <stop
              offset="100%"
              stopColor={conn.isBlocked ? '#94a3b8' : conn.toColor}
              stopOpacity={conn.isBlocked ? 0.6 : 0.8}
            />
          </linearGradient>
        ))}

        {/* Filtro de sombra suave */}
        <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15"/>
        </filter>

        {/* Filtro de glow para conexoes ativas */}
        <filter id="active-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {connections.map((conn) => {
        const isHighlighted = highlightItemId &&
          (alocacoes.find(a => a.id === conn.fromId)?.itemId === highlightItemId ||
           alocacoes.find(a => a.id === conn.toId)?.itemId === highlightItemId);

        const path = createPath(conn.from, conn.to);

        return (
          <g key={conn.id} className="transition-opacity duration-300">
            {/* Sombra da linha */}
            <path
              d={path}
              fill="none"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={isHighlighted ? 4 : 2.5}
              strokeLinecap="round"
              transform="translate(0, 1)"
            />

            {/* Linha principal com gradiente */}
            <path
              d={path}
              fill="none"
              stroke={`url(#gradient-${conn.id})`}
              strokeWidth={isHighlighted ? 3 : 2}
              strokeLinecap="round"
              strokeDasharray={conn.isBlocked ? '8 6' : 'none'}
              filter={isHighlighted ? 'url(#active-glow)' : undefined}
              style={{
                transition: 'stroke-width 0.2s ease',
              }}
            >
              {/* Animacao de fluxo para conexoes bloqueadas */}
              {conn.isBlocked && (
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="28"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              )}
            </path>

            {/* Ponto de origem (item que depende) - pequeno e discreto */}
            <circle
              cx={conn.from.x}
              cy={conn.from.y}
              r={isHighlighted ? 5 : 4}
              fill="white"
              stroke={conn.isBlocked ? '#94a3b8' : conn.fromColor}
              strokeWidth="2"
              filter="url(#soft-shadow)"
              style={{ transition: 'r 0.2s ease' }}
            />

            {/* Ponto de destino (item do qual depende) */}
            <circle
              cx={conn.to.x}
              cy={conn.to.y}
              r={isHighlighted ? 5 : 4}
              fill={conn.isBlocked ? '#94a3b8' : conn.toColor}
              stroke="white"
              strokeWidth="2"
              filter="url(#soft-shadow)"
              style={{ transition: 'r 0.2s ease' }}
            />

            {/* Icone de cadeado para conexoes bloqueadas */}
            {conn.isBlocked && (
              <g transform={`translate(${(conn.from.x + conn.to.x) / 2 - 6}, ${(conn.from.y + conn.to.y) / 2 - 6})`}>
                <circle
                  cx="6"
                  cy="6"
                  r="8"
                  fill="white"
                  filter="url(#soft-shadow)"
                />
                <path
                  d="M4 6V5C4 3.9 4.9 3 6 3C7.1 3 8 3.9 8 5V6M3 6H9V10C9 10.6 8.6 11 8 11H4C3.4 11 3 10.6 3 10V6Z"
                  fill="#64748b"
                  strokeWidth="0"
                />
              </g>
            )}

            {/* Checkmark para conexoes liberadas */}
            {!conn.isBlocked && (
              <g transform={`translate(${(conn.from.x + conn.to.x) / 2 - 6}, ${(conn.from.y + conn.to.y) / 2 - 6})`}>
                <circle
                  cx="6"
                  cy="6"
                  r="8"
                  fill="#22c55e"
                  filter="url(#soft-shadow)"
                />
                <path
                  d="M3.5 6L5.5 8L8.5 4"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
