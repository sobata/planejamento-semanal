import { useState, useRef, useEffect } from 'react';
import { Filter, Check, X } from 'lucide-react';
import type { Setor } from '@planejamento/shared';

interface SetorFilterProps {
  setores: Setor[];
  selectedIds: Set<number>;
  onChange: (ids: Set<number>) => void;
}

export function SetorFilter({ setores, selectedIds, onChange }: SetorFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allSelected = selectedIds.size === 0 || selectedIds.size === setores.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < setores.length;

  const handleToggleSetor = (setorId: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(setorId)) {
      newSelected.delete(setorId);
    } else {
      newSelected.add(setorId);
    }

    // Se todos foram selecionados, limpa o filtro (mostra todos)
    if (newSelected.size === setores.length) {
      onChange(new Set());
    } else {
      onChange(newSelected);
    }
  };

  const handleSelectAll = () => {
    onChange(new Set()); // Limpa = mostra todos
  };

  const handleClearFilter = () => {
    onChange(new Set());
    setIsOpen(false);
  };

  const isSetorSelected = (setorId: number) => {
    // Se nenhum selecionado, todos estão visíveis
    if (selectedIds.size === 0) return true;
    return selectedIds.has(setorId);
  };

  const getButtonText = () => {
    if (allSelected) {
      return 'Filtrar setores';
    }
    return `${selectedIds.size} de ${setores.length} setores`;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn btn-sm flex items-center gap-2 ${
          someSelected ? 'btn-primary' : 'btn-secondary'
        }`}
      >
        <Filter className="w-4 h-4" />
        {getButtonText()}
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200">
          {/* Header */}
          <div className="p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Filtrar por setor</span>
            {someSelected && (
              <button
                onClick={handleClearFilter}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>

          {/* Lista de setores */}
          <div className="max-h-64 overflow-y-auto p-1">
            {/* Opção "Todos" */}
            <button
              onClick={handleSelectAll}
              className={`w-full px-3 py-2 text-left text-sm rounded flex items-center gap-2 hover:bg-gray-50 ${
                allSelected ? 'text-primary-600 font-medium' : 'text-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  allSelected
                    ? 'bg-primary-600 border-primary-600'
                    : 'border-gray-300'
                }`}
              >
                {allSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              Todos os setores
            </button>

            <div className="border-t my-1" />

            {/* Lista de setores */}
            {setores.map((setor) => (
              <button
                key={setor.id}
                onClick={() => handleToggleSetor(setor.id)}
                className={`w-full px-3 py-2 text-left text-sm rounded flex items-center gap-2 hover:bg-gray-50 ${
                  isSetorSelected(setor.id) ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isSetorSelected(setor.id)
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-gray-300'
                  }`}
                >
                  {isSetorSelected(setor.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                {setor.nome}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
