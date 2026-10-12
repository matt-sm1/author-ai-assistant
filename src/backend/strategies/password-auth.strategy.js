import bcrypt from "bcryptjs";
import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

export class PasswordAuthStrategy {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async authenticate({ email, password }) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppError(
        "Invalid email or password",
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      throw new AppError(
        "Invalid email or password",
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}