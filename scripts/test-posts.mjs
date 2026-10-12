import { randomUUID } from "node:crypto";

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000")
  .trim()
  .replace(/\/+$/, "");

const EXISTING_TAG_INPUT = (
  process.env.POSTS_TEST_EXISTING_TAG || ""
).trim();

const AUTH_COOKIE_INPUT = (process.env.AUTH_COOKIE || "").trim();
const AUTH_EMAIL = (process.env.AUTH_EMAIL || "").trim();
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let cookie = "";
let passed = 0;
let failed = 0;

const createdPostIds = new Set();

function validateConfiguration() {
  const baseUrl = new URL(BASE_URL);

  if (!["http:", "https:"].includes(baseUrl.protocol)) {
    throw new Error("BASE_URL must use http or https.");
  }

  if (!EXISTING_TAG_INPUT) {
    throw new Error(
      "POSTS_TEST_EXISTING_TAG is required and must name an existing tag."
    );
  }

  if (EXISTING_TAG_INPUT.length > 100) {
    throw new Error(
      "POSTS_TEST_EXISTING_TAG cannot exceed 100 characters."
    );
  }

  if (AUTH_COOKIE_INPUT) {
    cookie = extractTokenCookie(AUTH_COOKIE_INPUT);
    return;
  }

  if (Boolean(AUTH_EMAIL) !== Boolean(AUTH_PASSWORD)) {
    throw new Error(
      "Set both AUTH_EMAIL and AUTH_PASSWORD, or provide AUTH_COOKIE."
    );
  }

  if (!AUTH_EMAIL || !AUTH_PASSWORD) {
    throw new Error(
      "Authentication is required: set AUTH_COOKIE or both AUTH_EMAIL and AUTH_PASSWORD."
    );
  }
}

function extractTokenCookie(value) {
  const tokenCookie = value
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  if (!tokenCookie || tokenCookie.length === "token=".length) {
    throw new Error(
      'AUTH_COOKIE must contain a non-empty token cookie, for example token=<JWT>.'
    );
  }

  return tokenCookie;
}

function jsonSummary(response) {
  const value =
    response.data !== null
      ? JSON.stringify(response.data)
      : response.raw || "(empty response body)";

  return value.length > 800 ? `${value.slice(0, 800)}...` : value;
}

async function request(path, { method = "GET", body, authenticated = true } = {}) {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (authenticated && cookie) {
    headers.set("Cookie", cookie);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const raw = await response.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // Keep the raw body for useful failure output.
  }

  return {
    status: response.status,
    data,
    raw,
    setCookie: response.headers.get("set-cookie") || "",
  };
}

function recordPostId(response) {
  const id = response.data?.data?.id;

  if (typeof id === "string" && UUID_PATTERN.test(id)) {
    createdPostIds.add(id);
  }
}

async function runRequestTest(
  name,
  path,
  options,
  verify,
  failureDetails = () => ""
) {
  let response;

  try {
    response = await request(path, options);
  } catch (error) {
    failed++;
    console.log(
      `FAIL | ${name} | HTTP N/A | Request failed: ${error.message}`
    );
    throw error;
  }

  options?.onResponse?.(response);

  let ok = false;

  try {
    ok = Boolean(verify(response));
  } catch {
    ok = false;
  }

  if (ok) {
    passed++;
    console.log(`PASS | ${name} | HTTP ${response.status}`);
    return response;
  }

  failed++;
  const extra = failureDetails(response);
  const suffix = extra ? ` | ${extra}` : "";

  console.log(
    `FAIL | ${name} | HTTP ${response.status}${suffix} | Response: ${jsonSummary(response)}`
  );

  throw new Error(`${name} failed.`);
}

function isSuccessEnvelope(response, expectedStatus) {
  return (
    response.status === expectedStatus &&
    response.data?.success === true
  );
}

