import { prisma } from '../../Infrastructure/db';

const CONTABILIDAD_WS_URL = process.env.CONTABILIDAD_WS_URL || 'http://localhost:4000/api/asientos';

export const contabilidadService = {
  async contabilizarDocumento(documentoId: number) {
    const documento = await prisma.documento.findUnique({
      where: { id: documentoId },
      include: { proveedor: true, concepto: true },
    });

    if (!documento) {
      throw { status: 404, message: 'Documento no encontrado' };
    }

    if (documento.estadoContable === 'CONTABILIZADO') {
      throw { status: 400, message: 'El documento ya está contabilizado' };
    }

    const asiento = {
      idAsiento: documento.id,
      descripcion: `CxP - ${documento.proveedor.nombre} - Doc #${documento.noDocumento}`,
      idTipoInventario: documento.concepto.id,
      cuentaContable: documento.concepto.cuentaContable,
      tipoMovimiento: 'CR' as const,
      fechaAsiento: new Date().toISOString(),
      montoAsiento: Number(documento.monto),
      estado: 'REGISTRADO' as const,
    };

    try {
      const response = await fetch(CONTABILIDAD_WS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asiento),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`WS Contabilidad respondió con error ${response.status}: ${errorBody}`);
      }

      const documentoActualizado = await prisma.documento.update({
        where: { id: documentoId },
        data: { estadoContable: 'CONTABILIZADO' },
      });

      return {
        message: 'Documento contabilizado exitosamente',
        asiento,
        documento: documentoActualizado,
      };
    } catch (error: any) {
      if (error.message?.includes('ECONNREFUSED')) {
        throw {
          status: 503,
          message: 'El servicio de Contabilidad no está disponible. Intente más tarde.',
        };
      }
      throw { status: 502, message: `Error de integración: ${error.message}` };
    }
  },
};
