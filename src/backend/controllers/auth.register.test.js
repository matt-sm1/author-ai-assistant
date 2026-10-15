import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/backend/lib/db", () => ({
  default: {
    query: vi.fn(),
    end: vi.fn(),
    connect: vi.fn(),
  },
}));

vi.mock("@/backend/factories/auth.factory", () => ({
  createAuthService: vi.fn(() => ({
    bootstrapAdminIfNeeded: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getUserById: vi.fn(),
    createUser: vi.fn(),
  })),
}));

describe("registerController", () => {
  let registerController;

  beforeAll(async () => {
    ({ registerController } = await import(
      "@/backend/controllers/auth.controller"
    ));
  });

  it("rejects public registration", async () => {
    const response = await registerController();
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/disabled/i);
  });
});
