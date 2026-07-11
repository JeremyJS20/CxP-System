import { useEffect, useState } from 'react';
import { FileText, Clock, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import { useDocumentos } from '@/Presentation/Hooks/useDocumentos';

export default function DashboardPage() {
  const { documentos, loading } = useDocumentos();
  const [metrics, setMetrics] = useState({ total: 0, pendiente: 0, pagado: 0, totalMonto: 0 });

  useEffect(() => {
    const total = documentos.length;
    const pendiente = documentos.filter((d: any) => d.estado === 'PENDIENTE').length;
    const pagado = documentos.filter((d: any) => d.estado === 'PAGADO').length;
    const totalMonto = documentos.reduce((s: number, d: any) => s + Number(d.monto), 0);
    setMetrics({ total, pendiente, pagado, totalMonto });
  }, [documentos]);

  const cards = [
    { icon: FileText, label: 'Total Documentos', value: metrics.total, color: 'var(--accent-primary)' },
    { icon: Clock, label: 'Pendientes', value: metrics.pendiente, color: 'var(--accent-warning)' },
    { icon: CheckCircle2, label: 'Pagados', value: metrics.pagado, color: 'var(--accent-primary)' },
    { icon: DollarSign, label: 'Monto Total', value: `$${metrics.totalMonto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, color: 'var(--accent-info)' },
  ];

  const pendientes = documentos.filter((d: any) => d.estado === 'PENDIENTE');

  return (
    <div>
      <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-lg)' }}>
        Dashboard
      </h2>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
          {cards.map((card, i) => (
            <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'var(--accent-primary-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <card.icon size={24} style={{ color: card.color }} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.label}
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0' }}>
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <AlertCircle size={18} style={{ color: 'var(--accent-warning)' }} />
          Documentos Pendientes
        </h3>
        {pendientes.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>No hay documentos pendientes</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Factura</th>
                  <th>Proveedor</th>
                  <th>Vencimiento</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.slice(0, 5).map((d: any) => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{d.noDocumento}</td>
                    <td>{d.noFactura}</td>
                    <td>{d.proveedor?.nombre || `#${d.proveedorId}`}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(d.fechaDocumento).toLocaleDateString('es-DO')}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      ${d.monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
