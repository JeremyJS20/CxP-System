import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { documentoClient } from '@/Infrastructure/HttpClient/documentoClient';
import { CreateDocumentoPayload } from '@cxp/common';

export function useDocumentos() {
  const { token } = useAuth();
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (query?: string) => {
    setLoading(true);
    const res = await documentoClient.getAll(token, query);
    if (res.success) {
      setDocumentos(res.data);
      if (res.meta) setMeta(res.meta);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (data: CreateDocumentoPayload) => {
    const res = await documentoClient.create(data, token);
    if (res.success) {
      await fetchAll();
      return res.data;
    }
    throw new Error(res.error);
  };

  const update = async (id: number, data: Partial<CreateDocumentoPayload>) => {
    const res = await documentoClient.update(id, data, token);
    if (res.success) {
      await fetchAll();
      return res.data;
    }
    throw new Error(res.error);
  };

  const remove = async (id: number) => {
    const res = await documentoClient.delete(id, token);
    if (res.success) {
      await fetchAll();
      return res.data;
    }
    throw new Error(res.error);
  };

  const contabilizar = async (id: number) => {
    const res = await documentoClient.contabilizar(id, token);
    if (res.success) {
      await fetchAll();
      return res.data;
    }
    throw new Error(res.error);
  };

  return { documentos, meta, loading, error, create, update, remove, contabilizar, refresh: fetchAll };
}
