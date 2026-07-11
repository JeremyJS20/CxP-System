# 🏗️ Sistema CxP — Guía de Implementación Paso a Paso

## Contexto
Proyecto Final de Integraciones I — Sistema de **Cuentas por Pagar (CxP)** con interfaz a Contabilidad.
Este primer entregable cubre los **3 CRUDs principales** + Dashboard + Consulta por criterios.

---

## Decisiones de Diseño (Preguntas Resueltas)

| Pregunta | Decisión | Justificación |
|----------|----------|---------------|
| ¿Despliegue? | **Vercel** (frontend + backend serverless) | Según tu guía de arquitectura, gratis, rápido |
| ¿Autenticación? | **Sí (JWT)** | Se implementará un login simple con JWT y rutas protegidas. |
| ¿Balance del Proveedor? | **Calculado automáticamente** | Suma de documentos PENDIENTES = balance. Se recalcula al crear/editar/eliminar documentos |
| ¿Conceptos de Pago? | **Categorías** (Servicios, Mercancía, Alquiler, etc.) | Catálogo simple para clasificar los pagos |
| ¿Base de datos? | **Supabase** (PostgreSQL en la nube) | Open source, gratis, ya tienes el MCP configurado |

---

## Stack Tecnológico Final

```
Frontend:  React 19 + Vite + TypeScript + HeroUI + TailwindCSS 4 + React Router 7
Backend:   Node.js + Express 4 + TypeScript + Prisma ORM
BD:        PostgreSQL (Supabase)
Shared:    Zod schemas (monorepo workspace)
Deploy:    Vercel
Diseño:    SaaS High-Density B2B (dark/light mode, glassmorphism, navy/cyan palette)
```

---

# FASE 0 — Setup del Entorno

## Paso 0.1 — Configurar Reglas de Proyecto para OpenCode

> [!IMPORTANT]
> Este es el primer paso porque establece la configuración que guía al agente IA en todo lo que sigue. Sin esto, el agente no conoce la arquitectura, los patrones de código, ni el design system.

### ¿Cómo funciona OpenCode?

OpenCode usa dos archivos clave:

| Archivo | Qué hace | Se inyecta al context window? |
|---------|----------|-------------------------------|
| **`AGENTS.md`** | Reglas del proyecto. Se lee automáticamente al iniciar cada sesión. | ✅ Sí — se inyecta en cada iteración del modelo |
| **`opencode.jsonc`** | Configuración técnica (modelo, permisos, archivos de instrucciones adicionales). | ✅ Los archivos en `instructions` también se inyectan |

### El problema de los límites

Los archivos de instrucciones se inyectan en el **system prompt** del modelo en cada iteración. Si son muy grandes, consumen el context window y el agente entra en loops de compactación:

| Guía de `utils_md` | Tamaño | ¿Inyectar? |
|---------------------|--------|------------|
| Monorepo Architecture | 76 KB | ❌ Demasiado grande |
| Node Express Architecture | 47 KB | ❌ Demasiado grande |
| React Vite Architecture | 34 KB | ❌ Demasiado grande |
| SaaS Design System | 60 KB | ❌ Demasiado grande |
| 23 archivos de `rules/` | ~230 KB | ❌ Demasiado grande |
| **TOTAL** | **~447 KB** | ❌ **Destruiría el 80%+ del context window** |

### La estrategia correcta: AGENTS.md como Router + docs/ on-demand

```
┌─────────────────────────────────┐
│     AGENTS.md (~150 líneas)     │  ← Se inyecta al context (pequeño)
│  • Reglas del proyecto          │
│  • Convenciones de código       │
│  • MAPA DE REFERENCIA:          │
│    "Para X, lee docs/Y.md"      │
└──────────────┬──────────────────┘
               │ agent usa `read` tool
               ▼
┌─────────────────────────────────┐
│     docs/ (~447 KB total)       │  ← NO se inyecta, se lee on-demand
│  • architecture/                │
│  • design/                      │
│  • rules/                       │
└─────────────────────────────────┘
```

### 0.1.1 — Copiar las guías dentro del proyecto

Todo debe vivir dentro de `CxP-System/docs/`. Ejecutar desde la raíz del proyecto:

```bash
# Crear estructura docs/
mkdir -p docs/architecture/monorepo-rules
mkdir -p docs/architecture/backend-rules
mkdir -p docs/architecture/frontend-rules
mkdir -p docs/design/rules

# Copiar guías principales
copy ..\..\utils_md\react_vite_node_express_vercel_monorepo_architecture\REACT_VITE_NODE_EXPRESS_VERCEL_GENERAL_ARCHITECTURE.md docs\architecture\MONOREPO_ARCHITECTURE.md
copy ..\..\utils_md\node_express_ts_architecture\NODE_EXPRESS_TS_ARCHITECTURE.md docs\architecture\BACKEND_ARCHITECTURE.md
copy ..\..\utils_md\react_vite_ts_architecture\REACT_VITE_TS_ARCHITECTURE.md docs\architecture\FRONTEND_ARCHITECTURE.md
copy ..\..\utils_md\general_design\saas\SAAS_GENERAL_DESIGN.md docs\design\SAAS_DESIGN.md

# Copiar reglas detalladas
copy ..\..\utils_md\react_vite_node_express_vercel_monorepo_architecture\rules\*.md docs\architecture\monorepo-rules\
copy ..\..\utils_md\node_express_ts_architecture\rules\*.md docs\architecture\backend-rules\
copy ..\..\utils_md\react_vite_ts_architecture\rules\*.md docs\architecture\frontend-rules\
copy ..\..\utils_md\general_design\saas\rules\*.md docs\design\rules\
```

Estructura resultante dentro del proyecto:

