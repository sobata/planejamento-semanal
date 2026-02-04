import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateItem, useSetores } from '../../hooks';
import type { ItemComSetor } from '@planejamento/shared';

// Cores predefinidas para seleção rápida
const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
  '#14B8A6', // teal
];

interface QuickAddItemProps {
  onClose: () => void;
  onItemCreated: (item: ItemComSetor) => void;
  defaultSetorId?: number;
}

export function QuickAddItem({ onClose, onItemCreated, defaultSetorId }: QuickAddItemProps) {
  const { data: setores } = useSetores();
  const createItem = useCreateItem();

  const [titulo, setTitulo] = useState('');
  const [cor, setCor] = useState(PRESET_COLORS[0]);
  const [setorSugeridoId, setSetorSugeridoId] = useState<number | ''>(defaultSetorId || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) return;

    try {
      const newItem = await createItem.mutateAsync({
        titulo: titulo.trim(),
        cor,
        setorSugeridoId: setorSugeridoId || undefined,
      });

      onItemCreated(newItem);
      onClose();
    } catch (error) {
      console.error('Erro ao criar item:', error);
    }
  };

  return (
    <div className="p-3 border-t bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700">Novo Item</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Nome do item"
          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
          autoFocus
        />

        <div className="flex gap-1 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-all ${
                cor === c ? 'border-gray-800 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        <select
          value={setorSugeridoId}
          onChange={(e) => setSetorSugeridoId(e.target.value ? Number(e.target.value) : '')}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Setor sugerido (opcional)</option>
          {setores?.map((setor) => (
            <option key={setor.id} value={setor.id}>
              {setor.nome}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={!titulo.trim() || createItem.isPending}
          className="w-full px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createItem.isPending ? 'Criando...' : 'Criar Item'}
        </button>
      </form>
    </div>
  );
}
