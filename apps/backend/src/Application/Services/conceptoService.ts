import { prisma } from '../../Infrastructure/db';

export const conceptoService = {
  async getAll() {
    return prisma.conceptoPago.findMany({ orderBy: { id: 'asc' } });
  },

  async getById(id: number) {
    const concepto = await prisma.conceptoPago.findUnique({ where: { id } });
    if (!concepto) {
      throw { status: 404, message: 'Concepto no encontrado' };
    }
    return concepto;
  },

  async create(data: { descripcion: string; cuentaDebitoId: number; cuentaCreditoId: number; estado?: boolean }) {
    return prisma.conceptoPago.create({ data });
  },

  async update(
    id: number,
    data: Partial<{ descripcion: string; cuentaDebitoId: number; cuentaCreditoId: number; estado: boolean }>
  ) {
    await this.getById(id);
    return prisma.conceptoPago.update({ where: { id }, data });
  },

  async delete(id: number) {
    await this.getById(id);
    return prisma.conceptoPago.update({
      where: { id },
      data: { estado: false },
    });
  },
};
