# AI Prompts Guidelines

Use these prompts to guide future code generations:

## Prompt: Create a New Feature
```text
"Create a new module for <name> in both frontend and backend.
Follow the explicit route registration in api/src/modules/index.ts.
Declare the backend service querying the Prisma Client directly.
Implement named exports. Specify ESM .js extensions for relative imports on the backend.
Do not leave any placeholders."
```

## Prompt: Update Schema
```text
"Add a new field <fieldName> to the <ModelName> in prisma/schema.prisma.
Ensure snake_case mapping is declared with @map() or @@map().
Generate the Prisma client. Update corresponding shared-types."
```
