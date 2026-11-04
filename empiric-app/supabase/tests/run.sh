#!/usr/bin/env bash
# Sobe um Postgres temporário, aplica stub + migrações e roda os testes de RLS.
set -euo pipefail
cd "$(dirname "$0")/.."
PGBIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)
DATA=$(mktemp -d); PORT=${PGPORT_TEST:-54329}
"$PGBIN/initdb" -D "$DATA" -U postgres -A trust >/dev/null
"$PGBIN/pg_ctl" -D "$DATA" -o "-p $PORT -k $DATA" -l "$DATA/log" start >/dev/null
trap '"$PGBIN/pg_ctl" -D "$DATA" stop -m fast >/dev/null; rm -rf "$DATA"' EXIT
PSQL="psql -h $DATA -p $PORT -U postgres -d postgres -v ON_ERROR_STOP=1 -q -At"
$PSQL -f tests/00_supabase_stub.sql
for f in migrations/*.sql; do $PSQL -f "$f"; done
$PSQL -f tests/rls_test.sql
