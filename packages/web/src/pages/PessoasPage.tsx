import { useState } from 'react';
import { Plus, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import {
  usePessoas,
  useCreatePessoa,
  useUpdatePessoa,
  useTogglePessoaAtivo,
  useDeletePessoa,
  useSetores,
} from '../hooks';
import { Modal, LoadingPage, EmptyState, Select } from '../components/ui';
import type { PessoaComSetor } from '@planejamento/shared';

export function PessoasPage() {
  const { data: pessoas, isLoading } = usePessoas();
  const { data: setores } = useSetores();
  const createPessoa = useCreatePessoa();
  const updatePessoa = useUpdatePessoa();
  const toggleAtivo = useTogglePessoaAtivo();
  const deletePessoa = useDeletePessoa();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPessoa, setEditingPessoa] = useState<PessoaComSetor | null>(null);
  const [nome, setNome] = useState('');
  const [setorId, setSetorId] = useState<number | ''>('');
  const [ordem, setOrdem] = useState(0);

  const openCreateModal = () => {
    setEditingPessoa(null);
    setNome('');
    setSetorId('');
    setOrdem(0);
    setIsModalOpen(true);
  };

  const openEditModal = (pessoa: PessoaComSetor) => {
    setEditingPessoa(pessoa);
    setNome(pessoa.nome);
    setSetorId(pessoa.setorId);
    setOrdem(pessoa.ordem);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPessoa(null);
    setNome('');
    setSetorId('');
    setOrdem(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!setorId) return;

    if (editingPessoa) {
      await updatePessoa.mutateAsync({
        id: editingPessoa.id,
        data: { nome, setorId: Number(setorId), ordem },
      });
    } else {
      await createPessoa.mutateAsync({ nome, setorId: Number(setorId), ordem });
    }

    closeModal();
  };

  const handleToggleAtivo = async (id: number) => {
    await toggleAtivo.mutateAsync(id);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta pessoa?')) {
      await deletePessoa.mutateAsync(id);
    }
  };

  if (isLoading) return <LoadingPage />;

  const setorOptions = setores?.map((s) => ({ value: s.id, label: s.nome })) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pessoas</h1>
          <p className="text-gray-600">Gerencie os colaboradores</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Nova Pessoa
        </button>
      </div>

      {pessoas?.length === 0 ? (
        <EmptyState
          title="Nenhuma pessoa cadastrada"
          description="Comece cadastrando um colaborador"
          action={
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Cadastrar Pessoa
            </button>
          }
        />
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nome</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Setor</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Ordem</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pessoas?.map((pessoa) => (
                <tr
                  key={pessoa.id}
                  className={`border-b last:border-0 hover:bg-gray-50 ${
                    !pessoa.ativo ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 text-sm text-gray-900">{pessoa.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{pessoa.setor.nome}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`badge ${
                        pessoa.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {pessoa.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{pessoa.ordem}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleAtivo(pessoa.id)}
                      className="btn btn-ghost btn-sm mr-2"
                      title={pessoa.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {pessoa.ativo ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(pessoa)}
                      className="btn btn-ghost btn-sm mr-2"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pessoa.id)}
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
        title={editingPessoa ? 'Editar Pessoa' : 'Nova Pessoa'}
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
              <label className="label">Setor</label>
              <Select
                value={setorId}
                onChange={(e) => setSetorId(Number(e.target.value) || '')}
                options={setorOptions}
                placeholder="Selecione um setor"
                required
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
              disabled={createPessoa.isPending || updatePessoa.isPending}
            >
              {editingPessoa ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
