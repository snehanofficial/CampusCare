**CampusCare**

*Campus Help Desk & IT Service Management Platform*

Technical Documentation

Version 1.0 | August 2026

Feature-Based Monorepo Architecture

# **Table of Contents**

**Table of Contents** 1

**1\. Overview** 1

**Design Principles** 1

**2\. Technology Stack** 1

**2.1 Backend — apps/api** 1

**2.2 Frontend — apps/web** 1

**2.3 Shared Packages & Tooling** 1

**3\. Architecture & Folder Structure** 1

**4\. Getting Started** 1

**4.1 Prerequisites** 1

**4.2 Setup** 1

**5\. Environment Variables** 1

**6\. Available Scripts** 1

**7\. API Documentation** 1

**7.1 Modules & Endpoints** 1

**7.2 Response Envelope** 1

**8\. Granular Temporary Privilege Escalation (GTPE)** 1

**9\. Deployment** 1

**9.1 Backend** 1

**9.2 Frontend** 1

**9.3 Recommended Setup** 1

**10\. Engineering Standards Summary** 1

# **1\. Overview**

CampusCare is a full-stack IT Service Management (ITSM) platform built for campus environments. It provides end-to-end management of IT support tickets, incidents, assets, service-level agreements (SLAs), workflow automation, and role-based access control (RBAC), including a granular, time-bound privilege escalation system.

The application is implemented as a pnpm monorepo with a feature-based architecture applied consistently across both the frontend and backend, so each business domain (tickets, incidents, SLA, automation, privileges, etc.) is self-contained and independently extensible.

### **Design Principles**

-   Scalability, maintainability, and reusability across all modules
-   Strict type safety end-to-end (TypeScript + Zod validation)
-   Clean, layered architecture — no shortcuts or ad-hoc logic
-   Security-first: JWT auth, RBAC, granular temporary privilege escalation, audit logging
-   Production readiness: structured logging, rate limiting, SLA/automation scheduling

# **2\. Technology Stack**

## **2.1 Backend — apps/api**

| **Category** | **Technology** |
| --- | --- |
| Runtime / Framework | Node.js, Express 5, TypeScript |
| Database / ORM | PostgreSQL, Prisma 7 (@prisma/client, @prisma/adapter-pg) |
| Authentication | JWT (access/refresh tokens), bcrypt, cookie-based sessions |
| Realtime | Socket.IO |
| Validation | Zod |
| API Documentation | Scalar API Reference + Swagger/OpenAPI (swagger-jsdoc) |
| Supporting Libraries | Nodemailer (email), web-push (VAPID push), Multer (uploads), node-cron (scheduled jobs), Pino (logging), Helmet, CORS, compression, express-rate-limit |

## **2.2 Frontend — apps/web**

| **Category** | **Technology** |
| --- | --- |
| Framework | React 19, Vite 8, TypeScript |
| Styling / UI | Tailwind CSS 4, shadcn/ui, Radix UI primitives, Lucide icons |
| State / Data | TanStack Query, TanStack Table, Zustand |
| Routing | React Router 8 |
| Forms | React Hook Form + Zod resolvers |
| Supporting Libraries | Axios, Recharts, Sonner (toasts), cmdk, vaul, html5-qrcode, vite-plugin-pwa |

## **2.3 Shared Packages & Tooling**

packages/constants, packages/shared-schemas, packages/shared-types, and packages/shared-utils are consumed by both apps as @campuscare/\* workspace packages, eliminating duplication of types, validation schemas, and constants.

Tooling: pnpm workspaces, ESLint, Prettier, Husky + lint-staged.

# **3\. Architecture & Folder Structure**

Each backend module follows the pattern Route → Controller → Service → Repository → Prisma. Each frontend feature follows Feature → Components → Hooks → Services → API. This layering isolates HTTP concerns, business logic, and data access, and keeps each of the 20 backend feature modules independently testable.

CampusCare/

├── apps/

│ ├── api/ # Express backend

│ │ ├── prisma/

│ │ │ ├── schema.prisma # Database schema (30 models)

│ │ │ ├── seed.ts

│ │ │ └── migrations/

│ │ └── src/

│ │ ├── config/ # Zod-validated environment config

│ │ ├── database/ # Prisma client instance

│ │ ├── middleware/ # auth, authorize, error-handler, request-id

│ │ ├── modules/ # 20 feature modules

│ │ ├── types/

│ │ ├── utils/ # logger, helpers, etc.

