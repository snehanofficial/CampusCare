# CampusCare

**Campus Help Desk & IT Service Management Platform**

CampusCare is a full-stack ITSM platform for managing campus IT support — tickets, incidents, assets, SLAs, automation, and role-based access — built as a pnpm monorepo with a feature-based architecture on both frontend and backend.

---

## 👥 Team

| Role | Name | Register No. | Email | Department |
|------|------|--------------|-------|------------|
| **Team Lead** | **Snehan S** | 7376252IT351 | snehans.it25@bitsathy.ac.in | Department of Information Technology |
| **Team Member** | **Rishabh M** | 7376252IT304 | rishabhm.it25@bitsathy.ac.in | Department of Information Technology |
| **Team Member** | **Somasri S** | 7376252IT352 | somasris.it25@bitsathy.ac.in | Department of Information Technology |

---

## 🎮 Demo Credentials

After running the database seed (`pnpm db:seed`), the following demo accounts are available for exploring CampusCare.

| Role | Email | Password |
|------|-------|----------|
| 👑 **System Administrator** | `admin@campuscare.edu` | `AdminPassword123!` |
| 🔧 **IT Technician** | `tech@campuscare.edu` | `TechPassword123!` |
| 🎓 **Student** | `student@campuscare.edu` | `StudentPassword123!` |

> **Note:** These are seeded demonstration accounts intended for local development and evaluation only.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)

## Tech Stack

