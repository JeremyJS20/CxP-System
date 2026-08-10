import { Response } from 'express';
import { documentoService } from '../../Application/Services/documentoService';
import { CreateDocumentoSchema, UpdateDocumentoSchema, PaginationSchema, DocumentoFilterSchema } from '@cxp/common';
import { contabilidadService } from '../../Application/Services/contabilidadService';
import { AuthRequest } from '../../Infrastructure/Middlewares/authMiddleware';

export const documentoController = {
  async listDocumentos(req: AuthRequest, res: Response) {
    try {
      const paginationParsed = PaginationSchema.safeParse(req.query);
      if (!paginationParsed.success) {
        return res.status(400).json({ success: false, error: 'Parámetros de paginación inválidos' });
      }

      const filtersParsed = DocumentoFilterSchema.safeParse(req.query);
      if (!filtersParsed.success) {
        return res.status(400).json({ success: false, error: 'Filtros inválidos' });
      }

      const result = await documentoService.getAll(filtersParsed.data, paginationParsed.data);
      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'Error al listar documentos' });
    }
  },

  async getDocumento(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data = await documentoService.getById(id);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  },

  async createDocumento(req: AuthRequest, res: Response) {
    try {
      const parsed = CreateDocumentoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() });
      }
      const data = await documentoService.create(parsed.data);
      return res.status(201).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'Error al crear documento' });
    }
  },

  async updateDocumento(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const parsed = UpdateDocumentoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() });
      }
      const data = await documentoService.update(id, parsed.data);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  },

  async deleteDocumento(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      await documentoService.delete(id);
      return res.json({ success: true, data: { message: 'Documento eliminado correctamente' } });
    } catch (error: any) {
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  },

  async getBalances(req: AuthRequest, res: Response) {
    try {
      const filters = DocumentoFilterSchema.safeParse(req.query);
      const result = await documentoService.getBalancesByProveedor({
        proveedorId: filters.success ? filters.data.proveedorId : undefined,
        fechaDesde: filters.success ? filters.data.fechaDesde : undefined,
        fechaHasta: filters.success ? filters.data.fechaHasta : undefined,
      });
      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'Error al consultar balances' });
    }
  },

  async contabilizarDocumento(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await contabilidadService.contabilizarDocumento(id);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  },
};