│ │ ├── app.ts # Express app + middleware setup

│ │ └── server.ts # Entry point

│ │

│ └── web/ # React frontend

│ └── src/

│ ├── app/ # guards, layouts, providers, router

│ ├── components/ # common, feedback, forms, navigation, templates, ui

│ ├── features/ # One folder per domain

│ ├── hooks/

│ ├── lib/

│ │ └── repositories/

│ └── mocks/

│

├── packages/

│ ├── constants/

│ ├── shared-schemas/

│ ├── shared-types/

│ └── shared-utils/

│

├── pnpm-workspace.yaml

└── package.json

# **4\. Getting Started**

## **4.1 Prerequisites**

-   Node.js 20+
-   pnpm 9+
-   PostgreSQL 14+

## **4.2 Setup**

\# 1. Clone and install dependencies git clone <repo-url>

cd CampusCare

pnpm install

\# 2. Configure environment variables

cp .env.example .env # edit .env with your DATABASE\_URL, JWT secrets, SMTP, VAPID keys, etc.

\# 3. Generate Prisma client and set up the database

pnpm db:generate

pnpm db:migrate

pnpm db:seed

\# 4. Run the apps (in separate terminals)

pnpm dev:api # API on [http://localhost:3000](http://localhost:3000)

pnpm dev:web # Web on http://localhost:5173

# **5\. Environment Variables**

A single root .env file is loaded by the API (checked in both apps/api and the repo root). Values are validated at startup with Zod (apps/api/src/config/env.ts); the process exits if required values are missing or invalid.

| **Variable** | **Description** |
| --- | --- |
| NODE\_ENV | development | production |
| PORT | API port (default 3000) |
| HOST | API host (default localhost) |
| DATABASE\_URL | PostgreSQL connection string |
| JWT\_ACCESS\_SECRET | Secret for signing access tokens |
| JWT\_REFRESH\_SECRET | Secret for signing refresh tokens |
| SOCKET\_PORT | Socket.IO port |
| SMTP\_HOST / SMTP\_PORT / SMTP\_USER / SMTP\_PASS / SMTP\_FROM | Outbound email configuration |
| VAPID\_PUBLIC\_KEY / VAPID\_PRIVATE\_KEY | Web push keys — generate via npx web-push generate-vapid-keys |
| VITE\_PORT | Frontend dev server port (default 5173) |
| VITE\_API\_URL | API base URL for the frontend |
| VITE\_SOCKET\_URL | Socket.IO URL for the frontend |

# **6\. Available Scripts**

Run from the repository root:

| **Script** | **Description** |
| --- | --- |
| pnpm dev:api | Start the API in watch mode (tsx watch) |
| pnpm dev:web | Start the Vite dev server |
| pnpm build | Build all workspace packages/apps |
| pnpm lint | Lint the whole monorepo |
| pnpm format | Format with Prettier |
| pnpm typecheck | Type-check all packages |
| pnpm db:generate | Generate the Prisma client |
| pnpm db:migrate | Push the Prisma schema to the database |
| pnpm db:seed | Seed the database |

apps/api also exposes build (tsc) and start (node dist/server.js) for production runs. apps/web also exposes build (tsc && vite build) and preview.

# **7\. API Documentation**

Once the API is running, interactive documentation is available at:

-   Scalar API Reference: http://localhost:3000/reference
-   Raw OpenAPI spec: http://localhost:3000/swagger.json

All endpoints are mounted under /api/v1 and generated from JSDoc comments in each module's \*.routes.ts file. Most write endpoints require a JWT (authenticate) plus a permission check (authorize("resource:action")).

## **7.1 Modules & Endpoints**

