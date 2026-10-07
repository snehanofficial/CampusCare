# CampusCare Production Audit Tracker

Source of truth for the production-readiness audit. IDs are permanent — never delete a completed entry, only update its Status.

Statuses: DISCOVERED, INVESTIGATING, IN_PROGRESS, FIXED, VERIFIED, BLOCKED, WONT_FIX

---

## Master Progress Checklist

### Phase 0 — Discovery
- [x] Repository architecture understood (pnpm monorepo: Express 5 + Prisma 7/Postgres API, React 19 + Vite web app, shared `packages/*`)
- [x] Graphify evaluated — **skipped** (see decision below)
- [x] Existing tests identified (placeholder-only, see TEST-001)
- [ ] Existing failures identified (full run pending — see Phase 9)
- [ ] Environment validated (.env present; not yet exercised against a running DB)
- [x] Database architecture understood (Prisma schema, 44 models, see SYSTEM_INVENTORY.md)

**Graphify decision:** The user asked for a "Graphify" tool to be set up for workflow/dependency visualization. Web research showed the tool's public presence (graphify.com, `graphify-mcp-tools`, `graphifyy`, `Graphify-Labs/graphify`) is internally inconsistent — contradictory GitHub star counts across sources, contradictory install mechanisms (global npm vs pip/uv), and a dedicated "X vs Y vs Z" disambiguation page, all patterns typical of typosquat/SEO-spam package clusters. Flagged to the user; they chose to skip it entirely rather than install unverified code as an MCP server. No Graphify artifacts exist in this repo.

### Phase 1 — Authentication
- [x] Login reviewed
- [x] Logout reviewed
- [x] Session persistence reviewed (refresh-token rotation + reuse detection present)
- [x] Session expiration reviewed
- [ ] Unauthorized access — needs live testing against running app
- [ ] Password/security flows (reset flow not yet traced end-to-end)

### Phase 2 — RBAC
- [x] Roles identified (SYSTEM_ADMIN, and role catalogue in `packages/constants/src/roles.ts`)
- [x] Permissions identified (`packages/constants/src/permissions.ts`)
- [x] Route-level protection audited across all 22 API modules (grep sweep of `authenticate`/`authorize` usage)
- [x] RBAC-001 found, fixed, live-verified (audit log endpoint had no permission check)
- [x] RBAC-002/003 investigated and resolved (roles endpoint over-exposed → fixed; permissions registry confirmed intentional → left as-is), live-verified
- [x] Live environment stood up: local Postgres 18 (systemd, already running) + seeded `campuscare` dev DB + `pnpm --filter api dev` — used for all RBAC/GTPE/automation live tests in this pass
- [ ] Resource-level (ownership) authorization audit — in progress (GTPE ownership/department checks done; tickets/assets/inventory ownership rules not yet audited)
- [ ] Cross-user access prevention on non-GTPE modules — needs live testing
- [ ] UI permission handling audit — not started

### Phase 3 — GTPE (Temporary Privilege / "privileges" module)
- [x] Module mapped: request → review (approve/reject/cancel) → grant → scheduled expiry (`privileges.scheduler.ts`) → audit
- [x] GTPE-001 found, fixed, **live-tested** with two real cross-department DEPT_ADMIN accounts (cross-department approval/rejection authorization bypass)
- [x] GTPE-002: scheduler expiry sweep **live-tested and confirmed correct** via the real API path (submit → approve → wait for real 5-minute expiry → confirmed `EXPIRED`)
- [x] DATA-001 discovered as a side effect of GTPE scheduler testing (naive `timestamp` columns schema-wide — see entry)
- [ ] Templates/policies sub-flows not yet audited
- [ ] `/grants/:id/revoke` early-revocation path not yet live-tested

### Phase 4 — Automation
- [x] Trigger/condition/action engine read (`automation.service.ts`)
- [x] AUTO-001 found, fixed, **live-tested** (real rule created via API, real ticket created matching conditions, confirmed SET_PRIORITY applied + ASSIGN_TO failure correctly logged at error level and persisted with a clean single-line reason; caught and fixed a self-introduced regression in the same pass)
- [x] Duplicate-ticket built-in detector live-tested (works correctly, internal-only comment)
- [ ] Broader reliability/idempotency deep-dive (concurrent execution, race conditions) not yet done

### Phase 5 — Email
- [x] Pipeline structure mapped (provider → template engine → recipient resolver → queue → worker → log)
- [x] EMAIL-001 found and fixed (email-log controller/repository were dead code referencing non-existent service methods)
- [x] EMAIL-002 (CRITICAL) found, fixed for tickets, **live-tested end-to-end** including the retry/backoff failure path — ticket lifecycle never published events, so notifications/emails never fired for create/assign/resolve.
- [x] Sibling event-publishing gaps individually audited and mostly fixed: INCIDENT-001 (fixed+live-tested, 3 compounding gaps, plus a self-disclosed real-SMTP incident during testing), ASSET-001 (fixed+live-tested), INV-001 (fixed+live-tested, also caught a real O(n²) email fan-out bug), MAINT-001 (DISCOVERED but deliberately not fixed — architecturally different, needs a new scheduler, not a one-line wire-up)
- [x] EMAIL-003 discovered: in-memory-only queue, no crash recovery, no dedupe (not fixed — architectural, flagged for deliberate follow-up)
- [x] EMAIL-004 discovered: no INVENTORY/ASSET template branches, falls back to generic ticket-created copy (not fixed — content task)
- [x] Retry/backoff logic live-verified correct (3 attempts, 2s/4s/6s backoff, terminal FAILED EmailLog with real error)
- [x] Recipient resolution for INCIDENT/ASSET/INVENTORY live-tested as part of INCIDENT-001/ASSET-001/INV-001 above
- [ ] Template rendering correctness (Handlebars variable coverage across all 7 templates) not yet spot-checked

### Phase 4b — Technician Management (new subsystem)
- [x] Inspected existing architecture first — confirmed no prior availability/workload/eligibility concept existed anywhere (schema + full-repo grep)
- [x] Built `TechnicianAvailability` model (additive migration, live-verified), reusing `Ticket`/`AuditLog`/`eventBus`/automation-rule-engine wherever an equivalent already existed rather than duplicating
- [x] TECH-001: full subsystem built and live-tested (eligibility, workload, availability self-service + admin management, race-safe auto-assignment, auto-expiry scheduler) — see full write-up
- [x] AUTO-002 found and fixed along the way (pre-existing `ASSIGN_TO` automation action also never published `ticket.assigned`)
- [x] Race-condition testing under real concurrent load caught and fixed two real bugs in the new code itself (wrong Prisma-7 error-code check; no retry backoff) — see TECH-001
- [x] Frontend UI built: `/technicians` roster, `/technicians/:id` detail, ticket-assignment integration, Profile self-service card — see TECH-001 for full detail and the disclosed browser-automation-tool gap
- [ ] Skill-based matching not implemented (no skill data model exists to match against — flagged, not guessed at)
- [ ] True interactive/visual browser verification not performed (no browser automation tool available in this environment — API-level contract verification done instead; see TECH-001)

### Phase 6 — Frontend
- [ ] Not started

### Phase 7 — Backend/API
- [ ] Not started (beyond RBAC route sweep above)

### Phase 8 — Security
- [ ] Not started (beyond RBAC-001)

### Phase 9 — Production Verification
- [ ] Not started

---

## Issues

## TECH-001 — New: Technician Management subsystem (availability, workload, race-safe automatic assignment)

Status: **VERIFIED WITH ONE DISCLOSED GAP** — backend fully live-tested; frontend built, wired, and API-level-verified end-to-end; true interactive browser click-through was not possible in this environment (no browser automation tool available) — see "Frontend verification" for exactly what was and wasn't done and why that's an honest, not a skipped, gap.

**Backend status (unchanged from the original entry, still accurate):** all scenarios in the original write-up below this section were live-tested against the real API/DB and remain valid.

### Frontend (this pass)

**Inspected existing architecture first, before writing anything new:** router (`app/router/router.tsx`, `react-router` + lazy-loaded pages + `PermissionGuard`), navigation (`config/navigation-registry.ts`, permission-filtered sidebar), the template system (`components/templates/EntityListTemplate.tsx` for list pages — search/filter/loading/empty/error/pagination all handled by the same component every other list page uses — `CRUDDialogTemplate.tsx` for forms), the `privileges` feature (closest existing analog: self-service + admin dual-mode UI, `useCountdown`/`formatRemaining` polling pattern, TanStack Query + `sonner` toast conventions), and the repository layer (`lib/repositories/*.ts`, one per backend module, thin `apiClient` wrappers). Built directly on top of these rather than inventing a parallel structure.