```text
CxP-System/
├── docs/
│   ├── architecture/
│   │   ├── MONOREPO_ARCHITECTURE.md          # 76 KB — Guía completa monorepo
│   │   ├── BACKEND_ARCHITECTURE.md           # 47 KB — Guía completa backend
│   │   ├── FRONTEND_ARCHITECTURE.md          # 34 KB — Guía completa frontend
│   │   ├── monorepo-rules/                   # 8 archivos detallados (~80 KB)
│   │   │   ├── architecture-part01-philosophy-to-configuration-files.md
│   │   │   ├── architecture-part02-database-layer-prisma-orm-to-domain-layer-shared.md
│   │   │   ├── architecture-part03-server-utilities-to-react-frontend.md
│   │   │   ├── architecture-part04-database-conventions-prisma-to-structured-logging.md
│   │   │   ├── architecture-part05-express-security-hardening-to-email-notification-service.md
│   │   │   ├── architecture-part06-react-error-boundary-to-react-performance.md
│   │   │   ├── architecture-part07-accessibility-a11y-to-dependency-audit-maintenance.md
│   │   │   └── architecture-part08-internationalization-i18n-to-quick-start.md
│   │   ├── backend-rules/                    # 5 archivos detallados (~48 KB)
│   │   │   ├── architecture-part01-philosophy-to-1-controller-example.md
│   │   │   ├── architecture-part02-express-dev-server-to-logger.md
│   │   │   ├── architecture-part03-database-conventions-prisma-to-secure-express-configuration.md
│   │   │   ├── architecture-part04-asynchandler-apperror-together-to-setup.md
│   │   │   └── architecture-part05-unit-test-repository-to-quick-start.md
│   │   └── frontend-rules/                   # 4 archivos detallados (~34 KB)
│   │       ├── react-architecture-part01-philosophy-to-app-with-lazy-routes.md
│   │       ├── react-architecture-part02-data-fetching-hooks-to-react-performance.md
│   │       ├── react-architecture-part03-preloading-critical-routes-to-file-structure.md
│   │       └── react-architecture-part04-configuration-to-i18n-conventions.md
│   └── design/
│       ├── SAAS_DESIGN.md                    # 60 KB — Design system completo
│       └── rules/                            # 6 archivos detallados (~60 KB)
│           ├── design-part01-visual-theme-atmosphere-to-inputs-forms.md
│           ├── design-part02-status-icons-to-tooltips.md
│           ├── design-part03-alerts-banners-to-contrast-ratios.md
│           ├── design-part04-focus-indicators-to-loading-states.md
│           ├── design-part05-full-page-loading-to-2-the-theme-block.md
│           └── design-part06-3-resulting-utility-classes-to-6-file-organization.md
```

### 0.1.2 — Crear `AGENTS.md` (Router conciso ~150 líneas)

#### [NEW] `CxP-System/AGENTS.md`

```markdown
# CxP System — Agent Rules

## Project Overview
Sistema de Cuentas por Pagar (CxP) con interfaz a Contabilidad.
Monorepo TypeScript: React frontend + Express backend + shared Zod schemas.

## Tech Stack
- Frontend: React 19 + Vite + TypeScript + HeroUI + TailwindCSS 4 + React Router 7
- Backend: Node.js + Express 4 + TypeScript + Prisma ORM
- Database: PostgreSQL (Supabase)
- Shared: Zod schemas in `packages/common`
- Deploy: Vercel

## Architecture Pattern
Clean Architecture: Domain → Application/Services → Infrastructure → Presentation.
Inner layers NEVER depend on outer layers.

## Project Structure
- `apps/backend/` — Express API
  - `src/Application/Services/` — Business logic (one service per entity)
  - `src/Domain/` — Backend types
  - `src/Infrastructure/` — Prisma client, error handler
  - `src/Presentation/Controllers/` — HTTP handlers
  - `src/Presentation/Routes/` — Route definitions
- `apps/frontend/` — React SPA
  - `src/Domain/` — Frontend types
  - `src/Infrastructure/HttpClient/` — Fetch wrappers per entity (including Auth)
  - `src/Presentation/Components/` — Reusable components
  - `src/Presentation/Pages/` — Page components (one per route, including Login)
  - `src/Presentation/Context/` — Theme, Toast, Auth contexts
  - `src/Presentation/Hooks/` — CRUD hooks per entity
- `packages/common/` — Shared Zod schemas and types

## Key Commands
- `npm run dev` — Start frontend + backend concurrently
- `npm run dev:backend` — Express on port 3001
- `npm run dev:frontend` — Vite on port 5173
- `npx prisma migrate dev` — Run migrations (from apps/backend/)
- `npx prisma generate` — Regenerate Prisma client
- `npx prisma studio` — Database GUI

## Coding Standards
- TypeScript strict mode everywhere
- Zod validation in `packages/common`, shared by frontend and backend
- API response format: `{ success: boolean, data?: T, error?: string, meta?: { page, pageSize, total } }`
- Database access ONLY through Prisma ORM, never raw SQL
- Functional React components with hooks only, no class components
- TailwindCSS 4 utility classes + CSS custom properties for theming

## Constraints
- Do NOT add new libraries without asking
- Do NOT use raw SQL — use Prisma client
- Do NOT create class components
- Do NOT put business logic in controllers — delegate to services
- Do NOT hardcode API URLs — use Vite proxy in dev, relative paths in prod
- Keep shared types in `packages/common`, never duplicate

## Reference Documentation (read on-demand with `read` tool)
When you need detailed patterns or examples, read these files:

### Architecture
- **Monorepo full guide** (structure, config, deploy): `docs/architecture/MONOREPO_ARCHITECTURE.md`
- **Backend full guide** (Express, services, controllers): `docs/architecture/BACKEND_ARCHITECTURE.md`
- **Frontend full guide** (React, Vite, routing, hooks): `docs/architecture/FRONTEND_ARCHITECTURE.md`

### Architecture — Detailed Rules (read the specific part you need)
- Philosophy, config files: `docs/architecture/monorepo-rules/architecture-part01-*.md`
- Prisma ORM, database layer: `docs/architecture/monorepo-rules/architecture-part02-*.md`
  or `docs/architecture/backend-rules/architecture-part03-*.md`
- Server utilities, Express setup: `docs/architecture/monorepo-rules/architecture-part03-*.md`
  or `docs/architecture/backend-rules/architecture-part02-*.md`
- DB conventions, logging: `docs/architecture/monorepo-rules/architecture-part04-*.md`
- Security hardening: `docs/architecture/monorepo-rules/architecture-part05-*.md`
- React performance: `docs/architecture/monorepo-rules/architecture-part06-*.md`
  or `docs/architecture/frontend-rules/react-architecture-part02-*.md`
- Accessibility (a11y): `docs/architecture/monorepo-rules/architecture-part07-*.md`
- i18n: `docs/architecture/monorepo-rules/architecture-part08-*.md`
- Error handling (AsyncHandler, AppError): `docs/architecture/backend-rules/architecture-part04-*.md`
- Testing: `docs/architecture/backend-rules/architecture-part05-*.md`
- Lazy routes, preloading: `docs/architecture/frontend-rules/react-architecture-part01-*.md`
  and `docs/architecture/frontend-rules/react-architecture-part03-*.md`
- Frontend config: `docs/architecture/frontend-rules/react-architecture-part04-*.md`

### Design System
- **Full design system** (colors, typography, all components): `docs/design/SAAS_DESIGN.md`

### Design — Detailed Rules (read the specific part you need)
- Theme, colors, surfaces, inputs: `docs/design/rules/design-part01-*.md`
- Status icons, tables, tabs, tooltips: `docs/design/rules/design-part02-*.md`
- Alerts, banners, contrast ratios: `docs/design/rules/design-part03-*.md`
- Focus indicators, loading states: `docs/design/rules/design-part04-*.md`
- Full-page loading, theme block: `docs/design/rules/design-part05-*.md`
- Tailwind utility classes, file organization: `docs/design/rules/design-part06-*.md`
```

