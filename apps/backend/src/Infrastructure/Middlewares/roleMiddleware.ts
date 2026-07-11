import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para esta acción' });
    }
    next();
  };
}