function tagNamesMatch(post, expectedNames) {
  if (!Array.isArray(post?.tags)) {
    return false;
  }

  const validTagObjects = post.tags.every(
    (tag) =>
      tag &&
      typeof tag.id === "string" &&
      UUID_PATTERN.test(tag.id) &&
      typeof tag.name === "string" &&
      typeof tag.slug === "string"
  );

  if (!validTagObjects) {
    return false;
  }

  const actual = post.tags
    .map((tag) => tag.name.trim().toLowerCase())
    .sort();

  const expected = expectedNames
    .map((name) => name.trim().toLowerCase())
    .sort();

  return (
    actual.length === expected.length &&
    actual.every((name, index) => name === expected[index])
  );
}

function tagFailureDetails(expectedNames) {
  return (response) => {
    const actualTags = response.data?.data?.tags;
    return `Expected tag names ${JSON.stringify(expectedNames)}; received ${JSON.stringify(actualTags)}`;
  };
}

function postPayload(title, tags) {
  return {
    title,
    content: "Automated Posts API tag test.",
    excerpt: "Temporary API test post.",
    featuredImage: null,
    status: "draft",
    visibility: "public",
    publishedAt: null,
    categoryId: null,
    tags,
    seoTitle: null,
    metaDescription: null,
  };
}

async function authenticate() {
  if (AUTH_COOKIE_INPUT) {
    return;
  }

  let loginCookie = "";

  await runRequestTest(
    "Authenticate with POST /api/auth/login",
    "/api/auth/login",
    {
      method: "POST",
      authenticated: false,
      body: {
        email: AUTH_EMAIL,
        password: AUTH_PASSWORD,
      },
      onResponse(response) {
        loginCookie = extractTokenCookie(response.setCookie);
        cookie = loginCookie;
      },
    },
    (response) =>
      response.status === 200 &&
      response.data?.success === true &&
      Boolean(loginCookie),
    () =>
      "Expected HTTP 200, success=true, and a token Set-Cookie header."
  );
}

async function cleanupCreatedPosts() {
  if (createdPostIds.size === 0) {
    return;
  }

  if (!cookie) {
    for (const id of createdPostIds) {
      failed++;
      console.log(
        `FAIL | Cleanup test post ${id} | HTTP N/A | No authenticated cookie is available.`
      );
    }
    return;
  }

  for (const id of createdPostIds) {
    try {
      const response = await request(`/api/posts/${id}`, {
        method: "DELETE",
      });

      const ok =
        response.status === 200 &&
        response.data?.success === true;

      if (ok) {
        passed++;
        console.log(`PASS | Cleanup test post ${id} | HTTP ${response.status}`);
      } else {
        failed++;
        console.log(
          `FAIL | Cleanup test post ${id} | HTTP ${response.status} | Response: ${jsonSummary(response)}`
        );
      }
    } catch (error) {
      failed++;
      console.log(
        `FAIL | Cleanup test post ${id} | HTTP N/A | Request failed: ${error.message}`
      );
    }
  }
}

