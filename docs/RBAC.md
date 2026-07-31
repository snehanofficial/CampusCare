# Role-Based Access Control (RBAC)

This document details the roles, permissions matrix, and runtime authorization flows implemented in **CampusCare**.

## System Roles

1. **System Administrator (`SYSTEM_ADMIN`):** Unrestricted access. Configures categories, departments, and SLA policies.
2. **Department Administrator (`DEPT_ADMIN`):** Manages team assignments, reviews SLA compliance metrics, and views local audits.
3. **Technician (`TECHNICIAN`):** Claims tickets, consumes spare parts, logs asset maintenance history, and closes issues.
4. **Faculty (`FACULTY`):** Submits tickets, reviews assets assigned to their local department, and searches FAQs.
5. **Student (`STUDENT`):** Reports ticket issues (via UI or QR scans) and views/tracks their own requests.

## Permissions Matrix

| Permission Code | Student | Faculty | Technician | Dept Admin | Sys Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `tickets:create` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `tickets:read_own` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `tickets:read_all` | ✗ | ✗ | ✓ | ✓ | ✓ |
| `tickets:assign` | ✗ | ✗ | ✓ | ✓ | ✓ |
| `tickets:resolve` | ✗ | ✗ | ✓ | ✓ | ✓ |
| `assets:create` | ✗ | ✗ | ✗ | ✓ | ✓ |
| `assets:read` | ✗ | ✓ | ✓ | ✓ | ✓ |
| `inventory:read` | ✗ | ✗ | ✓ | ✓ | ✓ |
| `users:read` | ✗ | ✗ | ✗ | ✓ | ✓ |
| `audit:read` | ✗ | ✗ | ✗ | ✗ | ✓ |

## Temporary Delegated Permissions

To cover temporary coverage cases (e.g., a student assisting a technician with maintenance for a day), CampusCare supports **User Permissions Overrides** inside the `user_permissions` table:
- Overrides map a specific permission to a user with an `expiresAt` timestamp.
- The authorization middleware checks the user's base role permissions and then queries active overrides to evaluate access.
- Overrides with past expiration dates are automatically ignored.
