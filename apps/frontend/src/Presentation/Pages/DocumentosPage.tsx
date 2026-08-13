import { useState, useEffect, useContext } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Search } from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { useDocumentos } from '@/Presentation/Hooks/useDocumentos';
import { useConceptos } from '@/Presentation/Hooks/useConceptos';
import { useProveedores } from '@/Presentation/Hooks/useProveedores';
import FormModal from '@/Presentation/Components/FormModal';
import DeleteConfirm from '@/Presentation/Components/DeleteConfirm';
import StatusBadge from '@/Presentation/Components/StatusBadge';
import { ToastContext } from '@/Presentation/Context/ToastContext';

export default function DocumentosPage() {
  const { documentos, loading, create, update, remove, contabilizar, refresh } = useDocumentos();
  const { conceptos, refresh: refreshConceptos } = useConceptos();
  const { proveedores, refresh: refreshProveedores } = useProveedores();
  const { showToast } = useContext(ToastContext);

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [contabilizandoId, setContabilizandoId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const [noDocumento, setNoDocumento] = useState('');
  const [noFactura, setNoFactura] = useState('');
  const [fechaDocumento, setFechaDocumento] = useState('');
  const [monto, setMonto] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [conceptoId, setConceptoId] = useState('');
  const [estado, setEstado] = useState<'PENDIENTE' | 'PAGADO'>('PENDIENTE');

  useEffect(() => {
    refreshConceptos();
    refreshProveedores();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setNoDocumento('');
    setNoFactura('');
    setFechaDocumento(new Date().toISOString().slice(0, 10));
    setMonto('');
    setProveedorId('');
    setConceptoId('');
    setEstado('PENDIENTE');
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setNoDocumento(item.noDocumento);
    setNoFactura(item.noFactura);
    setFechaDocumento(item.fechaDocumento.slice(0, 10));
    setMonto(String(item.monto));
    setProveedorId(String(item.proveedorId));
    setConceptoId(String(item.conceptoId));
    setEstado(item.estado);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      noDocumento,
      noFactura,
      fechaDocumento: new Date(fechaDocumento).toISOString(),
      monto: parseFloat(monto),
      proveedorId: parseInt(proveedorId),
      conceptoId: parseInt(conceptoId),
      estado,
    };
    try {
      if (editItem) {
        await update(editItem.id, payload);
        showToast('Documento actualizado', 'success');
      } else {
        await create(payload as any);
        showToast('Documento creado', 'success');
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
      showToast('Documento eliminado', 'success');
      setDeleteId(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
    setSubmitting(false);
  };

  const handleContabilizar = async (id: number) => {
    setContabilizandoId(id);
    try {
      const res = await contabilizar(id);
      showToast(res?.message || 'Documento contabilizado', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
    setContabilizandoId(null);
  };

  const filtered = documentos.filter((d: any) =>
    !search || d.noDocumento.toLowerCase().includes(search.toLowerCase()) ||
    d.noFactura?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Documentos por Pagar
        </h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nuevo Documento
        </button>
      </div>

      <div className="search-bar" style={{ marginBottom: 'var(--space-md)', maxWidth: 320 }}>
        <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
        <input placeholder="Buscar por documento o factura..." value={search} onChange={e => setSearch(e.target.value)} />
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
                <th>No. Documento</th>
                <th>Factura</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Contable</th>
                <th style={{ width: 200 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>Sin documentos registrados</td></tr>
              )}
              {filtered.map((d: any) => (
                <tr key={d.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{d.noDocumento}</td>
                  <td>{d.noFactura}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(d.fechaDocumento).toLocaleDateString('es-DO')}
                  </td>
                  <td>{d.proveedor?.nombre || `#${d.proveedorId}`}</td>
                  <td>{d.concepto?.descripcion || `#${d.conceptoId}`}</td>
                  <td style={{ fontWeight: 700 }}>
                    ${d.monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </td>
                  <td><StatusBadge estado={d.estado} /></td>
                  <td>
                    {d.estadoContable === 'CONTABILIZADO' && d.respuestaContable ? (
                      <Tooltip
                        showArrow
                        placement="top"
                        content={
                          <div className="tooltip-content">
                            <h4>Asiento Contable</h4>
                            <dl>
                              <dt>No. Asiento</dt>
                              <dd style={{ fontFamily: 'var(--font-mono)' }}>#{d.respuestaContable.numeroAsiento}</dd>
                              <dt>Fecha</dt>
                              <dd>{d.respuestaContable.fecha}</dd>
                              <dt>Auxiliar</dt>
                              <dd>{d.respuestaContable.auxiliar}</dd>
                              <dt>Cuenta Débito</dt>
                              <dd>{d.respuestaContable.cuentaDebito}</dd>
                              <dt>Cuenta Crédito</dt>
                              <dd>{d.respuestaContable.cuentaCredito}</dd>
                              <dt>Monto</dt>
                              <dd>${Number(d.respuestaContable.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</dd>
                              <dt>Estado WS</dt>
                              <dd>{d.respuestaContable.estado}</dd>
                            </dl>
                          </div>
                        }
                      >
                        <StatusBadge estado="CONTABILIZADO" />
                      </Tooltip>
                    ) : (
                      <StatusBadge estado={d.estadoContable || 'PENDIENTE'} />
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {d.estadoContable !== 'CONTABILIZADO' && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleContabilizar(d.id)}
                            disabled={contabilizandoId !== null}
                            title="Enviar a Contabilidad"
                          >
                            {contabilizandoId === d.id ? (
                              <span style={{ fontSize: '0.75rem' }}>Enviando...</span>
                            ) : (
                              <BookOpen size={15} />
                            )}
                          </button>
                          <div style={{ width: 1, height: 20, background: 'var(--surface-border)', margin: '0 4px' }} />
                        </>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)} title="Editar">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(d.id)} title="Eliminar">
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

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Documento' : 'Nuevo Documento'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>No. Documento</label>
              <input className="input-field" value={noDocumento} onChange={e => setNoDocumento(e.target.value)} placeholder="DOC-001" required />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>No. Factura</label>
              <input className="input-field" value={noFactura} onChange={e => setNoFactura(e.target.value)} placeholder="FAC-001" required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Fecha</label>
              <input className="input-field" type="date" value={fechaDocumento} onChange={e => setFechaDocumento(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Monto ($)</label>
              <input className="input-field" type="number" step="0.01" min="0.01" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" required />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Proveedor</label>
            <select className="input-field" value={proveedorId} onChange={e => setProveedorId(e.target.value)} required style={{ cursor: 'pointer' }}>
              <option value="">Seleccionar proveedor...</option>
              {proveedores.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Concepto de Pago</label>
            <select className="input-field" value={conceptoId} onChange={e => setConceptoId(e.target.value)} required style={{ cursor: 'pointer' }}>
              <option value="">Seleccionar concepto...</option>
              {conceptos.map((c: any) => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Estado</label>
            <select className="input-field" value={estado} onChange={e => setEstado(e.target.value as any)} style={{ cursor: 'pointer' }}>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PAGADO">Pagado</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Guardando...' : editItem ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </FormModal>

      <DeleteConfirm open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={submitting} />
    </div>
  );
}
