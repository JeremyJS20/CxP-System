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
