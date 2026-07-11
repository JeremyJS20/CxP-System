import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/Presentation/Hooks/useAuth';

const LoginPage = lazy(() => import('@/Presentation/Pages/LoginPage'));
const DashboardPage = lazy(() => import('@/Presentation/Pages/DashboardPage'));
const ConceptosPage = lazy(() => import('@/Presentation/Pages/ConceptosPage'));
const ProveedoresPage = lazy(() => import('@/Presentation/Pages/ProveedoresPage'));
const DocumentosPage = lazy(() => import('@/Presentation/Pages/DocumentosPage'));
const ConsultaBalancesPage = lazy(() => import('@/Presentation/Pages/ConsultaBalancesPage'));
import AppLayout from '@/Presentation/Components/Layout/AppLayout';

function Fallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/conceptos" element={<ConceptosPage />} />
          <Route path="/proveedores" element={<ProveedoresPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/consultas" element={<ConsultaBalancesPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
