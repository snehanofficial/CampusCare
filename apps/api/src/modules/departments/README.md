# Departments Module

This is the Express backend module for departments.

## Conventions
- Routes are explicitly mounted under `/api/v1/departments`.
- Business operations are placed inside `departments.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `departments.controller.ts`.
