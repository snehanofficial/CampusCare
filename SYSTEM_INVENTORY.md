# CampusCare System Inventory

Ground-truth inventory derived from reading the implementation (not from docs/README claims). Companion to `PRODUCTION_AUDIT_TRACKER.md`.

## Stack

- **API:** `apps/api` — Express 5, TypeScript, Prisma 7 / PostgreSQL, JWT (15m access / 7d refresh, hashed+rotated), Socket.IO, Nodemailer, node-cron, Zod validation, Pino logging.
- **Web:** `apps/web` — React 19, Vite 8, TanStack Query, Zustand, React Router 8, React Hook Form + Zod, Tailwind 4 / shadcn.
- **Shared:** `packages/{constants,shared-schemas,shared-types,shared-utils}` consumed by both apps.
- **Module pattern (API):** each `apps/api/src/modules/<name>` follows `*.routes.ts → *.controller.ts → *.service.ts → *.repository.ts`, with route-level `authenticate` + `authorize`/`authorizeAny` middleware.

## Roles (`packages/constants/src/roles.ts`)

```
STUDENT
FACULTY
TECHNICIAN
DEPT_ADMIN
SYSTEM_ADMIN   ← bypasses ALL authorize() checks unconditionally (apps/api/src/middleware/authorize.ts)
```

`SYSTEM_ADMIN` is a hard bypass baked into the `authorize`/`authorizeAny` middleware itself (`if (user.role === "SYSTEM_ADMIN") return next()`), not a permission grant — worth knowing when reasoning about any RBAC fix: giving a permission to another role never matters for SYSTEM_ADMIN, and no permission can ever restrict SYSTEM_ADMIN.

## Permission model

- Permissions are `code` strings (e.g. `tickets:read`, `privileges:manage`) defined in `packages/constants/src/permissions.ts`, seeded into `Permission`/`RolePermission` via `apps/api/prisma/seed.ts`.
- Effective permissions at request time = role's permissions ∪ active `UserPermission` grants (including GTPE temporary grants) − active revocations, resolved in `AuthService.login/refresh/getMe` and baked into the JWT at issue time (see AUTH-001 in the tracker: this snapshot only refreshes on token refresh, not instantly).
- The `privileges` (GTPE) module additionally hydrates *live* temporary grants per-request via `hydrateTemporaryPermissions` middleware, so mid-session revocation of a temporary grant is enforced faster than a full permission change would be — but only within that module's own routes.

## Auth flow

```
POST /auth/login → bcrypt verify → issue access JWT (15m, embeds role+permissions+departmentId+sessionId)
                                  → issue random refresh token (rotated, hashed, stored as Session row)
POST /auth/refresh → look up Session by tokenHash → reuse-detection (revokes whole family if a
                      revoked token is replayed) → rotate → new access JWT
POST /auth/logout → revoke Session (refresh token only; already-issued access tokens remain valid
                     until natural 15m expiry — see AUTH-001)
```

`authenticate` middleware verifies JWT signature + `user.isActive` only; does not check session revocation per-request (by design, bounded by the 15m access token TTL).

## GTPE — "privileges" module (Temporary Grant of Privilege Escalation)

```
POST /privileges/request         (privileges:request)   → creates TemporaryPermissionRequest (PENDING),
                                                            snapshots requester's departmentId + requiredRole
                                                            (DEPT_ADMIN vs SYSTEM_ADMIN tier, from ApprovalPolicy)
GET  /privileges/pending         (privileges:approve|manage) → DEPT_ADMIN sees only own-department requests;
                                                                 SYSTEM_ADMIN sees all
POST /privileges/:id/approve     (privileges:approve|manage) → tier + department checked (dept check added
                                                                 by GTPE-001 fix) → creates grant row(s),
                                                                 status → APPROVED
POST /privileges/:id/reject      (privileges:approve|manage) → same guards (added by GTPE-001 fix) →
                                                                 status → REJECTED, notifies requester
POST /privileges/:id/cancel      (requester only, enforced in service layer) → status → CANCELLED
POST /privileges/grant           (privileges:grant|manage)   → direct admin grant, bypasses request flow
POST /privileges/grants/:id/revoke (privileges:grant|manage) → revokes an active grant early
(scheduler)                      privileges.scheduler.ts     → expires grants/requests past expiresAt
GET  /privileges/my/effective                                → live effective temporary permissions for caller
```

