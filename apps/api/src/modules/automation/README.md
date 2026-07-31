# Automation Module

This is the Express backend module for automation.

## Conventions
- Routes are explicitly mounted under `/api/v1/automation`.
- Business operations are placed inside `automation.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `automation.controller.ts`.
