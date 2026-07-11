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
