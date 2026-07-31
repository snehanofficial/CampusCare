# Contributing Guidelines

Thank you for contributing to the **CampusCare** platform. To ensure high code quality, consistency, and build safety, please adhere to the following development practices.

## Branching Conventions

- Use clean, task-descriptive branch names prefixed by work category:
  - `feat/ticket-creation` (new features)
  - `fix/auth-cookie-refresh` (bug fixes)
  - `docs/setup-guide-update` (documentation updates)
  - `perf/query-optimization` (performance improvements)

## Commit Messages (Conventional Commits)

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(api): add ticket assignee endpoint`
- `fix(web): correct dashboard layout alignment`
- `docs(db): clarify database index mappings`
- `style(api): format database mappings`

## CI Pipeline Checklist

Our GitHub Actions pipeline automatically checks the following on every Pull Request:
1. **Format Check:** Prettier styling verification.
2. **Linting Check:** Flat ESLint rules.
3. **Prisma Validate:** Schema syntax and relations validity.
4. **TypeScript Compilation:** Strict type-checks across all workspaces (`tsc --noEmit`).
5. **Production Build:** Bundling validity checks (`pnpm build`).

Ensure all tasks run successfully locally by running `pnpm run lint` and `pnpm run build` before pushing to origin.
