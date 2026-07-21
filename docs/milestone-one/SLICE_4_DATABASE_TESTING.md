# Slice 4 local database security tests

This harness extends the Slice 3 local-only synthetic suite for Circle invitations. Never point it at production, preview, beta, or a database containing real family information.

Verified toolchain remains Supabase CLI 2.109.1 with the local Docker Postgres image used by Slice 3.

```sh
npm run db:start
npm run db:reset
npm run db:status
npm run test:db
```

Fixtures use reserved `example.test` addresses only. Invitation tokens are generated in the test process; only SHA-256 digests are stored. Synthetic delivery capture records domain and delivery marker only.

## Coverage mapped to acceptance tests

- **AT-014:** Intended verified adult acceptance creates one membership and activates the proposed Family Coordinator assignment; mismatch and anonymous paths deny; tokens are single-use.
- **AT-015:** Forced `expires_at` in the past yields expired outcome, no membership, and one `invitation.expired` audit event.
- **AT-016:** Authorized cancel and identity-bound decline invalidate tokens without membership; later acceptance fails.

## Objects added by migration `202607200003_slice_4_invitations.sql`

Tables: `circle_invitations`, `invitation_proposed_assignments`, `invitation_creation_requests`, `invitation_delivery_captures`.

Role expansion: `circle_role_assignments.role_code` allows `family_coordinator` in addition to `circle_head`.

RPCs: `create_circle_invitation`, `capture_invitation_delivery`, `cancel_circle_invitation`, `resend_circle_invitation`, `preview_circle_invitation`, `accept_circle_invitation`, `decline_circle_invitation`, `list_pending_circle_invitations`, `get_pending_circle_invitation`, `list_my_pending_invitations`, `preview_my_circle_invitation`, `decline_my_circle_invitation`. Acceptance always requires the caller-supplied opaque token; My Kinward is a review and confirmed-decline surface.

Helpers (not granted to authenticated): `kinward_is_active_circle_head`, `kinward_normalize_email`, `kinward_email_digest`, `kinward_mask_email`, `kinward_require_verified_active_adult`.
