# CxP System — Agent Rules

## Project Overview
Sistema de Cuentas por Pagar (CxP) con interfaz a Contabilidad.
Monorepo TypeScript: React frontend + Express backend + shared Zod schemas.

## Tech Stack
- Frontend: React 19 + Vite + TypeScript + HeroUI + TailwindCSS 4 + React Router 7
- Backend: Node.js + Express 4 + TypeScript + Prisma ORM
- Database: PostgreSQL (Docker local)
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
- `docker compose up -d` — Start PostgreSQL
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
