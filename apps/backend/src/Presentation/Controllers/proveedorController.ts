import { Response } from 'express';
import { proveedorService } from '../../Application/Services/proveedorService';
import { CreateProveedorSchema, UpdateProveedorSchema } from '@cxp/common';
import { AuthRequest } from '../../Infrastructure/Middlewares/authMiddleware';

export const proveedorController = {
  async listProveedores(_req: AuthRequest, res: Response) {
    try {
      const data = await proveedorService.getAll();
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'Error al listar proveedores' });
    }
  },

  async getProveedor(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data = await proveedorService.getById(id);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  },

  async createProveedor(req: AuthRequest, res: Response) {
    try {
      const parsed = CreateProveedorSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() });
      }
      const data = await proveedorService.create(parsed.data);
      return res.status(201).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'Error al crear proveedor' });
    }
  },

  async updateProveedor(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const parsed = UpdateProveedorSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() });
      }
      const data = await proveedorService.update(id, parsed.data);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  },

  async deleteProveedor(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      await proveedorService.delete(id);
      return res.json({ success: true, data: { message: 'Proveedor desactivado correctamente' } });
    } catch (error: any) {
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  },
};
