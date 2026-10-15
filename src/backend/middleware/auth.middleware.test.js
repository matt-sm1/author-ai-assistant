import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/backend/lib/auth-context", () => ({
  resolveAuthFromRequest: vi.fn(),
}));

import { resolveAuthFromRequest } from "@/backend/lib/auth-context";
import { withAuth, withRole } from "@/backend/middleware/auth.middleware";

function mockRequest() {
  return new Request("http://localhost/api/posts");
}

describe("withAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when session cannot be resolved", async () => {
    resolveAuthFromRequest.mockResolvedValue(null);
    const handler = withAuth(async () => Response.json({ ok: true }));
    const response = await handler(mockRequest());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it("passes AuthContext to the controller", async () => {
    const auth = {
      userId: "u1",
      role: "editor",
      email: "e@example.com",
      name: "Ed",
      sessionId: "s1",
    };
    resolveAuthFromRequest.mockResolvedValue(auth);

    const handler = withAuth(async (_req, received) =>
      Response.json({ role: received.role, userId: received.userId })
    );
    const response = await handler(mockRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      role: "editor",
      userId: "u1",
    });
  });
});

describe("withRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when role is not allowed", async () => {
    resolveAuthFromRequest.mockResolvedValue({
      userId: "u1",
      role: "editor",
      email: "e@example.com",
      name: "Ed",
      sessionId: "s1",
    });

    const handler = withRole("admin")(async () =>
      Response.json({ ok: true })
    );
    const response = await handler(mockRequest());
    expect(response.status).toBe(403);
  });

  it("allows matching admin role", async () => {
    resolveAuthFromRequest.mockResolvedValue({
      userId: "u1",
      role: "admin",
      email: "a@example.com",
      name: "Admin",
      sessionId: "s1",
    });

    const handler = withRole("admin")(async (_req, auth) =>
      Response.json({ ok: true, role: auth.role })
    );
    const response = await handler(mockRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      role: "admin",
    });
  });
});
