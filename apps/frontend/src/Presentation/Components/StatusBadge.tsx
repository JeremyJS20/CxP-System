interface StatusBadgeProps {
  estado: string;
}

const statusConfig: Record<string, { className: string; label: string }> = {
  PENDIENTE: { className: 'badge badge-warning', label: 'Pendiente' },
  PAGADO: { className: 'badge badge-primary', label: 'Pagado' },
  CANCELADO: { className: 'badge badge-error', label: 'Cancelado' },
  true: { className: 'badge badge-primary', label: 'Activo' },
  false: { className: 'badge badge-muted', label: 'Inactivo' },
};

export default function StatusBadge({ estado }: StatusBadgeProps) {
  const key = String(estado);
  const config = statusConfig[key] || { className: 'badge badge-muted', label: key };
  return <span className={config.className}>{config.label}</span>;
}
