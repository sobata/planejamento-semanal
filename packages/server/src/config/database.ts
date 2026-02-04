import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DATABASE_PATH || './data/planejamento.db';

// Criar diretório se não existir
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Wrapper para compatibilidade com better-sqlite3 API
class DatabaseWrapper {
  private sqlDb: SqlJsDatabase;
  private dbPath: string;

  constructor(sqlDb: SqlJsDatabase, dbPath: string) {
    this.sqlDb = sqlDb;
    this.dbPath = dbPath;
  }

  prepare(sql: string) {
    const self = this;
    return {
      run(...params: unknown[]) {
        self.sqlDb.run(sql, params as (string | number | null | Uint8Array)[]);
        const lastIdResult = self.sqlDb.exec('SELECT last_insert_rowid() as id');
        const lastId = lastIdResult[0]?.values[0]?.[0] ?? 0;
        const changes = self.sqlDb.getRowsModified();
        self.save();
        return { lastInsertRowid: lastId as number, changes };
      },
      get(...params: unknown[]) {
        const stmt = self.sqlDb.prepare(sql);
        stmt.bind(params as (string | number | null | Uint8Array)[]);
        if (stmt.step()) {
          const columns = stmt.getColumnNames();
          const values = stmt.get();
          stmt.free();
          return columns.reduce((obj, col, i) => {
            obj[col] = values[i];
            return obj;
          }, {} as Record<string, unknown>);
        }
        stmt.free();
        return undefined;
      },
      all(...params: unknown[]) {
        const stmt = self.sqlDb.prepare(sql);
        stmt.bind(params as (string | number | null | Uint8Array)[]);
        const results: Record<string, unknown>[] = [];
        while (stmt.step()) {
          const columns = stmt.getColumnNames();
          const values = stmt.get();
          results.push(
            columns.reduce((obj, col, i) => {
              obj[col] = values[i];
              return obj;
            }, {} as Record<string, unknown>)
          );
        }
        stmt.free();
        return results;
      },
    };
  }

  exec(sql: string) {
    this.sqlDb.exec(sql);
    this.save();
  }

  pragma(pragma: string) {
    this.sqlDb.exec(`PRAGMA ${pragma}`);
  }

  transaction<T>(fn: (items: T[]) => T[]): (items: T[]) => T[] {
    return (items: T[]) => {
      this.sqlDb.exec('BEGIN TRANSACTION');
      try {
        const result = fn(items);
        this.sqlDb.exec('COMMIT');
        this.save();
        return result;
      } catch (error) {
        this.sqlDb.exec('ROLLBACK');
        throw error;
      }
    };
  }

  close() {
    this.save();
    this.sqlDb.close();
  }

  private save() {
    const data = this.sqlDb.export();
    const buffer = Buffer.from(data);
    writeFileSync(this.dbPath, buffer);
  }
}

// @ts-expect-error - will be initialized async
export let db: DatabaseWrapper = null;

let initialized = false;

export async function initializeDatabase(): Promise<void> {
  if (initialized) return;

  const SQL = await initSqlJs();

  // Carregar banco existente ou criar novo
  let sqlDb: SqlJsDatabase;
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    sqlDb = new SQL.Database(buffer);
  } else {
    sqlDb = new SQL.Database();
  }

  db = new DatabaseWrapper(sqlDb, dbPath);

  // Habilitar foreign keys
  db.pragma('foreign_keys = ON');

  // Executar schema
  const schemaPath = join(__dirname, '../db/schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  initialized = true;
  console.log('Database initialized successfully');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
