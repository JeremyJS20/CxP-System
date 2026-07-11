import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { proveedorClient } from '@/Infrastructure/HttpClient/proveedorClient';
import { CreateProveedorPayload } from '@cxp/common';

export function useProveedores() {
  const { token } = useAuth();
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const res = await proveedorClient.getAll(token);
    if (res.success) {
      setProveedores(res.data);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (data: CreateProveedorPayload) => {
    const res = await proveedorClient.create(data, token);
    if (res.success) {
      await fetchAll();
      return res.data;
    }
    throw new Error(res.error);
  };

  const update = async (id: number, data: Partial<CreateProveedorPayload>) => {
    const res = await proveedorClient.update(id, data, token);
    if (res.success) {
      await fetchAll();
      return res.data;
    }
    throw new Error(res.error);
  };

  const remove = async (id: number) => {
    const res = await proveedorClient.delete(id, token);
    if (res.success) {
      await fetchAll();
      return res.data;
    }
    throw new Error(res.error);
  };

  return { proveedores, loading, error, create, update, remove, refresh: fetchAll };
}
