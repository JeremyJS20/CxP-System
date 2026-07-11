import { Response } from 'express';
import { authService } from '../../Application/Services/authService';
import { LoginSchema, RegisterSchema } from '@cxp/common';
import { AuthRequest } from '../../Infrastructure/Middlewares/authMiddleware';

export const authController = {
  async login(req: AuthRequest, res: Response) {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() });
      }

      const result = await authService.login(parsed.data.email, parsed.data.password);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  },

  async register(req: AuthRequest, res: Response) {
    try {
      const parsed = RegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() });
      }

      const result = await authService.register(
        parsed.data.email,
        parsed.data.password,
        parsed.data.nombre,
        parsed.data.rol
      );
      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  },
};
