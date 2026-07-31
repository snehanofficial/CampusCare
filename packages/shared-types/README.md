# @campuscare/shared-types

This package contains shared TypeScript interfaces and types for the CampusCare project.

## Conventions
- Always write type files using PascalCase.
- Export all types through the main index.ts (barrel file) using named exports.
- Do not import from `apps/web` or `apps/api` (this is forbidden to maintain clean boundaries).
