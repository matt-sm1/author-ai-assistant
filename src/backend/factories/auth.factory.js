import { UserRepository } from "@/backend/repositories/user.repository";
import { PasswordAuthStrategy } from "@/backend/strategies/password-auth.strategy";
import { JwtAdapter } from "@/backend/adapters/jwt.adapter";
import { AuthService } from "@/backend/services/auth.service";

export function createAuthService() {
  const userRepository = new UserRepository();

  const tokenProvider = new JwtAdapter();

  const authStrategy = new PasswordAuthStrategy(
    userRepository
  );

  return new AuthService(
    userRepository,
    authStrategy,
    tokenProvider
  );
}