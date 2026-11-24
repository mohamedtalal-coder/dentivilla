// Runs before `next build`: applies migrations and seeds reference data.
// On a Vercel *production* build any problem fails the build with a clear
// message, instead of shipping a site whose database silently doesn't work.
import { execSync, spawnSync } from "node:child_process";
import { readdirSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // no local .env — fine on Vercel
  }
}

const strict = process.env.VERCEL_ENV === "production";

function fail(message) {
  if (strict) {
    console.error(`\n[prepare-db] ERROR: ${message}\n`);
    process.exit(1);
  }
  console.warn(`[prepare-db] warning: ${message}`);
}

function run(label, command) {
  console.log(`[prepare-db] ${label}…`);
  try {
    execSync(command, { stdio: "inherit" });
    return true;
  } catch {
    fail(`${label} failed (see the output above).`);
    return false;
  }
}

function firstEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
}

/** Same rule as src/lib/database-url.ts: on Vercel, Dentivilla lives in its own "dentivilla" schema. */
function appSchema() {
  return process.env.DATABASE_SCHEMA ?? (process.env.VERCEL ? "dentivilla" : undefined);
}

function withAppSchema(raw) {
  const schema = appSchema();
  if (!raw || !schema) return raw;
  try {
    const parsed = new URL(raw);
    if (parsed.searchParams.has("schema")) return raw;
    parsed.searchParams.set("schema", schema);
    return parsed.toString();
  } catch {
    return raw;
  }
}

function withoutSchemaParam(raw) {
  if (!raw) return raw;
  try {
    const parsed = new URL(raw);
    parsed.searchParams.delete("schema");
    return parsed.toString();
  } catch {
    return raw;
  }
}

function deriveDirectUrl(pooled) {
  const explicit = firstEnv("DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DIRECT_URL");
  if (explicit) return explicit;
  if (!pooled) return pooled;
  try {
    const url = new URL(pooled);
    url.searchParams.delete("pgbouncer");
    url.searchParams.delete("connection_limit");
    url.hostname = url.hostname.replace("-pooler.", ".");
    if (url.port === "6543") url.port = "5432";
    return url.toString();
  } catch {
    return pooled;
  }
}

const pooled = firstEnv(
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DIRECT_URL",
);
const direct = deriveDirectUrl(pooled);
const schema = appSchema();

if (!pooled) {
  fail(
    "No Postgres URL found. Neon on Vercel usually sets DATABASE_URL (and DATABASE_URL_UNPOOLED). " +
      "If you connected Neon under Storage, confirm the project is linked and both variables exist for Production.",
  );
} else if (process.env.VERCEL && /@(localhost|127\.0\.0\.1)[:/]/.test(pooled)) {
  fail("DATABASE_URL points to localhost, which does not exist on Vercel. Use the Neon connection string.");
} else {
  // Prisma migrate / db execute need a direct (unpooled) session. Neon’s Vercel
  // integration puts PgBouncer in DATABASE_URL, which cannot take advisory locks.
  process.env.DATABASE_URL = withAppSchema(direct);
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  if (schema) console.log(`[prepare-db] Using Postgres schema "${schema}".`);
  if (direct !== pooled) console.log("[prepare-db] Using the unpooled Neon URL for migrations.");
  if (ensureSchema(direct, schema) && migrate()) {
    run("Seeding reference data and the admin account", "npx tsx prisma/seed.ts");
  }
}

function ensureSchema(directUrl, schemaName) {
  if (!schemaName) return true;
  const adminUrl = withoutSchemaParam(directUrl);
  console.log(`[prepare-db] Ensuring Postgres schema "${schemaName}" exists…`);
  const sqlPath = join("prisma", ".ensure-schema.sql");
  writeFileSync(sqlPath, `CREATE SCHEMA IF NOT EXISTS "${schemaName}";\n`);
  try {
    const result = spawnSync(
      "npx",
      ["prisma", "db", "execute", "--file", sqlPath, "--url", adminUrl],
      { encoding: "utf8" },
    );
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    if (result.status === 0) return true;
    fail(`Could not create schema "${schemaName}" (see the output above).`);
    return false;
  } finally {
    try {
      unlinkSync(sqlPath);
    } catch {
      // ignore
    }
  }
}

/** prisma migrate deploy, plus a one-time safe baseline for databases created with `db push` (P3005). */
function migrate() {
  console.log("[prepare-db] Applying database migrations…");
  const result = spawnSync("npx prisma migrate deploy", { shell: true, encoding: "utf8" });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if (result.status === 0) return true;
  const output = `${result.stdout}${result.stderr}`;
  if (!output.includes("P3005")) {
    fail("Applying database migrations failed (see the output above).");
    return false;
  }

  console.log("[prepare-db] Database has tables but no migration history — baselining it once.");
  // db push without --accept-data-loss refuses anything destructive, so existing data is safe.
  if (!run("Syncing the schema (non-destructive)", "npx prisma db push --skip-generate")) return false;
  const migrations = readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const name of migrations) {
    if (!run(`Marking ${name} as applied`, `npx prisma migrate resolve --applied ${name}`)) return false;
  }
  if (!run("Adding booking-integrity constraints", "npx prisma db execute --file prisma/constraints.sql --schema prisma/schema.prisma")) {
    return false;
  }
  return run("Re-checking migrations", "npx prisma migrate deploy");
}
