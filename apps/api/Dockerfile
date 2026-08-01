# syntax=docker/dockerfile:1
# Build context MUST be the monorepo root, e.g.:
#   docker build -f apps/api/Dockerfile -t campuscare-api .

FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo

# ---- Install full workspace deps & build the api package ----
FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/web/package.json ./apps/web/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

# Produce an isolated, production-only install for the api package
RUN pnpm --filter api deploy --prod /deploy/api

# ---- Production runtime ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /deploy/api ./
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/server.js"]
