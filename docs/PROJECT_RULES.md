# CampusCare - PROJECT_RULES.md

> **Version:** 2.0
>
> **Project:** CampusCare – Enterprise Campus IT Service Management Platform
>
> **Architecture:** Feature-Based Monorepo
>
> **Status:** Foundation Phase Completed

---

# Purpose

This document defines the engineering standards, architecture rules, ownership boundaries, coding conventions, Git workflow, testing requirements, and implementation policies for CampusCare.

Every developer and AI coding agent **MUST** read and follow this document before making any code changes.

Failure to follow these rules may result in:

- Merge conflicts
- Architectural inconsistencies
- Broken builds
- Security vulnerabilities
- Performance regressions
- Technical debt

---

# Project Philosophy

CampusCare is being built as an enterprise-grade Campus IT Service Management (ITSM) platform.

Every implementation should prioritize:

- Scalability
- Maintainability
- Reusability
- Security
- Performance
- Type Safety
- Clean Architecture
- Production Readiness

Shortcuts are discouraged.

---

# Current Project Status

## Completed

The following infrastructure has already been implemented.

- Monorepo Setup
- React + Vite
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Refresh Token Rotation
- Session Management
- Device Tracking
- RBAC Foundation
- Route Guards
- Theme System
- Shared UI Components
- Navbar
- Sidebar
- Breadcrumbs
- Layout System
- Error Boundaries
- API Foundation
- Design Tokens

These components are considered stable.

---

# Technology Stack

## Frontend

- React 19
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- Zustand
- TanStack Query
- Axios
- React Hook Form
- Zod
- Sonner
- Recharts
- html5-qrcode
- vite-plugin-pwa

---

## Backend

- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt
- Socket.IO
- Nodemailer
- Multer
- Web Push API

---

# Architecture Rules

Always follow Feature-Based Architecture.

Frontend

```
Feature

↓

Components

↓

Hooks

↓

Services

↓

API
```

Backend

```
Routes

↓

Controllers

↓

Services

↓

Repositories

↓

Prisma
```

Never bypass layers.

---

# Module Ownership

## Foundation

Owns

```
app/
components/
hooks/
providers/
layouts/
router/
services/
stores/
config/
middleware/
database/
shared packages
```

No other developer should modify these folders.

---

## Developer A

Owns

```
users/
roles/
permissions/
departments/
categories/
tickets/
sla/
automation/
incidents/
dashboard/
```

---

## Developer B

Owns

```
assets/
maintenance/
inventory/
heatmap/
reports/
```

---

## Developer C

Owns

```
notifications/
analytics/
audit/
settings/
mail/
socket/
jobs/
pwa/
workers/
service-status/
knowledge-base/
```

---

# Ownership Rules

Never modify another developer's module.

Never rename another module.

Never move another module.

Never refactor another developer's implementation.

Only consume public APIs.

---

# Shared Packages

Allowed

```
shared-types

shared-schemas

shared-utils
```

Never introduce breaking changes.

---

# Git Strategy

```
main

↓

develop

↓

feature/<module>
```

Examples

```
feature/tickets

feature/assets

feature/notifications
```

Never commit directly to main.

---

# Commit Convention

```
feat(module):

fix(module):

refactor(module):

docs(module):

test(module):

chore(module):
```

Example

```
feat(ticket): implement ticket assignment

fix(asset): resolve QR lookup bug

refactor(notification): simplify email provider
```

---

# Coding Standards

Strict TypeScript.

Never use

```
any
```

Prefer

- interfaces
- enums
- readonly
- utility types

Meaningful variable names only.

---

# File Size Guidelines

Preferred

Component

< 250 lines

Service

< 300 lines

Controller

< 150 lines

Split larger files.

---

# React Standards

Only Functional Components.

Use Hooks.

Never use Class Components.

Prefer composition.

Keep business logic outside UI.

---

# Component Rules

Reusable components belong inside

