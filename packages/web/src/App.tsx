import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './components/layout';
import {
  PlanejamentoPage,
  HistoricoPage,
  SetoresPage,
  PessoasPage,
  ItensPage,
} from './pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minuto
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<PlanejamentoPage />} />
            <Route path="/historico" element={<HistoricoPage />} />
            <Route path="/setores" element={<SetoresPage />} />
            <Route path="/pessoas" element={<PessoasPage />} />
            <Route path="/itens" element={<ItensPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
