// Auth API smoke tests (httpOnly cookie version).
// Usage:
//   1. npm run dev                       (in one terminal)
//   2. node scripts/test-auth.mjs        (in another terminal, Node 18+)
// Optional: BASE_URL=http://localhost:3001 node scripts/test-auth.mjs

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const email = `test_${Date.now()}@example.com`;
const password = "StrongPass123";

let passed = 0;
let failed = 0;
let cookie = null; // "token=<jwt>"
let wrongPasswordMessage = null;

async function call(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // response had no JSON body
  }
  return { status: res.status, data, setCookie: res.headers.get("set-cookie") };
}

function check(name, condition, extra = "") {
  if (condition) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name} ${extra}`);
  }
}

async function run() {
  console.log(`Testing ${BASE_URL} with ${email}\n`);

  // Register
  let r = await call("/api/auth/register", {
    method: "POST",
    body: { name: "Test User", email, password: "123" },
  });
  check("register: weak password -> 400", r.status === 400, `(got ${r.status})`);

  r = await call("/api/auth/register", { method: "POST", body: { email } });
  check("register: missing fields -> 400", r.status === 400, `(got ${r.status})`);

  r = await call("/api/auth/register", {
    method: "POST",
    body: { name: "Test User", email, password },
  });
  check("register: valid data -> 201", r.status === 201, `(got ${r.status}) ${JSON.stringify(r.data)}`);
  check("register: response has no password/hash", !JSON.stringify(r.data || {}).toLowerCase().includes("password"));

  r = await call("/api/auth/register", {
    method: "POST",
    body: { name: "Test User", email, password },
  });
  check("register: duplicate email -> 409", r.status === 409, `(got ${r.status})`);

  // Login
  r = await call("/api/auth/login", { method: "POST", body: { email, password } });
  check("login: valid credentials -> 200", r.status === 200, `(got ${r.status})`);
  check("login: sets httpOnly token cookie", /(^|,\s*)token=[^;]+/.test(r.setCookie || "") && /httponly/i.test(r.setCookie || ""), `(Set-Cookie: ${r.setCookie})`);
  check("login: cookie has SameSite", /samesite=(lax|strict)/i.test(r.setCookie || ""));
  check("login: token is NOT in the JSON body", r.data && !("token" in r.data));
  check("login: response has user without password", !!r.data?.user && !("password" in r.data.user) && !("password_hash" in r.data.user));
  cookie = (r.setCookie || "").split(";")[0] || null; // "token=<jwt>"

  r = await call("/api/auth/login", { method: "POST", body: { email, password: "WrongPass999" } });
  check("login: wrong password -> 401", r.status === 401, `(got ${r.status})`);
  check("login: wrong password sets no cookie", !r.setCookie);
  wrongPasswordMessage = r.data?.message;

  r = await call("/api/auth/login", {
    method: "POST",
    body: { email: `nobody_${Date.now()}@example.com`, password },
  });
  check("login: unknown email -> 401", r.status === 401, `(got ${r.status})`);
  check("login: same message for unknown email and wrong password", r.data?.message === wrongPasswordMessage);

  r = await call("/api/auth/login", { method: "POST", body: { email: "not-an-email" } });
  check("login: invalid input -> 400", r.status === 400, `(got ${r.status})`);

  // /me
  r = await call("/api/auth/me", { headers: { Cookie: cookie || "" } });
  check("me: with valid cookie -> 200", r.status === 200, `(got ${r.status})`);
  check("me: returns the same email", r.data?.user?.email === email);

  r = await call("/api/auth/me");
  check("me: no cookie -> 401", r.status === 401, `(got ${r.status})`);

  r = await call("/api/auth/me", { headers: { Cookie: "token=not.a.real.token" } });
  check("me: invalid token -> 401", r.status === 401, `(got ${r.status})`);

  // Protected posts route
  r = await call("/api/posts");
  check("posts: no cookie -> 401", r.status === 401, `(got ${r.status})`);

  // Logout
  r = await call("/api/auth/logout", { method: "POST", headers: { Cookie: cookie || "" } });
  check("logout: -> 200", r.status === 200, `(got ${r.status})`);
  check("logout: clears cookie (Max-Age=0)", /max-age=0/i.test(r.setCookie || ""), `(Set-Cookie: ${r.setCookie})`);

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Could not run tests. Is `npm run dev` running?", err.message);
  process.exit(1);
});
