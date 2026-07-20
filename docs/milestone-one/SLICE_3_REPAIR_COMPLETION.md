# Slice 3 targeted security repair completion

**Status:** Ready for targeted security re-audit  
**Scope:** Milestone One Slice 3 only  
**Data:** Synthetic local fixtures only

The audit repairs establish executable local Supabase evidence for Circle RLS, constrained RPC execution, atomic creation, rollback, concurrency, idempotency, privacy-safe denial logging, immutable audit records, and Circle/membership/role integrity. No invitation, Care Recipient, role-management, medical, upload, beta, deployment, or real-family behavior was added.

## Traceability

- Slice 3 implements UF-01 and the Circle switching/denial portions of UF-19–20.
- UF-02 is invitation-based second-Circle joining and remains in Slice 4.
- Slice 3 covers AT-001 and AT-021.
- Slice 3 proves only the AT-002 boundary that Circle Head status grants no Care Recipient authority. Full AT-002 remains in Slice 5, where Care Recipient records exist.

## Defense-in-depth repairs

- Both security-definer RPCs use an empty search path and schema-qualified references.
- Circle reads require an active membership in the exact Circle.
- Role assignments use a composite foreign key binding membership and Circle.
- Audit UPDATE, DELETE, and TRUNCATE operations are rejected by database triggers, including table-owner SQL.
- Denied Circle access stores a one-way attempted-context fingerprint, not the raw Circle UUID or family content.
- Creator/status and active Circle-membership indexes support the approved access paths.
- Circle switching clears rendered protected content before navigation completes; destination authorization remains server-side and dynamic.

## Reproduction

Follow `SLICE_3_DATABASE_TESTING.md`. From a clean local database run `npm run db:reset`, `npm run test:db`, then the standard formatting, lint, typecheck, unit-test, and build commands. No secrets are committed.
