import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const dbPath = './data/planejamento.db';

async function migrate() {
  if (!existsSync(dbPath)) {
    console.log('Database not found, skipping migration');
    return;
  }

  const SQL = await initSqlJs();
  const buffer = readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  try {
    // Verificar colunas existentes na tabela alocacao
    const tableInfo = db.exec("PRAGMA table_info(alocacao)");
    const columns = tableInfo[0]?.values.map(row => row[1]) || [];
    console.log('Existing columns in alocacao:', columns);

    // Adicionar colunas que faltam
    // Nota: SQLite não permite CURRENT_TIMESTAMP como default em ALTER TABLE, então usamos NULL
    const columnsToAdd = [
      { name: 'status_execucao', definition: "TEXT DEFAULT 'pendente'" },
      { name: 'created_at', definition: "DATETIME" },
      { name: 'updated_at', definition: "DATETIME" },
    ];

    for (const col of columnsToAdd) {
      if (!columns.includes(col.name)) {
        console.log(`Adding column ${col.name}...`);
        db.run(`ALTER TABLE alocacao ADD COLUMN ${col.name} ${col.definition}`);
      } else {
        console.log(`Column ${col.name} already exists`);
      }
    }

    // Salvar o banco
    const data = db.export();
    const newBuffer = Buffer.from(data);
    writeFileSync(dbPath, newBuffer);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

migrate().catch(console.error);
