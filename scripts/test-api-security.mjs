
/**
 * Blog CMS API Security Smoke Tests
 *
 * Tests:
 * - Authentication protection
 * - Input validation
 * - SQL injection handling
 * - XSS payload handling
 * - Forged author ID
 * - Invalid UUID
 * - Sensitive data exposure
 *
 * Run:
 *   npm run dev
 *   node scripts/test-api-security.mjs
 *
 * Node.js 18+
 * DEVELOPMENT / TEST DATABASE ONLY
 */

import crypto from "node:crypto";

const BASE_URL = (
  process.env.BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");

const stamp = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

const email = `api_security_${stamp}@example.com`;
const password = "StrongPass123";

const missingId = "00000000-0000-4000-8000-000000000001";

const sqlPayload = "' OR 1=1 --";
const xssPayload = '<script>alert("XSS")</script>';

let passed = 0;
let failed = 0;
let cookie = "";
let userId = null;

const resources = {
  posts: new Set(),
  categories: new Set(),
  tags: new Set(),
};

// ============================================
// REQUEST HELPER
// ============================================

async function call(
  path,
  {
    method = "GET",
    body,
    rawBody,
    auth = true,
    cookieOverride,
  } = {}
) {
  const headers = {};

  if (cookieOverride !== undefined) {
    headers.Cookie = cookieOverride;
  } else if (auth && cookie) {
    headers.Cookie = cookie;
  }

  if (body !== undefined || rawBody !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    redirect: "manual",
    body:
      rawBody !== undefined
        ? rawBody
        : body === undefined
          ? undefined
          : JSON.stringify(body),
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
    raw,
    setCookie: response.headers.get("set-cookie"),
  };
}

// ============================================
// TEST HELPERS
// ============================================

function check(name, condition, response = null) {
  if (condition) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;

    console.log(
      `FAIL  ${name}`,
      response
        ? `(HTTP ${response.status}) ${response.raw.slice(0, 250)}`
        : ""
    );
  }
}

