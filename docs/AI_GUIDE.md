# AI Development Guide

This guide defines instructions for future AI coding agents (such as Claude Code, Cursor, Gemini CLI, or ChatGPT Codex) to ensure features added to **CampusCare** respect local rules and maintain system consistency.

## Prompt Context & Code Alignment

When generating code files or implementing new feature sets:

1. **Service Layer Direct Access:**
   - AI agents must write queries that call `prisma` Client methods directly inside services.
   - Do not attempt to introduce a Repository layer.

2. **Explicit Routing Registrations:**
   - When introducing a new module (e.g. `billing`), you must explicitly import the router and mount it in `apps/api/src/modules/index.ts`.
   - Do not write dynamic route discovery routines.

3. **Absolute Import Resolvers:**
   - Always reference component locations on the frontend using `@/` path aliases.
   - Specify `.js` extensions on backend file imports.

4. **Environment Variables:**
   - Any new configurations must be added to the Zod schemas in `apps/api/src/config/env.ts` or `apps/web/src/config/env.ts` to ensure runtime safety.

5. **No Placeholders:**
   - Write full implementations. Avoid leaving trailing comments like `// TODO: implement database logic`.
