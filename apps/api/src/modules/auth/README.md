# Auth Module

This module handles user authentication, registration, login, token issuance, and password verification.

## Features
- JWT access tokens (short-lived, stored in-memory in web client).
- Refresh tokens (longer-lived, secure HttpOnly cookie).
- Standard register and login validation using shared Zod schemas.

## Folder Boundaries
- `auth.service.ts` queries the Prisma client directly to verify credentials.
- `auth.controller.ts` validates requests and sets httpOnly cookies.
- `auth.routes.ts` mounts handlers on Express routes and documents them with JSDoc OpenAPI blocks.