async function main() {
  try {
    validateConfiguration();
  } catch (error) {
    failed++;
    console.log(
      `FAIL | Configuration | HTTP N/A | ${error.message}`
    );
    console.log("\nResult: 0 passed, 1 failed");
    process.exitCode = 1;
    return;
  }

  if (typeof fetch !== "function") {
    failed++;
    console.log(
      "FAIL | Node.js fetch availability | HTTP N/A | Use a Node.js version with built-in fetch (Node.js 18 or newer)."
    );
    console.log(`\nResult: ${passed} passed, ${failed} failed`);
    process.exitCode = 1;
    return;
  }

  const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const existingTagSearch = new URLSearchParams({
    page: "1",
    limit: "100",
    search: EXISTING_TAG_INPUT,
  });

  let existingTagName = "";

  console.log(`Testing Posts API at ${BASE_URL}\n`);

  try {
    await authenticate();

    await runRequestTest(
      "Authenticated GET /api/posts",
      "/api/posts?page=1&limit=1",
      {},
      (response) =>
        response.status === 200 &&
        response.data?.success === true &&
        Array.isArray(response.data?.data) &&
        response.data?.pagination?.page === 1 &&
        response.data?.pagination?.limit === 1,
      () => "Expected success envelope, posts array, and pagination metadata."
    );

    await runRequestTest(
      "Find configured existing tag through GET /api/tags",
      `/api/tags?${existingTagSearch.toString()}`,
      {},
      (response) => {
        if (
          response.status !== 200 ||
          response.data?.success !== true ||
          !Array.isArray(response.data?.data)
        ) {
          return false;
        }

        const match = response.data.data.find(
          (tag) =>
            typeof tag?.name === "string" &&
            tag.name.trim().toLowerCase() ===
              EXISTING_TAG_INPUT.toLowerCase()
        );

        if (!match) {
          return false;
        }

        existingTagName = match.name;
        return true;
      },
      () =>
        `No exact tag named ${JSON.stringify(EXISTING_TAG_INPUT)} was found. Check the name and authenticated user's access.`
    );

    const createdTagName = `Posts API test ${suffix}`;
    const existingTagPostTitle = `Posts API existing tag ${suffix}`;
    const newTagPostTitle = `Posts API new tag ${suffix}`;

    await runRequestTest(
      "Create post with an existing tag",
      "/api/posts",
      {
        method: "POST",
        body: postPayload(existingTagPostTitle, [existingTagName]),
        onResponse: recordPostId,
      },
      (response) =>
        isSuccessEnvelope(response, 201) &&
        UUID_PATTERN.test(response.data?.data?.id || "") &&
        tagNamesMatch(response.data.data, [existingTagName]),
      tagFailureDetails([existingTagName])
    );

    await runRequestTest(
      "Create post with a new uniquely named tag",
      "/api/posts",
      {
        method: "POST",
        body: postPayload(newTagPostTitle, [createdTagName]),
        onResponse: recordPostId,
      },
      (response) =>
        isSuccessEnvelope(response, 201) &&
        UUID_PATTERN.test(response.data?.data?.id || "") &&
        tagNamesMatch(response.data.data, [createdTagName]),
      tagFailureDetails([createdTagName])
    );

    const newTagPostId = [...createdPostIds].at(-1);

    if (!newTagPostId) {
      throw new Error(
        "The new-tag post response did not contain a valid post UUID."
      );
    }

    const updatePayload = postPayload(
      newTagPostTitle,
      [existingTagName]
    );

    await runRequestTest(
      "Update post tags from the new tag to the existing tag",
      `/api/posts/${newTagPostId}`,
      {
        method: "PUT",
        body: updatePayload,
      },
      (response) =>
        isSuccessEnvelope(response, 200) &&
        tagNamesMatch(response.data?.data, [existingTagName]),
      tagFailureDetails([existingTagName])
    );

    await runRequestTest(
      "Verify updated tag names with GET /api/posts/:id",
      `/api/posts/${newTagPostId}`,
      {},
      (response) =>
        response.status === 200 &&
        response.data?.success === true &&
        response.data?.data?.id === newTagPostId &&
        tagNamesMatch(response.data.data, [existingTagName]),
      tagFailureDetails([existingTagName])
    );

    await runRequestTest(
      "Update post with an empty tags array",
      `/api/posts/${newTagPostId}`,
      {
        method: "PUT",
        body: postPayload(newTagPostTitle, []),
      },
      (response) =>
        isSuccessEnvelope(response, 200) &&
        tagNamesMatch(response.data?.data, []),
      tagFailureDetails([])
    );

    await runRequestTest(
      "Verify empty tag relationships with GET /api/posts/:id",
      `/api/posts/${newTagPostId}`,
      {},
      (response) =>
        response.status === 200 &&
        response.data?.success === true &&
        response.data?.data?.id === newTagPostId &&
        tagNamesMatch(response.data.data, []),
      tagFailureDetails([])
    );
  } catch (error) {
    console.error(`\nStopped: ${error.message}`);
  } finally {
    await cleanupCreatedPosts();

    console.log(`\nResult: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  }
}

await main();