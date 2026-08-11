import { Response } from 'express';
import { contabilidadService } from '../../Application/Services/contabilidadService';
import { AuthRequest } from '../../Infrastructure/Middlewares/authMiddleware';

export const contabilidadController = {
  async listCuentas(_req: AuthRequest, res: Response) {
    try {
      const cuentas = await contabilidadService.getCuentas();
      return res.json({ success: true, data: cuentas });
    } catch (error: any) {
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  },
};