import { NextFunction, Request, Response } from "express";
import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

/**
 * Opt-in defence-in-depth middleware, mounted ONLY on the privileges router.
 *
 * The access token carries a permission snapshot taken at login/refresh time
 * (15-minute TTL). For GTPE's own endpoints we re-read live temporary grants so
 * that a grant revoked mid-session stops working here within ~30 seconds rather
 * than waiting for the next token refresh. Authentication middleware and
 * `auth.service.ts` are deliberately left untouched.
 *
 * Elsewhere in the API, revocation takes effect on the next refresh — which is
 * always correct because revoke also sets `expiresAt = now()`.
 */

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  codes: string[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/** Drops a user's cached snapshot so the next request re-reads from the database. */
export function invalidateHydrationCache(userId?: string): void {
  if (userId) {
    cache.delete(userId);
    return;
  }
  cache.clear();
}

async function readLiveTemporaryCodes(userId: string): Promise<string[]> {
  const rows = await prisma.userPermission.findMany({
    where: {
      userId,
      isGranted: true,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { permission: { select: { code: true } } },
  });
  return rows.map((r) => r.permission.code);
}

export async function hydrateTemporaryPermissions(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const user = req.user;
  if (!user) {
    next();
    return;
  }

  try {
    const now = Date.now();
    const cached = cache.get(user.id);
    const codes =
      cached && cached.expiresAt > now
        ? cached.codes
        : await readLiveTemporaryCodes(user.id).then((fresh) => {
            cache.set(user.id, { codes: fresh, expiresAt: now + CACHE_TTL_MS });
            return fresh;
          });

    // Union of the token snapshot and live temporary grants. Stale temporary
    // entries carried in the token are dropped: anything GTPE-managed must be
    // present in the live set to survive.
    const live = new Set(codes);
    const stale = new Set(
      (cached?.codes ?? []).filter((code) => !live.has(code)),
    );
    req.user = {
      ...user,
      permissions: [
        ...new Set([...user.permissions.filter((p) => !stale.has(p)), ...codes]),
      ],
    };
  } catch (err) {
    // Never block the request on a hydration failure — the token snapshot stands.
    logger.error({ err }, "GTPE: failed to hydrate temporary permissions");
  }

  next();
}
