import { useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  useItens,
  useCreateItem,
  useUpdateItem,
  useToggleItemAtivo,
  useDeleteItem,
  useSetores,
} from '../hooks';
import { Modal, LoadingPage, EmptyState, Select, Badge } from '../components/ui';
import type { ItemComSetor } from '@planejamento/shared';

const CORES_PREDEFINIDAS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#64748b', // slate
];

export function ItensPage() {
  const { data: itens, isLoading } = useItens();
  const { data: setores } = useSetores();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const toggleAtivo = useToggleItemAtivo();
  const deleteItem = useDeleteItem();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemComSetor | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [setorSugeridoId, setSetorSugeridoId] = useState<number | ''>('');
  const [cor, setCor] = useState('#6366f1');

  const openCreateModal = () => {
    setEditingItem(null);
    setTitulo('');
    setDescricao('');
    setSetorSugeridoId('');
    setCor('#6366f1');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ItemComSetor) => {
    setEditingItem(item);
    setTitulo(item.titulo);
    setDescricao(item.descricao || '');
    setSetorSugeridoId(item.setorSugeridoId || '');
    setCor(item.cor);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setTitulo('');
    setDescricao('');
    setSetorSugeridoId('');
    setCor('#6366f1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      titulo,
      descricao: descricao || undefined,
      setorSugeridoId: setorSugeridoId ? Number(setorSugeridoId) : undefined,
      cor,
    };

    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, data });
    } else {
      await createItem.mutateAsync(data);
    }

    closeModal();
  };

  const handleToggleAtivo = async (id: number) => {
    await toggleAtivo.mutateAsync(id);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      await deleteItem.mutateAsync(id);
    }
  };

  if (isLoading) return <LoadingPage />;

  const setorOptions = setores?.map((s) => ({ value: s.id, label: s.nome })) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Itens</h1>
          <p className="text-gray-600">Catálogo de atividades para planejamento</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Novo Item
        </button>
      </div>

      {itens?.length === 0 ? (
        <EmptyState
          title="Nenhum item cadastrado"
          description="Comece criando itens para o catálogo de atividades"
          action={
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Criar Item
            </button>
          }
        />
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Item</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Setor Sugerido
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {itens?.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b last:border-0 hover:bg-gray-50 ${
                    !item.ativo ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Badge color={item.cor} size="sm">
                        {item.titulo}
                      </Badge>
                      {item.descricao && (
                        <span className="text-xs text-gray-500">{item.descricao}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.setorSugerido?.nome || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`badge ${
                        item.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleAtivo(item.id)}
                      className="btn btn-ghost btn-sm mr-2"
                      title={item.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {item.ativo ? (
                        <ToggleRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="btn btn-ghost btn-sm mr-2"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn btn-ghost btn-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Editar Item' : 'Novo Item'}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="label">Título</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="input"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Descrição (opcional)</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Setor Sugerido (opcional)</label>
              <Select
                value={setorSugeridoId}
                onChange={(e) => setSetorSugeridoId(Number(e.target.value) || '')}
                options={setorOptions}
                placeholder="Nenhum"
              />
            </div>
            <div>
              <label className="label">Cor</label>
              <div className="flex flex-wrap gap-2">
                {CORES_PREDEFINIDAS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCor(c)}
                    className={`w-8 h-8 rounded-lg border-2 transition-transform ${
                      cor === c ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-500">Ou escolha uma cor personalizada</span>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-500">Preview: </span>
                <Badge color={cor}>{titulo || 'Exemplo'}</Badge>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={closeModal} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createItem.isPending || updateItem.isPending}
            >
              {editingItem ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