> [!TIP]
> El `AGENTS.md` tiene ~120 líneas. Es lo suficientemente conciso para NO saturar el context window, pero le da al agente un **mapa completo** de dónde encontrar cada cosa. Cuando el agente necesite, por ejemplo, el patrón exacto de un Controller, irá a leer `docs/architecture/BACKEND_ARCHITECTURE.md` con el `read` tool.

### 0.1.3 — Crear `opencode.jsonc` (configuración mínima)

#### [NEW] `CxP-System/opencode.jsonc`

```jsonc
{
  "$schema": "https://opencode.ai/config.json",

  // NO incluimos archivos grandes en "instructions" para no saturar el context.
  // El AGENTS.md ya actúa como router y se lee automáticamente.
  // Las guías completas viven en docs/ y el agente las lee on-demand.

  "permission": {
    "edit": "auto",
    "bash": "ask"
  }
}
```

> [!NOTE]
> **¿Por qué `instructions` está vacío?** Porque todo archivo listado en `instructions` se inyecta al system prompt en cada iteración. Con 447 KB de guías, eso destruiría el context window. En su lugar, el `AGENTS.md` le dice al agente *exactamente* qué archivo leer y cuándo, usando el `read` tool bajo demanda.

### 0.1.4 — Verificación Paso 0.1

- [ ] `AGENTS.md` existe en la raíz del proyecto (~120 líneas, <10 KB)
- [ ] `opencode.jsonc` existe en la raíz del proyecto
- [ ] `docs/architecture/` contiene 3 guías principales + 3 carpetas de rules
- [ ] `docs/design/` contiene 1 guía principal + 1 carpeta de rules
- [ ] Ningún archivo referencia rutas externas al proyecto (todo es local)
- [ ] Al abrir con OpenCode, el agente puede leer el AGENTS.md y encuentra las rutas de docs/

---

## Paso 0.2 — Crear proyecto Supabase
1. Crear un nuevo proyecto en Supabase (o usar el MCP tool `create_project`)
2. Guardar las credenciales:
   - `DATABASE_URL` (Connection string → PostgreSQL → URI con pooler)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## Paso 0.3 — Scaffolding e Inicializar el monorepo

**Comandos a ejecutar (en orden):**

```bash
# 1. Crear carpeta raíz e inicializar
mkdir CxP-System && cd CxP-System
npm init -y

# 2. Configurar workspaces en package.json raíz
# (se editará manualmente)

# 3. Crear estructura de carpetas
mkdir -p apps/backend/prisma apps/backend/src/{Application/Services,Domain,Infrastructure/{Middlewares},Presentation/{Controllers,Routes}}
mkdir -p apps/frontend/public apps/frontend/src/{Domain,Infrastructure/HttpClient,Presentation/{Components/{Layout,Shared,Dashboard},Pages,Context,Hooks},Validation}
mkdir -p packages/common/src
mkdir -p api
```

## Paso 0.4 — Instalar dependencias

**Root `package.json`:**
```json
{
  "name": "cxp-system",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "npm run dev -w apps/backend",
    "dev:frontend": "npm run dev -w apps/frontend",
    "build": "npm run build -w apps/frontend",
    "db:migrate": "npm run db:migrate -w apps/backend",
    "db:generate": "npm run db:generate -w apps/backend"
  },
  "devDependencies": {
    "concurrently": "^9.0.0",
    "typescript": "^5.7.0"
  }
}
```

**Backend `apps/backend/package.json` — dependencias:**
```
express, cors, helmet, dotenv, zod, @prisma/client, bcrypt, jsonwebtoken
```
```
devDeps: prisma, tsx, @types/express, @types/cors, @types/bcrypt, @types/jsonwebtoken, typescript
```

**Frontend `apps/frontend/package.json` — dependencias:**
```
react, react-dom, react-router-dom, @heroui/react, lucide-react, zod
```
```
devDeps: vite, @vitejs/plugin-react, @tailwindcss/vite, tailwindcss, typescript, @types/react, @types/react-dom
```

**Common `packages/common/package.json` — dependencias:**
```
zod
```

---

# FASE 1 — Base de Datos (Prisma Schema + Migración)

## Paso 1.1 — Definir schema Prisma

#### [NEW] `apps/backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Usuarios (Auth) ───
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique @db.VarChar(255)
  password  String   @db.VarChar(255)
  nombre    String   @db.VarChar(255)
  estado    Boolean  @default(true)
  createdAt DateTime @default(now())

  @@map("users")
}

// ─── Catálogo de Conceptos de Pago ───
model ConceptoPago {
  id             Int         @id @default(autoincrement())
  descripcion    String      @db.VarChar(255)
  cuentaContable String      @db.VarChar(50)   // Para la integración con Contabilidad
  estado         Boolean     @default(true)    // true = Activo, false = Inactivo
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  documentos     Documento[]

  @@map("conceptos_pago")
}

