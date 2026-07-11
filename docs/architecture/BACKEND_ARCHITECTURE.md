# Node.js Express Backend Architecture Reference Guide (General DB)

> Stack: Node.js · Express · TypeScript · PostgreSQL · Prisma ORM
> Standalone Node.js Express Backend Architecture. Uses Prisma ORM for database access and data integrity.

---

## 1. Philosophy

| Principle | What it means |
|---|---|
| **Clean Architecture** | Strict separation into Domain → Application/Services → Infrastructure → Presentation. Inner layers never depend on outer layers. |
| **Zero Trust / Immutability** | Strict input validation at the edge (two-pass Zod validation). Append-only logic for critical ledgers. |
| **API-First** | Designed to run as a standalone generic Node.js process (Docker/VPS/PaaS). |
| **Convention over Configuration** | File placement determines behavior (Standard Express routing, layer boundaries, migration order). |

---

## 2. Technology Stack

### Core

| Role | Technology | Why |
|---|---|---|
| Language | **TypeScript** | End-to-end type safety across the backend |

### Backend

| Role | Technology | Why |
|---|---|---|
| API Framework | **Express 4** | Mature, generic REST API handler signatures |
| Database | **PostgreSQL** via **Prisma ORM** | Schema-driven migrations, type-safe queries, implicit repository pattern |
| Auth | **jsonwebtoken** + **express-jwt** | Stateless JWT auth, middleware-based |
| Password Hashing | **bcryptjs** | Proven, pure-JS (no native deps) |
| File Storage | **AWS S3 / Generic Storage** | Managed object storage, private/public access |
| Validation | **Zod** | Runtime type validation, TypeScript inference |

### DevOps

| Role | Technology | Why |
|---|---|---|
| TS Execution | **tsx** | Run TS directly without compilation step |

| Deployment | **Docker / Render / VPS** | Containerized generic Node.js process |

---

## 3. Project Structure

```text
project-root/
│
├── prisma/                           # 🗄️ Database schema & migrations (Prisma ORM)
│
├── src/
│   ├── Application/                  # ⚙️ Core use-case logic (Services)
│   ├── Domain/                       # 🧩 Pure business rules, entities, and shared Zod schemas
│   ├── Infrastructure/               # 🔌 Database connections, external APIs, Middlewares
│   └── Presentation/                 # 🌐 Express routers and controllers
│
├── .env                              # Local environment (gitignored)
├── .env.example                      # Documented env template
├── package.json                      # Project dependencies and scripts
└── tsconfig.json                     # TypeScript configuration
```

---

## 4. Layer Architecture

```
┌──────────────────────────────────────┐
│         HTTP CLIENT / CONSUMER         │  Calls /api/* via fetch()
│    pages · components · context      │  Imports domain types only
├──────────────────────────────────────┤
│           API HANDLERS (api/)        │  Node Platform Serverless Functions
│      One file = one endpoint         │  Instantiates services/repos
├──────────────────────────────────────┤
│          SERVICES (src/services/)    │  Business logic, external APIs
│     Orchestrates repositories        │  Auth tokens, email, SMS
├──────────────────────────────────────┤
│            DATA (src/data/)          │  Repository classes + DB pool
│      SQL queries, transactions       │  Schema-prefixed queries
├──────────────────────────────────────┤
│          DOMAIN (src/domain/)        │  Pure TypeScript types + Zod schemas
│             No imports               │  Shared by all layers
├──────────────────────────────────────┤
│         INFRASTRUCTURE               │  PostgreSQL, Node Platform Blob,
│     (external, never imported)       │  third-party APIs
└──────────────────────────────────────┘
```

### Dependency Rules

| Layer | Can Import From | Cannot Import From |
|---|---|---|
| Domain | Nothing | Everything else |
| Data | Domain | Services, API, Presentation |
| Services | Domain, Data | API, Presentation |
| API Handlers | Domain, Infrastructure, Services | HTTP Client |


---

## 5. Configuration Files

### 5.1 `package.json` (scripts)

```json
{
  "name": "my-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server/index.ts",
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\""
  }
}
```

### 5.2 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

### 5.3 `.env.example`

```bash
# ── Server ──
PORT=3001
NODE_ENV=development

FRONTEND_URL=http://localhost:5173
# ── Auth ──
JWT_SECRET=change_me_in_production_min_32_chars

# ── Database (PostgreSQL) ──
DATABASE_URL=postgres://user:password@localhost:5432/my_app_db

# ── File Storage ──
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=my_bucket

# ── External Services (add as needed) ──
# MAIL_AUTH_URL=
# MAIL_SEND_URL=
# MAIL_USER=
# MAIL_PASS=
```

