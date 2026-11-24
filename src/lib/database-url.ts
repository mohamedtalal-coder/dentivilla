/**
 * Neon on Vercel injects several connection strings:
 *   DATABASE_URL              pooled (PgBouncer) — use at runtime
 *   DATABASE_URL_UNPOOLED     direct — required for Prisma migrate
 *   POSTGRES_URL / POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING  (legacy names)
 *
 * The Neon database may be shared with another app that has its own tables in
 * `public` (including a different `User` table). Dentivilla keeps all of its
 * tables in a separate Postgres schema so neither app can touch the other's data.
 *
 * - On Vercel the schema defaults to `dentivilla`; set DATABASE_SCHEMA to override.
 * - Locally nothing changes (tables stay in `public`) unless DATABASE_SCHEMA is set.
 * - An explicit `?schema=` already in the URL always wins.
 *
 * Keep in sync with `scripts/prepare-db.mjs`.
 */

function firstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
}

export function rawDatabaseUrl(): string | undefined {
  return firstEnv(
    "DATABASE_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "DIRECT_URL",
  );
}

export function appSchema(): string | undefined {
  return process.env.DATABASE_SCHEMA ?? (process.env.VERCEL ? "dentivilla" : undefined);
}

export function withAppSchema(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  const schema = appSchema();
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

export function databaseUrl(raw = rawDatabaseUrl()): string | undefined {
  return withAppSchema(raw);
}
