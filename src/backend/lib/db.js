import { Pool } from "pg";

const globalForDb = globalThis;

/**
 * Lazy pool so Next.js can collect route data at build time without DATABASE_URL.
 * Throws only when the database is actually used at runtime.
 */
function getPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  if (!globalForDb.__postgresPool) {
    // Neon uses sslmode=require; pg v8 warns unless uselibpqcompat=true is set.
    let url = connectionString;
    if (!url.includes("uselibpqcompat=")) {
      url += `${url.includes("?") ? "&" : "?"}uselibpqcompat=true`;
    }
    if (!/[?&]sslmode=/.test(url)) {
      url += "&sslmode=require";
    }

    globalForDb.__postgresPool = new Pool({ connectionString: url });
  }

  return globalForDb.__postgresPool;
}

const pool = new Proxy(
  {},
  {
    get(_target, prop, receiver) {
      if (prop === "then") return undefined;
      const real = getPool();
      const value = Reflect.get(real, prop, real);
      return typeof value === "function" ? value.bind(real) : value;
    },
  }
);

export default pool;
