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