---

## 6. Database Layer (Prisma ORM)

### 6.1 Database Client (`src/Infrastructure/db.ts`)

Instead of managing raw PostgreSQL connection pools, the architecture utilizes **Prisma ORM** for type-safe queries, schema-driven migrations, and connection management.

```typescript
// src/Infrastructure/db.ts
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
```

### 6.2 Schema as the Source of Truth (`schema.prisma`)

Prisma shifts the repository pattern responsibility to the schema itself. Business rules are enforced at the database level using compound unique constraints, ensuring data integrity even if the application layer fails.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  role      String   @default("USER")
  createdAt DateTime @default(now())
  records   Record[]
}

model Record {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String
  periodId  String
  
  // Enforces complex business rules: One record per user per type per period
  @@unique([userId, type, periodId])
}
```

### 6.3 Service Abstraction (The New Repository)

Because Prisma implicitly provides typed repositories via `prisma.user`, `prisma.record`, explicit repository classes are often unnecessary. Instead, data access is orchestrated within the Application Service layer.

```typescript
// src/Application/Services/recordService.ts
import { prisma } from '../../Infrastructure/db.js';

export class RecordService {
    async createUniqueRecord(userId: string, type: string, periodId: string) {
        // Validation check against active state
        const existing = await prisma.record.findUnique({
            where: {
                userId_type_periodId: { userId, type, periodId }
            }
        });
        
        if (existing) {
            throw Object.assign(new Error('errors.record.already_exists'), { code: 403 });
        }

        // Create transactionally
        return await prisma.record.create({
            data: { userId, type, periodId }
        });
    }
}
```

## 7. API Handler Pattern (Controller to Service Handoff)

The `Presentation` layer (Controllers) strictly handles HTTP context (req/res) and immediate schema validation using the shared `src/Domain` Zod schemas. It immediately passes structured payloads to the `Application` layer (Services), keeping business logic decoupled from Express.

### 7.1 Controller Example

```typescript
// src/Presentation/Controllers/recordController.ts
import type { Request, Response } from 'express';
import { CreateRecordSchema } from '@my-app/common';
import { RecordService } from '../../Application/Services/recordService.js';

const recordService = new RecordService();

export const createRecordHandler = async (req: Request, res: Response) => {
    // 1. Validate Input using Shared Workspace Schema (Zero Trust)
    const parsed = CreateRecordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten().fieldErrors,
        });
    }

    // 2. Pure Handoff to Application Layer
    try {
        const record = await recordService.createUniqueRecord(
            parsed.data.userId, 
            parsed.data.type, 
            parsed.data.periodId
        );
        return res.status(201).json({ success: true, data: record });
    } catch (error: any) {
        // Business logic errors return a code (e.g. 403, 404)
        return res.status(error.code || 500).json({ 
            success: false, 
            error: error.message || 'Internal Server Error' 
        });
    }
};
```

## 8. Express Dev Server

```typescript
// src/server/index.ts
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { validateEnv } from './env.js';
import { errorHandler } from './errorHandler.js';
import { closePool } from '@/data/db.js';

// Handlers
import entityHandler from '../../api/entities/index.js';
import entityDetailHandler from '../../api/entities/[id].js';
import healthHandler from '../../api/health.js';
import loginHandler from '../../api/auth/login.js';

const env = validateEnv();
const app = express();
const jsonParser = express.json({ limit: '10mb' });

// Security
app.use(helmet());
app.use(cors({
    origin: env.NODE_ENV === 'production'
        ? ['https://your-domain.com']
        : ['http://localhost:5173'],
    credentials: true,
}));
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Routes
app.get('/api/health', (req, res) => healthHandler(req as any, res as any));
app.post('/api/auth/login', jsonParser, (req, res) => loginHandler(req as any, res as any));
app.get('/api/entities', (req, res) => entityHandler(req as any, res as any));
app.post('/api/entities', jsonParser, (req, res) => entityHandler(req as any, res as any));
app.get('/api/entities/:id', (req, res) => {
    req.query.id = req.params.id;
    entityDetailHandler(req as any, res as any);
});
app.put('/api/entities/:id', jsonParser, (req, res) => {
    req.query.id = req.params.id;
    entityDetailHandler(req as any, res as any);
});
app.delete('/api/entities/:id', (req, res) => {
    req.query.id = req.params.id;
    entityDetailHandler(req as any, res as any);
});

