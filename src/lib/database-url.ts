/**
 * The Neon database on Vercel is shared with another app that has its own
 * tables in `public` (including a different `User` table). Dentivilla keeps
 * all of its tables in a separate Postgres schema so neither app can touch
 * the other's data.
 *
 * - On Vercel the schema defaults to `dentivilla`; set DATABASE_SCHEMA to override.
 * - Locally nothing changes (tables stay in `public`) unless DATABASE_SCHEMA is set.
 * - An explicit `?schema=` already in DATABASE_URL always wins.
 *
 * Keep in sync with `appDatabaseUrl` in scripts/prepare-db.mjs.
 */
export function databaseUrl(raw = process.env.DATABASE_URL): string | undefined {
  if (!raw) return raw;
  const schema = process.env.DATABASE_SCHEMA ?? (process.env.VERCEL ? "dentivilla" : undefined);
  if (!schema) return raw;
  try {
    const url = new URL(raw);
    if (url.searchParams.has("schema")) return raw;
    url.searchParams.set("schema", schema);
    return url.toString();
  } catch {
    return raw;
  }
}
