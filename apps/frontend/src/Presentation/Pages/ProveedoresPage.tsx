import { useState, useContext } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { CreateProveedorSchema, UpdateProveedorSchema } from '@cxp/common';
import { useProveedores } from '@/Presentation/Hooks/useProveedores';
import FormModal from '@/Presentation/Components/FormModal';
import DeleteConfirm from '@/Presentation/Components/DeleteConfirm';
import StatusBadge from '@/Presentation/Components/StatusBadge';
import { ToastContext } from '@/Presentation/Context/ToastContext';

export default function ProveedoresPage() {
  const { proveedores, loading, create, update, remove } = useProveedores();
  const { showToast } = useContext(ToastContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cedulaError, setCedulaError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [tipoPersona, setTipoPersona] = useState<'FISICA' | 'JURIDICA'>('FISICA');
  const [cedulaRnc, setCedulaRnc] = useState('');
  const [estado, setEstado] = useState(true);

  const openCreate = () => {
    setEditItem(null);
    setNombre('');
    setTipoPersona('FISICA');
    setCedulaRnc('');
    setEstado(true);
    setCedulaError(null);
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setNombre(item.nombre);
    setTipoPersona(item.tipoPersona);
    setCedulaRnc(item.cedulaRnc);
    setEstado(item.estado);
    setCedulaError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCedulaError(null);

    const payload = { nombre, tipoPersona, cedulaRnc, estado };
    const parsed = (editItem ? UpdateProveedorSchema : CreateProveedorSchema).safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const msg = issue && issue.path.includes('cedulaRnc') ? issue.message : 'Verifique los datos del formulario';
      setCedulaError(msg);
      showToast(msg, 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editItem) {
        await update(editItem.id, payload);
        showToast('Proveedor actualizado', 'success');
      } else {
        await create(payload);
        showToast('Proveedor creado', 'success');
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
      showToast('Proveedor eliminado', 'success');
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
          Proveedores
        </h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nuevo Proveedor
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
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Cédula/RNC</th>
                <th>Estado</th>
                <th style={{ width: 100 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>Sin proveedores registrados</td></tr>
              )}
              {proveedores.map(p => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-tertiary)' }}>{p.id}</td>
                  <td>{p.nombre}</td>
                  <td><span className="badge badge-muted">{p.tipoPersona}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{p.cedulaRnc}</td>
                  <td><StatusBadge estado={p.estado} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="Editar">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(p.id)} title="Eliminar">
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

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Nombre</label>
            <input className="input-field" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre o razón social" required />
          </div>
          <div>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Tipo de Persona</label>
            <select className="input-field" value={tipoPersona} onChange={e => setTipoPersona(e.target.value as any)} style={{ cursor: 'pointer' }}>
              <option value="FISICA">Física</option>
              <option value="JURIDICA">Jurídica</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
              Cédula / RNC {tipoPersona === 'FISICA' ? '(11 dígitos)' : '(9 dígitos)'}
            </label>
            <input
              className="input-field"
              value={cedulaRnc}
              onChange={e => { setCedulaRnc(e.target.value); setCedulaError(null); }}
              placeholder={tipoPersona === 'FISICA' ? '000-0000000-0' : '00000000-0'}
              style={cedulaError ? { borderColor: 'var(--accent-error)' } : undefined}
              required
            />
            {cedulaError && (
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-error)', margin: '4px 0 0' }}>
                {cedulaError}
              </p>
            )}
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
