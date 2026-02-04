import 'dotenv/config';
import { db, initializeDatabase, closeDatabase } from '../config/database.js';
import { getWeekBounds } from '@planejamento/shared';

async function main() {
  console.log('Seeding database...');

  // Inicializar schema primeiro
  await initializeDatabase();

  // Inserir setores
  const insertSetor = db.prepare('INSERT OR IGNORE INTO setor (nome, ordem) VALUES (?, ?)');
  insertSetor.run('Desenvolvimento', 1);
  insertSetor.run('QA', 2);
  insertSetor.run('Design', 3);
  insertSetor.run('Infraestrutura', 4);

  console.log('Setores criados');

  // Buscar IDs dos setores
  const setores = db.prepare('SELECT id, nome FROM setor').all() as { id: number; nome: string }[];
  const setorMap = Object.fromEntries(setores.map(s => [s.nome, s.id]));

  // Inserir pessoas
  const insertPessoa = db.prepare('INSERT OR IGNORE INTO pessoa (nome, setor_id, ordem) VALUES (?, ?, ?)');
  insertPessoa.run('João Silva', setorMap['Desenvolvimento'], 1);
  insertPessoa.run('Maria Santos', setorMap['Desenvolvimento'], 2);
  insertPessoa.run('Pedro Costa', setorMap['Desenvolvimento'], 3);
  insertPessoa.run('Ana Oliveira', setorMap['QA'], 1);
  insertPessoa.run('Carlos Lima', setorMap['QA'], 2);
  insertPessoa.run('Fernanda Souza', setorMap['Design'], 1);
  insertPessoa.run('Ricardo Mendes', setorMap['Infraestrutura'], 1);

  console.log('Pessoas criadas');

  // Inserir itens (catálogo de atividades)
  const insertItem = db.prepare(
    'INSERT OR IGNORE INTO item (titulo, descricao, setor_sugerido_id, cor) VALUES (?, ?, ?, ?)'
  );

  // Itens de Desenvolvimento
  insertItem.run('Bug Fix', 'Correção de bugs', setorMap['Desenvolvimento'], '#ef4444');
  insertItem.run('Code Review', 'Revisão de código', setorMap['Desenvolvimento'], '#f59e0b');
  insertItem.run('Nova Feature', 'Desenvolvimento de funcionalidade', setorMap['Desenvolvimento'], '#22c55e');
  insertItem.run('Refatoração', 'Melhoria de código existente', setorMap['Desenvolvimento'], '#8b5cf6');
  insertItem.run('Documentação', 'Documentação técnica', setorMap['Desenvolvimento'], '#6366f1');

  // Itens de QA
  insertItem.run('Testes Manuais', 'Execução de testes manuais', setorMap['QA'], '#ec4899');
  insertItem.run('Automação', 'Criação de testes automatizados', setorMap['QA'], '#14b8a6');
  insertItem.run('Homologação', 'Validação em ambiente de homologação', setorMap['QA'], '#f97316');

  // Itens de Design
  insertItem.run('Wireframe', 'Criação de wireframes', setorMap['Design'], '#06b6d4');
  insertItem.run('UI Design', 'Design de interface', setorMap['Design'], '#a855f7');
  insertItem.run('Prototipação', 'Criação de protótipos', setorMap['Design'], '#84cc16');

  // Itens de Infraestrutura
  insertItem.run('Deploy', 'Deploy em produção', setorMap['Infraestrutura'], '#dc2626');
  insertItem.run('Monitoramento', 'Monitoramento de sistemas', setorMap['Infraestrutura'], '#0ea5e9');
  insertItem.run('Backup', 'Execução de backups', setorMap['Infraestrutura'], '#64748b');

  // Itens genéricos
  insertItem.run('Reunião', 'Participação em reuniões', null, '#94a3b8');
  insertItem.run('Treinamento', 'Treinamento e capacitação', null, '#fbbf24');
  insertItem.run('Suporte', 'Atendimento de suporte', null, '#f472b6');

  console.log('Itens criados');

  // Criar semana atual
  const weekBounds = getWeekBounds(new Date());
  const insertSemana = db.prepare(
    'INSERT OR IGNORE INTO semana (data_inicio, data_fim, status) VALUES (?, ?, ?)'
  );
  insertSemana.run(weekBounds.inicio, weekBounds.fim, 'aberta');

  console.log('Semana atual criada:', weekBounds.inicio, '-', weekBounds.fim);

  closeDatabase();
  console.log('Seed completed!');
}

main().catch(console.error);
