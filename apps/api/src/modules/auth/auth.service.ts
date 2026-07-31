import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../database/prisma.js";
import { RegisterInput, LoginInput } from "@campuscare/shared-schemas";
import { BadRequestError, UnauthorizedError, ForbiddenError } from "../../utils/errors.js";
import { env } from "../../config/env.js";
import type { AuthUser } from "@campuscare/shared-types";

// User-Agent parser helper
function parseUserAgent(uaString: string | undefined) {
  if (!uaString) {
    return {
      deviceName: "Unknown Device",
      deviceType: "desktop",
      browser: "Unknown Browser",
      os: "Unknown OS",
    };
  }

  let deviceType = "desktop";
  if (/mobile/i.test(uaString)) deviceType = "mobile";
  if (/tablet|ipad|playbook|silk/i.test(uaString)) deviceType = "tablet";

  let browser = "Unknown Browser";
  if (/chrome|crios/i.test(uaString)) browser = "Chrome";
  else if (/firefox|fxios/i.test(uaString)) browser = "Firefox";
  else if (/safari/i.test(uaString) && !/chrome|crios/i.test(uaString)) browser = "Safari";
  else if (/opr\//i.test(uaString)) browser = "Opera";
  else if (/edg/i.test(uaString)) browser = "Edge";

  let os = "Unknown OS";
  if (/windows/i.test(uaString)) os = "Windows";
  else if (/macintosh|mac os x/i.test(uaString)) os = "macOS";
  else if (/android/i.test(uaString)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(uaString)) os = "iOS";
  else if (/linux/i.test(uaString)) os = "Linux";

  let deviceName = "Desktop PC";
  if (deviceType === "mobile") deviceName = "Mobile Phone";
  if (deviceType === "tablet") deviceName = "Tablet";
  if (/iphone/i.test(uaString)) deviceName = "iPhone";
  else if (/ipad/i.test(uaString)) deviceName = "iPad";

  return { deviceName, deviceType, browser, os };
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export class AuthService {
  static async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new BadRequestError("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    let role = await prisma.role.findUnique({
      where: { name: "STUDENT" },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: "STUDENT",
          displayName: "Student",
          description: "Standard student role",
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        roleId: role.id,
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  static async login(
    input: LoginInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Resolve permissions (role permissions + active overrides)
    const basePermissions = user.role.permissions.map((rp) => rp.permission.code);
    const overrides = user.permissions
      .filter((up) => !up.expiresAt || new Date(up.expiresAt) > new Date())
      .reduce((acc, curr) => {
        if (curr.isGranted) {
          acc.add(curr.permission.code);
        } else {
          acc.delete(curr.permission.code);
        }
        return acc;
      }, new Set<string>(basePermissions));

    const finalPermissions = Array.from(overrides);

    // Create session (device tracking)
    const rawRefreshToken = crypto.randomUUID();
    const tokenHash = hashToken(rawRefreshToken);
    const uaMeta = parseUserAgent(userAgent);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        deviceName: uaMeta.deviceName,
        deviceType: uaMeta.deviceType,
        browser: uaMeta.browser,
        os: uaMeta.os,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Update user lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Sign Access Token (15m)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role.name,
        permissions: finalPermissions,
        departmentId: user.departmentId,
        sessionId: session.id,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role.name,
        permissions: finalPermissions,
        departmentId: user.departmentId,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  static async refresh(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    const hashed = hashToken(rawRefreshToken);

    // Look up session
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashed },
      include: {
        user: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Reuse detection
    if (!session || session.revoked) {
      if (session) {
        // Token was revoked previously but is presented again → Compromised family!
        console.warn(`⚠️ Reuse detected for token: ${hashed}. Revoking all sessions for user: ${session.userId}`);
        await prisma.session.updateMany({
          where: { userId: session.userId },
          data: {
            revoked: true,
            revokedAt: new Date(),
            revokedReason: "REUSE_DETECTED",
          },
        });
      }
      throw new UnauthorizedError("Session is invalid or has been revoked");
    }

    if (new Date(session.expiresAt) < new Date()) {
      await prisma.session.update({
        where: { id: session.id },
        data: {
          revoked: true,
          revokedAt: new Date(),
          revokedReason: "EXPIRED",
        },
      });
      throw new UnauthorizedError("Session has expired");
    }

    const user = session.user;
    if (!user.isActive) {
      throw new UnauthorizedError("User account is disabled");
    }

    // Resolve permissions (role permissions + active overrides)
    const basePermissions = user.role.permissions.map((rp) => rp.permission.code);
    const overrides = user.permissions
      .filter((up) => !up.expiresAt || new Date(up.expiresAt) > new Date())
      .reduce((acc, curr) => {
        if (curr.isGranted) {
          acc.add(curr.permission.code);
        } else {
          acc.delete(curr.permission.code);
        }
        return acc;
      }, new Set<string>(basePermissions));

    const finalPermissions = Array.from(overrides);

    // Rotate token
    const newRawRefreshToken = crypto.randomUUID();
    const newTokenHash = hashToken(newRawRefreshToken);
    const uaMeta = parseUserAgent(userAgent);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        tokenHash: newTokenHash,
        lastActivity: new Date(),
        deviceName: uaMeta.deviceName || session.deviceName,
        deviceType: uaMeta.deviceType || session.deviceType,
        browser: uaMeta.browser || session.browser,
        os: uaMeta.os || session.os,
        ipAddress: ipAddress || session.ipAddress,
        userAgent: userAgent || session.userAgent,
      },
    });

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role.name,
        permissions: finalPermissions,
        departmentId: user.departmentId,
        sessionId: session.id,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return {
      accessToken,
      newRefreshToken: newRawRefreshToken,
    };
  }

  static async logout(rawRefreshToken: string): Promise<void> {
    const hashed = hashToken(rawRefreshToken);
    await prisma.session.updateMany({
      where: { tokenHash: hashed },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: "LOGOUT",
      },
    });
  }

  static async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new BadRequestError("Session not found");
    }
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: "LOGOUT",
      },
    });
  }

  static async logoutAll(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId, revoked: false },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: "LOGOUT",
      },
    });
  }

  static async getActiveSessions(userId: string) {
    const sessions = await prisma.session.findMany({
      where: { userId, revoked: false },
      orderBy: { lastActivity: "desc" },
    });
    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      deviceName: s.deviceName,
      deviceType: s.deviceType,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ipAddress,
      lastActivity: s.lastActivity,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  static async getMe(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError("User session is invalid");
    }

    // Resolve permissions (role permissions + active overrides)
    const basePermissions = user.role.permissions.map((rp) => rp.permission.code);
    const overrides = user.permissions
      .filter((up) => !up.expiresAt || new Date(up.expiresAt) > new Date())
      .reduce((acc, curr) => {
        if (curr.isGranted) {
          acc.add(curr.permission.code);
        } else {
          acc.delete(curr.permission.code);
        }
        return acc;
      }, new Set<string>(basePermissions));

    const finalPermissions = Array.from(overrides);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role.name,
      permissions: finalPermissions,
      departmentId: user.departmentId,
    };
  }
}
export default AuthService;
