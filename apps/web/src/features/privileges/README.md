# Privileges Feature — GTPE (Granular Temporary Privilege Escalation)

## Purpose

The admin and self-service surface for time-boxed privilege escalation. Users can
request extra permissions for a bounded window; administrators grant, review, revoke
and audit them. All grants expire automatically.

## Structure

```
components/   TemporaryAccessWorkspace (modal shell) + one component per tab,
              plus PermissionSelector / DurationPicker / TemplatePicker /
              RemainingTime / TemporaryAccessIndicator
hooks/        React Query hooks + the shared useCountdown ticker
schemas/      Zod mirrors of the API contracts (instant form feedback)
types/        API response shapes
utils/        Duration/countdown formatting, tag variants, CSV download
```

Server access goes through `lib/repositories/privilege.repository.ts`, following the
project's Component → Hook → Repository → Axios flow.

## Integration points

There are exactly two, both additive:

1. **`features/users/pages/UsersPage.tsx`** — a "Temporary Access" entry appended to
   the existing `actions` array (so "Add User" remains `actions[0]` and the
   `EntityListTemplate` empty-state CTA is unchanged), plus the workspace dialog
   rendered next to `UserFormDialog`. There is **no new route**: the workspace is
   modal-only, per spec.
2. **`components/navigation/Navbar.tsx`** — two lines: an import and
   `<TemporaryAccessIndicator />` as the first child of the existing right-side
   cluster. The indicator returns `null` when the user holds no active grants, so
   the navbar is visually identical for ordinary sessions.

## Tabs

| Tab | Contents |
| --- | --- |
| Pending Requests | Review queue with approve / reject |
| Active Permissions | Live grants with a per-second countdown and revoke |
| Grant Access | Direct grant form: user, template, permissions, duration, justification |
| History | Full grant history with status filter and CSV export |
| Approval Policies | Inline editing of risk level, approver role, max duration, enabled |

Each tab's queries are `enabled` only while that tab is active, so opening the
workspace issues one request rather than five.

## Performance notes

- Countdown cells share a **single** `useCountdown` interval per table rather than
  one timer per row.
- The permission registry is cached for 5 minutes (`staleTime`) — it is effectively
  static within a session.
- `useEffectivePrivileges` polls every 30 seconds and exposes a `permissionsVersion`
  string that changes whenever the live grant set changes.

## Validation

React Hook Form is not used here because the grant/request forms are composed of
custom multi-select controls rather than registered inputs; the same Zod schemas run
`safeParse` on submit and map issues onto per-field errors. The server re-validates
everything with its own Zod schemas.

## Limitations

- Revoke and reject reasons are collected via `window.prompt` rather than a dedicated
  dialog.
- Template creation is available through the API but not yet surfaced in the UI.
- Mid-session permission changes take effect on the next token refresh (see the API
  module README for the documented propagation window).
