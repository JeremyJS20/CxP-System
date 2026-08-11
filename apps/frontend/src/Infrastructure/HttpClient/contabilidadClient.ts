function getHeaders(token: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface CuentaContable {
  id: number;
  codigo: string;
  nombre: string;
  permiteTransacciones: boolean;
  estado: string;
}

export const contabilidadClient = {
  getCuentas: (token: string | null) =>
    fetch('/api/contabilidad/cuentas', { headers: getHeaders(token) }).then(r => r.json()),
};