### Backend (`apps/api`)
- **Runtime/Framework:** Node.js, Express 5, TypeScript
- **Database/ORM:** PostgreSQL, Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`)
- **Auth:** JWT (access/refresh tokens), bcrypt, cookie-based sessions
- **Realtime:** Socket.IO
- **Validation:** Zod
- **Docs:** Scalar API Reference + Swagger/OpenAPI (`swagger-jsdoc`)
- **Other:** Nodemailer (email), web-push (VAPID push notifications), Multer (file uploads), node-cron (scheduled jobs), Pino (logging), Helmet, CORS, compression, express-rate-limit

### Frontend (`apps/web`)
- **Framework:** React 19, Vite 8, TypeScript
- **Styling/UI:** Tailwind CSS 4, shadcn/ui, Radix UI primitives, Lucide icons
- **State/Data:** TanStack Query, TanStack Table, Zustand
- **Routing:** React Router 8
- **Forms:** React Hook Form + Zod resolvers
- **Other:** Axios, Recharts, Sonner (toasts), cmdk, vaul, html5-qrcode, vite-plugin-pwa

### Shared
- `packages/constants`, `packages/shared-schemas`, `packages/shared-types`, `packages/shared-utils` — shared code consumed by both apps as `@campuscare/*` workspace packages

### Tooling
- pnpm workspaces, ESLint, Prettier, Husky + lint-staged

## Folder Structure

```
CampusCare/
├── apps/
│   ├── api/                       # Express backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Database schema (30 models)
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── config/            # Zod-validated environment config
│   │       ├── database/          # Prisma client instance
│   │       ├── middleware/        # auth, authorize, error-handler, request-id
│   │       ├── modules/           # 20 feature modules (route → controller → service → repository)
│   │       ├── types/
│   │       ├── utils/             # logger, etc.
│   │       ├── app.ts             # Express app + middleware setup
│   │       └── server.ts          # Entry point
│   │
│   └── web/                       # React frontend
│       └── src/
│           ├── app/
│           │   ├── guards/        # Auth/RBAC route guards
│           │   ├── layouts/
│           │   ├── providers/
│           │   └── router/
│           ├── components/        # common, feedback, forms, navigation, templates, ui
│           ├── config/
│           ├── constants/
│           ├── features/          # One folder per domain (api, components, hooks,
│           │                      # pages, schemas, services, store, types, utils)
│           ├── hooks/
│           ├── lib/
│           │   └── repositories/
│           └── mocks/
│
├── packages/
│   ├── constants/
│   ├── shared-schemas/
│   ├── shared-types/
│   └── shared-utils/
│
├── pnpm-workspace.yaml
└── package.json
```

Each backend module follows **Route → Controller → Service → Repository → Prisma**. Each frontend feature follows **Feature → Components → Hooks → Services → API**.

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL 14+

### Setup

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd CampusCare
pnpm install

# 2. Configure environment variables
cp .env.example .env
# edit .env with your DATABASE_URL, JWT secrets, SMTP, VAPID keys, etc.

# 3. Generate Prisma client and set up the database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 4. Run the apps (in separate terminals)
pnpm dev:api    # API on http://localhost:3000
pnpm dev:web    # Web on http://localhost:5173
```

## Environment Variables

A single root `.env` file is loaded by the API (checked in both `apps/api` and the repo root).

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` \| `production` |
| `PORT` | API port (default `3000`) |
| `HOST` | API host (default `localhost`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `SOCKET_PORT` | Socket.IO port |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Outbound email configuration |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web push keys — generate via `npx web-push generate-vapid-keys` |
| `VITE_PORT` | Frontend dev server port (default `5173`) |
| `VITE_API_URL` | API base URL for the frontend (e.g. `http://localhost:3000/api/v1`) |
| `VITE_SOCKET_URL` | Socket.IO URL for the frontend |

Environment variables are validated at API startup with Zod (`apps/api/src/config/env.ts`); the process exits if required values are missing or invalid.

## Available Scripts

Run from the repository root:

| Script | Description |
|---|---|
| `pnpm dev:api` | Start the API in watch mode (`tsx watch`) |
| `pnpm dev:web` | Start the Vite dev server |
| `pnpm build` | Build all workspace packages/apps |
| `pnpm lint` | Lint the whole monorepo |
| `pnpm format` | Format with Prettier |
| `pnpm typecheck` | Type-check all packages |
| `pnpm db:generate` | Generate the Prisma client |
| `pnpm db:migrate` | Push the Prisma schema to the database |
| `pnpm db:seed` | Seed the database |

`apps/api` also exposes `build` (`tsc`) and `start` (`node dist/server.js`) for production runs.
`apps/web` also exposes `build` (`tsc && vite build`) and `preview`.

## API Documentation

Once the API is running, interactive documentation is available at:

- **Scalar API Reference:** `http://localhost:3000/reference`
- **Raw OpenAPI spec:** `http://localhost:3000/swagger.json`

All endpoints are mounted under `/api/v1` and generated from JSDoc comments in each module's `*.routes.ts` file. Most write endpoints require a JWT (`authenticate`) plus a permission check (`authorize("resource:action")`).

### Modules & Endpoints

| Module | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/v1/auth` | `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`, `GET /sessions`, `DELETE /sessions/:sessionId`, `DELETE /sessions` |
| Users | `/api/v1/users` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Roles | `/api/v1/roles` | `GET /` |
| Permissions | `/api/v1/permissions` | `GET /`, `GET /registry` |
| Privileges (GTPE) | `/api/v1/privileges` | `POST /request`, `GET /my`, `GET /my/effective`, `GET /pending`, `GET /active`, `GET /history`, `POST /grant`, `POST /grants/:grantId/revoke`, `GET|POST /templates`, `PUT|DELETE /templates/:id`, `GET|POST /policies`, `PUT /policies/:id`, `POST /:id/approve`, `POST /:id/reject`, `POST /:id/cancel` |
| Departments | `/api/v1/departments` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Categories | `/api/v1/categories` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Tickets | `/api/v1/tickets` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `POST /:id/comments`, `DELETE /:id/comments/:commentId`, `POST /merge`, `POST /:id/verify`, `POST /:id/reopen`, `POST /auto-close` |
| Incidents | `/api/v1/incidents` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `GET /:id/timeline` |
| SLA | `/api/v1/sla` | `GET /compliance`, `POST /check-violations`, `GET|POST /policies`, `GET|PUT|DELETE /policies/:id` |
| Automation | `/api/v1/automation` | `GET /`, `GET|POST /rules`, `GET|PUT|DELETE /rules/:id`, `GET /logs` |
| Analytics | `/api/v1/analytics` | `GET /student`, `GET /technician`, `GET /department`, `GET /admin`, `GET /charts` |
| Assets | `/api/v1/assets` | `GET /` |
| Maintenance | `/api/v1/maintenance` | `GET /` |
| Inventory | `/api/v1/inventory` | `GET /` |
| Notifications | `/api/v1/notifications` | `GET /` |
| Reports | `/api/v1/reports` | `GET /` |
| Knowledge Base | `/api/v1/knowledge-base` | `GET /` |
| Audit | `/api/v1/audit` | `GET /` |
| Settings | `/api/v1/settings` | `GET /` |

### Response Envelope

```json
// Success
{ "success": true, "message": "string", "data": {} }

// Error
{ "success": false, "message": "string", "errors": [] }
```

## Deployment

### Backend
1. Provision a PostgreSQL database and set `DATABASE_URL`.
2. Set `NODE_ENV=production` and all required secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, SMTP, VAPID keys).
3. Build and run migrations:
   ```bash
   pnpm --filter api build
   pnpm db:migrate
   pnpm --filter api start
   ```
4. **Note:** CORS is currently configured to disable cross-origin requests entirely when `NODE_ENV=production` (`origin: false`). Update `apps/api/src/app.ts` to allow your production frontend origin before deploying.

### Frontend
1. Set `VITE_API_URL` and `VITE_SOCKET_URL` to your production API's URL.
2. Build the static bundle:
   ```bash
   pnpm --filter web build
   ```
3. Serve the `apps/web/dist` output from a static host or CDN (the app is a configured PWA via `vite-plugin-pwa`).

### Recommended Setup
- Run the API behind a reverse proxy (e.g. Nginx) terminating TLS and forwarding to the Express/Socket.IO port.
- Run scheduled jobs (SLA checks, privilege expiry, ticket auto-close) via the built-in `node-cron` scheduler started in `server.ts` — no separate worker process is required.
- Use a managed PostgreSQL instance and run `pnpm db:migrate` as part of your deploy pipeline before starting the API.
