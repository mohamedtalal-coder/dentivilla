import { execSync } from "child_process";

// Automatically load local .env if running outside Vercel/production (Node 20+)
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore missing .env
  }
}

async function prepareDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("ℹ️ [prepare-db] No DATABASE_URL set. Skipping migrations.");
    return;
  }

  console.log("🚀 [prepare-db] Applying Prisma database migrations...");
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("✅ [prepare-db] Database migrations applied successfully.");
  } catch (error) {
    console.warn("⚠️ [prepare-db] prisma migrate deploy finished with message:", error.message);
  }

  console.log("🌱 [prepare-db] Checking/seeding initial data (services, hours, admin user)...");
  try {
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
    console.log("✅ [prepare-db] Initial database seed completed.");
  } catch (error) {
    console.warn("⚠️ [prepare-db] Initial seed message:", error.message);
  }
}

prepareDatabase().catch((error) => {
  console.warn("⚠️ [prepare-db] Warning during DB preparation:", error);
});