// ─── Maestro de Proveedores ───
model Proveedor {
  id          Int         @id @default(autoincrement())
  nombre      String      @db.VarChar(255)
  tipoPersona String      @db.VarChar(10)    // "FISICA" | "JURIDICA"
  cedulaRnc   String      @unique @db.VarChar(15)
  estado      Boolean     @default(true)     // true = Activo, false = Inactivo
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  documentos  Documento[]

  @@map("proveedores")
}

// ─── Documentos por Pagar ───
model Documento {
  id              Int           @id @default(autoincrement())
  noDocumento     String        @unique @db.VarChar(30)
  noFactura       String        @db.VarChar(30)
  fechaDocumento  DateTime
  monto           Decimal       @db.Decimal(18, 2)
  fechaRegistro   DateTime      @default(now())
  estado          String        @default("PENDIENTE") @db.VarChar(20) // "PENDIENTE" | "PAGADO"
  estadoContable  String        @default("PENDIENTE") @db.VarChar(20) // "PENDIENTE" | "CONTABILIZADO"
  proveedorId     Int
  conceptoId      Int
  proveedor       Proveedor     @relation(fields: [proveedorId], references: [id])
  concepto        ConceptoPago  @relation(fields: [conceptoId], references: [id])
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@map("documentos")
}
```

> [!NOTE]
> El campo `balance` del Proveedor **NO se almacena en la tabla**. Se calcula dinámicamente como la suma de `monto` de sus documentos con `estado = 'PENDIENTE'`. Esto evita inconsistencias por datos duplicados.

## Paso 1.2 — Configurar conexión a Supabase

#### [NEW] `.env`
```bash
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
JWT_SECRET=una-clave-secreta-de-al-menos-32-caracteres-aqui
CONTABILIDAD_WS_URL=http://localhost:4000/api/asientos
```

> [!NOTE]
> `CONTABILIDAD_WS_URL` es la URL del Web Service del equipo de Contabilidad. Durante desarrollo se usa un mock local o la URL del equipo compañero. En producción se reemplaza con la URL real del sistema de Contabilidad desplegado.

## Paso 1.3 — Ejecutar migración

```bash
cd apps/backend
npx prisma migrate dev --name init_cxp_tables
npx prisma generate
```

## Paso 1.4 — Verificación Fase 1
- [ ] Las 4 tablas existen en Supabase: `users`, `conceptos_pago`, `proveedores`, `documentos`
- [ ] `npx prisma studio` abre el visor de datos sin errores
- [ ] Las relaciones FK están correctas (documento → proveedor, documento → concepto)

---

# FASE 2 — Backend API (Express + Services + Controllers)

## Paso 2.1 — Prisma Client Singleton

#### [NEW] `apps/backend/src/Infrastructure/db.ts`

```typescript
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
```

## Paso 2.2 — Shared Zod Schemas (packages/common)

#### [NEW] `packages/common/src/index.ts`

Definir los schemas compartidos entre frontend y backend:

```typescript
import { z } from 'zod';

// ─── Auth ───
export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña es requerida'),
});
export type LoginPayload = z.infer<typeof LoginSchema>;

// ─── Concepto de Pago ───
export const CreateConceptoSchema = z.object({
  descripcion: z.string().min(1, 'Descripción es requerida').max(255),
  cuentaContable: z.string().min(1, 'Cuenta contable es requerida').max(50),
  estado: z.boolean().default(true),
});
export const UpdateConceptoSchema = CreateConceptoSchema.partial();
export type CreateConceptoPayload = z.infer<typeof CreateConceptoSchema>;

