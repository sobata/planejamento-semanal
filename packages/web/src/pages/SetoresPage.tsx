import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useSetores, useCreateSetor, useUpdateSetor, useDeleteSetor } from '../hooks';
import { Modal, LoadingPage, EmptyState } from '../components/ui';
import type { Setor } from '@planejamento/shared';

export function SetoresPage() {
  const { data: setores, isLoading } = useSetores();
  const createSetor = useCreateSetor();
  const updateSetor = useUpdateSetor();
  const deleteSetor = useDeleteSetor();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetor, setEditingSetor] = useState<Setor | null>(null);
  const [nome, setNome] = useState('');
  const [ordem, setOrdem] = useState(0);

  const openCreateModal = () => {
    setEditingSetor(null);
    setNome('');
    setOrdem(0);
    setIsModalOpen(true);
  };

  const openEditModal = (setor: Setor) => {
    setEditingSetor(setor);
    setNome(setor.nome);
    setOrdem(setor.ordem);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSetor(null);
    setNome('');
    setOrdem(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSetor) {
      await updateSetor.mutateAsync({ id: editingSetor.id, data: { nome, ordem } });
    } else {
      await createSetor.mutateAsync({ nome, ordem });
    }

    closeModal();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este setor?')) {
      await deleteSetor.mutateAsync(id);
    }
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Setores</h1>
          <p className="text-gray-600">Gerencie os setores da organização</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Novo Setor
        </button>
      </div>

      {setores?.length === 0 ? (
        <EmptyState
          title="Nenhum setor cadastrado"
          description="Comece criando seu primeiro setor"
          action={
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Criar Setor
            </button>
          }
        />
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nome</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Ordem</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {setores?.map((setor) => (
                <tr key={setor.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{setor.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{setor.ordem}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEditModal(setor)}
                      className="btn btn-ghost btn-sm mr-2"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(setor.id)}
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
        title={editingSetor ? 'Editar Setor' : 'Novo Setor'}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Ordem de exibição</label>
              <input
                type="number"
                value={ordem}
                onChange={(e) => setOrdem(parseInt(e.target.value) || 0)}
                className="input"
                min={0}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={closeModal} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createSetor.isPending || updateSetor.isPending}
            >
              {editingSetor ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