```
components/
```

Feature-specific components belong inside

```
features/<feature>/components/
```

Never duplicate components.

---

# State Management

Use

Zustand

For

- Authentication
- Theme
- Sidebar
- Global UI

Use

TanStack Query

For

- Server Data
- API Cache
- Mutations

Never store server data inside Zustand.

---

# API Rules

Never call

```
fetch()
```

Always use

Axios Client

Flow

```
Component

↓

Hook

↓

Service

↓

API Client
```

---

# Backend Standards

Controller

Only HTTP handling.

Service

Business logic.

Repository

Database only.

Never mix responsibilities.

---

# Prisma Rules

Always use Prisma ORM.

Never write raw SQL unless unavoidable.

Use transactions when updating multiple tables.

Use soft delete where appropriate.

---

# Validation

Frontend

React Hook Form + Zod

Backend

Zod

Validate everything.

Never trust client input.

---

# Authentication

Already implemented.

Do NOT rewrite.

Consume existing APIs.

Reuse middleware.

---

# Authorization

Every protected endpoint must verify

Authentication

AND

Permission

Never skip authorization.

---

# API Response Standard

Success

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Failure

```json
{
  "success": false,
  "message": "Error",
  "errors": []
}
```

---

# Error Handling

Use centralized middleware.

Never expose

- stack traces
- SQL errors
- internal implementation

---

# Logging

Log

- Authentication
- Ticket Actions
- Inventory
- SLA
- Workflow
- Incidents
- Notifications
- Audit Events

Never log

- Passwords
- Tokens
- Secrets

---

# Notification Rules

Support

- In-App
- Email
- Browser Push

Keep provider architecture extensible.

---

# Socket.IO Rules

Sockets only broadcast events.

Never implement business logic inside socket handlers.

Authenticate every socket connection.

---

# Offline Rules

Never overwrite server data.

Queue offline actions.

Synchronize later.

Detect conflicts.

Resolve conflicts safely.

---

# UI Guidelines

Style

- Modern SaaS
- Enterprise Dashboard
- Minimal
- Glassmorphism
- Responsive
- Accessible

---

# Color System

Primary

Blue

Secondary

Purple

Success

Green

Warning

Orange

Danger

Red

Never hardcode colors.

Use Tailwind theme variables.

---

# Typography

Primary

Inter

Mono

JetBrains Mono

Use consistent spacing.

---

# Icons

Only

Lucide React

---

# Performance

Lazy Loading

Code Splitting

Memoization

Pagination

Virtualization

Image Optimization

---

# Accessibility

Keyboard Navigation

ARIA Labels

Focus Indicators

Color Contrast

Semantic HTML

---

# Security

Helmet

CORS

Rate Limiting

JWT

bcrypt

Input Validation

Sanitization

Secure Cookies

HTTPS

---

# Testing Requirements

Every phase must include

- Build
- Lint
- Type Check
- API Testing
- Database Verification
- Manual Testing
- Responsive Testing

No phase is complete without testing.

---

# Documentation

Every completed feature must document

- Purpose
- APIs
- Business Rules
- Validation
- Limitations

---

# Merge Conflict Prevention

Never edit another module.

Never rename shared APIs.

Never modify completed Foundation code.

Never change shared interfaces without approval.

Keep commits small and atomic.

---

# Development Workflow

Every phase follows

```
Implement

↓

Build

↓

Lint

↓

Test

↓

Verify

↓

Document

↓

Commit

↓

User Approval

↓

Next Phase
```

Never continue automatically.

---

# Completion Checklist

Before marking a phase complete

- Build passes
- TypeScript passes
- ESLint passes
- APIs verified
- Database verified
- Responsive UI verified
- Documentation updated
- Commit completed

---

# Final Rule

Write code as if CampusCare will be deployed to a real university supporting thousands of users.

Do not optimize for speed.

Optimize for quality, maintainability, and long-term scalability.