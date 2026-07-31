# Incidents Module

This is the Express backend module for incidents.

## Conventions
- Routes are explicitly mounted under `/api/v1/incidents`.
- Business operations are placed inside `incidents.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `incidents.controller.ts`.
