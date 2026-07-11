import { prisma } from '../../Infrastructure/db';
import { Prisma } from '@prisma/client';

interface DocumentoFilters {
  proveedorId?: number;
  conceptoId?: number;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

interface Pagination {
  page: number;
  pageSize: number;
}

export const documentoService = {
  async getAll(filters: DocumentoFilters, pagination: Pagination) {
    const where: Prisma.DocumentoWhereInput = {};

    if (filters.proveedorId) where.proveedorId = filters.proveedorId;
    if (filters.conceptoId) where.conceptoId = filters.conceptoId;
    if (filters.estado) where.estado = filters.estado;
    if (filters.fechaDesde || filters.fechaHasta) {
      where.fechaDocumento = {};
      if (filters.fechaDesde) where.fechaDocumento.gte = new Date(filters.fechaDesde);
      if (filters.fechaHasta) where.fechaDocumento.lte = new Date(filters.fechaHasta);
    }

    const total = await prisma.documento.count({ where });

    const documentos = await prisma.documento.findMany({
      where,
      include: { proveedor: true, concepto: true },
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });

    return {
      data: documentos,
      meta: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
      },
    };
  },

  async getById(id: number) {
    const documento = await prisma.documento.findUnique({
      where: { id },
      include: { proveedor: true, concepto: true },
    });
    if (!documento) {
      throw { status: 404, message: 'Documento no encontrado' };
    }
    return documento;
  },

  async create(data: {
    noDocumento: string;
    noFactura: string;
    fechaDocumento: string;
    monto: number;
    proveedorId: number;
    conceptoId: number;
    estado?: string;
  }) {
    return prisma.documento.create({
      data: {
        noDocumento: data.noDocumento,
        noFactura: data.noFactura,
        fechaDocumento: new Date(data.fechaDocumento),
        monto: data.monto,
        proveedorId: data.proveedorId,
        conceptoId: data.conceptoId,
        estado: data.estado || 'PENDIENTE',
      },
      include: { proveedor: true, concepto: true },
    });
  },

  async update(
    id: number,
    data: Partial<{
      noDocumento: string;
      noFactura: string;
      fechaDocumento: string;
      monto: number;
      proveedorId: number;
      conceptoId: number;
      estado: string;
    }>
  ) {
    await this.getById(id);

    const updateData: any = { ...data };
    if (data.fechaDocumento) {
      updateData.fechaDocumento = new Date(data.fechaDocumento);
    }

    return prisma.documento.update({
      where: { id },
      data: updateData,
      include: { proveedor: true, concepto: true },
    });
  },

  async delete(id: number) {
    await this.getById(id);
    return prisma.documento.delete({ where: { id } });
  },

  async getBalancesByProveedor(filters: { proveedorId?: number; fechaDesde?: string; fechaHasta?: string }) {
    const where: Prisma.DocumentoWhereInput = { estado: 'PENDIENTE' };

    if (filters.proveedorId) where.proveedorId = filters.proveedorId;
    if (filters.fechaDesde || filters.fechaHasta) {
      where.fechaDocumento = {};
      if (filters.fechaDesde) where.fechaDocumento.gte = new Date(filters.fechaDesde);
      if (filters.fechaHasta) where.fechaDocumento.lte = new Date(filters.fechaHasta);
    }

    const documentos = await prisma.documento.findMany({
      where,
      include: { proveedor: true },
    });

    const grouped = new Map<number, { proveedor: any; docsPendientes: number; balance: number }>();

    for (const doc of documentos) {
      const key = doc.proveedorId;
      const existing = grouped.get(key) || {
        proveedor: doc.proveedor,
        docsPendientes: 0,
        balance: 0,
      };
      existing.docsPendientes += 1;
      existing.balance += Number(doc.monto);
      grouped.set(key, existing);
    }

    const data = Array.from(grouped.values());
    const totalBalance = data.reduce((sum, item) => sum + item.balance, 0);
    const totalDocs = data.reduce((sum, item) => sum + item.docsPendientes, 0);

    return {
      data,
      total: {
        docsPendientes: totalDocs,
        balance: totalBalance,
      },
    };
  },
};
