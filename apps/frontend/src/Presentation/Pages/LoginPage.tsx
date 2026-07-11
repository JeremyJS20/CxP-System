import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/Presentation/Hooks/useAuth';
import { ToastContext } from '@/Presentation/Context/ToastContext';
import { authClient } from '@/Infrastructure/HttpClient/authClient';
import { Tags } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await authClient.login({ email, password });
    if (res.success) {
      login(res.data.token, res.data.user);
      showToast('Inicio de sesión exitoso', 'success');
      navigate('/');
    } else {
      showToast(res.error || 'Error al iniciar sesión', 'error');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-base)' }}>
      <div className="glass-card" style={{ width: 400, padding: 'var(--space-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          <Tags size={40} style={{ color: 'var(--accent-primary)' }} />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, margin: 'var(--space-sm) 0 0', color: 'var(--text-primary)' }}>
            CxP System
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Cuentas por Pagar
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
              Email
            </label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@cxp.com"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
              Contraseña
            </label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