// Error handler (MUST be last)
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
    console.log(`[Backend] Running on port ${env.PORT} (${env.NODE_ENV})`);
});

// Graceful shutdown
function shutdown(signal: string) {
    console.log(`\n[Backend] ${signal} received. Shutting down...`);
    server.close(async () => {
        await closePool();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

---

## 9. Environment Validation

```typescript
// src/server/env.ts
import { z } from 'zod';

const ServerEnvSchema = z.object({
    PORT: z.string().default('3001'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid postgres:// URL'),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    VITE_APP_URL: z.string().default('http://localhost:5173'),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

export function validateEnv(): ServerEnv {
    const result = ServerEnvSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ Invalid environment variables:');
        console.error(result.error.flatten().fieldErrors);
        process.exit(1);
    }
    return result.data;
}
```

---

## 10. Domain Layer

To ensure **Zero-Trust Validation**, the client and backend must strictly agree on the shape of data. This is achieved by extracting the domain layer into a shared npm workspace (e.g., `src/Domain`).

### 10.1 Shared Zod Schemas

```typescript
// src/Domain/src/index.ts
import { z } from 'zod';

// ── Identity / Core Entities ──
export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email('errors.auth.invalid_email'),
    role: z.enum(['ADMIN', 'USER']).default('USER'),
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({ id: true });
export type CreateUserPayload = z.infer<typeof CreateUserSchema>;

// ── Strict API Payloads ──
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const PaginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Complex Discriminated Unions ──
// Useful for ensuring that the backend receives EXACTLY what it expects for specific transaction types.
export const ActionPayloadSchema = z.object({
    actionId: z.string().min(1),
    metadata: z.record(z.unknown()), // Backend will validate further internally
});
```

### 10.2 Symmetrical Validation Usage

Both the client and backend import from this shared package. 

**client (Client-Side Check before Network Request):**
```typescript
import { CreateUserSchema } from '@my-app/common';
```

**Backend (Zero-Trust Enforcement):**
```typescript
import { CreateUserSchema } from '@my-app/common';

export const createHandler = async (req: Request, res: Response) => {
    // 1. Zod parses and strips unneeded fields. The backend NEVER trusts the client.
    const result = CreateUserSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    
    // 2. Pass strictly-typed, clean data to Application Service
    await userService.create(result.data);
}
```

---

## 11. Server Utilities

### Response Envelope

```typescript
// src/server/response.ts
export function ok<T>(res: any, data: T, meta?: Record<string, any>) {
    return res.status(200).json({ success: true, data, meta });
}
export function created<T>(res: any, data: T) {
    return res.status(201).json({ success: true, data });
}
export function badRequest(res: any, error: string, details?: Record<string, string[]>) {
    return res.status(400).json({ success: false, error, details });
}
export function unauthorized(res: any, error = 'Unauthorized') {
    return res.status(401).json({ success: false, error });
}
export function forbidden(res: any, error = 'Forbidden') {
    return res.status(403).json({ success: false, error });
}
export function notFound(res: any, error = 'Not found') {
    return res.status(404).json({ success: false, error });
}
export function conflict(res: any, error: string) {
    return res.status(409).json({ success: false, error });
}
export function serverError(res: any, error = 'Internal Server Error') {
    return res.status(500).json({ success: false, error });
}
```

### AppError + Error Handler

```typescript
// src/server/AppError.ts
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }

    static badRequest(msg: string) { return new AppError(msg, 400); }
    static unauthorized(msg = 'Unauthorized') { return new AppError(msg, 401); }
    static forbidden(msg = 'Forbidden') { return new AppError(msg, 403); }
    static notFound(msg = 'Not found') { return new AppError(msg, 404); }
    static conflict(msg: string) { return new AppError(msg, 409); }
}
```

```typescript
// src/server/errorHandler.ts
import type { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    console.error('[ErrorHandler]', err.message, err.stack);
    return res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    });
}
```

### Async Handler + Auth Middleware

```typescript
// src/server/asyncHandler.ts
import type { Request, Response, NextFunction, RequestHandler } from 'express';

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
```

```typescript
// src/server/middleware.ts
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Token required' });

    try {
        (req as any).user = jwt.verify(token, process.env.JWT_SECRET!);
        next();
    } catch {
        return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
}

export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ success: false, error: 'Insufficient permissions' });
        }
        next();
    };
}
```

### Logger

```typescript
// src/server/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, ctx: string, msg: string, data?: Record<string, any>) {
    const entry = JSON.stringify({ level, context: ctx, message: msg, timestamp: new Date().toISOString(), data });
    level === 'error' ? console.error(entry) : level === 'warn' ? console.warn(entry) : console.log(entry);
}

export const logger = {
    debug: (ctx: string, msg: string, data?: Record<string, any>) => log('debug', ctx, msg, data),
    info:  (ctx: string, msg: string, data?: Record<string, any>) => log('info',  ctx, msg, data),
    warn:  (ctx: string, msg: string, data?: Record<string, any>) => log('warn',  ctx, msg, data),
    error: (ctx: string, msg: string, data?: Record<string, any>) => log('error', ctx, msg, data),
};
```

---

## 13. Database Conventions (Prisma)

```prisma
// prisma/schema.prisma

// 1. Always use UUIDs/CUIDs for IDs
model Entity {
    id          String   @id @default(cuid())
    name        String
    email       String   @unique
    status      String   @default("ACTIVE")
    
    // 2. Use JSON for unstructured data
    metadata    Json     @default("{}")
    
    // 3. Automatic Timestamps
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    
    // 4. Heavy use of compound unique constraints to enforce data integrity
    @@unique([name, status])
}
```

| Decision | When to Use |
|---|---|
| **CUIDs/UUIDs** as PKs | Always — safe for distributed/serverless. (`@default(cuid())`) |
| **Json** | Variable-length nested data, flexible metadata. |
| **Relational Fields** | Fixed catalogs, reference data. Define explicitly in Prisma. |
| **Unique Constraints** | Natural keys (slug, code, email) AND complex business rules (e.g. `@@unique([userId, periodId])`). |
| **Enums vs Strings** | Use native Prisma Enums if supported by the DB, otherwise use strings with Zod validation at the edge. |

---

## 14. Checklists

### Deployment

```
[ ] All env vars set in Node Platform
[ ] DATABASE_URL points to cloud Postgres (Neon/Supabase/Railway)
[ ] Connection pooler configured in DATABASE_URL (pgbouncer=true)
[ ] Prisma generate added to build step (`prisma generate && tsc`)
[ ] JWT_SECRET is strong and unique
```

---

## 15. Common Pitfalls

| Problem | Fix |
|---|---|
| Route works on Node Platform but not locally | Register in `src/server/index.ts` |
| Handler can't read `:id` param | Bridge: `req.query.id = req.params.id` |
| Too many DB connections on Node Platform | Reduce `max` pool size to 3-5, or use a connection pooler |
| Request body is `undefined` | Add `jsonParser` middleware to route |
| Large upload times out | `express.json({ limit: '10mb' })` |
| New env var not available | Add to `.env` AND Node Platform dashboard |
| client can't reach API in dev | Check CORS settings and PORT configuration |
| Import path breaks after refactor | Use `@/` aliases instead of relative paths |

---

## 16. Input Validation (Zod)

### Schema Definition

```typescript
// src/domain/schemas.ts
import { z } from 'zod';

export const CreateEntitySchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    email: z.string().email('Invalid email'),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
    metadata: z.record(z.unknown()).optional().default({}),
    tags: z.array(z.string()).optional().default([]),
});

export type CreateEntityPayload = z.infer<typeof CreateEntitySchema>;
```

### Usage in API Handlers

```typescript
import { CreateEntitySchema } from '../../src/domain/schemas.js';

export default async function handler(req: Request, res: Response) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // Validate input — returns typed data or formatted errors
    const parsed = CreateEntitySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Validation failed',
            details: parsed.error.flatten().fieldErrors,
        });
    }

    // parsed.data is now fully typed and sanitized
    const { name, email, status } = parsed.data;
    // ... proceed with clean data
}
```

**Conventions:**
- Define schemas in `src/domain/schemas.ts` (next to `types.ts`)
- Use `z.infer<typeof Schema>` to derive TypeScript types from schemas
- Always use `safeParse()` (never `parse()`) to avoid thrown exceptions
- Return `error.flatten().fieldErrors` for structured error response
- Reuse schemas across handlers — compose with `.extend()`, `.pick()`, `.omit()`

---

## 17. API Response Envelope

Standardize all API responses with a consistent shape:

```typescript
// src/server/response.ts

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    details?: Record<string, string[]>;  // Validation field errors
    meta?: {
        page?: number;
        pageSize?: number;
        total?: number;
    };
}
```

### Usage in Handlers

```typescript
import { ok, created, badRequest, serverError } from '../../src/server/response.js';

export default async function handler(req: Request, res: Response) {
    if (req.method === 'GET') {
        try {
            const items = await repo.listAll();
            return ok(res, items, { total: items.length });
        } catch (e: any) {
            console.error('[entities] GET error:', e);
            return serverError(res);
        }
    }

    if (req.method === 'POST') {
        const parsed = CreateEntitySchema.safeParse(req.body);
        if (!parsed.success) {
            return badRequest(res, 'Validation failed', parsed.error.flatten().fieldErrors);
        }

        try {
            const id = await repo.create(parsed.data);
            return created(res, { id });
        } catch (e: any) {
            return serverError(res, e.message);
        }
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
```

### client Consumption

```typescript
const res = await fetch('/api/entities');
const json = await res.json();

if (json.success) {
    setItems(json.data);
} else {
    setError(json.error);
    if (json.details) setFieldErrors(json.details);  // Per-field validation errors
}
```

---

## 18. Protected API Middleware (Backend JWT)

### Express Middleware

```typescript
// src/server/middleware.ts
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_key';

export interface AuthenticatedRequest extends Request {
    user: { id: string; email: string; role: string };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Token required' });

    try {
        const payload = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest['user'];
        (req as any).user = payload;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
}

export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ success: false, error: 'Insufficient permissions' });
        }
        next();
    };
}
```

### Usage in Dev Server

```typescript
import { requireAuth, requireRole } from './middleware.js';

// Any authenticated user
app.get('/api/profile', requireAuth, (req, res) => profileHandler(req, res));

// Admin only
app.get('/api/admin/users', requireAuth, requireRole('ADMIN'), (req, res) => ...);

// In the handler, access the typed user:
export default async function handler(req: AuthenticatedRequest, res: Response) {
    const userEmail = req.user.email;
}
```

## 19. Structured Logging

```typescript
// src/server/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: string;         // e.g., '[EnrollmentHandler]'
    requestId?: string;       // Correlation ID
    data?: Record<string, any>;
}

function log(level: LogLevel, context: string, message: string, data?: Record<string, any>) {
    const entry: LogEntry = { level, message, timestamp: new Date().toISOString(), context, data };
    const output = JSON.stringify(entry);
    switch (level) {
        case 'error': console.error(output); break;
        case 'warn':  console.warn(output);  break;
        default:      console.log(output);
    }
}

export const logger = {
    debug: (ctx: string, msg: string, data?: Record<string, any>) => log('debug', ctx, msg, data),
    info:  (ctx: string, msg: string, data?: Record<string, any>) => log('info',  ctx, msg, data),
    warn:  (ctx: string, msg: string, data?: Record<string, any>) => log('warn',  ctx, msg, data),
    error: (ctx: string, msg: string, data?: Record<string, any>) => log('error', ctx, msg, data),
};
```

### Usage in Handlers

```typescript
import { logger } from '../../src/server/logger.js';

export default async function handler(req: Request, res: Response) {
    logger.info('[entities]', 'Creating entity', { name: req.body.name });

    try {
        const id = await repo.create(req.body);
        logger.info('[entities]', 'Entity created', { id });
        return res.status(201).json({ success: true, data: { id } });
    } catch (error: any) {
        logger.error('[entities]', 'Creation failed', { error: error.message });
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}
```

**Benefits:**
- JSON output — parseable by Node Platform Logs, Datadog, etc.
- Structured context and data fields for filtering
- Consistent format across all handlers and services
- Easy to extend with request ID correlation

---

## 20. Express Security Hardening

### Secure Express Configuration

```typescript
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from './rateLimit.js';

// ── Security Headers ──
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],     // TailwindCSS needs inline styles
            imgSrc: ["'self'", 'data:', 'blob:', '*.Node Platform-storage.com'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", 'fonts.gstatic.com'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    strictTransportSecurity: {
        maxAge: 31536000,            // 1 year
        includeSubDomains: true,
        preload: true,
    },
}));

// ── CORS ──
app.use(cors({
    origin: env.NODE_ENV === 'production'
        ? ['https://your-domain.com']   // Explicit whitelist in production
        : ['http://localhost:5173'],     // Client dev server
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
}));

// ── Rate Limiting ──
app.use('/api', rateLimit(60000, 100));            // Global: 100/min
app.use('/api/auth', rateLimit(60000, 10));         // Auth: 10/min

// ── Trust Proxy (behind Node Platform/Nginx/ALB) ──
app.set('trust proxy', 1);
app.disable('x-powered-by');
```

### AsyncHandler + AppError Together

```typescript
import { asyncHandler } from './asyncHandler.js';
import { AppError } from './AppError.js';

// In dev server route registration:
app.get('/api/entities/:id', asyncHandler(async (req, res) => {
    req.query.id = req.params.id;

    const entity = await repo.findById(req.query.id as string);
    if (!entity) {
        throw AppError.notFound('Entity not found');  // Automatically caught and formatted
    }

    return res.status(200).json({ success: true, data: entity });
}));

// No try/catch needed — errors flow to errorHandler middleware
```

---

## 22. Graceful Shutdown

```typescript
// Add to src/server/index.ts

import { closePool } from '@/data/db.js';

const server = app.listen(PORT, () => {
    console.log(`[Backend] Running on port ${PORT}`);
});

function shutdown(signal: string) {
    console.log(`\n[Backend] ${signal} received. Shutting down...`);

    // 1. Stop accepting new connections
    server.close(async () => {
        console.log('[Backend] HTTP server closed');

        try {
            // 2. Close database connections
            await closePool();
            console.log('[Backend] Database connections closed');
        } catch (err) {
            console.error('[Backend] Error during cleanup:', err);
        }

        // 3. Exit
        process.exit(0);
    });

    // Force exit after 10s if graceful shutdown stalls
    setTimeout(() => {
        console.error('[Backend] Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled errors globally
process.on('unhandledRejection', (reason: any) => {
    console.error('[Backend] Unhandled Rejection:', reason);
    // Don't exit — log and continue (unless critical)
});

process.on('uncaughtException', (error: Error) => {
    console.error('[Backend] Uncaught Exception:', error);
    shutdown('uncaughtException');  // Exit — state may be corrupted
});
```

---

## 24. External Service Integration

```typescript
// src/services/ExternalApiService.ts
export class ExternalApiService {
    private cachedToken: string | null = null;
    private tokenExpiresAt: number = 0;

    /**
     * OAuth2 client-credentials flow with caching.
     */
    private async getToken(): Promise<string> {
        if (this.cachedToken && Date.now() < this.tokenExpiresAt - 60000) {
            return this.cachedToken;
        }

        const { AUTH_URL, CLIENT_ID, CLIENT_SECRET } = process.env;
        if (!AUTH_URL || !CLIENT_ID || !CLIENT_SECRET) {
            throw new Error('Service config missing in .env');
        }

        const res = await fetch(AUTH_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
        const data = await res.json() as { access_token: string; expires_in: number };

        this.cachedToken = data.access_token;
        this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
        return this.cachedToken;
    }

    async callApi<T>(path: string, method = 'GET', body?: any): Promise<T> {
        const token = await this.getToken();
        const res = await fetch(`${process.env.SERVICE_BASE_URL}${path}`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            ...(body ? { body: JSON.stringify(body) } : {})
        });

        if (!res.ok) {
            const err = await res.text();
            console.error(`[ExternalApi] ${method} ${path} failed:`, res.status, err);
            throw new Error(`External API error: ${res.status}`);
        }

        return res.json() as T;
    }
}
```

---

## 25. Email / Notification Service

```typescript
// src/services/EmailService.ts
export class EmailService {
    private async getToken(): Promise<string> {
        const { MAIL_AUTH_URL, MAIL_USER, MAIL_PASS } = process.env;
        const hash = Buffer.from(`${MAIL_USER}:${MAIL_PASS}`).toString('base64');

        const res = await fetch(MAIL_AUTH_URL!, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${hash}` }
        });

        const data = await res.json() as { access_token: string };
        return data.access_token;
    }

    async sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
        try {
            const token = await this.getToken();
            const res = await fetch(process.env.MAIL_SEND_URL!, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ subject, body: htmlBody, addresses: [to] })
            });
            return res.ok;
        } catch (error) {
            console.error('[EmailService] Failed:', error);
            return false;  // Non-blocking — never crash the caller
        }
    }
}
```

---

## 27. File Uploads (Node Platform Blob)

```typescript
import { put, del } from '@Node Platform/blob';

