import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  message?: string;
}

export default function DeleteConfirm({ open, onClose, onConfirm, loading, message }: DeleteConfirmProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: 400 }}>
        <AlertTriangle size={40} style={{ color: 'var(--accent-error)', margin: '0 auto var(--space-md)' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 var(--space-sm)' }}>
          Confirmar eliminación
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 var(--space-lg)' }}>
          {message || '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.'}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
