# ADR 0002 - Service-Prisma Architecture

## Status
Accepted

## Context
We want a clean backend data access architecture. Historically, a Repository pattern was proposed to wrap data queries, but this often leads to empty pass-through methods and added complexity since Prisma already provides type safety and active query building out of the box.

## Decision
We will remove the Repository layer. Express services will interact directly with the Prisma client singleton.

## Consequences
- Simpler backend code footprint.
- Faster development with Prisma's native API.
- Direct control over joins, transactions, and filters.
