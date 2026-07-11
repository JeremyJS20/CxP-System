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