| **Module** | **Base Path** | **Key Endpoints** |
| --- | --- | --- |
| Auth | /api/v1/auth | POST /register, POST /login, POST /refresh, POST /logout, GET /me, GET /sessions, DELETE /sessions/:id, DELETE /sessions |
| Users | /api/v1/users | GET /, GET /:id, POST /, PUT /:id, DELETE /:id |
| Roles | /api/v1/roles | GET / |
| Permissions | /api/v1/permissions | GET /, GET /registry |
| Privileges (GTPE) | /api/v1/privileges | POST /request, GET /my, GET /my/effective, GET /pending, GET /active, GET /history, POST /grant, POST /grants/:id/revoke, GET|POST /templates, PUT|DELETE /templates/:id, GET|POST /policies, PUT /policies/:id, POST /:id/approve, POST /:id/reject, POST /:id/cancel |
| Departments | /api/v1/departments | GET /, GET /:id, POST /, PUT /:id, DELETE /:id |
| Categories | /api/v1/categories | GET /, GET /:id, POST /, PUT /:id, DELETE /:id |
| Tickets | /api/v1/tickets | GET /, GET /:id, POST /, PUT /:id, DELETE /:id, POST /:id/comments, DELETE /:id/comments/:id, POST /merge, POST /:id/verify, POST /:id/reopen, POST /auto-close |
| Incidents | /api/v1/incidents | GET /, GET /:id, POST /, PUT /:id, DELETE /:id, GET /:id/timeline |
| SLA | /api/v1/sla | GET /compliance, POST /check-violations, GET|POST /policies, GET|PUT|DELETE /policies/:id |
| Automation | /api/v1/automation | GET /, GET|POST /rules, GET|PUT|DELETE /rules/:id, GET /logs |
| Analytics | /api/v1/analytics | GET /student, GET /technician, GET /department, GET /admin, GET /charts |
| Assets | /api/v1/assets | GET / |
| Maintenance | /api/v1/maintenance | GET / |
| Inventory | /api/v1/inventory | GET / |
| Notifications | /api/v1/notifications | GET / |
| Reports | /api/v1/reports | GET / |
| Knowledge Base | /api/v1/knowledge-base | GET / |
| Audit | /api/v1/audit | GET / |
| Settings | /api/v1/settings | GET / |

## **7.2 Response Envelope**

// Success {

"success": true,

"message": "string",

"data": {}

}

// Error {

"success": false,

"message": "string",

"errors": \[\]

}

# **8\. Granular Temporary Privilege Escalation (GTPE)**

GTPE is CampusCare's role-based access control extension that allows users to request, and administrators to grant, time-bound elevated permissions instead of permanent role changes. It is exposed via the /api/v1/privileges endpoints (Section 7.1) and covers the full lifecycle: request → approval/rejection → active grant → automatic expiry → audit history.

-   Requests: users submit a privilege request (POST /request) scoped to specific permissions.
-   Approval workflow: administrators review pending requests (GET /pending) and approve or reject them.
-   Grants: approved requests become time-bound grants (POST /grant) that can be revoked early (POST /grants/:id/revoke).
-   Templates & policies: reusable privilege templates and policies standardize what can be requested and for how long.
-   Effective permissions: GET /my/effective resolves a user's base role permissions plus any active temporary grants.
-   Expiry: the node-cron scheduler in server.ts automatically expires grants without requiring a separate worker process.

# **9\. Deployment**

## **9.1 Backend**

-   Provision a PostgreSQL database and set DATABASE\_URL.
-   Set NODE\_ENV=production and all required secrets (JWT\_ACCESS\_SECRET, JWT\_REFRESH\_SECRET, SMTP, VAPID keys).
-   Build and run migrations:

pnpm --filter api build

pnpm db:migrate

pnpm --filter api start

*Note: CORS is currently configured to disable cross-origin requests entirely when NODE\_ENV=production (origin: false). Update apps/api/src/app.ts to allow the production frontend origin before deploying.*

## **9.2 Frontend**

-   Set VITE\_API\_URL and VITE\_SOCKET\_URL to the production API's URL.
-   Build the static bundle:

pnpm --filter web build

-   Serve apps/web/dist from a static host or CDN — the app is a configured PWA via vite-plugin-pwa.

## **9.3 Recommended Setup**

-   Run the API behind a reverse proxy (e.g. Nginx) terminating TLS and forwarding to the Express/Socket.IO port.
-   Scheduled jobs (SLA checks, privilege expiry, ticket auto-close) run via the built-in node-cron scheduler started in server.ts — no separate worker process required.
-   Use a managed PostgreSQL instance and run pnpm db:migrate as part of the deploy pipeline before starting the API.

# **10\. Engineering Standards Summary**

CampusCare follows a documented set of engineering rules (PROJECT\_RULES.md) covering architecture, ownership boundaries, coding conventions, Git workflow, and testing requirements. Every module owner is expected to:

-   Prioritize scalability, maintainability, reusability, security, performance, and type safety.
-   Follow the Route → Controller → Service → Repository → Prisma layering on the backend, and Feature → Components → Hooks → Services → API on the frontend.
-   Avoid shortcuts that introduce architectural inconsistency, security risk, or technical debt.