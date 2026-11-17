# One-time local DB setup for Dentivilla (native PostgreSQL 18 on Windows).
# Prompts for the 'postgres' superuser password you set when installing PostgreSQL.
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
& $psql -U postgres -h localhost -v ON_ERROR_STOP=1 -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='dentivilla') THEN CREATE ROLE dentivilla LOGIN PASSWORD 'dentivilla' CREATEDB; END IF; END `$`$;"
if (-not $?) { exit 1 }
$env:PGPASSWORD = "dentivilla"
$exists = & $psql -U dentivilla -h localhost -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='dentivilla'"
if ($exists -ne "1") { & $psql -U dentivilla -h localhost -d postgres -c "CREATE DATABASE dentivilla;" }
Remove-Item Env:PGPASSWORD
npx prisma migrate deploy
if ($?) { npx prisma db seed }
