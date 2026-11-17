// Runs before `next build`: applies migrations and seeds reference data.
// On a Vercel *production* build any problem fails the build with a clear
// message, instead of shipping a site whose database silently doesn't work.
import { execSync } from "node:child_process";

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

const url = process.env.DATABASE_URL;
if (!url) {
  fail("DATABASE_URL is not set. Add your cloud Postgres URL (e.g. Neon) in Vercel → Settings → Environment Variables.");
} else if (process.env.VERCEL && /@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  fail("DATABASE_URL points to localhost, which does not exist on Vercel. Use a cloud Postgres URL (e.g. Neon).");
} else if (run("Applying database migrations", "npx prisma migrate deploy")) {
  run("Seeding reference data and the admin account", "npx tsx prisma/seed.ts");
}
