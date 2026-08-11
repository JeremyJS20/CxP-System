import { Router } from 'express';
import { authController } from '../Controllers/authController';
import { conceptoController } from '../Controllers/conceptoController';
import { proveedorController } from '../Controllers/proveedorController';
import { documentoController } from '../Controllers/documentoController';
import { contabilidadController } from '../Controllers/contabilidadController';
import { authMiddleware } from '../../Infrastructure/Middlewares/authMiddleware';
import { requireRole } from '../../Infrastructure/Middlewares/roleMiddleware';

const router = Router();

// Auth
router.post('/auth/login', authController.login);
router.post('/auth/register', authMiddleware, requireRole('ADMIN'), authController.register);

// Conceptos
router.get('/conceptos', authMiddleware, conceptoController.listConceptos);
router.get('/conceptos/:id', authMiddleware, conceptoController.getConcepto);
router.post('/conceptos', authMiddleware, conceptoController.createConcepto);
router.put('/conceptos/:id', authMiddleware, conceptoController.updateConcepto);
router.delete('/conceptos/:id', authMiddleware, conceptoController.deleteConcepto);

// Proveedores
router.get('/proveedores', authMiddleware, proveedorController.listProveedores);
router.get('/proveedores/:id', authMiddleware, proveedorController.getProveedor);
router.post('/proveedores', authMiddleware, proveedorController.createProveedor);
router.put('/proveedores/:id', authMiddleware, proveedorController.updateProveedor);
router.delete('/proveedores/:id', authMiddleware, proveedorController.deleteProveedor);

// Documentos
router.get('/documentos', authMiddleware, documentoController.listDocumentos);
router.get('/documentos/:id', authMiddleware, documentoController.getDocumento);
router.post('/documentos', authMiddleware, documentoController.createDocumento);
router.put('/documentos/:id', authMiddleware, documentoController.updateDocumento);
router.delete('/documentos/:id', authMiddleware, documentoController.deleteDocumento);
router.post('/documentos/:id/contabilizar', authMiddleware, documentoController.contabilizarDocumento);

// Consultas
router.get('/consultas/balances', authMiddleware, documentoController.getBalances);

// Contabilidad (WS externo)
router.get('/contabilidad/cuentas', authMiddleware, contabilidadController.listCuentas);

export default router;
