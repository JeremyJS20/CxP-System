import { Response } from 'express';
import { conceptoService } from '../../Application/Services/conceptoService';
import { CreateConceptoSchema, UpdateConceptoSchema } from '@cxp/common';
import { AuthRequest } from '../../Infrastructure/Middlewares/authMiddleware';

export const conceptoController = {
  async listConceptos(_req: AuthRequest, res: Response) {
    try {
      const data = await conceptoService.getAll();
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'Error al listar conceptos' });
    }
  },

  async getConcepto(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await conceptoService.getById(id);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  },

  async createConcepto(req: AuthRequest, res: Response) {
    try {
      const parsed = CreateConceptoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() });
      }
      const data = await conceptoService.create(parsed.data);
      return res.status(201).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'Error al crear concepto' });
    }
  },

  async updateConcepto(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const parsed = UpdateConceptoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() });
      }
      const data = await conceptoService.update(id, parsed.data);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  },

  async deleteConcepto(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await conceptoService.delete(id);
      return res.json({ success: true, data: { message: 'Concepto desactivado correctamente' } });
    } catch (error: any) {
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  },
};