async function uploadFile(base64Data: string, path: string, contentType = 'image/jpeg'): Promise<string> {
    const clean = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(clean, 'base64');
    const blob = await put(path, buffer, {
        access: 'private',
        contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
}

async function deleteFile(url: string): Promise<void> {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
}
```

**Conventions:**
- Organize blob paths: `{entity_type}/{entity_id}/{filename}`
- Insert DB record **before** uploading (so you have the ID for the path)
- Update the record with the blob URL **after** successful upload
- Use `access: 'private'` for sensitive files, `'public'` for assets

---

## 28. Health Check Endpoint

```typescript
// api/health.ts
import { query } from '../src/data/db.js';

export default async function handler(req: any, res: any) {
    const checks: Record<string, 'ok' | 'error'> = {};

    try {
        await query('SELECT 1');
        checks.database = 'ok';
    } catch {
        checks.database = 'error';
    }

    const allOk = Object.values(checks).every(v => v === 'ok');

    return res.status(allOk ? 200 : 503).json({
        status: allOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        checks,
        version: process.env.npm_package_version || '0.0.0',
    });
}
```

---

## 29. Rate Limiting

```typescript
// src/server/rateLimit.ts
import type { Request, Response, NextFunction } from 'express';

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(windowMs = 60000, maxHits = 60) {
    return (req: Request, res: Response, next: NextFunction) => {
        const key = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
        const now = Date.now();
        const record = hits.get(key);

        if (!record || now > record.resetAt) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        if (record.count >= maxHits) {
            res.setHeader('Retry-After', Math.ceil((record.resetAt - now) / 1000));
            return res.status(429).json({ success: false, error: 'Too many requests.' });
        }

        record.count++;
        next();
    };
}
```

**Recommended limits:**

| Route | Window | Max |
|---|---|---|
| General API | 1 min | 100 |
| Auth endpoints | 1 min | 10 |
| File uploads | 1 min | 5 |
| Health check | 1 min | 30 |

For production (Node Platform serverless resets in-memory on cold starts):
- Use **Node Platform KV** (`@Node Platform/kv`) for persistent rate limiting
- Or use **Node Platform WAF / Firewall Rules** (no code needed)

---

## 30. TypeScript Patterns

### Path Aliases (`@/` Imports)

```typescript
// ❌ BAD
import { User } from '../../../domain/types';

// ✅ GOOD
import { User } from '@/domain/types';
```

Setup: `tsconfig.json` -> `"paths": { "@/*": ["src/*"] }` (with tsx for runtime resolution)

### Discriminated Unions

```typescript
type RequestState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: string };

function renderState<T>(state: RequestState<T>) {
    switch (state.status) {
        case 'idle': return null;
        case 'loading': return <Spinner />;
        case 'success': return <DataView data={state.data} />;
        case 'error': return <ErrorMessage message={state.error} />;
    }
}
```

### Branded Types

```typescript
type Brand<T, B> = T & { __brand: B };
type UserId = Brand<string, 'UserId'>;
type ProductId = Brand<string, 'ProductId'>;

function getUser(id: UserId) { /* ... */ }
const userId = 'abc' as UserId;
const productId = 'xyz' as ProductId;
getUser(userId);      // ✅
getUser(productId);   // ❌ Type error
```

### Utility Types

```typescript
interface User {
    id: string; email: string; name: string;
    role: 'ADMIN' | 'USER'; createdAt: Date;
}

type CreateUserPayload = Omit<User, 'id' | 'createdAt'>;
type UpdateUserPayload = Partial<Pick<User, 'name' | 'role'>>;
type UserSummary = Pick<User, 'id' | 'name' | 'email'>;
type ReadonlyUser = Readonly<User>;

const DEFAULT_USER = {
    role: 'USER' as const, name: '', email: '',
} satisfies Partial<User>;
```

### Env Type Safety

```typescript
// src/env.d.ts
interface ImportMetaEnv {
    readonly VITE_APP_URL: string;
    readonly VITE_API_BASE_URL?: string;
}
interface ImportMeta {
    readonly env: ImportMetaEnv;
}
```

---

## 33. Testing Strategy

### Setup

```bash
npm i -D vitest supertest @types/supertest
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
        },
    },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
