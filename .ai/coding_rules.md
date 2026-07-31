# AI Coding Rules

Adhere strictly to the following standards when editing code in this workspace:

## 1. Export Standards
- Export modules using named exports only.
- Avoid default exports.

## 2. ESM Resolution
- Always attach the `.js` extension to local relative file imports on the backend.
- Do not add file extensions to absolute path aliases on the frontend.

## 3. Database Integrity
- Do not bypass Prisma validation when mapping fields.
- Properties mapping camelCase TS to snake_case PG must declare `@map` and `@@map`.

## 4. Dependencies boundaries
- Web app may depend on shared packages.
- Shared packages must never depend on the web or api apps.