function isUUID(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function remember(type, response) {
  const id = response.data?.data?.id;

  if (isUUID(id)) {
    resources[type].add(id);
  }

  return id;
}

function postPayload(overrides = {}) {
  return {
    title: `Security Post ${stamp}`,
    content: "Security testing content",
    excerpt: "Security testing excerpt",
    status: "draft",
    visibility: "public",
    tags: [],
    categoryId: null,
    ...overrides,
  };
}

function hasSensitiveFields(value) {
  const sensitive = new Set([
    "password",
    "password_hash",
    "passwordhash",
    "jwt_secret",
    "secret_key",
  ]);

  function inspect(obj) {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    for (const [key, val] of Object.entries(obj)) {
      if (sensitive.has(key.toLowerCase())) {
        return true;
      }

      if (inspect(val)) return true;
    }

    return false;
  }

  return inspect(value);
}

// ============================================
// MAIN TESTS
// ============================================

async function run() {
  console.log(`Testing API Security at ${BASE_URL}\n`);

  let r;

  try {
    // ========================================
    // REGISTER
    // ========================================

    r = await call("/api/auth/register", {
      method: "POST",
      body: {
        name: "API Security Test",
        email,
        password,
      },
    });

    check("setup: register -> 201", r.status === 201, r);

    if (r.status !== 201) return;

    userId = r.data?.user?.id ?? null;

    // ========================================
    // LOGIN
    // ========================================

    r = await call("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });

    cookie = r.setCookie?.split(";")[0] ?? "";

    check(
      "setup: login and cookie -> 200",
      r.status === 200 && /^token=.+/.test(cookie),
      r
    );

    if (!cookie) return;

    // ========================================
    // AUTHENTICATED IDENTITY
    // ========================================

    r = await call("/api/auth/me");

    if (r.status === 200 && isUUID(r.data?.user?.id)) {
      userId = r.data.user.id;
    }

    check(
      "auth: current user identity available",
      r.status === 200 && isUUID(userId),
      r
    );

    // ========================================
    // UNAUTHENTICATED READ ACCESS
    // ========================================

    for (const route of [
      "/api/posts",
      "/api/categories",
      "/api/tags",
    ]) {
      r = await call(route, { auth: false });

      check(
        `auth: GET ${route} -> 401`,
        r.status === 401,
        r
      );
    }

    // ========================================
    // INVALID TOKEN
    // ========================================

    for (const route of [
      "/api/posts",
      "/api/categories",
      "/api/tags",
    ]) {
      r = await call(route, {
        cookieOverride: "token=invalid.token.value",
      });

      check(
        `auth: forged token ${route} -> 401`,
        r.status === 401,
        r
      );
    }

    // ========================================
    // SQL INJECTION - ID
    // ========================================

    for (const route of [
      "/api/posts",
      "/api/categories",
      "/api/tags",
    ]) {
      r = await call(
        `${route}/${encodeURIComponent(sqlPayload)}`
      );

      check(
        `SQLi: invalid ID ${route} -> 400`,
        r.status === 400,
        r
      );
    }

    // ========================================
    // SQL INJECTION - NAME FIELDS
    // ========================================

    for (const type of ["categories", "tags"]) {
      r = await call(`/api/${type}`, {
        method: "POST",
        body: {
          name: `Security ${type} ${stamp} ${sqlPayload}`,
        },
      });

      const id = remember(type, r);

      check(
        `SQLi: ${type} input safely stored as data`,
        r.status === 201 && isUUID(id),
        r
      );

      if (isUUID(id)) {
        const fetched = await call(`/api/${type}/${id}`);

        check(
          `SQLi: ${type} original name preserved`,
          fetched.status === 200 &&
            fetched.data?.data?.name ===
              `Security ${type} ${stamp} ${sqlPayload}`,
          fetched
        );
      }
    }

    // ========================================
    // SQL INJECTION - POST TITLE
    // ========================================

    const injectionTitle =
      `Security SQL ${stamp} ${sqlPayload}`;

    r = await call("/api/posts", {
      method: "POST",
      body: postPayload({
        title: injectionTitle,
      }),
    });

    const sqlPostId = remember("posts", r);

    check(
      "SQLi: post title safely stored",
      r.status === 201 && isUUID(sqlPostId),
      r
    );

    if (isUUID(sqlPostId)) {
      r = await call(`/api/posts/${sqlPostId}`);

      check(
        "SQLi: post title preserved",
        r.status === 200 &&
          r.data?.data?.title === injectionTitle,
        r
      );
    }

    // ========================================
    // XSS - POST CONTENT
    // ========================================

    r = await call("/api/posts", {
      method: "POST",
      body: postPayload({
        title: `Security XSS ${stamp}`,
        content: xssPayload,
        excerpt: xssPayload,
      }),
    });

    const xssPostId = remember("posts", r);

    check(
      "XSS: content accepted as inert JSON data",
      r.status === 201 &&
        r.data?.data?.content === xssPayload,
      r
    );

    if (isUUID(xssPostId)) {
      r = await call(`/api/posts/${xssPostId}`);

      check(
        "XSS: stored content returned as JSON",
        r.status === 200 &&
          r.data?.data?.content === xssPayload,
        r
      );
    }

    // These tests do NOT prove frontend XSS safety.
    // HTML rendering must be tested separately.

    // ========================================
    // FORGED AUTHOR ID
    // ========================================

    const forgedAuthorId = crypto.randomUUID();

    r = await call("/api/posts", {
      method: "POST",
      body: postPayload({
        title: `Forged Author Test ${stamp}`,
        authorId: forgedAuthorId,
      }),
    });

    const forgedPostId = remember("posts", r);

    check(
      "authorization: forged authorId ignored",
      r.status === 201 &&
        r.data?.data?.author_id === userId &&
        r.data?.data?.author_id !== forgedAuthorId,
      r
    );

    // ========================================
    // MALFORMED JSON
    // ========================================

    for (const route of [
      "/api/posts",
      "/api/categories",
      "/api/tags",
    ]) {
      r = await call(route, {
        method: "POST",
        rawBody: '{"invalid":',
      });

      check(
        `validation: malformed JSON ${route} -> 400`,
        r.status === 400,
        r
      );
    }

    // ========================================
    // INVALID INPUT TYPES
    // ========================================

    r = await call("/api/posts", {
      method: "POST",
      body: postPayload({ title: 12345 }),
    });

    check(
      "validation: numeric post title -> 400",
      r.status === 400,
      r
    );

    for (const route of [
      "/api/categories",
      "/api/tags",
    ]) {
      r = await call(route, {
        method: "POST",
        body: { name: 12345 },
      });

      check(
        `validation: numeric name ${route} -> 400`,
        r.status === 400,
        r
      );
    }

    // ========================================
    // SENSITIVE DATA EXPOSURE
    // ========================================

    for (const route of [
      "/api/auth/me",
      "/api/posts",
      "/api/categories",
      "/api/tags",
    ]) {
      r = await call(route);

      check(
        `data: no sensitive fields ${route}`,
        r.status === 200 &&
          !hasSensitiveFields(r.data),
        r
      );
    }

    // ========================================
    // NON-EXISTENT RESOURCES
    // ========================================

    for (const route of [
      "/api/posts",
      "/api/categories",
      "/api/tags",
    ]) {
      r = await call(`${route}/${missingId}`);

      check(
        `resource: missing ${route} -> 404`,
        r.status === 404,
        r
      );
    }

    // ========================================
    // UNAUTHENTICATED MUTATIONS
    // ========================================

    for (const route of [
      "/api/posts",
      "/api/categories",
      "/api/tags",
    ]) {
      r = await call(route, {
        method: "POST",
        auth: false,
        body: { name: "Unauthorized", title: "Unauthorized" },
      });

      check(
        `auth: POST ${route} -> 401`,
        r.status === 401,
        r
      );

      r = await call(`${route}/${missingId}`, {
        method: "DELETE",
        auth: false,
      });

      check(
        `auth: DELETE ${route} -> 401`,
        r.status === 401,
        r
      );

      r = await call(`${route}/${missingId}`, {
        method: "PUT",
        auth: false,
        body: {
          name: "Unauthorized",
          title: "Unauthorized",
        },
      });

      check(
        `auth: PUT ${route} -> 401`,
        r.status === 401,
        r
      );
    }
  } finally {
    // ========================================
    // CLEANUP
    // ========================================

    console.log("\nCleaning up test resources...");

    for (const type of [
      "posts",
      "categories",
      "tags",
    ]) {
      for (const id of resources[type]) {
        if (!cookie) continue;

        try {
          const result = await call(
            `/api/${type}/${id}`,
            { method: "DELETE" }
          );

          console.log(
            `CLEANUP ${type}/${id}: HTTP ${result.status}`
          );
        } catch (error) {
          console.error(
            `CLEANUP ERROR ${type}/${id}:`,
            error.message
          );
        }
      }
    }

    // ========================================
    // RESULTS
    // ========================================

    console.log(
      `\nResult: ${passed} passed, ${failed} failed`
    );

    console.log(
      "Note: temporary test user is not deleted."
    );

    if (failed > 0) {
      process.exitCode = 1;
    }
  }
}

// ============================================
// EXECUTE
// ============================================

run().catch((error) => {
  console.error("Security test execution failed:", error);
  process.exitCode = 1;
});
