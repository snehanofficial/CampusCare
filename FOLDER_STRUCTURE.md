# CampusCare - Final Project Structure

> **Architecture:** Feature-Based Monorepo
>
> **Frontend:** React 19 + Vite + TypeScript
>
> **Backend:** Express.js + Prisma + PostgreSQL
>
> **Shared Packages:** Types, Schemas & Utilities
>
> **Goal:** AI-Augmented Development, Modular, Scalable & Maintainable

```text
campuscare/
│
├── apps/
│   │
│   ├── web/                            # React Frontend
│   │   │
│   │   ├── public/
│   │   │
│   │   ├── src/
│   │   │
│   │   ├── app/
│   │   │   ├── providers/
│   │   │   ├── router/
│   │   │   ├── layouts/
│   │   │   ├── guards/
│   │   │   └── app.tsx
│   │   │
│   │   ├── assets/
│   │   │   ├── icons/
│   │   │   ├── images/
│   │   │   └── illustrations/
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── common/
│   │   │   ├── forms/
│   │   │   ├── tables/
│   │   │   ├── charts/
│   │   │   ├── dialogs/
│   │   │   ├── navigation/
│   │   │   └── feedback/
│   │   │
│   │   ├── features/
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── api/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── pages/
│   │   │   │   ├── schemas/
│   │   │   │   ├── services/
│   │   │   │   ├── store/
│   │   │   │   ├── types/
│   │   │   │   ├── utils/
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── departments/
│   │   │   ├── categories/
│   │   │   ├── tickets/
│   │   │   ├── assets/
│   │   │   ├── maintenance/
│   │   │   ├── inventory/
│   │   │   ├── incidents/
│   │   │   ├── sla/
│   │   │   ├── automation/
│   │   │   ├── notifications/
│   │   │   ├── analytics/
│   │   │   ├── reports/
│   │   │   ├── service-status/
│   │   │   ├── heatmap/
│   │   │   ├── knowledge-base/
│   │   │   ├── audit/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   │
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── lib/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── config/
│   │   ├── styles/
│   │   ├── types/
│   │   ├── workers/
│   │   ├── pwa/
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   │
│   └── api/                            # Express Backend
│       │
│       ├── src/
│       │
│       ├── modules/
│       │   │
│       │   ├── auth/
│       │   │   ├── controllers/
│       │   │   ├── routes/
│       │   │   ├── services/
│       │   │   ├── repositories/
│       │   │   ├── validators/
│       │   │   ├── dto/
│       │   │   ├── interfaces/
│       │   │   ├── types/
│       │   │   ├── utils/
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── auth.routes.ts
│       │   │   └── index.ts
│       │   │
│       │   ├── users/
│       │   ├── roles/
│       │   ├── permissions/
│       │   ├── departments/
│       │   ├── categories/
│       │   ├── tickets/
│       │   ├── assets/
│       │   ├── maintenance/
│       │   ├── inventory/
│       │   ├── incidents/
│       │   ├── sla/
│       │   ├── automation/
│       │   ├── notifications/
│       │   ├── analytics/
│       │   ├── reports/
│       │   ├── knowledge-base/
│       │   ├── audit/
│       │   └── settings/
│       │
│       ├── middleware/
│       │   ├── authenticate.ts
│       │   ├── authorize.ts
│       │   ├── validate.ts
│       │   ├── upload.ts
│       │   ├── rate-limit.ts
│       │   ├── error-handler.ts
│       │   └── not-found.ts
│       │
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── seed.ts
│       │   └── migrations/
│       │
│       ├── sockets/
│       │   ├── index.ts
│       │   ├── ticket.socket.ts
│       │   ├── notification.socket.ts
│       │   └── presence.socket.ts
│       │
│       ├── jobs/
│       │   ├── sla.job.ts
│       │   ├── notification.job.ts
│       │   └── cleanup.job.ts
│       │
│       ├── mail/
│       │   ├── templates/
│       │   ├── mailer.ts
│       │   ├── ticket-created.ts
│       │   ├── ticket-assigned.ts
│       │   ├── ticket-resolved.ts
│       │   └── password-reset.ts
│       │
│       ├── storage/
│       │   ├── uploads/
│       │   ├── attachments/
│       │   ├── avatars/
│       │   └── temp/
│       │
│       ├── config/
│       ├── constants/
│       ├── database/
│       ├── lib/
│       ├── types/
│       ├── utils/
│       ├── app.ts
│       └── server.ts
│
├── packages/
│   │
│   ├── shared-types/
│   │   ├── user.ts
│   │   ├── ticket.ts
│   │   ├── asset.ts
│   │   ├── inventory.ts
│   │   ├── notification.ts
│   │   └── report.ts
│   │
│   ├── shared-schemas/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── ticket.ts
│   │   ├── asset.ts
│   │   ├── inventory.ts
│   │   └── notification.ts
│   │
│   ├── shared-utils/
│   │   ├── helpers.ts
│   │   ├── permissions.ts
│   │   ├── pagination.ts
│   │   ├── formatter.ts
│   │   └── date.ts
│   │
│   ├── constants/
│   │
│   └── eslint-config/
│
├── docs/
│   ├── SRS.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── RBAC.md
│   ├── DEPLOYMENT.md
│   ├── CONTRIBUTING.md
│   └── CHANGELOG.md
│
├── scripts/
│   ├── seed.ts
│   ├── reset-db.ts
│   └── generate-types.ts
│
├── docker/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── lint.yml
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── turbo.json                # Optional if using Turborepo
├── tsconfig.base.json
└── README.md
```

---

# Feature Module Convention

Every frontend feature follows this structure:

```text
feature-name/
│
├── api/
├── components/
├── hooks/
├── pages/
├── schemas/
├── services/
├── store/
├── types/
├── utils/
└── index.ts
```

---

# Backend Module Convention

Every backend module follows this structure:

```text
module-name/
│
├── controllers/
├── routes/
├── services/
├── repositories/
├── validators/
├── dto/
├── interfaces/
├── types/
├── utils/
├── events/
│
├── module.controller.ts
├── module.service.ts
├── module.routes.ts
└── index.ts
```

---

# Core Technologies

## Frontend

- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod
- Sonner
- Recharts
- html5-qrcode
- vite-plugin-pwa

## Backend

- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- Socket.IO
- Nodemailer
- Multer
- Web Push API

---

# Design Principles

- Feature-Based Architecture
- Domain-Driven Module Separation
- Shared Types & Validation
- Mobile-First PWA
- AI-Augmented Development
- Clean Architecture
- Scalable Monorepo
- Reusable Components
- Strong Type Safety
- RESTful APIs
- Granular RBAC
- Offline-Ready Foundation
