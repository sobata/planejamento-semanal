import { Router } from 'express';
import setorRoutes from './setor.routes.js';
import pessoaRoutes from './pessoa.routes.js';
import itemRoutes from './item.routes.js';
import semanaRoutes from './semana.routes.js';

const router = Router();

router.use('/setores', setorRoutes);
router.use('/pessoas', pessoaRoutes);
router.use('/itens', itemRoutes);
router.use('/semanas', semanaRoutes);

// Rota de health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
