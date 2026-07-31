import { prisma } from "../../database/prisma.js";
import { RegisterInput, LoginInput } from "@campuscare/shared-schemas";
import { BadRequestError, UnauthorizedError } from "../../utils/errors.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export class AuthService {
  static async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existing) {
      throw new BadRequestError("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Fetch the default STUDENT role to link during registration
    let role = await prisma.role.findUnique({
      where: { name: "STUDENT" }
    });

    if (!role) {
      // Create role if not exist for bootstrap safety
      role = await prisma.role.create({
        data: { name: "STUDENT", description: "Standard student role" }
      });
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        roleId: role.id
      }
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { role: true }
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role.name },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name
      },
      accessToken,
      refreshToken
    };
  }
}
