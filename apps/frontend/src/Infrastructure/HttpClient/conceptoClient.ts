import { CreateConceptoPayload } from '@cxp/common';

function getHeaders(token: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const BASE = '/api/conceptos';

export const conceptoClient = {
  getAll: (token: string | null) =>
    fetch(BASE, { headers: getHeaders(token) }).then(r => r.json()),

  getById: (id: number, token: string | null) =>
    fetch(`${BASE}/${id}`, { headers: getHeaders(token) }).then(r => r.json()),

  create: (data: CreateConceptoPayload, token: string | null) =>
    fetch(BASE, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    }).then(r => r.json()),

  update: (id: number, data: Partial<CreateConceptoPayload>, token: string | null) =>
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
};
