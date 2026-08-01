# Privileges Module — GTPE (Granular Temporary Privilege Escalation)

## Purpose

Time-boxed, auditable privilege escalation on top of the existing RBAC foundation.
Users may **request** extra permissions for a bounded window; administrators may
**grant** them directly. Every grant expires automatically and can be revoked early.

## Design

The module deliberately **extends the existing `UserPermission` model** rather than
introducing a parallel grant table. `auth.service.ts` already merges `UserPermission`
rows (filtered by `expiresAt`) into the JWT permission snapshot, so GTPE grants are
picked up by authentication and `authorize`/`authorizeAny` with **zero changes to
Authentication, Role definitions, or the authorization middleware**.

### Invariant

Revocation always sets `expiresAt = now()` alongside `status = REVOKED`. `auth.service.ts`
only understands `expiresAt`, so status alone would not drop the permission.

## Layering

```
privileges.routes.ts
  → privileges.controller.ts / .admin.controller.ts / .templates.controller.ts
    → privileges.service.ts / .requests.service.ts / .templates.service.ts
      → privileges.repository.ts
        → Prisma
```

Supporting files: `privileges.schema.ts` (Zod), `privileges.helpers.ts` (policy
resolution, expiry math, request-context extraction, pagination), `privileges.events.ts`
(inline audit + notification writers), `privileges.middleware.ts` (opt-in live
permission hydration), `privileges.scheduler.ts` (node-cron sweep).

## API

All paths are prefixed `/api/v1/privileges`.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| POST | `/request` | `privileges:request` | Submit an escalation request |
| GET | `/my` | authenticated | The caller's own requests |
| GET | `/my/effective` | authenticated | Live temporary permissions (navbar indicator) |
| GET | `/pending` | `privileges:approve` \| `:manage` | Review queue (dept-scoped for DEPT_ADMIN) |
| GET | `/active` | `privileges:grant` \| `:manage` | Currently active grants |
| GET | `/history` | `privileges:grant` \| `:manage` | Full grant history, `?format=csv` supported |
| POST | `/grant` | `privileges:grant` \| `:manage` | Direct grant, no approval step |
| POST | `/grants/:grantId/revoke` | `privileges:grant` \| `:manage` | Early revocation |
| POST | `/:id/approve` | `privileges:approve` \| `:manage` | Approve and activate |
| POST | `/:id/reject` | `privileges:approve` \| `:manage` | Reject with a reason |
| POST | `/:id/cancel` | requester only | Withdraw a pending request |
| GET/POST | `/templates` | `:grant` / `:manage` | Reusable permission bundles |
| PUT/DELETE | `/templates/:id` | `privileges:manage` | Update / soft-delete a template |
| GET/POST | `/policies` | `:approve` / `:manage` | Approval policies |
| PUT | `/policies/:id` | `privileges:manage` | Update a policy |

The permission registry used by the selector is served by the permissions module at
`GET /api/v1/permissions/registry`.

## Business rules

- **No self-approval.** A requester can never approve or reject their own request.
- **No self-grant.** An administrator cannot grant temporary access to themselves.
- **No duplicates.** A request is rejected if the requester already holds an active
  grant for any of the selected permissions. A new grant supersedes (revokes) any
  existing active GTPE grant for the same user + permission pair.
- **Duration ceiling.** Requests and non-SYSTEM_ADMIN grants are capped by the
  resolved policy's `maxDurationMinutes`. SYSTEM_ADMIN may set custom durations.
- **Policy resolution.** exact permission → permission category → fallback
  (`LOW` / `DEPT_ADMIN` / 60 minutes). Across a multi-permission selection the
  strictest policy wins.

## Scheduler

`node-cron`, `*/1 * * * *`, started from `server.ts` and disabled by
`ENABLE_SCHEDULER=false`. Each tick, guarded against overlap and wrapped in
try/catch so it can never crash the process:

1. Expire `ACTIVE` grants past `expiresAt` → audit `GTPE_EXPIRE` + notify holders.
2. Warn holders of grants expiring within 5 minutes (once, via `notifiedExpiringSoon`).
3. Expire `PENDING` requests older than 24 hours → audit + notify requester.

## Propagation window (documented trade-off)

Access tokens carry a 15-minute permission snapshot. Because revocation also sets
`expiresAt = now()`, the next token refresh always drops a revoked permission.
On GTPE's own endpoints, `hydrateTemporaryPermissions` re-reads live grants
(30-second cache), so revocation takes effect there within ~30 seconds.

## Limitations

- Email and browser-push delivery are not wired up; notifications are in-app only.
- `autoApprove` is stored and resolved but requests still require an explicit review.
- History CSV export is capped at 5000 rows.
