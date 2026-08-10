import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('123456', 10);

  // ── Usuario Admin ──
  await prisma.user.upsert({
    where: { email: 'admin@cxp.com' },
    update: {},
    create: {
      email: 'admin@cxp.com',
      password: hashed,
      nombre: 'Admin',
      rol: 'ADMIN',
    },
  });
  console.log('Admin: admin@cxp.com / 123456');

  // ── Conceptos de Pago ──
  const conceptosData = [
    { descripcion: 'Servicios', cuentaContable: '501-01' },
    { descripcion: 'Mercancía', cuentaContable: '101-01' },
    { descripcion: 'Alquiler', cuentaContable: '501-02' },
    { descripcion: 'Servicios Profesionales', cuentaContable: '502-01' },
    { descripcion: 'Materiales y Suministros', cuentaContable: '101-02' },
  ];

  for (const c of conceptosData) {
    const existe = await prisma.conceptoPago.findFirst({ where: { cuentaContable: c.cuentaContable } });
    if (!existe) {
      await prisma.conceptoPago.create({ data: c });
    }
  }
  console.log('5 conceptos creados');

  // ── Proveedores ──
  // Cédulas/RNCs válidos según algoritmo DGII (módulo 10 / módulo 11)
  const proveedoresData = [
    { nombre: 'Ferretería El Rayo SRL', tipoPersona: 'JURIDICA', cedulaRnc: '100000004' },
    { nombre: 'Transporte Fast CxA', tipoPersona: 'JURIDICA', cedulaRnc: '100000012' },
    { nombre: 'Consultora Legal RD', tipoPersona: 'FISICA', cedulaRnc: '01000000008' },
  ];

  for (const p of proveedoresData) {
    let existe = await prisma.proveedor.findFirst({ where: { nombre: p.nombre } });
    if (existe) {
      await prisma.proveedor.update({
        where: { id: existe.id },
        data: { tipoPersona: p.tipoPersona, cedulaRnc: p.cedulaRnc },
      });
    } else {
      await prisma.proveedor.create({ data: p });
    }
  }
  console.log('3 proveedores creados');

  // ── Documentos por Pagar ──
  const conceptos = await prisma.conceptoPago.findMany();
  const proveedores = await prisma.proveedor.findMany();

  const docsData = [
    { doc: 'DOC-001', fac: 'FAC-001', fecha: new Date('2026-06-01'), monto: 25000, prov: 0, conc: 0 },
    { doc: 'DOC-002', fac: 'FAC-002', fecha: new Date('2026-06-05'), monto: 8500, prov: 0, conc: 4 },
    { doc: 'DOC-003', fac: 'FAC-003', fecha: new Date('2026-06-10'), monto: 12000, prov: 1, conc: 1 },
    { doc: 'DOC-004', fac: 'FAC-004', fecha: new Date('2026-06-15'), monto: 32000, prov: 1, conc: 3 },
    { doc: 'DOC-005', fac: 'FAC-005', fecha: new Date('2026-06-20'), monto: 15000, prov: 2, conc: 2 },
    { doc: 'DOC-006', fac: 'FAC-006', fecha: new Date('2026-07-01'), monto: 18000, prov: 2, conc: 3 },
    { doc: 'DOC-007', fac: 'FAC-007', fecha: new Date('2026-07-05'), monto: 9500, prov: 0, conc: 2 },
    { doc: 'DOC-008', fac: 'FAC-008', fecha: new Date('2026-07-10'), monto: 45000, prov: 1, conc: 0 },
    { doc: 'DOC-009', fac: 'FAC-009', fecha: new Date('2026-06-25'), monto: 22000, prov: 0, conc: 1, estado: 'PAGADO' },
    { doc: 'DOC-010', fac: 'FAC-010', fecha: new Date('2026-06-28'), monto: 7500, prov: 2, conc: 4, estado: 'PAGADO' },
  ];

  for (const d of docsData) {
    const existe = await prisma.documento.findUnique({ where: { noDocumento: d.doc } });
    if (!existe) {
      await prisma.documento.create({
        data: {
          noDocumento: d.doc,
          noFactura: d.fac,
          fechaDocumento: d.fecha,
          monto: d.monto,
          estado: (d as any).estado || 'PENDIENTE',
          proveedorId: proveedores[d.prov].id,
          conceptoId: conceptos[d.conc].id,
        },
      });
    }
  }
  console.log('10 documentos creados');

  console.log('✅ Seed completado');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
