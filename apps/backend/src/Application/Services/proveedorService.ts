import { prisma } from '../../Infrastructure/db';

export const proveedorService = {
  async getAll() {
    const proveedores = await prisma.proveedor.findMany({ orderBy: { id: 'asc' } });

    const result = await Promise.all(
      proveedores.map(async (p) => {
        const balance = await this.calcularBalance(p.id);
        return { ...p, balance };
      })
    );

    return result;
  },

  async getById(id: number) {
    const proveedor = await prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) {
      throw { status: 404, message: 'Proveedor no encontrado' };
    }
    const balance = await this.calcularBalance(id);
    return { ...proveedor, balance };
  },

  async create(data: { nombre: string; tipoPersona: string; cedulaRnc: string; estado?: boolean }) {
    return prisma.proveedor.create({ data });
  },

  async update(id: number, data: Partial<{ nombre: string; tipoPersona: string; cedulaRnc: string; estado: boolean }>) {
    await this.getById(id);
    return prisma.proveedor.update({ where: { id }, data });
  },

  async delete(id: number) {
    const proveedor = await this.getById(id);
    if (proveedor.balance > 0) {
      throw { status: 400, message: 'No se puede desactivar un proveedor con documentos pendientes' };
    }
    return prisma.proveedor.update({
      where: { id },
      data: { estado: false },
    });
  },

  async calcularBalance(proveedorId: number) {
    const result = await prisma.documento.aggregate({
      where: { proveedorId, estado: 'PENDIENTE' },
      _sum: { monto: true },
    });
    return Number(result._sum.monto || 0);
  },
};
