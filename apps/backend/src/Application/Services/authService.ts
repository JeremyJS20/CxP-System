import { prisma } from '../../Infrastructure/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw { status: 401, message: 'Credenciales inválidas' };
    }

    if (!user.estado) {
      throw { status: 401, message: 'Usuario inactivo' };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw { status: 401, message: 'Credenciales inválidas' };
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
    };
  },

  async register(email: string, password: string, nombre: string, rol: string = 'USUARIO') {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw { status: 400, message: 'El email ya está registrado' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        rol,
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
    };
  },
};
