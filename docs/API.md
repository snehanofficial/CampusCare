# API Design & Reference

This document outlines the API guidelines, versioning, global response envelopes, and error formats for the **CampusCare REST API**.

## API Versioning

All API endpoints must be prefixed with `/api/v1` namespace (e.g. `/api/v1/auth/login`, `/api/v1/tickets`).
Versioning is explicitly declared at route mounting inside `apps/api/src/app.ts` to ensure consistency and prevent routing confusion.

## Standardized JSON Response Envelope

To simplify client integration, all API controllers must wrap outputs in a standard JSON response structure.

### 1. Success Envelope (HTTP 200/201)
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "Asset name"
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

### 2. Error Envelope (HTTP 4xx/5xx)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request body failed Zod checks",
    "details": {
      "title": ["Title must be at least 5 characters long"]
    }
  }
}
```

## Swagger & Interactive Reference (Scalar)

The API documentation is generated dynamically from JSDoc Swagger annotations on the routes.
- **JSON spec endpoint:** Available at `/swagger.json`.
- **Interactive documentation:** Rendered via `@scalar/express-api-reference` and available at `/reference` (fully client-executable).
