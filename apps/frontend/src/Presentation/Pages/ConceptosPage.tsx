import { useState, useEffect, useContext, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useConceptos } from '@/Presentation/Hooks/useConceptos';
import { useAuth } from '@/Presentation/Hooks/useAuth';
import { contabilidadClient, CuentaContable } from '@/Infrastructure/HttpClient/contabilidadClient';
import FormModal from '@/Presentation/Components/FormModal';
import DeleteConfirm from '@/Presentation/Components/DeleteConfirm';
import StatusBadge from '@/Presentation/Components/StatusBadge';
import { ToastContext } from '@/Presentation/Context/ToastContext';

export default function ConceptosPage() {
  const { conceptos, loading, create, update, remove, refresh } = useConceptos();
  const { token } = useAuth();
  const { showToast } = useContext(ToastContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [descripcion, setDescripcion] = useState('');
  const [cuentaDebitoId, setCuentaDebitoId] = useState('');
  const [cuentaCreditoId, setCuentaCreditoId] = useState('');
  const [estado, setEstado] = useState(true);

  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [cuentasLoading, setCuentasLoading] = useState(true);
  const [cuentasError, setCuentasError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    contabilidadClient
      .getCuentas(token)
      .then(res => {
        if (!active) return;
        if (res.success) {
          setCuentas(res.data);
          setCuentasError(null);
        } else {
          setCuentas([]);
          setCuentasError(res.error || 'No se pudieron cargar las cuentas del WS de Contabilidad');
        }
      })
      .catch(() => {
        if (!active) return;
        setCuentas([]);
        setCuentasError('No se pudieron cargar las cuentas del WS de Contabilidad');
      })
      .finally(() => {
        if (active) setCuentasLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const cuentasActivas = useMemo(
    () => cuentas.filter(c => c.estado === 'ACTIVO' && c.permiteTransacciones),
    [cuentas]
  );

  const cuentaLabel = (id: number) => {
    const c = cuentas.find(x => x.id === id);
    return c ? `${c.codigo} — ${c.nombre}` : `#${id}`;
  };

  const openCreate = () => {
    setEditItem(null);
    setDescripcion('');
    setCuentaDebitoId('');
    setCuentaCreditoId('');
    setEstado(true);
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setDescripcion(item.descripcion);
    setCuentaDebitoId(String(item.cuentaDebitoId));
    setCuentaCreditoId(String(item.cuentaCreditoId));
    setEstado(item.estado);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        descripcion,
        cuentaDebitoId: parseInt(cuentaDebitoId, 10),
        cuentaCreditoId: parseInt(cuentaCreditoId, 10),
        estado,
      };
      if (editItem) {
        await update(editItem.id, payload);
        showToast('Concepto actualizado', 'success');
      } else {
        await create(payload);
        showToast('Concepto creado', 'success');
      }
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    try {
      await remove(deleteId);
      showToast('Concepto eliminado', 'success');
      setDeleteId(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
    setSubmitting(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Conceptos de Pago
        </h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nuevo Concepto
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 48, flex: 1 }} />)}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Descripción</th>
                <th>Cuenta Débito</th>
                <th>Cuenta Crédito</th>
                <th>Estado</th>
                <th style={{ width: 100 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {conceptos.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>Sin conceptos registrados</td></tr>
              )}
              {conceptos.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-tertiary)' }}>{c.id}</td>
                  <td>{c.descripcion}</td>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{cuentaLabel(c.cuentaDebitoId)}</code></td>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{cuentaLabel(c.cuentaCreditoId)}</code></td>
                  <td><StatusBadge estado={c.estado} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} title="Editar">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(c.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Concepto' : 'Nuevo Concepto'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Descripción</label>
            <input className="input-field" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Nombre del concepto" required />
          </div>
          {cuentasLoading ? (
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div className="skeleton" style={{ height: 38, flex: 1 }} />
              <div className="skeleton" style={{ height: 38, flex: 1 }} />
            </div>
          ) : (
            <>
              {cuentasError && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--danger-primary, #dc2626)', marginTop: '-var(--space-sm)' }}>
                  {cuentasError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Cuenta Débito</label>
                  <select
                    className="input-field"
                    value={cuentaDebitoId}
                    onChange={e => setCuentaDebitoId(e.target.value)}
                    required
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {cuentasActivas.map(c => (
                      <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Cuenta Crédito</label>
                  <select
                    className="input-field"
                    value={cuentaCreditoId}
                    onChange={e => setCuentaCreditoId(e.target.value)}
                    required
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {cuentasActivas.map(c => (
                      <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={estado} onChange={e => setEstado(e.target.checked)} style={{ accentColor: 'var(--accent-primary)' }} />
              Activo
            </label>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || cuentasLoading}>
              {submitting ? 'Guardando...' : editItem ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </FormModal>

      <DeleteConfirm open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={submitting} />
    </div>
  );
}