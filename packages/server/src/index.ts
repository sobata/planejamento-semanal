import 'dotenv/config';
import app from './app.js';
import { initializeDatabase } from './config/database.js';

const PORT = process.env.PORT || 3001;

// Inicializar banco de dados e servidor
async function main() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API disponível em http://localhost:${PORT}/api`);
  });
}

main().catch(console.error);