// ─── Proveedor ───
export const CreateProveedorSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(255),
  tipoPersona: z.enum(['FISICA', 'JURIDICA'], { message: 'Tipo debe ser FISICA o JURIDICA' }),
  cedulaRnc: z.string().min(9, 'Cédula/RNC inválido').max(15),
  estado: z.boolean().default(true),
});
export const UpdateProveedorSchema = CreateProveedorSchema.partial();
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
// Estos son los 8 campos exactos que pide el PPT (Slide 6)
export const AsientoContableSchema = z.object({
  idAsiento: z.number().int(),                                    // Identificador Asiento
  descripcion: z.string().min(1).max(255),                        // Descripción del asiento
  idTipoInventario: z.number().int(),                             // Identificador del Tipo de Inventario
  cuentaContable: z.string().min(1).max(50),                      // Cuenta Contable (viene del ConceptoPago)
  tipoMovimiento: z.enum(['DB', 'CR']),                           // Tipo de Movimiento: Débito o Crédito
  fechaAsiento: z.string().datetime().or(z.string().date()),      // Fecha del Asiento
  montoAsiento: z.number().positive(),                            // Monto (viene del Documento)
  estado: z.enum(['REGISTRADO', 'ANULADO']).default('REGISTRADO'),// Estado del asiento
});
export type AsientoContable = z.infer<typeof AsientoContableSchema>;
```

## Paso 2.3 — Services (Lógica de Negocio e Integración)

Crear un service por cada entidad.

#### [NEW] `apps/backend/src/Infrastructure/Middlewares/authMiddleware.ts`

Middleware Express que:
1. Extrae el token JWT del header `Authorization: Bearer <token>`
2. Verifica el token con `jsonwebtoken.verify(token, JWT_SECRET)`
3. Si es válido, adjunta el usuario decodificado a `req.user` y llama `next()`
4. Si es inválido o falta, retorna `401 { success: false, error: 'No autorizado' }`

#### [NEW] `apps/backend/src/Application/Services/authService.ts`

| Método | Descripción |
|--------|-------------|
| `login(email, password)` | Busca usuario por email, compara password con `bcrypt.compare()`, genera token JWT con `jsonwebtoken.sign({ userId, email }, JWT_SECRET, { expiresIn: '8h' })` |

#### [NEW] `apps/backend/src/Application/Services/contabilidadService.ts`

Implementa la **integración con el Web Service de Contabilidad** (el requerimiento central de la materia).

**Método `contabilizarDocumento(documentoId: number)`:**

1. Busca el documento con su relación a Proveedor y ConceptoPago
2. Valida que `estadoContable !== 'CONTABILIZADO'` (evita duplicados)
3. Construye el payload del Asiento Contable con los **8 campos del PPT (Slide 6)**:

```typescript
const asiento: AsientoContable = {
  idAsiento: documento.id,                        // Identificador Asiento
  descripcion: `CxP - ${proveedor.nombre} - Doc #${documento.noDocumento}`,  // Descripción
  idTipoInventario: concepto.id,                  // ID Tipo de Inventario (usa concepto como proxy)
  cuentaContable: concepto.cuentaContable,        // Cuenta Contable (del concepto)
  tipoMovimiento: 'CR',                           // Crédito (CxP siempre es CR para Contabilidad)
  fechaAsiento: new Date().toISOString(),          // Fecha del asiento
  montoAsiento: Number(documento.monto),           // Monto
  estado: 'REGISTRADO',                           // Estado
};
```

4. Hace `POST` a `env.CONTABILIDAD_WS_URL` con el payload
5. Si el WS responde OK → actualiza `documento.estadoContable = 'CONTABILIZADO'`
6. Si el WS falla → retorna error con el detalle (timeout, connection refused, etc.)
7. Registra el resultado en un log para auditoría

> [!IMPORTANT]
> **¿Qué pasa si el WS de Contabilidad no existe aún?** Durante desarrollo, el service debe manejar graciosamente los errores de conexión (`ECONNREFUSED`). Se puede crear un mock server simple en `scripts/mock-contabilidad.ts` que acepte POSTs y responda `{ success: true }` para pruebas.

#### [NEW] `apps/backend/src/Application/Services/conceptoService.ts`

| Método | Descripción |
|--------|-------------|
| `getAll()` | Lista todos los conceptos |
| `getById(id)` | Obtiene uno por ID |
| `create(data)` | Crea un concepto |
| `update(id, data)` | Actualiza un concepto |
| `delete(id)` | Soft delete (estado = false) |

#### [NEW] `apps/backend/src/Application/Services/proveedorService.ts`

| Método | Descripción |
|--------|-------------|
| `getAll()` | Lista todos con balance calculado (aggregation de documentos PENDIENTES) |
| `getById(id)` | Obtiene uno con su balance |
| `create(data)` | Crea un proveedor |
| `update(id, data)` | Actualiza un proveedor |
| `delete(id)` | Soft delete (estado = false) — solo si balance = 0 |

> [!IMPORTANT]
> **Cálculo de balance**: El service de proveedores usa `prisma.documento.aggregate()` con `where: { proveedorId, estado: 'PENDIENTE' }` y `_sum: { monto: true }` para calcular el balance dinámicamente cada vez que se consulta un proveedor.

#### [NEW] `apps/backend/src/Application/Services/documentoService.ts`

| Método | Descripción |
|--------|-------------|
| `getAll(filters, pagination)` | Lista con filtros (proveedor, concepto, estado, rango de fechas) + paginación |
| `getById(id)` | Obtiene uno con relaciones (proveedor, concepto) |
| `create(data)` | Crea documento |
| `update(id, data)` | Actualiza documento |
| `delete(id)` | Elimina documento |
| `getBalancesByProveedor(filters)` | Consulta de balances agrupados por proveedor (para la página de consultas) |

## Paso 2.4 — Controllers (Capa HTTP)

Cada controller:
1. Recibe `req, res`
2. Valida input con Zod (del `@cxp/common`)
3. Llama al service correspondiente
4. Retorna respuesta JSON estandarizada

**Formato de respuesta estándar:**

```typescript
// Éxito
{ success: true, data: {...}, meta?: { page, pageSize, total } }

// Error
{ success: false, error: "Mensaje", details?: {...} }
```

#### [NEW] `apps/backend/src/Presentation/Controllers/authController.ts`
Handler: `login` (genera y retorna token JWT).

#### [NEW] `apps/backend/src/Presentation/Controllers/conceptoController.ts`

5 handlers: `listConceptos`, `getConcepto`, `createConcepto`, `updateConcepto`, `deleteConcepto`

#### [NEW] `apps/backend/src/Presentation/Controllers/proveedorController.ts`

5 handlers: `listProveedores`, `getProveedor`, `createProveedor`, `updateProveedor`, `deleteProveedor`

#### [NEW] `apps/backend/src/Presentation/Controllers/documentoController.ts`

7 handlers: `listDocumentos`, `getDocumento`, `createDocumento`, `updateDocumento`, `deleteDocumento`, `getBalances`, `contabilizarDocumento`

## Paso 2.5 — Rutas Express

#### [NEW] `apps/backend/src/Presentation/Routes/index.ts`

```
POST   /api/auth/login         → login

(Todas las siguientes rutas deben estar protegidas por un authMiddleware que verifique el JWT)
GET    /api/conceptos          → listConceptos
GET    /api/conceptos/:id      → getConcepto
POST   /api/conceptos          → createConcepto
PUT    /api/conceptos/:id      → updateConcepto
DELETE /api/conceptos/:id      → deleteConcepto

GET    /api/proveedores        → listProveedores
GET    /api/proveedores/:id    → getProveedor
POST   /api/proveedores        → createProveedor
PUT    /api/proveedores/:id    → updateProveedor
DELETE /api/proveedores/:id    → deleteProveedor

GET    /api/documentos         → listDocumentos
GET    /api/documentos/:id     → getDocumento
POST   /api/documentos         → createDocumento
PUT    /api/documentos/:id     → updateDocumento
DELETE /api/documentos/:id     → deleteDocumento
POST   /api/documentos/:id/contabilizar → contabilizarDocumento

GET    /api/consultas/balances → getBalances
```

## Paso 2.6 — Express Server (Dev)

#### [NEW] `apps/backend/src/server.ts`

Configurar Express con: `cors`, `helmet`, `json parser`, montar rutas, error handler.
Puerto: `3001`.

## Paso 2.7 — Verificación Fase 2

```bash
cd apps/backend && npm run dev
```

Probar con curl o Postman cada endpoint:
- [ ] `POST /api/auth/login` con credenciales válidas → 200 + token JWT
- [ ] `POST /api/auth/login` con credenciales inválidas → 401
- [ ] Acceder a `/api/conceptos` sin token → 401
- [ ] `POST /api/conceptos` con token + `{ "descripcion": "Servicios", "cuentaContable": "501-01" }` → 201
- [ ] `GET /api/conceptos` → lista con el concepto creado
- [ ] `POST /api/proveedores` con datos válidos → 201
- [ ] `POST /api/documentos` con proveedor y concepto existentes → 201
- [ ] `GET /api/proveedores` → proveedor con balance calculado
- [ ] `GET /api/consultas/balances` → balances agrupados
- [ ] `POST /api/documentos/:id/contabilizar` → envía asiento al WS (o error controlado si WS no disponible)
- [ ] Validaciones Zod rechazan datos inválidos → 400

---

# FASE 3 — Frontend Setup

## Paso 3.1 — Inicializar React + Vite

```bash
cd apps/frontend
npx -y create-vite@latest ./ --template react-ts
```

## Paso 3.2 — Configurar Vite

#### [MODIFY] `apps/frontend/vite.config.ts`

- Agregar plugin TailwindCSS 4
- Configurar proxy `/api` → `http://localhost:3001`
- Configurar alias `@/` → `src/`

