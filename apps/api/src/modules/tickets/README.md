# Tickets Module

This is the Express backend module for tickets.

## Conventions
- Routes are explicitly mounted under `/api/v1/tickets`.
- Business operations are placed inside `tickets.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `tickets.controller.ts`.
