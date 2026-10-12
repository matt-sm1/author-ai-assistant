
/**
 * Authentication Security Smoke Tests
 * Next.js + JWT + HttpOnly Cookies
 *
 * Run:
 * 1. npm run dev
 * 2. node scripts/test-auth-security.mjs
 *
 * Node.js 18+
 * DEVELOPMENT DATABASE ONLY
 */

import crypto from "node:crypto";

const BASE_URL = (
  process.env.BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");

const timestamp = Date.now();
const email = `security_test_${timestamp}@example.com`;
const password = "StrongPass123";

let passed = 0;
let failed = 0;
let cookie = "";
let token = "";

// ============================================
// HTTP REQUEST HELPER
// ============================================

async function call(
  path,
  {
    method = "GET",
    body,
    cookieHeader,
    rawBody,
  } = {}
) {
  const headers = {};

  if (cookieHeader !== undefined) {
    headers.Cookie = cookieHeader;
  }

  if (body !== undefined || rawBody !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body:
      rawBody !== undefined
        ? rawBody
        : body === undefined
          ? undefined
          : JSON.stringify(body),
    redirect: "manual",
  });

  const raw = await response.text();

  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // Non-JSON response
  }

  return {
    status: response.status,
    data,
    setCookie: response.headers.get("set-cookie"),
  };
}

// ============================================
// TEST HELPERS
// ============================================

