# ADR 0004 - Explicit Routes & API Versioning v1

## Status
Accepted

## Context
Routing configurations can become hard to maintain or compile-check if they are resolved dynamically via filesystem scanning at runtime. We need deterministic startup behaviors.

## Decision
All routes will be mounted explicitly under the `/api/v1` namespace. A central routes index imports each module router by name and registers it using Express's standard router interface.

## Consequences
- Compile-time type validation of all routes.
- Fully predictable route mounting order.
- Easier debugging and tracing of router mounts.
