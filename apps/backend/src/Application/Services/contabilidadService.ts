import { prisma } from '../../Infrastructure/db';

const CONTABILIDAD_WS_URL = process.env.CONTABILIDAD_WS_URL || 'https://sistema-contabilidad.onrender.com/api/entradas';
const CONTABILIDAD_CUENTAS_URL =
  process.env.CONTABILIDAD_CUENTAS_URL || 'https://sistema-contabilidad.onrender.com/api/cuentas';
const AUXILIAR_CXP = 4;
const WS_TIMEOUT_MS = 60000;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WS_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

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
      auxiliarId: AUXILIAR_CXP,
      cuentaDebitoId: documento.concepto.cuentaDebitoId,
      cuentaCreditoId: documento.concepto.cuentaCreditoId,
      descripcion: `CxP - ${documento.proveedor.nombre} - Doc #${documento.noDocumento}`,
      monto: Number(documento.monto),
    };

    try {
      const response = await fetchWithTimeout(CONTABILIDAD_WS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asiento),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`WS Contabilidad respondió con error ${response.status}: ${errorBody}`);
      }

      const respuestaContable = await response.json();

      const documentoActualizado = await prisma.documento.update({
        where: { id: documentoId },
        data: {
          estadoContable: 'CONTABILIZADO',
          respuestaContable,
        },
      });

      return {
        message: 'Documento contabilizado exitosamente',
        asiento,
        respuestaContable,
        documento: documentoActualizado,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw {
          status: 504,
          message:
            'El servicio de Contabilidad tardó demasiado en responder (se reactiva después de inactividad). Intente nuevamente en unos segundos.',
        };
      }
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ENOTFOUND')) {
        throw {
          status: 503,
          message: 'El servicio de Contabilidad no está disponible. Intente más tarde.',
        };
      }
      throw { status: 502, message: `Error de integración: ${error.message}` };
    }
  },

  async getCuentas() {
    try {
      const response = await fetchWithTimeout(CONTABILIDAD_CUENTAS_URL, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`WS Contabilidad respondió con error ${response.status}`);
      }

      const cuentas = await response.json();
      return Array.isArray(cuentas) ? cuentas : [];
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw {
          status: 504,
          message: 'El servicio de Contabilidad tardó demasiado en responder. Intente nuevamente en unos segundos.',
        };
      }
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ENOTFOUND')) {
        throw {
          status: 503,
          message: 'El servicio de Contabilidad no está disponible. Intente más tarde.',
        };
      }
      throw { status: 502, message: `Error de integración: ${error.message}` };
    }
  },
};