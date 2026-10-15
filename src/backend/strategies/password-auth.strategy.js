import bcrypt from "bcryptjs";
import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

/** Valid bcrypt hash (of a random string) so missing-user path still runs compare. */
const DUMMY_HASH =
  "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";

export class PasswordAuthStrategy {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async authenticate({ email, password }) {
    const user = await this.userRepository.findByEmail(email);

    const hash = user?.password_hash ?? DUMMY_HASH;
    const validPassword = await bcrypt.compare(password, hash);

    if (!user || !validPassword || user.status === "disabled") {
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
      role: user.role,
      status: user.status,
    };
  }
}
