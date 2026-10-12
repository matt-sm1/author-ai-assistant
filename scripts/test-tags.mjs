
/**
 * Tags API Smoke Tests
 * Next.js + PostgreSQL + httpOnly JWT Cookie
 *
 * Run:
 * 1. npm run dev
 * 2. node scripts/test-tags.mjs
 *
 * Node.js 18+
 * Use development/test database only.
 */

const BASE_URL = (
  process.env.BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");

const stamp = Date.now();
const email = `tags_test_${stamp}@example.com`;
const password = "StrongPass123";

const tagName = `Test Tag ${stamp}`;
const updatedName = `Updated Tag ${stamp}`;
const secondName = `Second Tag ${stamp}`;

const missingId = "00000000-0000-4000-8000-000000000001";

let passed = 0;
let failed = 0;
let cookie = "";

const createdIds = new Set();

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
  } = {}
) {
  const headers = {};

  if (auth && cookie) {
    headers.Cookie = cookie;
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
// ASSERTIONS
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
  return `(got ${r.status}) ${
    JSON.stringify(r.data)?.slice(0, 300)
  }`;
}

function isUUID(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

// ============================================
// MAIN TESTS
// ============================================

async function run() {
  console.log(`Testing Tags API at ${BASE_URL}\n`);

  let r;
  let tagId = null;
  let secondId = null;

  try {
    // ========================================
    // REGISTER USER
    // ========================================

    r = await call("/api/auth/register", {
      method: "POST",
      auth: false,
      body: {
        name: "Tags Test User",
        email,
        password,
      },
    });

    check(
      "setup: register user -> 201",
      r.status === 201,
      detail(r)
    );

    if (r.status !== 201) return;

    // ========================================
    // LOGIN USER
    // ========================================

    r = await call("/api/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });

    cookie = r.setCookie?.split(";")[0] || "";

    check(
      "setup: login and cookie -> 200",
      r.status === 200 && /^token=.+/.test(cookie),
      detail(r)
    );

    if (!cookie) return;

    // ========================================
    // AUTHENTICATION
    // ========================================

    r = await call("/api/tags", { auth: false });

    check(
      "tags: GET without auth -> 401",
      r.status === 401,
      detail(r)
    );

    r = await call("/api/tags", {
      method: "POST",
      auth: false,
      body: { name: tagName },
    });

    check(
      "tags: POST without auth -> 401",
      r.status === 401,
      detail(r)
    );

    // ========================================
    // CREATE VALIDATION
    // ========================================

    r = await call("/api/tags", {
      method: "POST",
      body: {},
    });

    check(
      "create: missing name -> 400",
      r.status === 400,
      detail(r)
    );

    r = await call("/api/tags", {
      method: "POST",
      body: { name: "   " },
    });

    check(
      "create: blank name -> 400",
      r.status === 400,
      detail(r)
    );

    r = await call("/api/tags", {
      method: "POST",
      body: { name: "A".repeat(101) },
    });

    check(
      "create: name over 100 characters -> 400",
      r.status === 400,
      detail(r)
    );

    r = await call("/api/tags", {
      method: "POST",
      body: { name: 12345 },
    });

    check(
      "create: numeric name -> 400",
      r.status === 400,
      detail(r)
    );

    r = await call("/api/tags", {
      method: "POST",
      body: { name: null },
    });

    check(
      "create: null name -> 400",
      r.status === 400,
      detail(r)
    );

    r = await call("/api/tags", {
      method: "POST",
      rawBody: '{"name":',
    });

    check(
      "create: malformed JSON -> 400",
      r.status === 400,
      detail(r)
    );

    // ========================================
    // CREATE VALID TAG
    // ========================================

    r = await call("/api/tags", {
      method: "POST",
      body: {
        name: `  ${tagName}  `,
        id: "forged-id",
        slug: "forged-slug",
      },
    });

    tagId = r.data?.data?.id;

    if (isUUID(tagId)) {
      createdIds.add(tagId);
    }

    check(
      "create: valid tag -> 201",
      r.status === 201 && isUUID(tagId),
      detail(r)
    );

    check(
      "create: name trimmed",
      r.data?.data?.name === tagName,
      detail(r)
    );

    check(
      "create: slug generated server-side",
      r.data?.data?.slug === `test-tag-${stamp}`,
      detail(r)
    );

    if (!isUUID(tagId)) return;

    // ========================================
    // DUPLICATE TAGS
    // ========================================

    r = await call("/api/tags", {
      method: "POST",
      body: { name: tagName },
    });

    check(
      "create: duplicate name -> 409",
      r.status === 409,
      detail(r)
    );

    r = await call("/api/tags", {
      method: "POST",
      body: { name: tagName.toUpperCase() },
    });

    check(
      "create: case-insensitive duplicate -> 409",
      r.status === 409,
      detail(r)
    );

    // ========================================
    // GET ALL TAGS
    // ========================================

    r = await call("/api/tags");

    check(
      "list: tags -> 200",
      r.status === 200 && Array.isArray(r.data?.data),
      detail(r)
    );

    check(
      "list: includes created tag",
      r.data?.data?.some((t) => t.id === tagId),
      detail(r)
    );

    // ========================================
    // GET TAG BY ID
    // ========================================

    r = await call(`/api/tags/${tagId}`);

    check(
      "get: existing tag -> 200",
      r.status === 200 &&
        r.data?.data?.id === tagId,
      detail(r)
    );

    check(
      "get: postCount is numeric",
      typeof r.data?.data?.postCount === "number",
      detail(r)
    );

    r = await call("/api/tags/not-a-uuid");

    check(
      "get: invalid UUID -> 400",
      r.status === 400,
      detail(r)
    );

    r = await call(`/api/tags/${missingId}`);

    check(
      "get: missing tag -> 404",
      r.status === 404,
      detail(r)
    );

    // ========================================
    // UPDATE TAG
    // ========================================

    r = await call(`/api/tags/${tagId}`, {
      method: "PUT",
      body: { name: updatedName },
    });

    check(
      "update: valid tag -> 200",
      r.status === 200 &&
        r.data?.data?.name === updatedName,
      detail(r)
    );

    check(
      "update: slug updated",
      r.data?.data?.slug === `updated-tag-${stamp}`,
      detail(r)
    );

    r = await call(`/api/tags/${tagId}`, {
      method: "PUT",
      body: { name: "   " },
    });

    check(
      "update: blank name -> 400",
      r.status === 400,
      detail(r)
    );

    r = await call(`/api/tags/${missingId}`, {
      method: "PUT",
      body: { name: "Missing Tag" },
    });

    check(
      "update: missing tag -> 404",
      r.status === 404,
      detail(r)
    );

    // ========================================
    // CREATE SECOND TAG
    // ========================================

    r = await call("/api/tags", {
      method: "POST",
      body: { name: secondName },
    });

    secondId = r.data?.data?.id;

    if (isUUID(secondId)) {
      createdIds.add(secondId);
    }

    check(
      "create: second tag -> 201",
      r.status === 201 && isUUID(secondId),
      detail(r)
    );

    if (isUUID(secondId)) {
      r = await call(`/api/tags/${secondId}`, {
        method: "PUT",
        body: { name: updatedName },
      });

      check(
        "update: duplicate name -> 409",
        r.status === 409,
        detail(r)
      );
    }

    // ========================================
    // UNAUTHENTICATED UPDATE / DELETE
    // ========================================

    r = await call(`/api/tags/${tagId}`, {
      method: "PUT",
      auth: false,
      body: { name: "Unauthorized Change" },
    });

    check(
      "update: without auth -> 401",
      r.status === 401,
      detail(r)
    );

    r = await call(`/api/tags/${tagId}`, {
      method: "DELETE",
      auth: false,
    });

    check(
      "delete: without auth -> 401",
      r.status === 401,
      detail(r)
    );

    // ========================================
    // DELETE TAG
    // ========================================

    r = await call(`/api/tags/${tagId}`, {
      method: "DELETE",
    });

    check(
      "delete: existing tag -> 200",
      r.status === 200,
      detail(r)
    );

    if (r.status === 200) {
      createdIds.delete(tagId);
    }

    r = await call(`/api/tags/${tagId}`);

    check(
      "delete: subsequent GET -> 404",
      r.status === 404,
      detail(r)
    );

    r = await call(`/api/tags/${tagId}`, {
      method: "DELETE",
    });

    check(
      "delete: already deleted -> 404",
      r.status === 404,
      detail(r)
    );

  } finally {
    // ========================================
    // CLEANUP
    // ========================================

    for (const id of createdIds) {
      if (!cookie) break;

      try {
        const cleanup = await call(`/api/tags/${id}`, {
          method: "DELETE",
        });

        console.log(
          `CLEANUP ${id}: HTTP ${cleanup.status}`
        );
      } catch (error) {
        console.error(
          `CLEANUP ${id}: ${error.message}`
        );
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
// RUN
// ============================================

run().catch((error) => {
  console.error(
    "Could not run tests:",
    error.message
  );

  process.exitCode = 1;
});
