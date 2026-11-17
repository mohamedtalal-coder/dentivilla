// Runs before `next build`: applies migrations and seeds reference data.
// On a Vercel *production* build any problem fails the build with a clear
// message, instead of shipping a site whose database silently doesn't work.
import { execSync, spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

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

/** Same rule as src/lib/database-url.ts: on Vercel, Dentivilla lives in its own "dentivilla" schema. */
function appDatabaseUrl(raw) {
  const schema = process.env.DATABASE_SCHEMA ?? (process.env.VERCEL ? "dentivilla" : undefined);
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

const url = appDatabaseUrl(process.env.DATABASE_URL);
if (url) {
  // child processes (prisma CLI, seed) inherit this
  process.env.DATABASE_URL = url;
  const schema = new URL(url).searchParams.get("schema");
  if (schema) console.log(`[prepare-db] Using Postgres schema "${schema}".`);
}
if (!url) {
  fail("DATABASE_URL is not set. Add your cloud Postgres URL (e.g. Neon) in Vercel → Settings → Environment Variables.");
} else if (process.env.VERCEL && /@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  fail("DATABASE_URL points to localhost, which does not exist on Vercel. Use a cloud Postgres URL (e.g. Neon).");
} else if (migrate()) {
  run("Seeding reference data and the admin account", "npx tsx prisma/seed.ts");
}

/** prisma migrate deploy, plus a one-time safe baseline for databases created with `db push` (P3005). */
function migrate() {
  console.log("[prepare-db] Applying database migrations…");
  const result = spawnSync("npx prisma migrate deploy", { shell: true, encoding: "utf8" });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if (result.status === 0) return true;
  if (!`${result.stdout}${result.stderr}`.includes("P3005")) {
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