State machine: `PENDING → {APPROVED, REJECTED, CANCELLED}`, plus a scheduler-driven `→ EXPIRED` for approved grants past `expiresAt`. Not yet verified: whether the scheduler and `/grants/:id/revoke` path keep the request row and the grant row's status in sync (needs a Phase 3 follow-up pass).

## Automation module (ticket rule engine)

```
Ticket create/update in TicketsService → AutomationService.evaluateRules(ticket, trigger)
  trigger ∈ {ON_CREATE, ON_UPDATE, ON_STATUS_CHANGE}
  → built-in duplicate-ticket detection (ON_CREATE only, 24h window, case-insensitive title match)
  → for each active AutomationRule (priority order): evaluate conditions (AND-only — every condition
    must match, no OR/nested support) → if matched, run actions serially (ASSIGN_TO, SET_PRIORITY,
    SET_STATUS, ADD_COMMENT, SET_DEPARTMENT) → increment executionCount → write AutomationLog row
    (triggered: bool, actionsRun: string[])
  Entire evaluateRules() call is wrapped so failures never propagate to the ticket write path
  (intentional — see AUTO-001 for the associated observability gap: action failures are
  logged at `debug` only, invisible in production).
```

No retry, no dead-letter queue, no idempotency key — re-running the same trigger (e.g. a duplicate webhook/update) re-evaluates and can re-run actions.

## Email pipeline

```
Domain event → mail/recipient/{resolver,mapper,service} determines recipients
             → mail/template.engine.ts (Handlebars, apps/api/src/modules/mail/templates/*.hbs)
             → mail/email.provider.ts (Nodemailer)
             → mail/queue/email.queue.ts → mail/jobs/email.worker.ts (async send)
             → EmailLogService.log() persists to EmailLog (SENT|FAILED|PENDING, retryCount, error)
Admin-facing log viewer: GET /api/v1/mail/logs, /logs/:id (users:manage) — was broken/unwired
  dead code until EMAIL-001 fix.
```

Templates present: `incident-created`, `password-reset`, `system-announcement`, `ticket-created`, `ticket-assigned`, `ticket-resolved`, `sla-warning`, plus shared `layout.hbs`. Recipient resolution and retry/backoff logic in the queue/worker not yet traced in depth (Phase 5 follow-up).

## Database (Prisma, `apps/api/prisma/schema.prisma`)

44 models. Key clusters:
- **Identity/RBAC:** User, Role, Permission, RolePermission, UserPermission, TemporaryPermissionRequest(+Item), PermissionTemplate(+Item), ApprovalPolicy, Session
- **Ticketing:** Ticket, TicketComment, TicketAttachment, Category, Department, SlaPolicy
- **Incidents:** Incident, IncidentTicket, Service, ServiceStatusHistory, MaintenanceWindow
- **Assets/Inventory:** Asset, AssetHistory, AssetCategory, AssetAssignment, InventoryItem, InventoryTransaction, InventoryAllocation, InventoryReservation, Procurement, MaintenanceSchedule/Record/History, HealthConfiguration
- **Comms:** Notification, NotificationPreference, EmailLog, EmailPreference, PushSubscription, SystemNotification
- **Automation/Audit:** AutomationRule, AutomationLog, AuditLog
- **Knowledge base:** KnowledgeCategory, KnowledgeArticle, ArticleFeedback

## API modules (route-level auth coverage, from grep sweep — see RBAC-001/002 in tracker for gaps found)

`analytics, assets, audit*, auth, automation, categories, departments, email-preferences, incidents, inventory, knowledge-base, maintenance, notifications, permissions*, privileges, push, reports, roles*, service-status, settings*, sla, tickets, users`

`*` = modules where at least one route relies on `authenticate` alone with no `authorize()` — see RBAC-001 (fixed) and RBAC-002 (open, needs product decision) in the tracker.

## Tests

`apps/api/tests/{fixtures,unit,integration}/index.test.ts` and the `apps/web` equivalents are empty placeholders — no real coverage exists yet (TEST-001).
