import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatWeekRange } from '@planejamento/shared';
import type { Semana } from '@planejamento/shared';

interface WeekSelectorProps {
  semana: Semana;
  semanas: Semana[];
  onSelect: (semana: Semana) => void;
  onCreateNext?: () => void;
  onCreatePrevious?: () => void;
}

export function WeekSelector({
  semana,
  semanas,
  onSelect,
  onCreateNext,
  onCreatePrevious,
}: WeekSelectorProps) {
  const currentIndex = semanas.findIndex((s) => s.id === semana.id);
  // Semanas ordenadas DESC: índice 0 = mais recente
  const hasPrevious = currentIndex < semanas.length - 1; // existe semana mais antiga
  const hasNext = currentIndex > 0; // existe semana mais recente

  // Pode navegar ou criar
  const canGoPrevious = hasPrevious || !!onCreatePrevious;
  const canGoNext = hasNext || !!onCreateNext;

  const handlePrevious = () => {
    if (hasPrevious) {
      onSelect(semanas[currentIndex + 1]);
    } else if (onCreatePrevious) {
      onCreatePrevious();
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelect(semanas[currentIndex - 1]);
    } else if (onCreateNext) {
      onCreateNext();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePrevious}
        className="btn btn-ghost btn-sm"
        disabled={!canGoPrevious}
        title={hasPrevious ? 'Semana anterior' : 'Criar semana anterior'}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="relative">
        <select
          value={semana.id}
          onChange={(e) => {
            const selected = semanas.find((s) => s.id === Number(e.target.value));
            if (selected) onSelect(selected);
          }}
          className="input pl-10 pr-4 py-2 min-w-[220px]"
        >
          {semanas.map((s) => (
            <option key={s.id} value={s.id}>
              {formatWeekRange(s.dataInicio, s.dataFim)}
              {s.status === 'fechada' ? ' (fechada)' : ''}
            </option>
          ))}
        </select>
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      <button
        onClick={handleNext}
        className="btn btn-ghost btn-sm"
        disabled={!canGoNext}
        title={hasNext ? 'Próxima semana' : 'Criar próxima semana'}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
