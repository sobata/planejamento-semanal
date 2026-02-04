import { useState, useRef, useEffect } from 'react';
import { Plus, Search, X, PlusCircle } from 'lucide-react';
import { Badge } from '../ui';
import { QuickAddItem } from './QuickAddItem';
import type { ItemComSetor } from '@planejamento/shared';

interface ItemSelectorProps {
  itens: ItemComSetor[];
  onSelect: (item: ItemComSetor) => void;
  disabled?: boolean;
}

export function ItemSelector({ itens, onSelect, disabled }: ItemSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current && !showAddForm) {
      inputRef.current.focus();
    }
  }, [isOpen, showAddForm]);

  const filteredItens = itens.filter(
    (item) =>
      item.ativo &&
      (item.titulo.toLowerCase().includes(search.toLowerCase()) ||
        item.setorSugerido?.nome.toLowerCase().includes(search.toLowerCase()))
  );

  // Agrupar por setor sugerido
  const grouped = filteredItens.reduce((acc, item) => {
    const key = item.setorSugerido?.nome || 'Geral';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ItemComSetor[]>);

  const handleSelect = (item: ItemComSetor) => {
    onSelect(item);
    setIsOpen(false);
    setSearch('');
    setShowAddForm(false);
  };

  const handleItemCreated = (newItem: ItemComSetor) => {
    // Ao criar um item, já seleciona ele automaticamente
    handleSelect(newItem);
  };

  if (disabled) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
        title="Adicionar item"
      >
        <Plus className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200">
          {!showAddForm ? (
            <>
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar item..."
                    className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {filteredItens.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Nenhum item encontrado
                  </div>
                ) : (
                  Object.entries(grouped).map(([setor, items]) => (
                    <div key={setor}>
                      <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
                        {setor}
                      </div>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Badge color={item.cor} size="sm">
                            {item.titulo}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>

              {/* Botão para criar novo item */}
              <div className="border-t">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full px-3 py-2.5 text-left hover:bg-primary-50 flex items-center gap-2 text-primary-600 font-medium text-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  Criar novo item
                </button>
              </div>
            </>
          ) : (
            <QuickAddItem
              onClose={() => setShowAddForm(false)}
              onItemCreated={handleItemCreated}
            />
          )}
        </div>
      )}
    </div>
  );
}
