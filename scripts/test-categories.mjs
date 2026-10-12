
/**
 * Categories API Smoke Tests
 * Next.js + PostgreSQL + httpOnly JWT Cookie
 *
 * Run:
 * 1. npm run dev
 * 2. node scripts/test-categories.mjs
 *
 * Node.js 18+
 * Run only against development/test database.
 */

const BASE_URL = (
  process.env.BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");

const stamp = Date.now();
const email = `category_test_${stamp}@example.com`;
const password = "StrongPass123";

let passed = 0;
let failed = 0;
let cookie = "";

const createdIds = new Set();

const categoryName = `Test Category ${stamp}`;
const updatedName = `Updated Category ${stamp}`;

// ============================================
// HTTP REQUEST HELPER
// ============================================

async function call(
  path,
  {
    method = "GET",
    body,
    auth = true,
    rawBody,
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
// TEST RESULT HELPER
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
  console.log(`Testing Categories API at ${BASE_URL}\n`);

  let r;
  let categoryId = null;
  let secondId = null;

  try {
    // ========================================
    // REGISTER TEST USER
    // ========================================

    r = await call("/api/auth/register", {
      method: "POST",
      auth: false,
      body: {
        name: "Category Test User",
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
    // LOGIN
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
    // UNAUTHENTICATED REQUESTS
    // ========================================

    r = await call("/api/categories", {
      auth: false,
    });

    check(
      "categories: GET without auth -> 401",
      r.status === 401,
      detail(r)
    );

    r = await call("/api/categories", {
      method: "POST",
      auth: false,
      body: { name: categoryName },
    });

    check(
      "categories: POST without auth -> 401",
      r.status === 401,
      detail(r)
    );

    // ========================================
    // CREATE VALIDATION
    // ========================================

    r = await call("/api/categories", {
      method: "POST",
      body: {},
    });

    check(
      "create: missing name -> 400",
      r.status === 400,
      detail(r)
    );

    r = await call("/api/categories", {
      method: "POST",
      body: { name: "   " },
    });

    check(
      "create: blank name -> 400",
      r.status === 400,
      detail(r)
    );

    r = await call("/api/categories", {
      method: "POST",
      body: { name: "A".repeat(101) },
    });

    check(
      "create: name over 100 characters -> 400",
      r.status === 400,
      detail(r)
    );

    r = await call("/api/categories", {
      method: "POST",
      body: { name: 12345 },
    });

    check(
      "create: numeric name must be rejected -> 400",
      r.status === 400,
      detail(r)
    );

    r = await call("/api/categories", {
      method: "POST",
      rawBody: '{"name":',
    });

    check(
      "create: malformed JSON -> 400",
      r.status === 400,
      detail(r)
    );

    // ========================================
    // CREATE CATEGORY
    // ========================================

    r = await call("/api/categories", {
      method: "POST",
      body: {
        name: `  ${categoryName}  `,
        slug: "forged-slug",
        id: "forged-id",
      },
    });

    categoryId = r.data?.data?.id;

    if (isUUID(categoryId)) {
      createdIds.add(categoryId);
    }

    check(
      "create: valid category -> 201",
      r.status === 201 && isUUID(categoryId),
      detail(r)
    );

    check(
      "create: trims category name",
      r.data?.data?.name === categoryName,
      detail(r)
    );

    check(
      "create: slug generated server-side",
      r.data?.data?.slug ===
        `test-category-${stamp}`,
      detail(r)
    );

    if (!isUUID(categoryId)) return;

    // ========================================
    // DUPLICATE CATEGORY
    // ========================================

    r = await call("/api/categories", {
      method: "POST",
      body: { name: categoryName },
    });

    check(
      "create: duplicate name -> 409",
      r.status === 409,
      detail(r)
    );

    r = await call("/api/categories", {
      method: "POST",
      body: { name: categoryName.toUpperCase() },
    });

    check(
      "create: case-insensitive duplicate -> 409",
      r.status === 409,
      detail(r)
    );

    // ========================================
    // GET ALL CATEGORIES
    // ========================================

    r = await call("/api/categories");

    check(
      "list: categories -> 200",
      r.status === 200 && Array.isArray(r.data?.data),
      detail(r)
    );

    check(
      "list: includes created category",
      r.data?.data?.some((c) => c.id === categoryId),
      detail(r)
    );

    // ========================================
    // GET CATEGORY BY ID
    // ========================================

    r = await call(`/api/categories/${categoryId}`);

    check(
      "get: existing category -> 200",
      r.status === 200 &&
        r.data?.data?.id === categoryId,
      detail(r)
    );

    r = await call("/api/categories/not-a-uuid");

    check(
      "get: invalid UUID -> 400",
      r.status === 400,
      detail(r)
    );

    const missingId =
      "00000000-0000-4000-8000-000000000001";

    r = await call(`/api/categories/${missingId}`);

    check(
      "get: missing category -> 404",
      r.status === 404,
      detail(r)
    );

    // ========================================
    // UPDATE CATEGORY
    // ========================================

    r = await call(`/api/categories/${categoryId}`, {
      method: "PUT",
      body: { name: updatedName },
    });

    check(
      "update: valid category -> 200",
      r.status === 200 &&
        r.data?.data?.name === updatedName,
      detail(r)
    );

    check(
      "update: slug updated",
      r.data?.data?.slug ===
        `updated-category-${stamp}`,
      detail(r)
    );

    r = await call(`/api/categories/${categoryId}`, {
      method: "PUT",
      body: { name: "   " },
    });

    check(
      "update: blank name -> 400",
      r.status === 400,
      detail(r)
    );

    r = await call(`/api/categories/${missingId}`, {
      method: "PUT",
      body: { name: "Missing Category" },
    });

    check(
      "update: missing category -> 404",
      r.status === 404,
      detail(r)
    );

    // ========================================
    // SECOND CATEGORY
    // ========================================

    r = await call("/api/categories", {
      method: "POST",
      body: {
        name: `Second Category ${stamp}`,
      },
    });

    secondId = r.data?.data?.id;

    if (isUUID(secondId)) {
      createdIds.add(secondId);
    }

    check(
      "create: second category -> 201",
      r.status === 201 && isUUID(secondId),
      detail(r)
    );

    if (isUUID(secondId)) {
      r = await call(`/api/categories/${secondId}`, {
        method: "PUT",
        body: { name: updatedName },
      });

      check(
        "update: duplicate category name -> 409",
        r.status === 409,
        detail(r)
      );
    }

    // ========================================
    // UNAUTHENTICATED UPDATE
    // ========================================

    r = await call(`/api/categories/${categoryId}`, {
      method: "PUT",
      auth: false,
      body: { name: "Unauthorized Change" },
    });

    check(
      "update: no authentication -> 401",
      r.status === 401,
      detail(r)
    );

    // ========================================
    // UNAUTHENTICATED DELETE
    // ========================================

    r = await call(`/api/categories/${categoryId}`, {
      method: "DELETE",
      auth: false,
    });

    check(
      "delete: no authentication -> 401",
      r.status === 401,
      detail(r)
    );

    // ========================================
    // DELETE CATEGORY
    // ========================================

    r = await call(`/api/categories/${categoryId}`, {
      method: "DELETE",
    });

    check(
      "delete: existing category -> 200",
      r.status === 200,
      detail(r)
    );

    if (r.status === 200) {
      createdIds.delete(categoryId);
    }

    r = await call(`/api/categories/${categoryId}`);

    check(
      "delete: subsequent GET -> 404",
      r.status === 404,
      detail(r)
    );

    r = await call(`/api/categories/${categoryId}`, {
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
      try {
        const cleanup = await call(
          `/api/categories/${id}`,
          { method: "DELETE" }
        );

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
    // FINAL RESULTS
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
  console.error(
    "Could not run tests:",
    error.message
  );

  process.exitCode = 1;
});
