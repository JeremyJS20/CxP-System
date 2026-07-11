import { useState, useContext } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useConceptos } from '@/Presentation/Hooks/useConceptos';
import FormModal from '@/Presentation/Components/FormModal';
import DeleteConfirm from '@/Presentation/Components/DeleteConfirm';
import StatusBadge from '@/Presentation/Components/StatusBadge';
import { ToastContext } from '@/Presentation/Context/ToastContext';

export default function ConceptosPage() {
  const { conceptos, loading, create, update, remove, refresh } = useConceptos();
  const { showToast } = useContext(ToastContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [descripcion, setDescripcion] = useState('');
  const [cuentaContable, setCuentaContable] = useState('');
  const [estado, setEstado] = useState(true);

  const openCreate = () => {
    setEditItem(null);
    setDescripcion('');
    setCuentaContable('');
    setEstado(true);
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setDescripcion(item.descripcion);
    setCuentaContable(item.cuentaContable);
    setEstado(item.estado);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editItem) {
        await update(editItem.id, { descripcion, cuentaContable, estado });
        showToast('Concepto actualizado', 'success');
      } else {
        await create({ descripcion, cuentaContable, estado });
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
                <th>Cuenta Contable</th>
                <th>Estado</th>
                <th style={{ width: 100 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {conceptos.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>Sin conceptos registrados</td></tr>
              )}
              {conceptos.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-tertiary)' }}>{c.id}</td>
                  <td>{c.descripcion}</td>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{c.cuentaContable}</code></td>
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
          <div>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Cuenta Contable</label>
            <input className="input-field" value={cuentaContable} onChange={e => setCuentaContable(e.target.value)} placeholder="Ej: 1.01.01.001" required />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={estado} onChange={e => setEstado(e.target.checked)} style={{ accentColor: 'var(--accent-primary)' }} />
              Activo
            </label>
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
