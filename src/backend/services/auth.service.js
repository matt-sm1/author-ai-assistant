import bcrypt from "bcryptjs";
import { AppError } from "@/backend/errors/app-error";
import { ERROR_CODES } from "@/backend/constants/error-codes";
import { HTTP_STATUS } from "@/backend/constants/http-status";

const SALT_ROUNDS = 12;

export class AuthService {
  constructor(userRepository, authStrategy, tokenProvider) {
    this.userRepository = userRepository;
    this.authStrategy = authStrategy;
    this.tokenProvider = tokenProvider;
  }

  async login({ email, password }) {
    const user = await this.authStrategy.authenticate({
      email: email.trim().toLowerCase(),
      password,
    });

    return {
      token: this.tokenProvider.sign({ sub: user.id }),
      user,
    };
  }

  async register({ name, email, password }) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const user = await this.userRepository.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
      });

      return { user };
    } catch (error) {
      if (error.code === "23505") {
        throw new AppError(
          "Email already exists",
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.EMAIL_EXISTS
        );
      }

      throw error;
    }
  }

  async getUserById(id) {
    return this.userRepository.findById(id);
  }
}