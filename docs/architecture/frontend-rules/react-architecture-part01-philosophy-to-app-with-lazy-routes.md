# React + Vite + TypeScript Architecture



## 1. Philosophy

| Principle | What it means |
|---|---|
| **Clean Architecture** | Strict separation into Domain → Application/Services → Infrastructure → Presentation. Inner layers never depend on outer layers. |
| **Component Driven** | Strict separation of concerns via structured folder architecture. |
| **Zero Trust / Immutability** | Strict input validation at the edge (two-pass Zod validation). Append-only logic for critical ledgers. |
| **Client-Side Rendering** | Standalone React Single Page Application (SPA) with Vite. |
| **Convention over Configuration** | File placement determines behavior (Vercel routing, layer boundaries, migration order). |

---




## 2. Technology Stack




### Core

| Role | Technology | Why |
|---|---|---|
| Language | **TypeScript** | Strict type safety for components and data models |
| Frontend | **React 19** | Component model, concurrent features, ecosystem |
| Bundler | **Vite** | Fast HMR, native ESM, simple config |
| UI Components | **HeroUI** | Highly customizable, accessible React component architecture |
| Styling | **TailwindCSS 4** (Vite plugin) | Utility-first, no CSS context switching |
| Routing | **React Router DOM 7** | Declarative, nested routes, data loading |
| Icons | **Lucide React** | Consistent, tree-shakeable icon set |




### DevOps

| Role | Technology | Why |
|---|---|---|
| TS Execution | **tsx** | Run TS directly without compilation step |
| Deployment | **Vercel / Netlify / CDN** | Static SPA deployment |

---




## 3. Project Structure

```text
frontend-app/
│
├── public/                   #   Static assets and locales
├── src/
│   ├── Domain/               #   Frontend representations of business entities
│   ├── Infrastructure/       #   HTTP Clients, integrations
│   ├── Presentation/         #   React views (Pages, Components, Context, Hooks)
│   ├── Validation/           #   Client-side validation
│   └── main.tsx              #   React DOM entry point
│
├── .env                      # Local environment (gitignored)
├── .env.example              # Documented env template
├── package.json              # Frontend dependencies and scripts
├── tsconfig.json             # TypeScript config
└── vite.config.ts            # Vite bundler config
```

---




## 4. Configuration Files




### 5.1 `package.json` (scripts)

```json
{
  "name": "my-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/ api/",
    "lint:fix": "eslint src/ api/ --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\" \"api/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\" \"api/**/*.ts\""
  }
}
```




### 5.2 `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
    plugins: [react(), tailwindcss()],

    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },

    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },

    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'router': ['react-router-dom'],
                },
            },
        },
        target: 'esnext',
        minify: 'esbuild',
        cssMinify: true,
        sourcemap: mode === 'development',
        chunkSizeWarningLimit: 500,
    },

    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom'],
    },
}));
```




### 5.3 `vercel.json`

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```




### 5.4 `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
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




### 5.5 `.env.example`

```bash
# ── Server ──
PORT=3001
NODE_ENV=development

# ── Frontend ──
VITE_APP_URL=http://localhost:5173

# ── Auth ──
JWT_SECRET=change_me_in_production_min_32_chars


# ── File Storage ──
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_token

# ── External Services (add as needed) ──
# MAIL_AUTH_URL=
# MAIL_SEND_URL=
# MAIL_USER=
# MAIL_PASS=
```

---




## 5. React Frontend




### 12.1 State Delegation
Global state is managed via specialized React Contexts (e.g., `AuthContext`, `TransactionContext`) that wrap the application. This prevents prop-drilling while keeping state strongly typed, avoiding bloated Redux stores for simple global flags.




### 12.2 Structural UI Layering (HeroUI + Tailwind)
Components should utilize `HeroUI` wrapped in generic, unopinionated project-specific wrappers. The visual aesthetic strictly enforces **"Tonal Architecture"**—meaning components achieve depth and hierarchy through background color opacity (e.g., `bg-surface-container-highest`) and structural shadows, actively avoiding explicit borders or harsh lines. 

**Example of Tonal Layering:**
```tsx
<div className="w-32 h-32 rounded-full bg-surface-container-low relative shadow-sm">
  {/* Layered Circular Depth - Institutional Aesthetic without lines */}
  <div className="absolute inset-2 rounded-full bg-surface-container-high opacity-40"></div>
  <div className="absolute inset-4 rounded-full bg-primary-fixed opacity-50"></div>
</div>
```




### 12.3 Entry Point

```tsx
// src/main.tsx
import './i18n.js';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/presentation/components/ErrorBoundary.js';
import { AuthProvider } from '@/presentation/context/AuthContext.js';
import App from '@/presentation/App.js';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <Suspense fallback={<div>Loading...</div>}>
                <BrowserRouter>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </BrowserRouter>
            </Suspense>
        </ErrorBoundary>
    </StrictMode>
);
```




### App with Lazy Routes

```tsx
// src/presentation/App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/presentation/hooks/useAuth.js';

const HomePage = lazy(() => import('./pages/HomePage.js'));
const LoginPage = lazy(() => import('./pages/LoginPage.js'));
const Dashboard = lazy(() => import('./pages/Dashboard.js'));
const Settings = lazy(() => import('./pages/Settings.js'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
    return children;
};

export default function App() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]">Loading...</div>}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}
```