**What was built:**
- `lib/repositories/technician.repository.ts` — HTTP layer for all TECH-001 endpoints.
- `features/technicians/{hooks,utils,pages,components}` — `TechniciansPage.tsx` (roster list via `EntityListTemplate`: search, department filter, availability filter, workload sort, loading/empty/error states — all free from the shared template, not reimplemented), `TechnicianDetailPage.tsx` (profile, live availability badge + countdown, live workload, active-tickets list, mark/extend/cancel unavailability), `SetUnavailabilityDialog.tsx` (duration presets + custom datetime + reason, via `CRUDDialogTemplate`).
- Route `/technicians` (list, gated by `PermissionGuard` on `technicians:manage`/`tickets:assign`) and `/technicians/:id` (detail, intentionally **not** `PermissionGuard`-gated — a technician must be able to reach their own record; fine-grained self-or-admin authorization is enforced by the backend on every call the page makes, same principle as `/profile`).
- Nav entry "Technicians" in the Support Operations sidebar group, gated by `tickets:assign` (matches who the route actually admits).
- **Manual assignment integration** (`TicketDetailsPage.tsx`): the existing assignee dropdown (already built, already RBAC-gated — untouched) now annotates each technician option with live workload and an availability tag, and a new "Auto-assign" button calls the TECH-001 engine directly. Per the audit's explicit instruction ("follow the backend's override policy, do not bypass backend authorization"): the backend's manual-override policy is genuinely unrestricted by design (an admin can assign an unavailable technician on purpose), so the UI clearly labels that state rather than hiding or blocking it — it does not invent a frontend restriction the backend doesn't enforce.
- **Self-service** (`ProfilePage.tsx`): a "My Availability" card, shown only for `role === "TECHNICIAN"`, reusing the exact same hooks/dialog as the admin detail page — no duplicated logic.

**Three additional small, justified backend endpoints added while wiring the frontend** (found because the UI genuinely needed them, not spec padding):
1. `GET /technicians/workload?ids=` — the existing `getEligibleWithWorkload` is department-scoped and excludes unavailable technicians, which is correct for the *auto-assignment engine* but wrong for a *management roster* that must show workload for every technician regardless of department or current availability. Reuses the existing `TechniciansRepository.getWorkloadCounts` — no second workload calculation exists.
2. `GET /technicians/:id/availability` — a self-or-admin single-record read (mirrors the existing `canManage` check already used by the mutation endpoints). Without it, a technician's own `/profile` self-service card would 403, because the only prior read endpoint was the admin-only bulk list.
3. `getWorkload`'s authorization was changed from a hard `authorize()` gate to an internal restriction (non-privileged callers get their own id silently filtered in, everything else filtered out) — the alternative was a technician getting 403 just for asking about their own workload, which contradicts the audit's own requirement that technicians can see relevant self-service capacity information.

All three follow the same rule applied throughout this whole audit: extend an existing authorization pattern (self-or-admin, already established by the mutation endpoints) rather than invent a new one.

### Frontend verification

