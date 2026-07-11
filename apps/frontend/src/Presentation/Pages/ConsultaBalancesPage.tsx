import { useState, useEffect } from 'react';
import { Search, Filter, DollarSign, FileText } from 'lucide-react';
import { useProveedores } from '@/Presentation/Hooks/useProveedores';
import { documentoClient } from '@/Infrastructure/HttpClient/documentoClient';
import { useAuth } from '@/Presentation/Hooks/useAuth';

export default function ConsultaBalancesPage() {
  const { token } = useAuth();
  const { proveedores, refresh: refreshProveedores } = useProveedores();

  const [proveedorFiltro, setProveedorFiltro] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [total, setTotal] = useState({ docsPendientes: 0, balance: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshProveedores();
    consultar();
  }, []);

  const consultar = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (proveedorFiltro) params.set('proveedorId', proveedorFiltro);
    if (fechaDesde) params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params.set('fechaHasta', fechaHasta);
    const res = await documentoClient.getBalances(token, params.toString());
    if (res.success) {
      setResultados(res.data || []);
      if (res.total) setTotal(res.total);
    }
    setLoading(false);
  };

  const fmt = (n: number) => n.toLocaleString('es-DO', { minimumFractionDigits: 2 });

  return (
    <div>
      <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-lg)' }}>
        Consulta de Balances
      </h2>

      <div className="glass-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
          <Filter size={16} style={{ color: 'var(--text-tertiary)' }} />
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filtros
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4, display: 'block' }}>Proveedor</label>
            <select className="input-field" value={proveedorFiltro} onChange={e => setProveedorFiltro(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="">Todos</option>
              {proveedores.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 140 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4, display: 'block' }}>Fecha Desde</label>
            <input className="input-field" type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
          </div>
          <div style={{ minWidth: 140 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4, display: 'block' }}>Fecha Hasta</label>
            <input className="input-field" type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={consultar} style={{ minWidth: 100 }}>
            <Search size={16} /> Consultar
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 48, flex: 1 }} />)}
        </div>
      ) : (
        <div className="table-container" style={{ marginBottom: 'var(--space-md)' }}>
          <table>
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Cédula/RNC</th>
                <th>Docs Pendientes</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {resultados.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>Sin resultados</td></tr>
              )}
              {resultados.map((r: any, i: number) => (
                <tr key={r.proveedor?.id || i}>
                  <td style={{ fontWeight: 600 }}>{r.proveedor?.nombre}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{r.proveedor?.cedulaRnc}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} style={{ color: 'var(--accent-primary)' }} />
                      {r.docsPendientes}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>${fmt(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Documentos Pendientes:</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {total.docsPendientes}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <DollarSign size={18} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Balance Total:</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            ${fmt(total.balance)}
          </span>
        </div>
      </div>
    </div>
  );
}
