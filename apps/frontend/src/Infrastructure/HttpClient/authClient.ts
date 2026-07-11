import { LoginPayload, RegisterPayload } from '@cxp/common';

function getHeaders(token: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const BASE = '/api/auth';

export const authClient = {
  login: (data: LoginPayload) =>
    fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  register: (data: RegisterPayload, token: string | null) =>
    fetch(`${BASE}/register`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    }).then(r => r.json()),
};
