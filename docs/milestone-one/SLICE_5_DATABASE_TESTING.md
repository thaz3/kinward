# Slice 5 local database security tests

This harness extends the Slice 3/4 local-only synthetic suite for Care Recipients and dedicated ownership invitations. Never point it at production, preview, beta, or a database containing real family information.

Verified toolchain remains Supabase CLI 2.109.1 with the local Docker Postgres image used by earlier slices.

```sh
npm run db:start
npm run db:reset
npm run db:status
npm run test:db
```

Fixtures use reserved `example.test` addresses only. Ownership invitation tokens are generated in the test process; only SHA-256 digests are ever stored. Consent is always the exact string `kinward.ownership.v1`. Synthetic delivery capture records domain and delivery marker only.

## Test files

- `tests/database/slice-5-care-recipients-security.test.ts` — proposal authorization, deny-by-default direct reads/writes, identity-bound acceptance, consent enforcement, owner-only read isolation, terminal transitions (decline / cancel / expire), self-activation, and denial fingerprint logging.
- `tests/database/slice-5-atomicity.test.ts` — fault injection via `kinward_test` triggers proving proposal and acceptance are all-or-nothing, then proving retry succeeds after the injected failure is removed.
- `tests/database/slice-5-concurrency.test.ts` — `Promise.all` races for proposal idempotency, sole-owner acceptance, invited-account-only acceptance, accept-versus-cancel determinism, and independent Dad/Mom activation.
- `tests/database/slice-5-isolation.test.ts` — focused Dad/Mom (AT-002/003/022) ownership isolation in a single Harbor circle, including non-owning Circle Head exclusion and write isolation between recipient rows.

## Coverage highlights

- **Sole ownership:** Exactly one recorded, consented owner per active recipient. Wrong accounts racing the intended owner never gain ownership.
- **Circle Head has no post-activation access:** The proposer (Circle Head) can never read an activated recipient via `get_owned_care_recipient` or a direct table select; only the accepting owner can.
- **Deny by default:** Only `select` on `care_recipients` is granted to `authenticated` (governed by an owner-only RLS policy). All other Slice 5 tables are RPC-only — direct inserts, updates, deletes, and token-digest reads are denied.
- **Consent binding:** Acceptance and self-activation require exactly `kinward.ownership.v1`; any other version yields `consent_required` (accept) or a raised error (self-activate) with no state change.
- **Identity binding:** Verified-email mismatch, Slice 4 circle-invitation tokens, and guessed digests/UUIDs all return a neutral `unavailable`.
- **Terminal transitions:** Decline and cancel archive the still-pending shell with no membership or ownership; forced past `expires_at` yields `expired` and archives the shell.
- **Atomicity:** Injected failures at each write stage (membership, acceptance record, consent record, activation, invitation update, audit) leave the recipient `proposed`, the invitation `pending` with an unrotated token, and no partial ownership, consent, membership, or acceptance audits. Proposal rollback leaves no recipient, invitation, or idempotency-ledger row.

## Objects exercised by migration `202607210001_slice_5_care_recipients.sql`

Tables: `care_recipients`, `care_recipient_ownership_invitations`, `ownership_proposal_requests`, `ownership_acceptance_records`, `consent_records`, `ownership_invitation_delivery_captures`, `ownership_acceptance_requests`.

RPCs: `propose_care_recipient`, `self_activate_care_recipient`, `accept_ownership_invitation`, `decline_ownership_invitation`, `cancel_ownership_proposal`, `resend_ownership_invitation`, `preview_ownership_invitation`, `capture_ownership_invitation_delivery`, `list_pending_care_recipients`, `get_pending_care_recipient`, `list_owned_care_recipients`, `get_owned_care_recipient`, `record_care_recipient_access_denied`.

Helpers (not granted to `authenticated`): `kinward_is_active_care_recipient_owner`, `kinward_rotate_token_digest`, `prevent_ownership_record_mutation`, plus the Slice 4 identity helpers (`kinward_require_verified_active_adult`, `kinward_is_active_circle_head`, `kinward_email_digest`, `kinward_mask_email`, `kinward_normalize_email`).

## Documented behavior

Concurrent proposals with **distinct** idempotency keys but the same label and email create **independent** recipients — a display label may legitimately name several distinct people — each with exactly one pending invitation (per-recipient pending uniqueness). Concurrent proposals sharing a single idempotency key deduplicate to one recipient.
