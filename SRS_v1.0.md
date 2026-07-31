CampusCare  
Software Requirements Specification (SRS) v1.0

**Smart Campus Help Desk & IT Service Management Platform

# 1\. Introduction

CampusCare is a mobile-first Progressive Web Application (PWA) that digitizes campus support operations. The platform combines help desk ticketing, asset lifecycle management, workflow automation, SLA monitoring, inventory tracking, real-time collaboration and analytics into a unified IT Service Management (ITSM) solution for educational institutions.

# 2\. Vision & Goals

- Provide a single service portal for all campus support requests.
- Reduce resolution time using structured workflows.
- Enable asset-centric issue tracking with QR codes.
- Improve accountability using audit logs and SLA monitoring.
- Deliver an installable PWA with offline-friendly experience.
- Provide a clean architecture suitable for AI-assisted development.

# 3\. Stakeholders

- Students
- Faculty
- Technicians
- Department Administrators
- System Administrators

# 4\. Functional Architecture

## Authentication & RBAC

- JWT access tokens
- Refresh token rotation
- HttpOnly cookies
- Granular permissions
- Temporary delegated permissions

## Ticket Management

- CRUD
- Assignment
- Comments
- Attachments
- Timeline
- Reopen
- User verification before close

## Asset Management

- Asset registry
- Warranty
- Maintenance history
- QR code
- Health summary
- Linked tickets

## Incident Management

- Merge duplicate tickets
- Root cause
- Bulk resolution
- Incident timeline

## SLA Management

- Priority policies
- Countdown
- Escalation
- Compliance metrics

## Workflow Automation

- Rule engine
- Auto assignment
- Duplicate detection
- Auto close
- Notifications

## Maintenance & Inventory

- Maintenance records
- Spare parts
- Stock deduction
- Vendor details

## Notifications

- Socket.IO
- Browser Push
- HTML Email (Nodemailer)
- Toast notifications

## Dashboards

- Student
- Technician
- Department
- Administrator
- Performance dashboard
- Service status dashboard
- Campus heatmap

## Knowledge Base

- FAQs
- Guides
- Search

## Audit Trail

- Authentication
- Permissions
- Ticket actions
- Inventory
- Configuration

## PWA

- Installable
- Offline shell
- Smart sync
- Responsive

# 5\. Business Rules

- Only authenticated users may access protected resources.
- Students may access only their own tickets.
- Tickets move through defined lifecycle states.
- Closed tickets require user verification or auto-close after configured period.
- SLA timers pause only in approved waiting states.
- Inventory updates when maintenance consumes spare parts.
- All privileged operations are audited.

# 6\. Non-Functional Requirements

- Mobile-first responsive UI.
- PWA with offline shell.
- Typical API latency under 500 ms.
- Secure password hashing using bcrypt.
- RESTful API design.
- WCAG-oriented accessible interface.
- Modular architecture supporting future scaling.

# 7\. Recommended Project Structure

frontend/  
app, components, features, hooks, services, lib, types  
backend/  
modules/  
auth/  
users/  
tickets/  
assets/  
incidents/  
inventory/  
notifications/  
analytics/  
audit/  
middleware/  
prisma/  
shared/  
schemas/

# 8\. Database Design

| Table                  | Purpose              |
| ---------------------- | -------------------- |
| users                  | Core user accounts   |
| roles                  | System roles         |
| permissions            | Granular permissions |
| user_permissions       | Temporary overrides  |
| departments            | Support departments  |
| categories             | Ticket categories    |
| assets                 | Campus assets        |
| asset_history          | Maintenance records  |
| inventory_items        | Spare parts          |
| inventory_transactions | Stock movement       |
| tickets                | Support requests     |
| ticket_comments        | Discussion           |
| ticket_attachments     | Evidence             |
| incidents              | Grouped issues       |
| incident_tickets       | Mapping              |
| notifications          | Notification queue   |
| sla_policies           | SLA configuration    |
| audit_logs             | System audit         |
| knowledge_base         | Support articles     |

# 9\. API Modules

- /auth
- /users
- /roles
- /permissions
- /departments
- /categories
- /tickets
- /assets
- /incidents
- /inventory
- /notifications
- /analytics
- /audit
- /knowledge-base

# 10\. UI Screens

- Login
- Dashboard
- Ticket List
- Ticket Details
- Create Ticket
- Asset Registry
- QR Scan
- Incident View
- Inventory
- Technician Dashboard
- Service Status
- Campus Heatmap
- Reports
- Knowledge Base
- Settings

# 11\. Development Guidelines

- Feature-based architecture.
- Shared Zod schemas for validation.
- Repository/service/controller separation.
- Consistent API response format.
- Centralized error handling.
- Role-based middleware.
- TanStack Query for server state.
- Reusable UI components with shadcn/ui.
- Typed Prisma models.

# 12\. MVP Milestones

- Phase 1: Authentication, RBAC, Ticketing, PWA.
- Phase 2: Assets, QR reporting, SLA, Workflow, Notifications.
- Phase 3: Incidents, Inventory, Analytics, Audit, Knowledge Base.

# 13\. Future Scope

- SSO
- ERP integration
- Native apps
- Predictive maintenance
- Multi-campus deployment

# 14\. Conclusion

This SRS defines a modular, implementation-ready foundation for CampusCare. The document is intentionally structured to support AI-augmented development, allowing independent implementation of each module while maintaining consistent architecture, security, and data flow.