function check(name, condition, extra = "") {
  if (condition) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name} ${extra}`);
  }
}

function detail(r) {
  return `(HTTP ${r.status}) ${
    JSON.stringify(r.data)?.slice(0, 300)
  }`;
}

function encodeBase64Url(value) {
  return Buffer.from(JSON.stringify(value))
    .toString("base64url");
}

function decodeJwtPayload(jwt) {
  const parts = jwt.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  return JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf8")
  );
}

// ============================================
// PROTECTED ENDPOINTS
// ============================================

const protectedRoutes = [
  "/api/auth/me",
  "/api/posts",
  "/api/categories",
  "/api/tags",
];

// ============================================
// MAIN TESTS
// ============================================

async function run() {
  console.log(
    `Testing Authentication Security at ${BASE_URL}\n`
  );

  let r;

  try {
    // ========================================
    // REGISTER TEST USER
    // ========================================

    r = await call("/api/auth/register", {
      method: "POST",
      body: {
        name: "Security Test User",
        email,
        password,
      },
    });

    check(
      "setup: registration -> 201",
      r.status === 201,
      detail(r)
    );

    if (r.status !== 201) return;

    // ========================================
    // LOGIN
    // ========================================

    r = await call("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });

    cookie = r.setCookie?.split(";")[0] || "";
    token = cookie.startsWith("token=")
      ? cookie.slice("token=".length)
      : "";

    check(
      "setup: login and JWT cookie -> 200",
      r.status === 200 && token.split(".").length === 3,
      detail(r)
    );

    if (!token) return;

    // ========================================
    // COOKIE SECURITY
    // ========================================

    check(
      "cookie: HttpOnly enabled",
      /httponly/i.test(r.setCookie || "")
    );

    check(
      "cookie: SameSite=Lax or Strict",
      /samesite=(lax|strict)/i.test(r.setCookie || "")
    );

    check(
      "cookie: Path=/",
      /path=\//i.test(r.setCookie || "")
    );

    check(
      "cookie: token absent from JSON response",
      !Object.hasOwn(r.data || {}, "token")
    );

    if (process.env.EXPECT_SECURE_COOKIE === "true") {
      check(
        "cookie: Secure enabled",
        /(?:^|;\s*)secure(?:;|$)/i.test(
          r.setCookie || ""
        )
      );
    }

    // ========================================
    // JWT PAYLOAD SECURITY
    // ========================================

    const payload = decodeJwtPayload(token);

    check(
      "JWT: contains subject (user ID)",
      typeof payload.sub === "string" &&
        payload.sub.length > 0
    );

    check(
      "JWT: has expiration",
      typeof payload.exp === "number"
    );

    check(
      "JWT: expiration is in future",
      payload.exp > Math.floor(Date.now() / 1000)
    );

    check(
      "JWT: does not contain password",
      !("password" in payload) &&
        !("password_hash" in payload)
    );

    // ========================================
    // MISSING COOKIE
    // ========================================

    for (const path of protectedRoutes) {
      r = await call(path);

      check(
        `auth: ${path} without cookie -> 401`,
        r.status === 401,
        detail(r)
      );
    }

    // ========================================
    // INVALID JWT
    // ========================================

    r = await call("/api/auth/me", {
      cookieHeader: "token=invalid.token.value",
    });

    check(
      "JWT: malformed token -> 401",
      r.status === 401,
      detail(r)
    );

    // ========================================
    // TAMPERED PAYLOAD
    // ========================================

    const parts = token.split(".");

    const forgedPayload = {
      ...payload,
      sub: crypto.randomUUID(),
    };

    const tamperedToken = [
      parts[0],
      encodeBase64Url(forgedPayload),
      parts[2],
    ].join(".");

    r = await call("/api/auth/me", {
      cookieHeader: `token=${tamperedToken}`,
    });

    check(
      "JWT: tampered payload -> 401",
      r.status === 401,
      detail(r)
    );

    // ========================================
    // ALG NONE ATTACK
    // ========================================

    const noneHeader = encodeBase64Url({
      alg: "none",
      typ: "JWT",
    });

    const unsignedToken = [
      noneHeader,
      encodeBase64Url(payload),
      "",
    ].join(".");

    r = await call("/api/auth/me", {
      cookieHeader: `token=${unsignedToken}`,
    });

    check(
      "JWT: unsigned alg=none token -> 401",
      r.status === 401,
      detail(r)
    );

    // ========================================
    // FAKE SIGNATURE
    // ========================================

    const fakeSignatureToken = [
      parts[0],
      parts[1],
      Buffer.from(
        crypto.randomBytes(32)
      ).toString("base64url"),
    ].join(".");

    r = await call("/api/auth/me", {
      cookieHeader: `token=${fakeSignatureToken}`,
    });

    check(
      "JWT: invalid signature -> 401",
      r.status === 401,
      detail(r)
    );

    // ========================================
    // EXPIRED JWT
    // ========================================

    const expiredPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600,
    };

    const expiredUnsigned = [
      noneHeader,
      encodeBase64Url(expiredPayload),
      "",
    ].join(".");

    r = await call("/api/auth/me", {
      cookieHeader: `token=${expiredUnsigned}`,
    });

    check(
      "JWT: expired unsigned token -> 401",
      r.status === 401,
      detail(r)
    );

    // Note: This does not prove that a correctly
    // signed but expired JWT is rejected.

    // ========================================
    // COOKIE EDGE CASES
    // ========================================

    r = await call("/api/auth/me", {
      cookieHeader: "token=",
    });

    check(
      "cookie: empty token -> 401",
      r.status === 401,
      detail(r)
    );

    r = await call("/api/auth/me", {
      cookieHeader: "other=value",
    });

    check(
      "cookie: unrelated cookie -> 401",
      r.status === 401,
      detail(r)
    );

    // ========================================
    // VALID SESSION
    // ========================================

    r = await call("/api/auth/me", {
      cookieHeader: cookie,
    });

    check(
      "JWT: valid session -> 200",
      r.status === 200 &&
        r.data?.user?.email === email,
      detail(r)
    );

    // ========================================
    // LOGIN SECURITY
    // ========================================

    r = await call("/api/auth/login", {
      method: "POST",
      body: {
        email,
        password: "IncorrectPassword123",
      },
    });

    const wrongPasswordMessage = r.data?.message;

    check(
      "login: wrong password -> 401",
      r.status === 401,
      detail(r)
    );

    check(
      "login: wrong password sets no cookie",
      !r.setCookie
    );

    r = await call("/api/auth/login", {
      method: "POST",
      body: {
        email: `unknown_${timestamp}@example.com`,
        password,
      },
    });

    check(
      "login: unknown email -> 401",
      r.status === 401,
      detail(r)
    );

    check(
      "login: same error for unknown email",
      r.data?.message === wrongPasswordMessage
    );

    // ========================================
    // LOGOUT
    // ========================================

    r = await call("/api/auth/logout", {
      method: "POST",
      cookieHeader: cookie,
    });

    check(
      "logout: status -> 200",
      r.status === 200,
      detail(r)
    );

    check(
      "logout: clears cookie",
      /max-age=0/i.test(r.setCookie || "")
    );

    // ========================================
    // REPLAY TOKEN AFTER LOGOUT
    // ========================================

    r = await call("/api/auth/me", {
      cookieHeader: cookie,
    });

    console.log(
      "\nINFO  Old JWT after logout:",
      r.status === 200
        ? "Still valid server-side (stateless JWT)"
        : `HTTP ${r.status}`
    );

    // Clearing a cookie does not revoke
    // an already-issued JWT server-side.

  } finally {
    // ========================================
    // TEST SUMMARY
    // ========================================

    console.log(
      `\nResult: ${passed} passed, ${failed} failed`
    );

    console.log(
      "Note: test user remains in database."
    );

    if (failed > 0) {
      process.exitCode = 1;
    }
  }
}

// ============================================
// RUN
// ============================================

run().catch((error) => {
  console.error(
    "Could not run security tests:",
    error.message
  );

  process.exitCode = 1;
});
