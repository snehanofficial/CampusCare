# Coding Rules & Guidelines

These coding standards are strictly enforced in this monorepo:

1. **Exports Rule:**
   - Use named exports exclusively (`export function`, `export const`).
   - Do not use default exports (`export default`) for business modules, helpers, or hooks.
   - Default exports are permitted only for configuration files required by outer tools (e.g. `prettier.config.js`).

2. **Imports Rule:**
   - Use absolute path aliases (`@/*`) on the frontend to resolve directory structures. Do not use relative chains (`../../../../`).
   - Attach the `.js` extension to all relative file imports on the backend under ESM.

3. **Validation Rule:**
   - Validate all input payloads on HTTP endpoints using Zod schemas located in `packages/shared-schemas`.
   - Validate all environment variables at startup in both the API and Web client.

4. **No Circular Dependencies:**
   - Do not create circular reference loops between modules or packages. Keep features modular and self-contained.
