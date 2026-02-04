import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { getWeekDaysDetailed } from '@planejamento/shared';
import { DayCell } from './DayCell';
import { ObservacaoCell } from './ObservacaoCell';
import type {
  PlanejamentoResponse,
  SetorPlanejamento,
  ItemComSetor,
  StatusExecucao,
} from '@planejamento/shared';

interface PlanejamentoGridProps {
  planejamento: PlanejamentoResponse;
  itens: ItemComSetor[];
  onAddAlocacao: (pessoaId: number, data: string, itemId: number) => void;
  onRemoveAlocacao: (alocacaoId: number) => void;
  onUpdateStatus: (alocacaoId: number, status: StatusExecucao) => void;
  onSaveObservacao: (pessoaId: number, texto: string) => void;
}

export function PlanejamentoGrid({
  planejamento,
  itens,
  onAddAlocacao,
  onRemoveAlocacao,
  onUpdateStatus,
  onSaveObservacao,
}: PlanejamentoGridProps) {
  const [collapsedSetores, setCollapsedSetores] = useState<Set<number>>(new Set());

  const isLocked = planejamento.semana.status === 'fechada';
  const weekDays = getWeekDaysDetailed(planejamento.semana.dataInicio);

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

  return (
    <div className="card overflow-visible">
      <table className="w-full border-collapse" style={{ overflow: 'visible' }}>
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 w-48 sticky left-0 bg-gray-50">
              Pessoa
            </th>
            {weekDays.map((day) => (
              <th
                key={day.date}
                className="text-center px-2 py-3 text-sm font-medium text-gray-600 min-w-[120px]"
              >
                <div>{day.dayShort}</div>
                <div className="text-xs text-gray-400">{day.dayNumber}</div>
              </th>
            ))}
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 min-w-[150px]">
              Observação
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
              onSaveObservacao={onSaveObservacao}
            />
          ))}
        </tbody>
      </table>

      {planejamento.setores.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          Nenhuma pessoa ativa encontrada. Cadastre pessoas para começar o planejamento.
        </div>
      )}
    </div>
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
  onSaveObservacao,
}: SetorSectionProps) {
  return (
    <>
      {/* Header do setor */}
      <tr
        className="bg-primary-50 cursor-pointer hover:bg-primary-100 transition-colors"
        onClick={onToggle}
      >
        <td
          colSpan={weekDays.length + 2}
          className="px-4 py-2 text-sm font-semibold text-primary-800"
        >
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {setorPlan.setor.nome}
            <span className="text-xs font-normal text-primary-600">
              ({setorPlan.pessoas.length} pessoas)
            </span>
          </div>
        </td>
      </tr>

      {/* Linhas de pessoas */}
      {!isCollapsed &&
        setorPlan.pessoas.map((pessoaPlan) => (
          <tr key={pessoaPlan.pessoa.id} className="border-b hover:bg-gray-50">
            <td className="px-4 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-white">
              {pessoaPlan.pessoa.nome}
            </td>
            {weekDays.map((day) => (
              <td key={day.date} className="border-l overflow-visible relative">
                <DayCell
                  alocacoes={pessoaPlan.alocacoes[day.date] || []}
                  itens={itens}
                  isLocked={isLocked}
                  onAddItem={(item) => onAddAlocacao(pessoaPlan.pessoa.id, day.date, item.id)}
                  onRemoveItem={onRemoveAlocacao}
                  onUpdateStatus={onUpdateStatus}
                />
              </td>
            ))}
            <td className="border-l">
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
