import "server-only";

import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/backend/lib/auth-cookie";
import { getSessionIdFromRequest } from "@/backend/lib/auth-cookie";
import { SessionRepository } from "@/backend/repositories/session.repository";

const sessionRepository = new SessionRepository();

/**
 * @returns {Promise<{ userId: string, role: string, email: string, name: string, sessionId: string } | null>}
 */
export async function resolveAuthFromSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== "string") return null;

  const row = await sessionRepository.findActiveById(sessionId);
  if (!row) return null;

  return {
    userId: row.user_id,
    role: row.role,
    email: row.email,
    name: row.name,
    sessionId: row.id,
  };
}

export async function resolveAuthFromRequest(request) {
  const sessionId = getSessionIdFromRequest(request);
  return resolveAuthFromSessionId(sessionId);
}

export async function resolveAuthFromCookies() {
  const jar = await cookies();
  const sessionId = jar.get(COOKIE_NAME)?.value;
  return resolveAuthFromSessionId(sessionId);
}