## Paso 3.3 — Design System CSS

#### [NEW] `apps/frontend/src/index.css`

Implementar el design system SaaS High-Density B2B completo:
- **CSS Custom Properties** para dark/light mode (palette navy #1B2A4A + cyan #00B4D8)
- **Glassmorphism**: backdrop-blur, translucent surfaces
- **Tipografía**: DM Sans (Google Fonts)
- **Componentes base**: `.glass-card`, `.btn-primary`, `.btn-ghost`, `.sidenav`, `.table-container`, `.badge`, `.search-bar`, inputs, modals, toasts
- **Animaciones**: `fadeSlideUp`, `scaleIn`, transiciones suaves

## Paso 3.4 — HTTP Clients

Crear un client por entidad que encapsula las llamadas `fetch` al backend (incluyendo el envío del JWT Token en los headers):

#### [NEW] `apps/frontend/src/Infrastructure/HttpClient/authClient.ts`
Implementar llamada a `/api/auth/login`.

#### [NEW] `apps/frontend/src/Infrastructure/HttpClient/conceptoClient.ts`
```typescript
// Todas las llamadas incluyen el JWT en Authorization header via un helper getHeaders()
const BASE = '/api/conceptos';

export const conceptoClient = {
  getAll: () => fetch(BASE, { headers: getHeaders() }).then(r => r.json()),
  getById: (id: number) => fetch(`${BASE}/${id}`, { headers: getHeaders() }).then(r => r.json()),
  create: (data: CreateConceptoPayload) => fetch(BASE, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  update: (id: number, data: Partial<CreateConceptoPayload>) => fetch(`${BASE}/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  delete: (id: number) => fetch(`${BASE}/${id}`, { method: 'DELETE', headers: getHeaders() }).then(r => r.json()),
};
```

#### [NEW] `apps/frontend/src/Infrastructure/HttpClient/proveedorClient.ts`
Mismo patrón para proveedores.

#### [NEW] `apps/frontend/src/Infrastructure/HttpClient/documentoClient.ts`
Mismo patrón + métodos adicionales:
- `getBalances(filters)` — Para la consulta de balances
- `contabilizar(id: number)` — `POST /api/documentos/:id/contabilizar` para enviar el asiento al WS de Contabilidad

## Paso 3.5 — Custom Hooks

Un hook por entidad que maneja estado (loading, data, error) y operaciones CRUD:

#### [NEW] `apps/frontend/src/Presentation/Hooks/useConceptos.ts`
```typescript
// Expone: conceptos[], loading, error, createConcepto(), updateConcepto(), deleteConcepto(), refresh()
```

#### [NEW] `apps/frontend/src/Presentation/Hooks/useProveedores.ts`
#### [NEW] `apps/frontend/src/Presentation/Hooks/useDocumentos.ts`

## Paso 3.6 — Componentes Reutilizables

#### [NEW] Componentes en `apps/frontend/src/Presentation/Components/`:

| Componente | Descripción |
|------------|-------------|
| `Layout/Sidebar.tsx` | Sidebar con navegación: Dashboard, Conceptos, Proveedores, Documentos, Consultas. Colapsable. |
| `Layout/Navbar.tsx` | Top bar con logo "CxP System" + theme toggle (dark/light) |
| `Layout/AppLayout.tsx` | Wrapper con sidebar + navbar + content area |
| `Shared/DataTable.tsx` | Tabla reutilizable: recibe columns[], data[], onEdit, onDelete. Incluye búsqueda, paginación, estados vacíos. |
| `Shared/FormModal.tsx` | Modal genérico con formulario. Recibe fields[], onSubmit, title. Validación con Zod. |
| `Shared/StatusBadge.tsx` | Badge para estados: Activo/Inactivo (conceptos/proveedores), Pendiente/Pagado (documentos) |
| `Shared/DeleteConfirm.tsx` | Modal de confirmación de eliminación |
| `Shared/Toast.tsx` | Notificaciones toast (éxito, error, info) — auto-dismiss 3s |
| `Dashboard/MetricCard.tsx` | Tarjeta glassmorphic con ícono + valor + label |
| `Dashboard/RecentDocuments.tsx` | Mini-tabla de últimos 5 documentos |

## Paso 3.7 — Contexts

#### [NEW] `apps/frontend/src/Presentation/Context/ThemeContext.tsx`
Toggle dark/light mode. Persiste en localStorage. Detecta `prefers-color-scheme`.

#### [NEW] `apps/frontend/src/Presentation/Context/ToastContext.tsx`
Sistema de notificaciones global. `showToast(message, type)`.

#### [NEW] `apps/frontend/src/Presentation/Context/AuthContext.tsx`
Estado global del usuario autenticado y token JWT. Redirige a login si no hay sesión.

## Paso 3.8 — Verificación Fase 3
- [ ] `npm run dev:frontend` inicia sin errores en `http://localhost:5173`
- [ ] El sidebar y navbar se renderizan correctamente
- [ ] Dark/light mode toggle funciona
- [ ] El proxy a `/api` redirige correctamente al backend

---

# FASE 4 — Páginas CRUD y Login

## Paso 4.0 — Página de Login

#### [NEW] `apps/frontend/src/Presentation/Pages/LoginPage.tsx`

**UI:**
- Centrada en pantalla, tarjeta glassmorphic
- Logo "CxP System" arriba
- Campo Email (text input)
- Campo Contraseña (password input)
- Botón "Iniciar Sesión"
- Manejo de errores (credenciales inválidas → toast de error)
- Al login exitoso → guarda token en `AuthContext` + redirige a Dashboard

