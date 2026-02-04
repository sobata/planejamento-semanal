import 'dotenv/config';
import { initializeDatabase, closeDatabase } from '../config/database.js';

async function main() {
  console.log('Initializing database...');
  await initializeDatabase();
  closeDatabase();
  console.log('Done!');
}

main().catch(console.error);
