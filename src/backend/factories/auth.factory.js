import { UserRepository } from "@/backend/repositories/user.repository";
import { SessionRepository } from "@/backend/repositories/session.repository";
import { PasswordAuthStrategy } from "@/backend/strategies/password-auth.strategy";
import { AuthService } from "@/backend/services/auth.service";

export function createAuthService() {
  const userRepository = new UserRepository();
  const sessionRepository = new SessionRepository();
  const authStrategy = new PasswordAuthStrategy(userRepository);

  return new AuthService(userRepository, authStrategy, sessionRepository);
}
