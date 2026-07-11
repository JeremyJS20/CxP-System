import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { conceptoClient } from '@/Infrastructure/HttpClient/conceptoClient';
import { CreateConceptoPayload } from '@cxp/common';

export function useConceptos() {
  const { token } = useAuth();
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const res = await conceptoClient.getAll(token);
    if (res.success) {
      setConceptos(res.data);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (data: CreateConceptoPayload) => {
    const res = await conceptoClient.create(data, token);
    if (res.success) {
      await fetchAll();
      return res.data;
    }
    throw new Error(res.error);
  };

  const update = async (id: number, data: Partial<CreateConceptoPayload>) => {
    const res = await conceptoClient.update(id, data, token);
    if (res.success) {
      await fetchAll();
      return res.data;
    }
    throw new Error(res.error);
  };

  const remove = async (id: number) => {
    const res = await conceptoClient.delete(id, token);
    if (res.success) {
      await fetchAll();
      return res.data;
    }
    throw new Error(res.error);
  };

  return { conceptos, loading, error, create, update, remove, refresh: fetchAll };
}
