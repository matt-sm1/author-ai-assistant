import bcrypt from "bcryptjs";
import { AppError } from "@/backend/errors/app-error";
import { ERROR_CODES } from "@/backend/constants/error-codes";
import { HTTP_STATUS } from "@/backend/constants/http-status";

const SALT_ROUNDS = 12;
const SESSION_TTL_MS = 60 * 60 * 24 * 7 * 1000;

export class AuthService {
  constructor(userRepository, authStrategy, sessionRepository) {
    this.userRepository = userRepository;
    this.authStrategy = authStrategy;
    this.sessionRepository = sessionRepository;
  }

  async login({ email, password }) {
    const user = await this.authStrategy.authenticate({
      email: email.trim().toLowerCase(),
      password,
    });

    if (user.status === "disabled") {
      throw new AppError(
        "Invalid email or password",
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const session = await this.sessionRepository.create({
      userId: user.id,
      expiresAt,
    });

    return {
      sessionId: session.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }

  /**
   * Admin-only user creation (replaces public register).
   */
  async createUser({ name, email, password, role = "editor" }) {
    if (role !== "admin" && role !== "editor") {
      throw new AppError(
        "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        { role: "Role must be admin or editor" }
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const user = await this.userRepository.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role,
      });

      return { user };
    } catch (error) {
      if (error.code === "23505") {
        throw new AppError(
          "Registration failed",
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.EMAIL_EXISTS
        );
      }

      throw error;
    }
  }

  /**
   * One-time / env bootstrap when no admin exists.
   */
  async bootstrapAdminIfNeeded() {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Admin";

    if (!email || !password) {
      return null;
    }

    const adminCount = await this.userRepository.countAdmins();
    if (adminCount > 0) {
      return null;
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      return null;
    }

    return this.createUser({ name, email, password, role: "admin" });
  }

  async logout(sessionId) {
    if (sessionId) {
      await this.sessionRepository.revoke(sessionId);
    }
  }

  async getUserById(id) {
    return this.userRepository.findById(id);
  }
}
