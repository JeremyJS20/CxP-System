import { CreateDocumentoPayload } from '@cxp/common';

function getHeaders(token: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const BASE = '/api/documentos';

export const documentoClient = {
  getAll: (token: string | null, query?: string) =>
    fetch(`${BASE}${query ? `?${query}` : ''}`, { headers: getHeaders(token) }).then(r => r.json()),

  getById: (id: number, token: string | null) =>
    fetch(`${BASE}/${id}`, { headers: getHeaders(token) }).then(r => r.json()),

  create: (data: CreateDocumentoPayload, token: string | null) =>
    fetch(BASE, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    }).then(r => r.json()),

  update: (id: number, data: Partial<CreateDocumentoPayload>, token: string | null) =>
    fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    }).then(r => r.json()),

  delete: (id: number, token: string | null) =>
    fetch(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    }).then(r => r.json()),

  contabilizar: (id: number, token: string | null) =>
    fetch(`${BASE}/${id}/contabilizar`, {
      method: 'POST',
      headers: getHeaders(token),
    }).then(r => r.json()),

  getBalances: (token: string | null, query?: string) =>
    fetch(`/api/consultas/balances${query ? `?${query}` : ''}`, {
      headers: getHeaders(token),
    }).then(r => r.json()),
};