```

### Unit Test — Repository

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityRepository } from '../EntityRepository.js';

// Mock db module
vi.mock('@/data/db.js', () => ({
    query: vi.fn(),
    transaction: vi.fn(),
}));

import { query } from '@/data/db.js';

describe('EntityRepository', () => {
    const repo = new EntityRepository();
    beforeEach(() => vi.clearAllMocks());

    it('findById returns entity when found', async () => {
        (query as any).mockResolvedValueOnce({ rows: [{ id: '123', name: 'Test' }] });
        const result = await repo.findById('123');
        expect(result).toEqual({ id: '123', name: 'Test' });
        expect(query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1'), ['123']);
    });

    it('findById returns null when not found', async () => {
        (query as any).mockResolvedValueOnce({ rows: [] });
        expect(await repo.findById('nope')).toBeNull();
    });
});
```

### Integration Test — API Handler

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import handler from '../entities/index.js';

const app = express();
app.use(express.json());
app.all('/api/entities', (req, res) => handler(req as any, res as any));

describe('POST /api/entities', () => {
    it('returns 400 for missing fields', async () => {
        const res = await request(app).post('/api/entities').send({});
        expect(res.status).toBe(400);
    });
});
```

### Test File Convention

```
src/data/repositories/__tests__/EntityRepository.test.ts
src/services/__tests__/EmailService.test.ts
src/presentation/components/__tests__/ErrorBoundary.test.ts
api/__tests__/entities.test.ts
```

### Testing Priority

| Priority | Target | Type |
|---|---|---|
| 🔴 Critical | Auth middleware + JWT | Unit |
| 🔴 Critical | API handlers (create, update) | Integration |
| 🟡 High | Repositories | Unit |
| 🟡 High | Zod schemas | Unit |
| 🟢 Medium | Error boundaries | Unit |
| 🔵 Low | UI components | Unit |
| 🔵 Low | Full user flows | E2E |

---

## 34. Git Workflow & Conventions

### Branch Strategy

```
main                    # Production — always deployable
├── feature/xxx         # feature/add-payment-plans
├── fix/xxx             # fix/login-token-expiry
├── chore/xxx           # chore/update-dependencies
└── release/x.y.z       # Release prep (optional)
```

### Commit Messages (Conventional Commits)

```
feat: add payment gateway integration
fix: prevent duplicate enrollment submissions
chore: update express to 4.21.x
docs: add architecture reference guide
refactor: extract email templates to separate module
test: add unit tests for EntityRepository
```

### .gitignore

```gitignore
node_modules/
dist/
.env
.env.local
.vscode/
.idea/
.DS_Store
Thumbs.db
*.log
.Node Platform/
coverage/
```

### Pre-Commit Hooks

```bash
npm i -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

