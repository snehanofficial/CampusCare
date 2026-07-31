# KnowledgeBase Module

This is the Express backend module for knowledge-base.

## Conventions
- Routes are explicitly mounted under `/api/v1/knowledge-base`.
- Business operations are placed inside `knowledge-base.service.ts` and call Prisma Client directly.
- Request parsing and payload handling is inside `knowledge-base.controller.ts`.