## Paso 4.1 — Conceptos de Pago

#### [NEW] `apps/frontend/src/Presentation/Pages/ConceptosPage.tsx`

**UI:**
- Header: "Conceptos de Pago" + botón "Nuevo Concepto"
- DataTable con columnas: ID | Descripción | Cuenta Contable | Estado | Acciones
- StatusBadge: Verde "Activo" / Gris "Inactivo"
- Acciones por fila: Editar (ícono lápiz) | Eliminar (ícono trash)
- Click "Nuevo Concepto" → FormModal con campos Descripción + Cuenta Contable + switch Estado

**Campos del formulario:**
| Campo | Tipo | Validación |
|-------|------|------------|
| Descripción | Text input | Requerido, max 255 |
| Cuenta Contable | Text input | Requerido, max 50 (ej: 501-01, 101-02) |
| Estado | Switch/Toggle | Default: Activo |

## Paso 4.2 — Proveedores

#### [NEW] `apps/frontend/src/Presentation/Pages/ProveedoresPage.tsx`

**UI:**
- Header: "Proveedores" + botón "Nuevo Proveedor"
- DataTable con columnas: ID | Nombre | Tipo Persona | Cédula/RNC | Balance | Estado | Acciones
- Balance se muestra formateado como moneda (RD$ X,XXX.XX)
- Badge "Persona Física" (cyan) / "Persona Jurídica" (teal)
- Barra de búsqueda por nombre o cédula/RNC

**Campos del formulario:**
| Campo | Tipo | Validación |
|-------|------|------------|
| Nombre | Text input | Requerido, max 255 |
| Tipo Persona | Select (Física/Jurídica) | Requerido |
| Cédula/RNC | Text input | Requerido, min 9, max 15, único |
| Estado | Switch/Toggle | Default: Activo |

> [!NOTE]
> El campo **Balance** NO aparece en el formulario — se calcula automáticamente desde los documentos pendientes y se muestra como read-only en la tabla.

## Paso 4.3 — Documentos por Pagar

#### [NEW] `apps/frontend/src/Presentation/Pages/DocumentosPage.tsx`

**UI:**
- Header: "Documentos por Pagar" + botón "Nuevo Documento"
- **Filtros superiores**: Dropdown Proveedor | Dropdown Estado | Date range (Desde/Hasta) | Botón "Filtrar"
- DataTable con columnas: No. Doc | Factura | Proveedor | Concepto | Fecha | Monto | Estado | Integración | Acciones
- StatusBadge: Amarillo "Pendiente" / Verde "Pagado"
- Badge de Integración: Gris "No Contabilizado" / Azul "Contabilizado"
- Botón en acciones de tabla: **"Contabilizar"** (Llama al endpoint de integración)

**Campos del formulario:**
| Campo | Tipo | Validación |
|-------|------|------------|
| No. Documento | Text input | Requerido, único, max 30 |
| No. Factura | Text input | Requerido, max 30 |
| Proveedor | Select (dropdown con proveedores activos) | Requerido |
| Concepto | Select (dropdown con conceptos activos) | Requerido |
| Fecha Documento | Date picker | Requerido |
| Monto | Number input | Requerido, > 0 |
| Estado | Select (Pendiente/Pagado) | Default: Pendiente |

## Paso 4.4 — Verificación Fase 4
- [ ] Login con `admin@cxp.com / password` → redirige a Dashboard
- [ ] Login con credenciales incorrectas → muestra error
- [ ] Intentar acceder a `/conceptos` sin login → redirige a `/login`
- [ ] Crear un concepto con cuenta contable desde el formulario → aparece en la tabla
- [ ] Editar un concepto → se actualiza en la tabla
- [ ] Desactivar un concepto → badge cambia a "Inactivo"
- [ ] Crear un proveedor → aparece con balance RD$ 0.00
- [ ] Crear un documento asociado a ese proveedor → balance del proveedor se actualiza
- [ ] Filtrar documentos por proveedor → solo muestra los suyos
- [ ] Cambiar estado de documento a "Pagado" → balance del proveedor disminuye
- [ ] Click botón "Contabilizar" en un documento → badge cambia a "Contabilizado" (o error controlado si WS no disponible)
- [ ] Intentar contabilizar un documento ya contabilizado → muestra advertencia
- [ ] Intentar crear con datos inválidos → errores de validación se muestran

---

# FASE 5 — Dashboard y Consulta de Balances

## Paso 5.1 — Dashboard

#### [NEW] `apps/frontend/src/Presentation/Pages/DashboardPage.tsx`

**Layout (4 MetricCards arriba + tabla abajo):**

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📋 Conceptos │ │ 🏢 Proveedores│ │ 📄 Documentos│ │ 💰 Total     │
│    Activos   │ │    Activos    │ │  Pendientes  │ │   Adeudado   │
│      12      │ │      8        │ │     23       │ │ RD$ 450,000  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📋 Últimos Documentos Registrados                              │
│─────────────────────────────────────────────────────────────────│
│  #DOC-001 | Proveedor X | RD$ 15,000 | Pendiente | 2026-07-01 │
│  #DOC-002 | Proveedor Y | RD$ 8,500  | Pagado    | 2026-06-30 │
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Datos requeridos del backend** (nuevo endpoint o cálculos en frontend):
- Conteo de conceptos activos
- Conteo de proveedores activos
- Conteo de documentos pendientes
- Suma total de montos pendientes
- Últimos 5 documentos registrados

## Paso 5.2 — Consulta de Balances por Proveedor

#### [NEW] `apps/frontend/src/Presentation/Pages/ConsultaBalancesPage.tsx`

**UI:**
```
┌─────────────── Filtros ────────────────────────────────────────┐
│ Proveedor: [Todos ▼]  Desde: [____]  Hasta: [____]  [Buscar] │
└────────────────────────────────────────────────────────────────┘

┌─────────────── Resultados ────────────────────────────────────┐
│  Proveedor       | Cédula/RNC  | Docs Pendientes | Balance   │
│─────────────────────────────────────────────────────────────── │
│  Ferretería X    | 101000000   | 5               | RD$ 75,000│
│  Servicios Y     | 130000001   | 3               | RD$ 42,500│
│  TOTAL           |             | 8               |RD$ 117,500│
└───────────────────────────────────────────────────────────────┘
```

