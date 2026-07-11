import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: { userId: number; email: string; rol: string };
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; rol: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }
}
