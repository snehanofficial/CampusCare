# Database Design & Mappings

This document details the database conventions, naming conventions, indexes, enums, and mapping configurations for the **CampusCare** PostgreSQL instance managed via **Prisma ORM**.

## Naming Conventions & Mapping Rules

We enforce database conventions that keep PostgreSQL columns clean and TypeScript objects intuitive:

- **PostgreSQL Database:** All table names and column names use `snake_case` (e.g. `users`, `password_hash`, `created_at`).
- **TypeScript Code:** All class properties and model properties use `camelCase` (e.g. `passwordHash`, `createdAt`).
- **Prisma Mapping:** We map between these two conventions inside `prisma/schema.prisma` using `@map` (for columns) and `@@map` (for tables).

### Example Mapping
```prisma
model User {
  id           String   @id @default(uuid()) @map("id")
  email        String   @unique @map("email")
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("users")
}
```

## Database Indexes

To prevent slow queries, indexes are declared on foreign key relations and query filters:
- `users`: index on `email`, `roleId`.
- `tickets`: indexes on `status`, `priority`, `creatorId`, `assigneeId`, `categoryId`, `departmentId`, `assetId`.
- `assets`: indexes on `tag` (unique QR tag), `departmentId`.
- `notifications`: indexes on `userId`, `isRead`.
- `audit_logs`: indexes on `performedById`, `action`.

## Seed Strategy

Database seeds (placed in `apps/api/prisma/seed.ts`) will initialize static data before runtime:
1. **Roles:** Create `SYSTEM_ADMIN`, `DEPT_ADMIN`, `TECHNICIAN`, `FACULTY`, `STUDENT`.
2. **Permissions:** Populate all action-based permissions (e.g., `tickets:create`, `assets:delete`).
3. **Role-Permissions Mapping:** Link default permission lists to roles.
4. **Departments & Categories:** Add default support groups (e.g., "IT Support", "Facilities") and request categories.

## Future Multi-File Migration Path

Currently, Prisma ORM requires a preview flag (`prismaSchemaFolder`) to compile multiple files in a `prisma/schema/` directory. For production stability, CampusCare uses a single consolidated `prisma/schema.prisma` file. Once the multi-file schema feature exits preview and achieves general availability (GA), the schema can be migrated by moving individual models into separate domain files under `prisma/schema/` and updating the generator block.