Este es el requerimiento del PPT: **"Una consulta por criterios (ej: Balances por Proveedor, fecha, etc.)"**

## Paso 5.3 — Routing (App.tsx)

#### [NEW] `apps/frontend/src/App.tsx`

```typescript
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
    <Route path="/"             element={<DashboardPage />} />
    <Route path="/conceptos"    element={<ConceptosPage />} />
    <Route path="/proveedores"  element={<ProveedoresPage />} />
    <Route path="/documentos"   element={<DocumentosPage />} />
    <Route path="/consultas"    element={<ConsultaBalancesPage />} />
  </Route>
</Routes>
```

## Paso 5.4 — Verificación Fase 5
- [ ] Dashboard muestra las 4 métricas correctamente
- [ ] Últimos documentos aparecen en el dashboard
- [ ] Consulta de balances filtra por proveedor
- [ ] Consulta de balances filtra por rango de fechas
- [ ] La fila TOTAL suma correctamente todos los balances
- [ ] La navegación entre todas las páginas funciona

---

# FASE 6 — Pulido y Testing

## Paso 6.1 — Responsive
- [ ] Sidebar colapsa en mobile (hamburger menu)
- [ ] Tablas con scroll horizontal en pantallas pequeñas
- [ ] Modales centrados y usables en mobile

## Paso 6.2 — UX Polish
- [ ] Toasts de confirmación en cada operación CRUD
- [ ] Loading spinners durante llamadas API
- [ ] Empty states en tablas vacías (ícono + mensaje)
- [ ] Animaciones de entrada en modales y páginas

## Paso 6.3 — Seed Data
Crear script de datos iniciales (`seed.ts`) para demo:
```
1 Usuario Admin: admin@cxp.com / password
5 Conceptos: Servicios (Cta: 501-01), Mercancía (Cta: 101-01), Alquiler (Cta: 501-02)
3 Proveedores: con datos de prueba dominicanos
10 Documentos: mix de pendientes y pagados, algunos contabilizados
```

---

# FASE 7 — Deploy en la Nube

## Paso 7.1 — Configurar Vercel
```bash
npx -y vercel link
```

## Paso 7.2 — Variables de entorno en Vercel
Configurar en el dashboard de Vercel:
- `DATABASE_URL` → Connection string de Supabase (con pooler)
- `NODE_ENV` → `production`
- `JWT_SECRET` → Clave secreta para tokens (mínimo 32 caracteres)
- `CONTABILIDAD_WS_URL` → URL del WS de Contabilidad del otro equipo

## Paso 7.3 — Deploy

#### [NEW] `vercel.json`
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "apps/frontend/dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

```bash
npx vercel --prod
```

## Paso 7.4 — Verificación Final
- [ ] La app está accesible en `https://cxp-system.vercel.app` (o similar)
- [ ] Login funciona en producción
- [ ] Los 3 CRUDs funcionan en producción (Conceptos, Proveedores, Documentos)
- [ ] Consulta de balances por criterios funciona
- [ ] Botón "Contabilizar" envía el asiento al WS de Contabilidad
- [ ] La conexión a Supabase funciona con el pooler
- [ ] Dark/light mode funciona
- [ ] Es responsive

---

## Resumen de Archivos a Crear

| Fase | Archivos Nuevos | Descripción |
|------|----------------|-------------|
| 0 | ~10 archivos config | package.json's, tsconfig's, .env, vercel.json, AGENTS.md, opencode.jsonc, docs/ |
| 1 | 1 archivo | `schema.prisma` (4 tablas: users, conceptos_pago, proveedores, documentos) |
| 2 | ~14 archivos | db.ts, authMiddleware.ts, schemas (common), 5 services (auth, contabilidad, concepto, proveedor, documento), 4 controllers, routes, server.ts |
| 3 | ~15 archivos | vite.config, index.css, 4 clients (auth, concepto, proveedor, documento), 3 hooks, 3 contexts (theme, toast, auth), layout components |
| 4 | 4 archivos | LoginPage, ConceptosPage, ProveedoresPage, DocumentosPage |
| 5 | 3 archivos | DashboardPage, ConsultaBalancesPage, App.tsx |
| 6 | 1 archivo | seed script |
| 7 | 1 archivo | vercel.json (ya creado en fase 0) |
| **Total** | **~50 archivos** | |

---

> [!TIP]
> **Tiempo estimado de implementación**: Con asistencia de IA, ~4-5 horas de trabajo efectivo para tener todo funcionando.

---

## Checklist de Cobertura vs. Requerimientos PPT

| Requerimiento PPT | ¿Cubierto? | Dónde |
|---|---|---|
| CRUD Conceptos (ID, Descripción, Estado) | ✅ | Fase 1 (schema) + Fase 2 (API) + Fase 4 (UI) |
| CRUD Proveedores (ID, Nombre, TipoPersona, Cédula/RNC, Balance, Estado) | ✅ | Fase 1 + 2 + 4 (balance calculado dinámicamente) |
| CRUD Documentos (NoDoc, NoFactura, Fecha, Monto, FechaRegistro, Proveedor, Estado) | ✅ | Fase 1 + 2 + 4 |
| Consulta por criterios (Balances por proveedor, fecha) | ✅ | Fase 2 (endpoint) + Fase 5 (ConsultaBalancesPage) |
| WS Contabilidad: IdAsiento | ✅ | contabilidadService → `documento.id` |
| WS Contabilidad: Descripción | ✅ | contabilidadService → construido dinámicamente |
| WS Contabilidad: IdTipoInventario | ✅ | contabilidadService → `concepto.id` |
| WS Contabilidad: CuentaContable | ✅ | contabilidadService → `concepto.cuentaContable` |
| WS Contabilidad: TipoMovimiento (DB/CR) | ✅ | contabilidadService → `'CR'` para CxP |
| WS Contabilidad: FechaAsiento | ✅ | contabilidadService → `new Date()` |
| WS Contabilidad: MontoAsiento | ✅ | contabilidadService → `documento.monto` |
| WS Contabilidad: Estado | ✅ | contabilidadService → `'REGISTRADO'` |
| Open Source | ✅ | React + Express + PostgreSQL |
| Alojado en la nube | ✅ | Vercel + Supabase |
