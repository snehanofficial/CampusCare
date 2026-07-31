# Coding Guidelines & import Standards

This document establishes the code quality baselines and directory conventions required for **CampusCare**.

## 1. Import & Export Rules

To maintain type integrity and avoid resolution errors, developers must follow these import standards:

- **Named Exports:** Export modules explicitly by name. Avoid `export default` for utilities, hooks, constants, or services:
  ```typescript
  // Correct
  export function useTicketActions() { ... }

  // Incorrect
  export default function useTicketActions() { ... }
  ```
  *(Exception: Main configuration setups like `vite.config.ts` or routes default exports are allowed if required by outer tools).*

- **Absolute Paths & Aliases:** Import local workspace assets via the `@/*` alias mapped in `tsconfig.json`:
  ```typescript
  // Correct
  import { Button } from "@/components/ui/button";

  // Incorrect
  import { Button } from "../../../../components/ui/button";
  ```

- **Shallow Barrel Exports:** Use barrel files (`index.ts`) only at module boundaries. Do not nest barrel indexes deeply inside a single folder, as this hides import source tracks and causes IDE latency.

- **No Circular Imports:** Avoid importing modules that reference back to each other. Keep files decoupled and place shared structures inside the `packages/*` folders.

- **ESM Extension Requirements:** For all TypeScript files compiled under ESM (NodeNext resolution), relative imports must specify the `.js` extension:
  ```typescript
  // Correct
  import { authRouter } from "./auth.routes.js";

  // Incorrect
  import { authRouter } from "./auth.routes";
  ```

## 2. Strong Type Checking

- **Strict Compilation:** `"strict": true` is enforced at the compiler level.
- **No Implicit Any:** Always define return types and argument models explicitly. Avoid using the `any` type keyword. Use `unknown` if types are truly undefined.
