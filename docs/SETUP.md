# Local Environment Setup

This document walks you through setting up and running the **CampusCare** monorepo locally.

## Prerequisites

Ensure you have the following installed:
- Node.js (version 24.x recommended)
- pnpm (version 11.x recommended)
- PostgreSQL (running locally or in docker)

## Step-by-Step Installation

1. **Clone & Install Dependencies:**
   Install monorepo workspace dependencies from the root directory:
   ```bash
   pnpm install
   ```

2. **Configure Environment Variables:**
   Create `.env` file at the root by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Ensure `DATABASE_URL` matches your local PostgreSQL connection parameters.

3. **Prisma Client Generation & Migrations:**
   Run migrations and generate the typed client:
   ```bash
   pnpm db:migrate
   pnpm db:generate
   ```

4. **Seed Database:**
   Seed initial roles and permissions:
   ```bash
   pnpm db:seed
   ```

5. **Start Dev Servers:**
   Launch both application servers concurrently:
   - Run Express API: `pnpm dev:api` (available on Port 3000)
   - Run React SPA: `pnpm dev:web` (available on Port 5173)