---

## 35. Linting & Formatting

### ESLint (Flat Config — v9+)

```bash
npm i -D eslint @eslint/js typescript-eslint
```

```typescript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';


export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'prefer-const': 'error',
        },
    },
    { ignores: ['dist/', 'node_modules/', '*.config.*'] }
);
```

### Prettier

```json
// .prettierrc
{
    "semi": true,
    "singleQuote": true,
    "trailingComma": "es5",
    "tabWidth": 4,
    "printWidth": 100,
    "bracketSpacing": true,
    "arrowParens": "always"
}
```

---

## 36. Dependency Audit & Maintenance

```bash
npm audit                # Check vulnerabilities
npm audit fix            # Auto-fix
npm outdated             # Check for updates
npm update               # Update compatible versions
npm ci                   # CI/CD — exact versions from lockfile
```

### Dependency Categories

| Category | `dependencies` | `devDependencies` |
|---|---|---|
| Runtime (Express, pg) | ✅ | ❌ |
| Types (@types/*) | ❌ | ✅ |
| Build tools (TSC) | ❌ | ✅ |
| Test frameworks | ❌ | ✅ |
| Linters & formatters | ❌ | ✅ |

### Quarterly Security Checklist

```
[ ] npm audit — fix all high/critical
[ ] npm outdated — update patch/minor
[ ] Review CHANGELOG for major updates
[ ] Verify no secrets in VITE_ env vars
[ ] Rotate JWT_SECRET and API credentials
[ ] Review CORS origins match production domains
[ ] Confirm all endpoints have auth + rate limiting
```

---

## 38. Quick Start
```bash
mkdir my-backend && cd my-backend
npm init -y
npm i express dotenv cors helmet morgan bcryptjs jsonwebtoken zod
npm i -D typescript @types/node @types/express @types/cors tsx nodemon prisma
npx tsc --init
npx prisma init
```
