import { z } from 'zod';
import { isValidCedulaOrRNC } from './validators/cedulaRnc';

export { isValidCedula, isValidRNC, isValidCedulaOrRNC } from './validators/cedulaRnc';

// ─── Auth ───
export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña es requerida'),
});
export type LoginPayload = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(1, 'Nombre es requerido').max(255),
  rol: z.enum(['ADMIN', 'USUARIO']).default('USUARIO'),
});
export type RegisterPayload = z.infer<typeof RegisterSchema>;

// ─── Concepto de Pago ───
export const CreateConceptoSchema = z.object({
  descripcion: z.string().min(1, 'Descripción es requerida').max(255),
  cuentaContable: z.string().min(1, 'Cuenta contable es requerida').max(50),
  estado: z.boolean().default(true),
});
export const UpdateConceptoSchema = CreateConceptoSchema.partial();
export type CreateConceptoPayload = z.infer<typeof CreateConceptoSchema>;

// ─── Proveedor ───
const ProveedorFields = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(255),
  tipoPersona: z.enum(['FISICA', 'JURIDICA'], { message: 'Tipo debe ser FISICA o JURIDICA' }),
  cedulaRnc: z.string().min(9, 'Cédula/RNC inválido').max(15),
  estado: z.boolean().default(true),
});

const validarCedulaRnc = (data: { tipoPersona: 'FISICA' | 'JURIDICA'; cedulaRnc: string }) =>
  isValidCedulaOrRNC(data.cedulaRnc, data.tipoPersona);

export const CreateProveedorSchema = ProveedorFields.refine(validarCedulaRnc, {
  message: 'La cédula/RNC no es válida para el tipo de persona seleccionado',
  path: ['cedulaRnc'],
});
export const UpdateProveedorSchema = ProveedorFields.partial().refine(
  data => (data.tipoPersona && data.cedulaRnc ? validarCedulaRnc(data as any) : true),
  {
    message: 'La cédula/RNC no es válida para el tipo de persona seleccionado',
    path: ['cedulaRnc'],
  }
);
export type CreateProveedorPayload = z.infer<typeof CreateProveedorSchema>;

// ─── Documento por Pagar ───
export const CreateDocumentoSchema = z.object({
  noDocumento: z.string().min(1, 'No. Documento es requerido').max(30),
  noFactura: z.string().min(1, 'No. Factura es requerido').max(30),
  fechaDocumento: z.string().datetime().or(z.string().date()),
  monto: z.number().positive('Monto debe ser mayor a 0'),
  proveedorId: z.number().int().positive('Proveedor es requerido'),
  conceptoId: z.number().int().positive('Concepto es requerido'),
  estado: z.enum(['PENDIENTE', 'PAGADO']).default('PENDIENTE'),
});
export const UpdateDocumentoSchema = CreateDocumentoSchema.partial();
export type CreateDocumentoPayload = z.infer<typeof CreateDocumentoSchema>;

// ─── Paginación y filtros ───
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const DocumentoFilterSchema = z.object({
  proveedorId: z.coerce.number().int().positive().optional(),
  conceptoId: z.coerce.number().int().positive().optional(),
  estado: z.enum(['PENDIENTE', 'PAGADO']).optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
});

// ─── Asiento Contable (Integración con Contabilidad) ───
export const AsientoContableSchema = z.object({
  idAsiento: z.number().int(),
  descripcion: z.string().min(1).max(255),
  idTipoInventario: z.number().int(),
  cuentaContable: z.string().min(1).max(50),
  tipoMovimiento: z.enum(['DB', 'CR']),
  fechaAsiento: z.string().datetime().or(z.string().date()),
  montoAsiento: z.number().positive(),
  estado: z.enum(['REGISTRADO', 'ANULADO']).default('REGISTRADO'),
});
export type AsientoContable = z.infer<typeof AsientoContableSchema>;
