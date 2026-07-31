# Inventory Module

This is the Express backend module for inventory.

## Conventions
- Routes are explicitly mounted under `/api/v1/inventory`.
- Business operations are placed inside `inventory.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `inventory.controller.ts`.
