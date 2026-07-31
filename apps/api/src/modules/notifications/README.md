# Notifications Module

This is the Express backend module for notifications.

## Conventions
- Routes are explicitly mounted under `/api/v1/notifications`.
- Business operations are placed inside `notifications.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `notifications.controller.ts`.
