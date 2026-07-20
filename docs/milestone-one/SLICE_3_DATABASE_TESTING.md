# Slice 3 local database security tests

This harness is local-only and synthetic-only. Never point it at production, preview, beta, or a database containing real family information.

Verified toolchain: Supabase CLI 2.109.1, Docker client/server 29.4.3, PostgreSQL 17.6 using `public.ecr.aws/supabase/postgres:17.6.1.143`.

```sh
npm run db:start
npm run db:reset
npm run db:status
npm run test:db
```

The runner obtains `KINWARD_TEST_SUPABASE_URL`, `KINWARD_TEST_SUPABASE_ANON_KEY`, `KINWARD_TEST_SUPABASE_SERVICE_ROLE_KEY`, and `KINWARD_TEST_DATABASE_URL` from the running local CLI and passes them only to Vitest. The service-role key is used only in the Node test process to create and remove synthetic auth fixtures and inspect security outcomes. It is never browser code. `npm run db:reset` reapplies all migrations to a clean database; `npm run db:stop` removes the local stack.

Fixtures use reserved `example.test` addresses and synthetic Circle names. The suite verifies real RLS allow/deny behavior, RPC authorization, privacy-safe denial audit data, rollback fault injection, and concurrent idempotency.

## AT-021 logging alignment

AT-021 requires a safe attempted-context identifier while the permission model prohibits protected identifiers and family content in visible audit text. Slice 3 therefore records a one-way SHA-256 fingerprint of a well-formed attempted Circle UUID in the separate security event. It does not persist the raw attempted UUID, Circle name, membership fact, route value, or protected payload. Malformed identifiers receive the same neutral denial but have no context fingerprint. Runtime tests prove the fingerprint is present, deterministic, and contains neither the raw UUID nor Circle content.

Audit rows are database-enforced append-only: authenticated roles have no table writes, and UPDATE, DELETE, and TRUNCATE triggers also reject table-owner mutation. A composite foreign key requires every Circle role assignment’s membership to belong to the same Circle.
