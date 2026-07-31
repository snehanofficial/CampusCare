# Categories Module

This is the Express backend module for categories.

## Conventions
- Routes are explicitly mounted under `/api/v1/categories`.
- Business operations are placed inside `categories.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `categories.controller.ts`.
