# ADR 0003 - Monorepo Workspaces Utilising PNPM

## Status
Accepted

## Context
We need to manage a multi-package environment containing a React frontend, an Express API, and shared TypeScript structures (types, schemas, helper utilities).

## Decision
Use a monorepo structure managed by `pnpm` workspaces. Shared packages reside in `packages/*` and applications reside in `apps/*`.

## Consequences
- Fast dependency installations via content-addressable storage.
- Strict workspace encapsulation without the need to publish packages to external registries.
- Prevents version drift of common utility libraries.