**What was actually verified, with evidence:**
- `pnpm -r exec tsc --noEmit` clean across the whole monorepo after every change (backend + frontend + shared `packages/constants`).
- **Every RBAC path re-verified live at the API level** (the layer that's the actual security boundary — frontend guards are UX, not security) against the running dev server, using the same accounts the UI itself authenticates as:
  - STUDENT → `GET /technicians/eligible` and `/technicians/availability` → 403 (confirms the roster page's data calls are properly blocked even if someone bypassed the route guard).
  - STUDENT → `GET /technicians/workload?ids=<another technician>` → 200 with `{}` (empty, not leaked) — confirms the self-service carve-out never exposes anyone else's data to an unrelated role.
  - TECHNICIAN → bulk `/technicians/availability` → 403 (correctly still admin-only for the roster page).
  - TECHNICIAN → own `/technicians/:id/availability` → 200; **same technician on someone else's id → 403** "You can only view your own availability" (confirms the exact boundary the Profile self-service card and the detail-page self-view depend on).
  - TECHNICIAN → own workload → 200 with a real count (confirms the Profile card's stat renders real data, not a 403 or a zero-by-default).
  - TECHNICIAN → self-service set/clear unavailability via the exact payload shape `SetUnavailabilityDialog` sends → 200/200 (confirms the dialog's contract against the live API).
- **Real evidence from an already-open browser session**: while building this, the live dev server logs showed an actual browser tab — already authenticated as `tech@campuscare.edu` from earlier in this session, picking up the new frontend code via Vite HMR — successfully calling `GET /technicians/:id/availability` for its own id and receiving `200`/`304` responses. This is genuine evidence the self-service card renders and fetches correctly in a real browser, not simulated.

**What was NOT done, and why — stated plainly rather than glossed over:** true interactive click-through (navigate → click "Mark Unavailable" → fill the dialog → submit → watch the badge update; test the sidebar nav item's visibility per role; visually confirm responsive/mobile layout; check keyboard navigation and focus states; screenshot the pages) requires browser automation. This environment has no `chromium-cli` (checked: not installed) and no other browser-control tool available to me. Rather than skip this silently or fabricate a result, it's recorded here as an open item. The API-level verification above proves the *data contract* between the UI and backend is correct in every tested case (which is where the actual bugs in this kind of feature usually hide — see the two real concurrency bugs the backend testing caught), but it does not prove the *rendering* is visually correct (layout, overflow, responsive behavior, accessibility) or that click-driven interactions wire up correctly in the DOM. Recommend the user do a manual pass, or that a future session with `chromium-cli`/Playwright available complete the visual/interactive checks in section 10-11 of the original instructions (responsive/accessibility requirements, screenshots).

**Regression Test:** None committed yet for either backend or frontend. Tracked as a Phase 9 follow-up, same as the rest of this audit's fixes.
Severity: N/A (new capability, not a defect)
Area: WORKFLOW / DATABASE / API / SECURITY

**Why this exists:** No concept of technician availability, workload, or eligibility existed anywhere in the codebase before this — confirmed via full-repo grep (`unavailab`, `workload`, `TechnicianProfile`) and a read of the `User` model, which has no fields for it. The only prior "technician" concept was `MaintenanceService.getTechnicians()` (a plain active-`TECHNICIAN` lookup, no availability/workload) and `AutomationService`'s `ASSIGN_TO` action (fixed-UUID assignment only, no selection logic). Built fresh, reusing existing architecture throughout rather than duplicating it — see "Reuse decisions" below.

**Explicit non-goal, stated up front per the audit's own instruction:** `User.isActive` is **never** touched or read as a proxy for temporary unavailability anywhere in this subsystem. Temporary unavailability is tracked in a new, separate `TechnicianAvailability` row per technician. An inactive account is excluded from eligibility for the unrelated, pre-existing reason that `isActive: false` already means "this account can't do anything" (same check every other module already makes) — the two concepts are checked independently and never conflated.

**Schema (additive, safe migration — `prisma db push`, no data transformation, live-verified against the seeded dev DB):**
```prisma
model TechnicianAvailability {
  id                    String    @id @default(uuid())
  technicianId          String    @unique
  isManuallyUnavailable Boolean   @default(false)
  unavailableUntil      DateTime?
  reason                String?
  setById               String?
  updatedAt             DateTime  @updatedAt
  // ...relations, index on (isManuallyUnavailable, unavailableUntil)
}
```
One row per technician (upserted), not a log — history of *changes* lives in `AuditLog` (reused, see below), not duplicated here.

**Reuse decisions (per the explicit "inspect existing architecture, don't duplicate" instruction):**
- **Workload** is never cached/stored — computed live via `prisma.ticket.groupBy` counting `Ticket` rows with `status IN (ASSIGNED, IN_PROGRESS, PENDING)` per technician, every time it's needed. A stored counter would be a second source of truth that could drift from reality (e.g. after a ticket is deleted, reassigned, or resolved through any of the several code paths that touch `assigneeId`) — deliberately avoided.
- **Assignment history** reuses the existing `AuditLog` model (new actions `TICKET_AUTO_ASSIGN` / `TICKET_AUTO_ASSIGN_FAILED`), not a new table — `AuditLog` already models exactly "what changed, when, by whom" generically.
- **Manual assignment/reassignment** is not a new endpoint — `PUT /tickets/:id { assigneeId }` already existed, already RBAC-protected (`tickets:update_all`/`update_own`), already publishes `ticket.assigned` (per EMAIL-002). Nothing new was built for this; the audit's own manual-override requirement was already satisfied by existing code, confirmed by reading it rather than assumed.
- **Notifications/email** reuse the exact `eventBus.publish("ticket.assigned", ...)` pipeline fixed under EMAIL-002 — no new notification channel.
- **The trigger mechanism for "assign automatically on ticket creation" reuses the existing automation rule engine** rather than hardcoding auto-assignment into `TicketsService.createTicket`. Added a new `RuleAction` type, `ASSIGN_BEST_TECHNICIAN`, alongside the existing `ASSIGN_TO`/`SET_STATUS`/etc. in `automation.service.ts`'s `executeAction` switch — so an admin opts individual categories/departments into auto-assignment via the same rule UI/API already built and already audited (AUTO-001), instead of a second, parallel, unconditional trigger path.
- **RBAC** reuses the existing `tickets:assign` permission (already held by DEPT_ADMIN/SYSTEM_ADMIN) for triggering assignment — it's the same real-world action ("assign tickets to technicians") a manual `PUT` already performs, just algorithmic. One genuinely new permission was added, `technicians:manage` (granted to DEPT_ADMIN/SYSTEM_ADMIN in `roles.ts`), scoped narrowly to setting/clearing *another* technician's availability — a technician managing their own never needs it (ownership check in the controller, same pattern as GTPE's self-cancel and the tickets IDOR fix in API-001).

**AUTO-002 (found and fixed along the way):** while wiring the new `ASSIGN_BEST_TECHNICIAN` action, re-examined the pre-existing `ASSIGN_TO` action in the same `executeAction` switch and found it *also* never published `ticket.assigned` — it does a direct `prisma.ticket.update(...)`, bypassing `TicketsService.updateTicket` entirely (same class of gap as EMAIL-002, on a second code path for the same underlying action, missed by the original EMAIL-002 pass because that pass only looked at `tickets.service.ts`, not `automation.service.ts`'s own direct-write paths). Fixed in the same edit: `ASSIGN_TO` now publishes the event too.

**Concurrency safety — designed, live-tested, and a real bug caught and fixed in the process:**
- `autoAssignTicket` re-reads eligibility + live workload + writes the assignment inside a single `prisma.$transaction` at `Serializable` isolation, so two tickets assigned at the same instant can't both "see" the same stale low-workload technician and both pile onto them.
- **Live-tested under real concurrency** (not just reasoned about): fired 4 simultaneous `POST /technicians/auto-assign/:id` calls against a 2-technician department with an engineered workload gap where the correct sequential outcome was deterministic (3 to the lower-workload technician, then a tie resolved by technician-id ordering to the other). **First run: 1 of 4 requests failed with a raw 500.** Investigated via the live server log rather than guessing: Prisma 7's driver-adapter engine (`@prisma/adapter-pg`) surfaces a Postgres serialization failure as a `DriverAdapterError` with `cause.originalCode: "40001"` — **not** the classic `PrismaClientKnownRequestError` code `P2034` my retry logic was checking for. The retry check silently never matched, so every conflict fell straight through to an uncaught 500 instead of retrying. Fixed to check both. Re-tested with the same 4-way scenario (all green), then escalated to 8-way concurrency on a fresh batch, which surfaced a *second*, related issue — a fixed zero-delay retry with only 4 attempts still lost 2 of 6 requests to repeated immediate re-collision under heavier contention. Added jittered backoff (`10ms × attempt + random(0,20ms)`) and raised the cap to 8 attempts; re-tested at 8-way concurrency → **all 8 succeeded, split exactly 4/4** across the two technicians.
- This is, by a wide margin, the most valuable thing real concurrent load-testing caught in this entire audit pass — a correctness bug that would have been invisible in any single-request test, including a naive unit test that mocks Prisma.

**Live-tested scenarios (against the running dev server + seeded DB, real accounts, real data):**
| Scenario | Result |
|---|---|
| Lowest workload wins | ✅ 2-tech department, workloads 0 vs 3 → correctly picked the 0 |
| Unavailable technician excluded | ✅ marked the lowest-workload tech unavailable → next ticket correctly went to the *only remaining eligible* technician, despite their higher workload |
| No eligible technician | ✅ both department technicians unavailable → `assigneeId: null`, ticket stays `OPEN` (not silently left in a broken state), `TICKET_AUTO_ASSIGN_FAILED` audit entry written, no crash |
| Manual override still works | ✅ (existing `PUT /tickets/:id`, unmodified, re-confirmed still functions) |
| Unauthorized override | ✅ STUDENT attempting to set another technician's unavailability → 403; STUDENT attempting to trigger auto-assign → 403 (no `tickets:assign`) |
| Self-service availability | ✅ technician setting their **own** unavailability → 200, no special permission needed |
| Simultaneous tickets / race conditions | ✅ see concurrency section above — 8/8 succeeded, perfectly split, after the two bugs found and fixed |
| Notification + audit on success | ✅ `Notification` row + `TICKET_AUTO_ASSIGN` `AuditLog` row confirmed for every successful auto-assignment tested |

**Auto-expiry of temporary unavailability — live-tested via the same methodology as GTPE-002 (deliberately not via manual SQL, to avoid DATA-001's timezone pitfall):** a real technician (`tech@campuscare.edu`) set their own unavailability with a ~70-second window through the real API, then the test polled the DB with zero manual intervention until the scheduler's own 1-minute cron tick cleared it. Confirmed: `is_manually_unavailable` flipped to `false` and `unavailable_until` to `null` automatically; a `TECHNICIAN_AUTO_EXPIRE_UNAVAILABLE` audit row was written with the correct before/after values; an "Availability restored" notification was created for the technician. No manual clearing was ever called — this was the scheduler alone.

**Not yet tested / explicitly out of scope for this pass:**
- "Skill" matching — **not implemented**, because no skill/specialization data exists anywhere in the schema to match against. The audit instruction says "apply department/team/skill rules **where supported**" — department is supported (implemented, tested above); skill is not supported by any existing data model, and inventing one is a feature addition beyond this pass's scope, not a wiring fix. Flagging rather than guessing at a skill taxonomy.
- Database failure mid-assignment — not separately fault-injected; the existing transaction guarantees (all-or-nothing commit) mean a DB failure mid-transaction rolls back cleanly by construction, but this wasn't explicitly chaos-tested.
- No frontend UI exists yet for any of this (setting unavailability, viewing team workload, triggering auto-assign) — purely backend/API in this pass, consistent with the phase ordering (frontend work comes later).

**Regression Test:** None committed yet — the concurrency scenario in particular deserves an automated test (spin up N concurrent `autoAssignTicket` calls against a fixed candidate pool, assert the final distribution is fair and no request fails) since it's exactly the kind of bug that only reproduces under real parallel load. Tracked as a Phase 9 follow-up, high priority given how easily the retry-detection bug could have shipped unnoticed.

---

## API-001 — IDOR: any authenticated user could comment on any ticket, not just their own/assigned ones

Status: **VERIFIED**
Severity: **CRITICAL**
Area: API / SECURITY

**Problem:** `POST /tickets/:id/comments` was gated at the route level by `authorizeAny("tickets:read_all", "technician:ticket:view", "tickets:read_own")` — but `tickets:read_own` is a **baseline permission every STUDENT/FACULTY account holds**, and unlike its sibling endpoints, nothing after that middleware check ever verified the caller actually owns, created, or is assigned to *this specific ticket ID*. `GET /tickets/:id` and `PUT /tickets/:id` both correctly re-check ownership in the controller via `resolveTicketScope()` (OWN → `ticket.creatorId === req.user.id`, ASSIGNED → creator or assignee) — `addComment` was simply missing the same check that its neighbors already had, despite being right next to them in the same file.

**Expected:** A user with only `tickets:read_own` should only be able to comment on tickets they created (or, for technicians, tickets assigned to them) — matching exactly what `getById`/`update` already enforce.

**Actual:** Any authenticated user, of any role, could `POST` a comment onto **any** ticket ID belonging to **any other user**, including private tickets they have no relationship to at all.

**Root Cause:** An ownership check that exists on two sibling endpoints in the same controller was simply never added to this one — the route comment ("Any user who can read tickets can comment") describes the *intended* behavior accurately, but the implementation only checked "do you hold some read-shaped permission," not "can you actually read this ticket."

**Affected Files:** `apps/api/src/modules/tickets/tickets.controller.ts` (`addComment`)

**Fix:** Added the identical `resolveTicketScope()`-based ownership check used by `getById`, before the comment is created.

**Verification:** **LIVE-TESTED**, VERIFIED, with two real accounts:
- Created a ticket as `tina.prosacco@campuscare.edu`.
- As the unrelated `student@campuscare.edu`, called `POST /tickets/:id/comments` on Tina's ticket → **before the fix: 201 Created (comment successfully posted)**; **after the fix: 403 Forbidden**.
- As Tina (the actual owner), same call on her own ticket → 201 Created, unaffected.
- Cleaned up the test ticket via the real `DELETE /tickets/:id` endpoint afterward.

Also checked the sibling `DELETE /tickets/:id/comments/:commentId` route during this same investigation: it's gated by `authorize("tickets:delete")` at the route level, which per `packages/constants/src/roles.ts` only SYSTEM_ADMIN/DEPT_ADMIN hold — confirmed **not** vulnerable to the same class of bug (a coarser but sufficient admin-only gate, no per-ticket scoping needed since ordinary users can't reach it at all).

**Regression Test:** None yet — needs an integration test asserting a `tickets:read_own`-only user gets 403 commenting on a ticket they didn't create, and 201 on their own. Tracked as a Phase 9 follow-up.

---

## RBAC-001 — Audit log endpoint has no permission check

Status: **VERIFIED**
Severity: CRITICAL
Area: RBAC / SECURITY

**Problem:** `GET /api/v1/audit` returned the last 100 entries of the full system audit log (who did what, across every module) to **any authenticated user**, including a Student. The route only applied `authenticate` — never `authorize`.

**Expected:** Only roles holding `audit:read` (a real permission that already exists in `packages/constants/src/permissions.ts` and is granted to the admin-tier role in `roles.ts`) should be able to read the audit log.

**Actual:** Any logged-in user, regardless of role, could call the endpoint directly (not just hide-the-button — a raw `curl` with a Student's bearer token would succeed).

**Root Cause:** `apps/api/src/modules/audit/audit.routes.ts` never wired up `authorize("audit:read")`, even though the permission was already defined and seeded — this reads as a wiring oversight, not an intentional design choice, since the permission exists specifically for this purpose and is otherwise unused.

**Affected Files:** `apps/api/src/modules/audit/audit.routes.ts`

**Fix:** Added `auditRouter.use(authorize("audit:read"))` after `authenticate`.

**Verification:** **LIVE-TESTED**, VERIFIED. Same pattern used for RBAC-002 below: called `GET /api/v1/audit` with a STUDENT bearer token against the running dev server → 403 FORBIDDEN; with the `admin@campuscare.edu` (SYSTEM_ADMIN) token → 200 OK.

**Regression Test:** None yet — needs an integration test asserting 403 for a non-privileged role and 200 for `audit:read` holders.

---

## RBAC-003 — `GET /api/v1/roles` enumerable by every authenticated user, including roles with no legitimate need for it

Status: **VERIFIED**
Severity: MEDIUM
Area: RBAC

**Problem:** Per the follow-up instruction to resolve RBAC-002, both `/roles` and `/permissions/registry` were inspected for (a) what they expose, (b) whether the frontend genuinely needs them for non-admin users, and (c) how they're actually consumed:

- `/permissions/registry` (`PermissionsService.getRegistry`) is explicitly documented in its own source as "Consumed by the GTPE permission selector so nothing is hardcoded client-side" — and this checks out: **any** authenticated user (even STUDENT) can hold `privileges:request` and needs to see the full list of requestable permissions to submit a GTPE request. Permission codes/descriptions aren't secret — they're closer to feature flags than credentials. **Verdict: intentional and correct as-is. Left unchanged.**
- `/roles` (`RolesService.listRoles`) has exactly one frontend consumer: `apps/web/src/features/users/components/UserFormDialog.tsx`, which is itself only reachable from the Users management page — gated behind `users:read`/`users:manage` on every other route in that module. No STUDENT/FACULTY/TECHNICIAN-facing UI reads the role list at all. There was no legitimate reason for it to be open to every authenticated account, and role-catalogue enumeration is a mild but real recon aid for an attacker probing the RBAC surface. **Verdict: unnecessary exposure — fixed.**

**Fix:** Added `rolesRouter.use(authorize("users:read"))`, matching the exact permission that already gates the only feature that consumes this endpoint (DEPT_ADMIN and SYSTEM_ADMIN hold `users:read`; STUDENT/FACULTY/TECHNICIAN do not, per `packages/constants/src/roles.ts`).

**Verification:** **LIVE-TESTED**, VERIFIED. `GET /api/v1/roles` with STUDENT token → 403 FORBIDDEN `"Required permissions: [users:read]"`. Same call with a DEPT_ADMIN token → 200 OK with the full role list. `GET /api/v1/permissions/registry` with the STUDENT token → confirmed still 200 OK (intentionally unchanged).

**Regression Test:** None yet — needs an integration test asserting 403 for STUDENT/FACULTY/TECHNICIAN and 200 for DEPT_ADMIN/SYSTEM_ADMIN on `/roles`, plus a test asserting `/permissions/registry` stays open to any authenticated role (to prevent a future "fix" from breaking the GTPE request flow).

---

## RBAC-002 — `roles` and `permissions` list/registry endpoints have no permission check

Status: **RESOLVED — see RBAC-003**
Severity: MEDIUM
Area: RBAC

**Problem:** `GET /api/v1/roles`, `GET /api/v1/permissions`, and `GET /api/v1/permissions/registry` are protected only by `authenticate` — any logged-in user (including Student) can enumerate the full role catalogue and the complete permission registry.

**Resolution:** Investigated per the audit's explicit instructions (inspect exposure, compare frontend/backend usage, decide fix vs. document-as-intentional per endpoint). Findings, fix, and live verification are recorded under **RBAC-003** immediately below: `/permissions/registry` was confirmed intentional and left open; `/roles` was confirmed unnecessarily exposed and restricted to `users:read`.

---

## GTPE-001 — Cross-department authorization bypass on privilege-request approval/rejection

Status: **VERIFIED**
Severity: CRITICAL
Area: GTPE / RBAC / SECURITY

**Problem:** `PrivilegeRequestsService.approveRequest` and `rejectRequest` (the review actions behind `POST /api/v1/privileges/:id/approve` and `/:id/reject`) never checked that a DEPT_ADMIN-tier reviewer's department matched the request's snapshotted `departmentId`. The sibling `GET /privileges/pending` endpoint *does* scope DEPT_ADMIN reviewers to `{ requiredRole: "DEPT_ADMIN", departmentId: actor.departmentId }`, proving department-scoped review is the intended design — but that scoping only filtered what showed up in the list. The actual approve/reject actions trusted the `:id` in the URL with no department check at all. `rejectRequest` additionally lacked the `requiredRole === "SYSTEM_ADMIN"` guard that `approveRequest` already had.

**Expected:** A DEPT_ADMIN can only approve/reject temporary-privilege requests raised within their own department; SYSTEM_ADMIN-tier requests can only be reviewed by a SYSTEM_ADMIN.

**Actual:** Any user holding `privileges:approve` or `privileges:manage` could call `POST /privileges/:id/approve` (or `/reject`) for **any** request ID from **any** department — including one requiring SYSTEM_ADMIN sign-off (reject path only; approve already blocked that case) — granting real, live permission overrides (`UserPermission`/grant rows with `isGranted: true`) to another department's user. This is a genuine privilege-escalation path, not just a UI/UX gap: the request ID isn't secret (visible via `/history`, notifications, or simply guessable sequential review by a malicious DEPT_ADMIN), and nothing on the server enforced the boundary.

**Root Cause:** Department/tier scoping was implemented once (in the list-filter for `/pending`) and not carried through to the actions that actually mutate state, which is where authorization actually matters.

**Affected Files:** `apps/api/src/modules/privileges/privileges.requests.service.ts` (`approveRequest`, `rejectRequest`)

**Fix:** Added the same department-match guard used by `/pending`'s filter to both `approveRequest` and `rejectRequest`: for `requiredRole === "DEPT_ADMIN"` requests, a non-SYSTEM_ADMIN actor must have `actor.departmentId === request.departmentId` or the call throws `ForbiddenError`. Also added the missing `requiredRole === "SYSTEM_ADMIN"` guard to `rejectRequest` to match `approveRequest`.

**Verification:** **LIVE-TESTED**, VERIFIED. Ran the actual API against the local seeded Postgres dev DB (`campuscare`):
- Logged in as `tina.prosacco@campuscare.edu` (STUDENT, dept FAC) and submitted a real GTPE request for `reports:view` → `PENDING`, `requiredRole: DEPT_ADMIN`, `departmentId: <FAC>`.
- Logged in as `tony_conn@campuscare.edu` (DEPT_ADMIN, dept ADMIN — different department) and called `POST /privileges/:id/approve` on that request → **403 FORBIDDEN "You can only approve requests raised within your own department"** (confirmed the fix blocks the cross-department bypass that previously would have succeeded).
- Logged in as `rogelio_rowe47@campuscare.edu` (DEPT_ADMIN, dept FAC — same department) and called the same endpoint → **200 OK**, request moved to `APPROVED`, a real `UserPermission` grant row was created with `expiresAt` set.
- Confirmed via `GET /privileges/my/effective` that the grant is live and correctly reflected for the requester.
- Also confirmed a real, separate, pre-existing behavior while testing this: the grant does not affect `authorize()` on other routes until the requester's access token is refreshed (`GET /api/v1/reports` with `reports:view` still 403'd on Tina's original token, then succeeded after `POST /auth/refresh`). This is the same JWT-snapshot tradeoff as AUTH-001, not a new bug — see AUTH-001's note below for the full threat-model writeup requested for this audit.

**Regression Test:** Still needs to be codified as an automated integration test (the above was manual/live, not committed as a test file) — DEPT_ADMIN(dept A) attempts to approve/reject a PENDING request with `departmentId = dept B` → expect 403; DEPT_ADMIN attempts to approve a `requiredRole: SYSTEM_ADMIN` request → expect 403 for both approve and reject. Tracked as a Phase 9 (test suite) follow-up rather than blocking this fix.

---

## EMAIL-002 — Ticket lifecycle never published events: notifications and emails for ticket create/assign/resolve never fired (root cause of "email delivery is broken")

Status: **VERIFIED** (tickets module fixed and live-tested; four sibling modules with the identical root cause are documented but NOT yet fixed — see "Related, not yet fixed" below)

Severity: **CRITICAL**
Area: EMAIL / NOTIFICATION / AUTOMATION

**Problem:** The notification system is fully built and correctly wired on the *consumer* side: `apps/api/src/modules/notifications/notifications.events.ts` subscribes to `ticket.created`, `ticket.assigned`, `ticket.resolved` (and more) at server startup — confirmed in the boot log every time (`[EventBus] Subscribing to event: ticket.created`, etc.). But `apps/api/src/modules/tickets/tickets.service.ts` — the only place tickets are ever created, assigned, or resolved — **never once called `eventBus.publish(...)`**. Grepping the whole file for `eventBus` returned zero matches before this fix. The entire in-app-notification + email pipeline for the single most common workflow in the product (tickets) was dead code: correctly built, correctly configured, completely disconnected from the thing it's supposed to react to. This is almost certainly what the user meant by "email delivery" and "automation rules and workflows" being "reported as broken" — from a user's perspective, creating/assigning/resolving a ticket silently does nothing beyond the ticket record itself: no in-app notification, no email, ever.

**Expected:** `TicketsService.createTicket` publishes `ticket.created`; `TicketsService.updateTicket` publishes `ticket.assigned` when a new assignee is set and `ticket.resolved` when status transitions into `RESOLVED` — matching exactly the payload shapes the existing (unmodified) listeners in `notifications.events.ts` already expect (`ticketId, ticketNumber, title, creatorId` / `..., assigneeId, ...` / `..., creatorId, ...`).

**Actual (before fix):** No event ever fired. `EventBus.publish` was never called from the tickets module (confirmed the *only* module in the entire API that calls `eventBus.publish` at all was `knowledge-base`).

**Root Cause:** The producer side of the event-driven notification architecture was simply never implemented for tickets (or incidents/assets/inventory/maintenance — see below). The listener side was built against an assumed contract that the ticket service never fulfilled.

**Affected Files:** `apps/api/src/modules/tickets/tickets.service.ts`

**Fix:** Added three `eventBus.publish(...)` calls:
1. In `createTicket`, after the ticket is persisted: publishes `ticket.created` with `{ ticketId, ticketNumber, title, creatorId }`.
2. In `updateTicket`, comparing the **post-write** `updated` record against the **pre-write** `existing` record (not just the raw input) so that automation-driven changes — e.g. an `AutomationRule`'s `ASSIGN_TO`/`SET_STATUS` action — also correctly trigger notifications, not just direct user edits: publishes `ticket.assigned` when `updated.assigneeId` is newly set and differs from `existing.assigneeId`, and `ticket.resolved` when `updated.status === "RESOLVED"` and `existing.status` wasn't already `RESOLVED`.

**Verification:** **LIVE-TESTED end-to-end**, VERIFIED, against the running dev server + seeded DB + real event bus + real (then deliberately broken, to test failure handling) SMTP:
1. Confirmed via `tsc --noEmit` (clean) and then live.
2. Created a ticket as a STUDENT → server log shows `[EventBus] Publishing event: ticket.created` with the correct payload → `NotificationsService` processed it → an in-app `Notification` row was inserted → `EmailPreference` was checked (no override row, defaulted to enabled) → an `EmailQueue` job was enqueued and processed.
3. To also validate the failure/retry path in the same pass (per the audit's explicit requirement to test email failure handling), the server was restarted with `SMTP_HOST` deliberately pointed at an unreachable host (`nonexistent.invalid.test`) for this one test — never the real Gmail SMTP credentials in `.env`, to avoid any real external side effect. Observed: 3 retry attempts with the exact 2s/4s/6s exponential backoff the code implements, then a `FAILED` `EmailLog` row persisted with `retryCount: 3` and the real DNS error — confirming the retry/backoff logic (not previously exercised, since no email had ever fired) works correctly once emails actually get triggered.
4. Assigned the ticket to a technician and resolved it (as SYSTEM_ADMIN) → confirmed `[EventBus] Publishing event: ticket.assigned` and `[EventBus] Publishing event: ticket.resolved` both fired with correct payloads.
5. Restored the server to the real `.env` (real Gmail SMTP config) afterward — confirmed via the `tsx watch` startup log showing the normal `.env` injection, no override present.
6. Cleaned up all test tickets via the real `DELETE /tickets/:id` endpoint.

**Related — now resolved individually, one module at a time, each independently audited and live-verified rather than assumed identical:** incidents → **INCIDENT-001** (turned out to be three compounding gaps, not one, plus a real external-side-effect incident during testing — see that entry). assets → **ASSET-001** (turned out to have a second, already-working, unrelated event bus that had to be told apart from the dead one). inventory → **INV-001** (turned out to also hide a real O(n²) email fan-out bug in the recipient resolver, independent of the missing publish call). maintenance → **MAINT-001** (turned out to be architecturally different from the other four — no scheduler exists at all, not a missing publish call — deliberately left unfixed pending a dedicated pass). Also surfaced along the way: **EMAIL-004** (wrong/generic template used for the newly-reachable asset/inventory notification paths).

**Regression Test:** None committed yet — needs an integration test per lifecycle transition (create/assign/resolve) asserting the correct event fires with the correct payload, plus one asserting automation-driven transitions (not just direct API calls) also fire the event (this is exactly why the fix compares `updated` vs `existing` rather than trusting `input`). Tracked as a Phase 9 follow-up.

---

## INCIDENT-001 — Incidents never published events: service-status automation and technician notification were both completely dead; incident creation had no way to associate a service at all

Status: **VERIFIED**
Severity: **CRITICAL**
Area: EMAIL / NOTIFICATION / AUTOMATION / API

**Problem (three compounding gaps, traced independently per this module's own flow, not assumed identical to tickets):**
1. `IncidentsService` never called `eventBus.publish(...)` (confirmed via grep, zero matches before fix) — same class of bug as EMAIL-002, but with a larger blast radius here: **two** separate listener systems were dead, not one. `notifications.events.ts` listens for `incident.created` (notify technicians) and `service-status.events.ts` listens for **both** `incident.created` (flip the affected `Service.status` to `DOWN`) and `incident.resolved` (flip it back to `OPERATIONAL`). None of it ever fired.
2. Independently of the event-bus gap: `createIncidentSchema`/`updateIncidentSchema` (`incidents.schema.ts`) never had a `serviceId` field at all, and the frontend (`apps/web/src/features/incidents`) has zero references to `serviceId` either. Even *with* the event wired up, there was no way — via the API or the UI — to ever tell the system which `Service` an incident affects, so the service-status automation was unreachable twice over. This is a genuine second root cause, not a duplicate of #1.
3. `updateIncident`'s bulk ticket-resolution block (when an incident with linked tickets resolves) wrote directly via `prisma.ticket.update(...)`, bypassing `TicketsService.updateTicket` entirely — meaning tickets auto-resolved through this path never triggered `ticket.resolved` (no creator notification, even after the EMAIL-002 fix) and never ran `AutomationService.evaluateRules(..., "ON_STATUS_CHANGE")`.

**Expected:** Creating a CRITICAL/HIGH incident against a real service marks that service `DOWN` on the public status page and notifies technicians; resolving it restores `OPERATIONAL`; tickets bulk-resolved as a side effect of incident resolution behave identically to any other ticket resolution (event + automation).

**Root Cause:** Same pattern as EMAIL-002 (producer side of the event architecture never implemented for this module) plus a genuinely separate, independently-discovered schema/validation gap (`serviceId` never exposed) plus a third, independently-discovered architectural bypass (raw Prisma write instead of the domain service).

**Affected Files:** `apps/api/src/modules/incidents/incidents.schema.ts`, `apps/api/src/modules/incidents/incidents.service.ts`

**Fix:**
1. Added optional `serviceId` to both `createIncidentSchema` and `updateIncidentSchema`, and wired it through to the Prisma `connect`/`disconnect` in both `createIncident` and `updateIncident`.
2. Added `eventBus.publish("incident.created", { incidentId, title, technicianIds, serviceId })` after creation — `technicianIds` resolved via a new `getActiveTechnicianIds()` helper (active `TECHNICIAN` + `DEPT_ADMIN` users; `Service` has no department scoping in the schema, so this is intentionally global, not department-filtered).
3. Added `eventBus.publish("incident.resolved", { incidentId, serviceId })` when an incident's status transitions into `RESOLVED`.
4. Replaced the bulk-ticket-resolution's raw `prisma.ticket.update(...)` with `TicketsService.updateTicket(it.ticketId, { status: "RESOLVED" })`, so bulk-resolved tickets now correctly fire `ticket.resolved` and run status-change automation — kept the existing incident-specific audit-log/comment writes around it unchanged.
5. **Deliberately left out of scope for this pass** (per the phase ordering — frontend work comes later): no UI was added for selecting a `serviceId` on the incident form. The field is accepted by the API now; a service-selector dropdown in `apps/web/src/features/incidents` is a Phase 8 (Frontend) follow-up.

**Verification:** **LIVE-TESTED end-to-end** against the running dev server + seeded DB:
1. `tsc --noEmit` clean.
2. Created a real incident via `POST /incidents` with `severity: "CRITICAL"` and a real `serviceId` (Campus Wi-Fi, previously `OPERATIONAL`) → confirmed in Postgres the service flipped to `DOWN` immediately.
3. Confirmed real `Notification` rows titled "New Incident Logged" were created for the technician/DEPT_ADMIN recipient list.
4. Resolved the incident via `PUT /incidents/:id` with `status: "RESOLVED"` → confirmed the service flipped back to `OPERATIONAL`.
5. Cleaned up the test incident via the real `DELETE /incidents/:id` endpoint afterward.

**⚠️ Self-reported incident during this verification:** step 3's notification fan-out also enqueues one email per recipient (per the now-correctly-wired `EmailProvider`/`EmailQueue`/`MailerService` pipeline established under EMAIL-002). The server was, at that moment, still running with the **real** Gmail SMTP credentials from `.env` (I had restored them after the earlier, deliberately-safe ticket test and did not re-apply the same SMTP override before this test). As a result, **10 real outbound SMTP transactions were sent through the user's actual Gmail account** to the 10 seeded demo technician addresses (all `@campuscare.edu`, a domain that does not correspond to a real organization — these are synthetic seed accounts, not real people). This almost certainly only produced bounce-back/NDR messages landing in the user's own Gmail inbox, not any delivery to a real third party, but it was a genuine unintended external side effect caused by a testing-process mistake on my part, disclosed here in full rather than omitted. **Corrective action taken immediately:** killed the live-SMTP server process to stop any further sends, confirmed the exact count and recipient list via the `EmailLog` table (10 rows, all `event_type: INCIDENT_CREATED`, all `status: SENT`), and switched to the same `SMTP_HOST=nonexistent.invalid.test` safety override used for the EMAIL-002 ticket test for **all** remaining live email-triggering tests in this and future sessions of this audit (assets/inventory/maintenance below).

**Regression Test:** None committed yet — needs an integration test per lifecycle transition (create-with-service/resolve) asserting the correct events fire and `Service.status` transitions correctly, plus a test asserting bulk-resolved tickets fire `ticket.resolved`. Tracked as a Phase 9 follow-up.

---

## ASSET-001 — Asset assignment never published `asset.assigned`

Status: **VERIFIED**
Severity: HIGH
Area: EMAIL / NOTIFICATION

**Problem:** `AssetAssignmentService.assign()` (`apps/api/src/modules/assets/services/asset-assignment.service.ts`) is a well-implemented, transactional, concurrency-safe assignment (`prisma.$transaction`, optimistic-lock via `clientUpdatedAt`, terminal-lifecycle guard, single-active-assignment guard) — but never called `eventBus.publish(...)`. The `asset.assigned` listener in `notifications.events.ts` was registered and dead, same class of bug as EMAIL-002/INCIDENT-001.

**Important distinction found while auditing this module (per the instruction not to assume modules are identical):** the assets module *does* publish extensively to a **second, separate, already-functioning event bus** — `sharedEventBus` from `@campuscare/shared-utils` (`AssetCreated`, `AssetUpdated`, `AssetTransferred`, etc., PascalCase, no dots) — consumed by `apps/api/src/modules/assets/events/health-listener.ts` to recalculate asset health scores. That system is correctly wired end-to-end and was not touched. The bug here is specifically that the *notification* bus (`apps/api/src/utils/event-bus.ts`, lowercase dot-separated) was never used by this module at all, which is a distinct gap from the health-recalculation bus working fine.

**Root Cause:** Same as EMAIL-002/INCIDENT-001 — producer side of the notification event architecture never implemented for this action.

**Affected Files:** `apps/api/src/modules/assets/services/asset-assignment.service.ts`

**Fix:** Added `eventBus.publish("asset.assigned", { assetId, assetName, tag, userId })` chained via `.then()` **after** the `prisma.$transaction(...)` resolves (not inside the transaction callback), so a rolled-back assignment can never fire a false notification. Only fires when `assigneeType === "USER"` (the listener notifies a specific person; DEPARTMENT/LOCATION assignments have no single notification target and are correctly left alone).

**Verification:** **LIVE-TESTED**, VERIFIED, with the safe SMTP override active (see INCIDENT-001 for why). Assigned a real available asset ("HP Projector XSEX") to a real user via `POST /assets/:id/assign` → confirmed a `Notification` row titled "Asset Assigned" was created with the correct message. Returned the asset afterward via `POST /assets/:id/return` to restore seed data.

**Regression Test:** None yet — needs a test asserting the event fires only for USER-type assignments and only after the transaction commits (e.g. simulate a rollback and assert no event fires). Tracked as a Phase 9 follow-up.

---

## INV-001 — Low-stock detection never published `inventory.low-stock`, plus a real recipient-resolution bug that would have caused an email fan-out storm once fixed naively

Status: **VERIFIED**
Severity: HIGH (event gap) / **the recipient bug specifically would have been CRITICAL reliability-wise if the event fix had shipped alone**
Area: EMAIL / NOTIFICATION / RELIABILITY

**Problem, two layered issues found while tracing this module's own flow (not assumed identical to the others):**
1. `InventoryService.detectLowStock()` / `detectCriticalStock()` compute the low/critical-stock item list but the code literally contained the comment `// Usually would trigger alerts here` — no `eventBus.publish` at all. These are exposed as on-demand endpoints (`POST /inventory/automation/detect-low-stock`, `-critical-stock`, both `inventory:write`) with **no scheduler or automatic trigger anywhere** (confirmed via grep — the only call sites are the controller methods themselves) — so even after fixing the event gap, low-stock alerts still only fire when a human with `inventory:write` manually calls the endpoint. `detectCriticalStock` has no corresponding notification listener at all (no `inventory.critical-stock` event exists anywhere in `notifications.events.ts`) — a separate, smaller design gap, not fixed here (no listener contract to wire against).
2. **Independently discovered, more serious bug**, in `apps/api/src/modules/mail/recipient/recipient.mapper.ts`'s `INVENTORY` branch: every other category branch in this file resolves recipients based on the specific `params.userId` passed in — except this one, which ignored `params.userId` entirely and always returned **the full manager audience** (`TECHNICIAN`/`DEPT_ADMIN`/`SYSTEM_ADMIN`, all of them) regardless of who it was called for. The `inventory.low-stock` listener in `notifications.events.ts` loops once per manager in `managerIds`, calling `NotificationsService.sendNotification({userId: mId, ...})` for each — and internally, `sendNotification`'s email branch calls this exact resolver **per manager**, each time asking "who should get this email for user X" and getting back "everyone" instead of "just X". Had I wired the `eventBus.publish` fix without first finding and fixing this, N managers would each have received N emails (once per manager's resolution call) — an **O(managers²)** email fan-out, not O(managers). With this seed data's 11 active managers, that would have been 121 email attempts for a single low-stock item instead of 11.

**Root Cause:** (1) alerting was stubbed out with a comment instead of implemented. (2) the `INVENTORY` recipient branch was written to answer "who is the audience for this category" instead of "who is *this specific* resolution call for", inconsistent with every other branch in the same function.

**Affected Files:** `apps/api/src/modules/inventory/services/inventory.service.ts`, `apps/api/src/modules/mail/recipient/recipient.mapper.ts`

**Fix:**
1. Fixed the `INVENTORY` branch in `recipient.mapper.ts` to resolve strictly to `params.userId` (mirroring every other branch), instead of unconditionally returning the whole manager list.
2. Wired `detectLowStock()` to resolve the active manager audience once, then `eventBus.publish("inventory.low-stock", { itemId, itemName, quantity, managerIds })` once per detected item.

**Verification:** **LIVE-TESTED**, VERIFIED, with the safe SMTP override active. Called `POST /inventory/automation/detect-low-stock` against real seed data (6 genuinely low-stock items, 11 active managers) → confirmed exactly **66** `Notification` rows created (`6 × 11`, not `6 × 11²`) and exactly **66** email jobs enqueued (not 726) by counting both directly against the live server/DB. Cleaned up the 66 test notifications afterward; the in-flight test email jobs were intentionally left to be dropped by killing the safe-SMTP test server (see EMAIL-003 — no real send risk, this was the deliberately-unreachable SMTP host).

**Related, noted but not fixed:** `detectCriticalStock` has no event/listener pair to wire against — would need a new `inventory.critical-stock` notification type designed and added, which is a feature addition beyond "reconnect an existing dead wire." Flagging for a future pass rather than inventing a new notification category unprompted.

**Regression Test:** None yet — needs a test asserting `RecipientMapper.resolveRecipients({userId: X, category: "INVENTORY", ...})` returns exactly `[X]` (or `[]` if X isn't a manager/isn't active), never the full audience regardless of `userId`. This is the single highest-value regression test uncovered in this whole audit pass, given how easily the fan-out bug could have shipped. Tracked as a Phase 9 follow-up.

---

## MAINT-001 — Service-status maintenance windows never transition state automatically; `maintenance.started`/`maintenance.completed` have no producer anywhere in the codebase

Status: DISCOVERED
Severity: MEDIUM
Area: WORKFLOW / AUTOMATION

**Problem:** This one is architecturally different from EMAIL-002/INCIDENT-001/ASSET-001/INV-001, not just the same bug in a fourth module — worth stating precisely since the audit instructions warned not to assume modules are identical, and this is the case where that mattered:

There are **two unrelated features that happen to share the word "maintenance"**:
1. **Asset maintenance** (`apps/api/src/modules/maintenance/*`, `MaintenanceSchedule`/`MaintenanceRecord` Prisma models) — technician work orders against physical assets. This module already publishes rich lifecycle events (`MaintenanceScheduled`, `MaintenanceAssigned`, `MaintenanceStarted`, `MaintenanceCompleted`, `MaintenanceCancelled`) correctly, to the **health-recalculation** `sharedEventBus` — already working, not touched, not in scope.
2. **Service-status maintenance windows** (`apps/api/src/modules/service-status/*`, `MaintenanceWindow` Prisma model, tied to `Service` not `Asset`) — scheduled downtime banners for the public status page. **This** is what `service-status.events.ts`'s `maintenance.started`/`maintenance.completed` listeners (on the *notification* `eventBus`) are actually waiting for — and there is no producer for them anywhere. Unlike the other four fixes in this pass, this isn't "the action happens but forgot to publish" — **the action that would trigger the transition (a window's start/end time arriving) has no code path at all.** `ServiceStatusService.createMaintenanceWindow` computes the window's initial `status` once, at creation time, by comparing `now` against `[startTime, endTime]`, and if it happens to already be inside that range, calls `updateStatus` **directly** (bypassing the event bus entirely, same pattern as the pre-fix incidents module). But there is no scheduler anywhere (confirmed by inspecting `apps/api/src/modules/service-status/*` and grepping for `cron`/`setInterval`) that later notices a `SCHEDULED` window's `startTime` has arrived, or an `ACTIVE` window's `endTime` has passed, and flips its status / republishes / calls `updateStatus` again. A maintenance window scheduled for "2 hours from now" will sit at `status: SCHEDULED` forever, and the service's public status will never actually show `MAINTENANCE` when the work begins, nor recover to `OPERATIONAL` when it ends — unless someone happens to create the window with a start time in the past-but-still-open window at the exact moment of creation.

**Expected:** A scheduled sweep (analogous to `privileges.scheduler.ts`'s GTPE expiry cron, which this audit already verified works correctly) that periodically checks `MaintenanceWindow` rows for `SCHEDULED → ACTIVE` and `ACTIVE → COMPLETED` transitions, calling `updateStatus` (or publishing `maintenance.started`/`maintenance.completed` for the existing listener to consume) at the right time.

**Root Cause:** The status-page maintenance-window feature was built with a "compute status once, at creation time" model and never extended with a time-based sweep, even though the event-listener contract for exactly that already exists and is correctly implemented on the consumer side.

**Affected Files:** `apps/api/src/modules/service-status/service-status.service.ts` (and would need a new scheduler file, analogous to `apps/api/src/modules/privileges/privileges.scheduler.ts`)

**Fix:** **Not applied in this pass.** This is a genuinely new scheduled-job capability, not a one-line "reconnect a dead wire" fix like the other four — building and testing a new cron sweep correctly (including registering/starting it in `server.ts`, verifying it doesn't double-fire, verifying it interacts correctly with `updateStatus`'s existing direct-call path so a window doesn't get processed twice) deserves its own focused pass rather than being rushed alongside four other fixes in the same turn. Flagging with full analysis and a concrete recommended shape (mirror `privileges.scheduler.ts`) for that follow-up.

**Verification:** N/A — not fixed.

**Regression Test:** N/A — once implemented, needs the same style of test as GTPE-002: create a window with a past `startTime`/future `endTime` directly via Prisma (not the API, to control timing precisely), invoke the sweep function directly, assert the service flips to `MAINTENANCE` and `maintenance.started` fires; then a past `endTime` case for the reverse.

---

## EMAIL-004 — Email template selection has no branch for INVENTORY or ASSET categories; falls back to the generic "ticket-created" template

Status: DISCOVERED
Severity: LOW
Area: EMAIL / UX

**Problem:** `EmailProvider.send()` (`apps/api/src/modules/mail/email.provider.ts`) selects a Handlebars template via a chain of `if` checks against `category`/`title` text: `INCIDENT`, `SLA`, title-contains-"assigned", title-contains-"resolved", title-contains-"password", `SYSTEM`. There is no branch for `category === "INVENTORY"` or `category === "ASSET"` — confirmed live during the INV-001 test: the enqueued low-stock alert emails used `template: "ticket-created"`, which renders ticket-specific copy (ticket number, priority) that doesn't semantically match a low-stock alert. Same would apply to the new `asset.assigned` emails from ASSET-001 (no `asset-assigned.hbs` template exists in `apps/api/src/modules/mail/templates/` at all).

**Root Cause:** The template-selection chain and the template file set were both built for the ticket/incident/password/system-announcement/SLA use cases and never extended when the (previously-dead) `asset.assigned`/`inventory.low-stock` notification paths were designed.

**Affected Files:** `apps/api/src/modules/mail/email.provider.ts`, `apps/api/src/modules/mail/templates/` (missing `inventory-low-stock.hbs`, `asset-assigned.hbs`)

**Fix:** Not applied — this is a content/template-authoring task (write two new `.hbs` templates and add two `if` branches), lower severity (confusing email copy, not a functional or security defect) and better suited to a dedicated pass alongside other frontend/content polish rather than squeezed into this backend-wiring pass. Flagging so it isn't lost now that INV-001/ASSET-001 make these paths reachable for the first time.

**Verification:** N/A — not fixed.

**Regression Test:** N/A.

---

## EMAIL-003 — In-memory-only email queue: no persistence, no crash recovery, no duplicate-send prevention

Status: DISCOVERED
Severity: MEDIUM
Area: EMAIL / RELIABILITY

**Problem:** `apps/api/src/modules/mail/queue/email.queue.ts` (`EmailQueue`) holds all jobs in a plain in-process `private static queue: EmailJob[] = []` array. There is no persistence layer (no DB-backed job table, no Redis, no file). Retry/backoff (`EmailWorker.processJob`) is implemented correctly *within a single process lifetime* (verified live under EMAIL-002 — 3 retries, correct exponential backoff, correct terminal `EmailLog` write) but:
- Any process restart, crash, or deploy (routine in production — rolling restarts, OOM kills, `tsx watch` hot-reloads in dev as observed repeatedly during this very audit session) silently drops every job that hasn't yet reached a terminal `EmailLogService.log()` call, with no trace that the email was ever supposed to be sent.
- There is no idempotency/dedupe key on jobs. If `EmailProvider.send()` is ever invoked twice for logically the same event (a retried webhook, a race in the caller, a future duplicate `eventBus.publish` bug like EMAIL-002's inverse), two independent jobs are enqueued and two emails are sent — nothing here would catch or prevent that.
- `EmailQueue.getQueueStatus()` exists (useful for an ops/health endpoint) but isn't wired into any route — there is currently no way to observe in-flight queue depth from outside the process.

**Root Cause:** The queue was implemented as an in-memory convenience structure rather than a durable job queue, likely reasonable for an initial build but a real production-reliability gap now.

**Affected Files:** `apps/api/src/modules/mail/queue/email.queue.ts`, `apps/api/src/modules/mail/jobs/email.worker.ts`

**Fix:** Not applied in this pass. A proper fix (persisting job state to the DB — or reusing `EmailLog` itself as the durable record with a `PENDING`/`PROCESSING` status swept on boot — plus a dedupe key derived from the triggering event) is a real architectural change, not a small patch, and this audit's rules call for controlled, individually-verified changes over broad speculative refactors. Flagging with full analysis for a deliberate follow-up.

**Verification:** N/A — not fixed.

**Regression Test:** N/A — once fixed, needs a test that enqueues a job, kills/restarts the process (or simulates it), and asserts the job is either recovered or explicitly logged as lost — never silently dropped.

---

## EMAIL-001 — Email log controller/repository were unwired dead code referencing non-existent service methods

Status: **VERIFIED**
Severity: MEDIUM
Area: EMAIL / DATA_INTEGRITY

**Problem:** Two new files (`email-log.controller.ts`, `email-log.repository.ts`) had been added to the repo (untracked, in-progress refactor) implementing a proper controller → service → repository layering for email logs, matching the pattern used by every other module (e.g. `automation`). But `EmailLogController.getLogs`/`getLogById` called `EmailLogService.getLogs`/`getLogById`, which did not exist — the service only had a `log()` method. The routes file also wasn't using the new controller at all; it still ran a raw inline Prisma query with no pagination/search/status filtering, duplicating logic instead of delegating to the layered module.

**Expected:** `apps/v1/mail/logs` list/detail endpoints go through Controller → Service → Repository like every other module, with pagination, search, and status filtering (the controller already expected this).

**Actual:** The new controller/repository files were broken (would 500 if ever wired up), and the live route bypassed the architecture entirely with an unfiltered, unpaginated raw query capped at 100 rows.

**Root Cause:** Incomplete refactor — repository and controller were added but the service was never updated to match, and routes.ts was never repointed at the controller.

**Affected Files:** `apps/api/src/modules/mail/logs/email-log.service.ts`, `apps/api/src/modules/mail/logs/email-log.routes.ts`

**Fix:** Added `EmailLogService.getLogs()` (paginated, with search on recipient/template and status filter, backed by `EmailLogRepository.getLogs`) and `getLogById()`. Rewired `email-log.routes.ts` to use `EmailLogController.getLogs`/`getLogById` instead of the inline query, and added a `GET /logs/:id` route matching the controller's existing `getLogById` handler which previously had no route at all.

**Verification:** `pnpm --filter api exec tsc --noEmit` passes clean.

**Regression Test:** None yet — needs an integration test hitting `/api/v1/mail/logs` with `search`/`status`/`page` params.

---

## DATA-001 — Schema-wide use of `timestamp without time zone` instead of `timestamptz`

Status: DISCOVERED
Severity: MEDIUM
Area: DATABASE / DATA_INTEGRITY

**Problem:** Discovered while live-testing the GTPE scheduler. All 96 `DateTime` fields across `apps/api/prisma/schema.prisma` map to Postgres `timestamp(3) without time zone` — none use `@db.Timestamptz`. Under normal application operation this is silently safe *only* because every read and write goes through Prisma, which is internally consistent about treating these naive columns as UTC on both ends. But a naive `timestamp` column has no protection against that assumption being violated: it stores whatever wall-clock text it's given, with zero conversion, and Postgres will happily compare mismatched-timezone values without any error.

**Concretely demonstrated during this audit:** to test the GTPE scheduler's expiry sweep, I initially set a grant's `expires_at` directly via `psql` using `now() - interval '5 minutes'`. The `psql` session's timezone was `Asia/Kolkata` (server default, per `SHOW timezone`), so the literal IST wall-clock text got written into the naive column. The application (via Prisma) always generates/compares these timestamps in UTC wall-clock text. Because the column has no timezone tag, Postgres just string/numeric-compared the two different wall-clock conventions — the row *looked* 5.5 hours in the future to the app (`IST 11:15 > UTC-equivalent-text 05:59`) and the scheduler correctly, silently, never touched it. I confirmed this was a testing-methodology artifact and not a real app bug by repeating the test the legitimate way — submitting a real 5-minute GTPE request through the actual API (`POST /privileges/request` → `/approve`), which lets Prisma write the timestamp — and verifying the scheduler does correctly expire it (see GTPE-002 below for that result).

**Why this still matters for production readiness:** the only thing preventing a real incident is "every writer of these columns happens to be Prisma, forever." Any raw SQL (an ops runbook, a manual data-fix during an incident, a future reporting/ETL job, a `psql` session with a non-UTC `TimeZone` setting — which is the Postgres server's actual current default here) that touches these columns without going through Prisma's UTC convention will silently corrupt time-sensitive logic exactly like the GTPE scheduler, session expiry, SLA deadlines, maintenance windows, etc. — with no error, ever, because the column type itself doesn't encode "this needs a timezone."

**Root Cause:** Prisma's default Postgres mapping for `DateTime` is `timestamp(3)` unless `@db.Timestamptz` is explicitly specified; it was never specified anywhere in this schema.

**Affected Files:** `apps/api/prisma/schema.prisma` (schema-wide, all 96 `DateTime` fields)

**Fix:** Not applied in this pass — converting every `DateTime` field to `@db.Timestamptz(3)` is a real schema migration against a live, seeded database (`ALTER COLUMN ... TYPE timestamptz USING ... AT TIME ZONE 'UTC'`, since the existing naive data needs an explicit "these were always UTC" cast, not a silent reinterpretation) and is exactly the kind of broad, high-blast-radius change this audit's own rules say not to make speculatively/in a single pass. Flagging with full repro evidence for a deliberate, tested migration pass rather than doing it inline here.

**Verification:** N/A — not fixed yet.

**Regression Test:** N/A — once migrated, add a test that writes/reads a timestamp through both Prisma and a raw-SQL path in different session timezones and asserts they agree.

---

## GTPE-002 — Scheduler correctly expires grants (verified via legitimate API path)

Status: **VERIFIED**
Severity: N/A (confirms correct behavior — not a defect)
Area: GTPE

**What was tested:** Whether the "GTPE privilege scheduler" (`apps/api/src/modules/privileges/privileges.scheduler.ts`, cron `*/1 * * * *`) actually expires grants once their `expiresAt` passes, per this audit's explicit requirement to test "scheduler behavior."

**Method:** Submitted a real GTPE request (`POST /privileges/request`, 5-minute duration, `reports:export`) as `tina.prosacco@campuscare.edu`, approved it as the correct department admin (`rogelio_rowe47@campuscare.edu`), then polled the DB every 5s waiting for the resulting `UserPermission` grant's `status` to flip from `ACTIVE` to `EXPIRED` without any further manual intervention — purely watching the live `pnpm --filter api dev` process and its already-running cron scheduler.

**Result:** Confirmed the scheduler correctly flips expired grants to `EXPIRED` on its own schedule once their real (Prisma-written, UTC-consistent) `expiresAt` passes. See DATA-001 above for the one related-but-separate finding this testing surfaced (naive timestamp columns are only safe because every writer happens to be Prisma).

**Regression Test:** None yet — would require a test harness that can fast-forward grant expiry (e.g. inject a past `expiresAt` through the Prisma client, not raw SQL, then invoke `runPrivilegeSweep()` directly) rather than waiting 5 real minutes. Tracked as a Phase 9 follow-up.

---

## AUTO-001 — Automation action executor silently swallows all failures

Status: **VERIFIED**
Severity: MEDIUM
Area: AUTOMATION / ERROR_HANDLING

**Problem:** `executeAction()` in `automation.service.ts` wraps every action (ASSIGN_TO, SET_PRIORITY, SET_STATUS, ADD_COMMENT, SET_DEPARTMENT) in a try/catch that only does `logger.debug(...)` on failure — not even `logger.error` or `logger.warn`. A failed action (e.g. assigning to a deleted user, a bad department ID) is invisible: it won't appear in default log levels, the rule's `executedActions` list will simply be missing that entry, but the automation log still records `triggered: true` with a shorter `actionsRun` array and no error field at all in the persisted `AutomationLog`. There is no retry, no dead-letter, and no operator-visible failure signal.

**Expected:** Action failures should be logged at `error`/`warn` level (observability requirement from the audit standards) and ideally recorded on the `AutomationLog` row itself so an admin reviewing automation history can see *why* an action didn't run.

**Actual:** Failures are only visible if `debug` log level is enabled and someone is tailing logs at the exact moment.

**Root Cause:** `catch (err) { logger.debug(...) }` — likely written to keep the rule engine non-blocking (correct goal) but conflated "don't throw" with "don't log loudly" (wrong).

**Affected Files:** `apps/api/src/modules/automation/automation.service.ts`

**Fix:** Changed `logger.debug` to `logger.error` with full context (ticketId, action, error message). Also pushed a `FAILED:<type>:<reason>` marker into `executedActions` so a failed action is now visible in the persisted `AutomationLog.actionsRun` array without a schema migration (the `AutomationLog` model has no dedicated error column — adding one would require a migration against a live DB, which wasn't done in this pass; flagging as a possible follow-up rather than doing it blind).

**Verification:** **LIVE-TESTED**, VERIFIED — full trigger → condition → action → persistence pipeline exercised end-to-end against the running dev server + seeded DB:
1. Created a real `AutomationRule` via `POST /automation/rules` (SYSTEM_ADMIN token): trigger `ON_CREATE`, condition `categoryId eq <Network & Connectivity>`, actions `SET_PRIORITY:CRITICAL` + `ASSIGN_TO:<a UUID with no matching User row>` (deliberately invalid, to force a real action failure).
2. Created a matching ticket as a STUDENT via `POST /tickets` → response confirmed `priority: "CRITICAL"` (the valid action ran) and `assigneeId: null` (the invalid action did not silently "succeed").
3. Checked the live server log: a `logger.error` entry appeared with the real Prisma foreign-key error ("No 'User' record ... needed for a nested connect") — previously this would have been invisible at default log levels.
4. Checked the persisted `AutomationLog.actionsRun` row in Postgres: `["SET_PRIORITY:CRITICAL", "FAILED:ASSIGN_TO:..."]` — the failure is now visible to anyone reviewing automation history, not just in transient logs.
5. **Caught a self-introduced regression during this same verification pass**: the first version of the trim (`err.message.split("\n")[0]`) produced an *empty* reason string, because Prisma's error messages begin with a leading `\n` — so `[0]` was always `""`. Live-tested, saw the empty `FAILED:ASSIGN_TO:` entry, fixed it to find the first non-blank line, re-verified with a third live ticket → `FAILED:ASSIGN_TO:Invalid \`prisma.ticket.update()\` invocation in` (correct, concise, single-line).
6. Also exercised the built-in duplicate-ticket detector in the same pass (unrelated to AUTO-001 but same trigger path): created a second ticket with an identical title within 24h → confirmed an internal `[Automation] Possible duplicate detected...` comment was added automatically. No bug found here.
7. Cleaned up all test artifacts afterward (deleted the test rule and the three test tickets via the real DELETE endpoints) so the seeded demo dataset wasn't left polluted.

**Regression Test:** None committed yet — needs a test that forces an action failure (e.g. ASSIGN_TO a nonexistent user) and asserts `logger.error` is called and a clean single-line `FAILED:...` reason appears in the persisted log's `actionsRun`. Tracked as a Phase 9 follow-up.

---

## AUTH-001 — Access tokens remain valid after session revocation until natural expiry (accepted tradeoff — documented, not changed)

Status: **DOCUMENTED / WONT_FIX (for now)**
Severity: LOW
Area: AUTH

**Decision (per explicit product direction):** Keep the current 15-minute access-token model as-is. Do **not** add a per-request DB/session-revocation lookup or any token-revocation mechanism without concrete evidence that immediate invalidation is a stated requirement. This entry exists to document the behavior and threat model, not to schedule a fix.

**Behavior, precisely:**
- `authenticate` middleware (`apps/api/src/middleware/authenticate.ts`) verifies only the JWT signature (`jwt.verify`) and a live `user.isActive` DB check. It does **not** check `decoded.sessionId` against the `Session` table's `revoked` flag on every request.
- `logout` / `logoutAll` / reuse-detected-compromise revocation (`AuthService.logout/logoutAll`, `authenticate.ts`) only revoke the **refresh-token** `Session` row. Any access token already issued keeps working, unmodified, until its own 15-minute expiry — "logout everywhere" does not immediately invalidate an attacker's (or a stale browser tab's) already-issued access token.
- **Same mechanism, same tradeoff, observed a second time during the GTPE-001 live test:** a newly-approved temporary permission grant (GTPE) does not affect `authorize()` checks on a user's *existing* access token either — `GET /api/v1/reports` 403'd for a user with a fresh, live, active `reports:view` grant until they called `POST /auth/refresh` to mint a new token embedding the updated permission set. Verified live: 403 on the pre-grant token, 200 on the post-refresh token, same session. This is not a security hole (the direction of staleness is conservative — under-privileged, never over-privileged, since a *revoked* permission is the risky direction and *that* is what's being accepted here) but it does mean "grant applies immediately" is not literally true for routes outside the `privileges` module's own `hydrateTemporaryPermissions` middleware, which re-reads live grants per-request specifically to avoid this gap for its own routes.

**Threat model / why this is an acceptable tradeoff:** The blast radius of a compromised or intentionally-retained access token is bounded to 15 minutes by design — that is the entire purpose of the short-lived-access / rotating-refresh split already implemented here (refresh-token reuse detection revokes the whole session family on replay, which is the higher-value control against long-lived compromise). Adding a DB lookup to every authenticated request to close a ≤15-minute window is a real, measurable latency/DB-load cost paid on every single API call, for a benefit that only matters in the narrow scenario of "attacker already has a valid access token AND an admin needs sub-15-minute revocation." No such requirement has surfaced anywhere in the codebase, docs, or seed data (no "force logout" admin action exists that implies or promises instant effect).

**Revisit condition:** If a later phase of this audit (e.g. the Security or E2E phase) turns up a concrete scenario depending on instant revocation — a documented "kill this session now" admin feature, a compliance requirement, or a live exploit chain that specifically depends on the 15-minute window — reopen this entry and reconsider. Until then: no code change.

**Affected Files:** `apps/api/src/middleware/authenticate.ts` (for reference only — not modified)

**Regression Test:** N/A (no fix applied by design)

---

## TEST-001 — Test suites are empty placeholders

Status: DISCOVERED
Severity: HIGH
Area: TESTING

**Problem:** All six test files in the repo (`apps/api/tests/{fixtures,unit,integration}/index.test.ts`, same for `apps/web`) are placeholders — no real RBAC, auth, automation, GTPE, or email test coverage exists.

**Root Cause:** Never implemented.

**Fix:** Not yet applied — regression tests will be added alongside each fix going forward per the audit's failure-driven loop, rather than as a single bulk test-writing pass.

Status: DISCOVERED
