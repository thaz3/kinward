-- Slice 5: Care Recipients and dedicated ownership invitations.
--
-- Scope and governing rules encoded in this migration:
--   * Exactly one adult sole owner per active Care Recipient. Ownership is only
--     ever granted through explicit, recorded, consented acceptance.
--   * A Circle Head may PROPOSE a Care Recipient and invite its future owner, but
--     the Circle Head gains NO access to the recipient after activation. Only the
--     accepting owner can read the active care_recipients row.
--   * Ownership invitations are a DISTINCT artifact from Slice 4 circle_invitations
--     (public.care_recipient_ownership_invitations). They never grant a circle role.
--   * Acceptance is atomic: membership (create-if-missing / reactivate-if-inactive)
--     + ownership + consent + activation + invitation invalidation + audit, all in
--     one transaction.
--   * Only a token digest is ever stored (never plaintext). Tokens are single-use:
--     on any terminal transition the digest is rotated to fresh random material.
--   * Ownership invite TTL is 7 days (aligned with Slice 4 circle_invitations;
--     docs/milestone-one/DATA_MODEL.md specifies an expiration without a fixed
--     default duration, so we align to the Slice 4 7-day window here).
--   * Decline / cancel / expire make the invitation terminal AND archive the still
--     pending care_recipient shell (status = 'archived'), per the wireframe rule to
--     archive an unactivated shell (UF-03 / Screens 08-12).
--   * Self-add (UF-03 alternate / Screen 08): a Circle Head who is already an active
--     member may become sole owner immediately, with recorded consent, without any
--     invitation.
--   * Existing membership on accept (Screen 09): membership is created only if
--     required; an inactive membership is reactivated rather than duplicated.
--   * Synthetic delivery domains only: example.test and example.com.
--
-- This migration is a NEW forward migration. It does NOT modify Slice 2-4 objects.
-- It does NOT implement Slice 6+ recipient roles, management modes, delegation, or
-- any medical/care content.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.care_recipients (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.family_circles(id),
  display_label text not null
    check (char_length(pg_catalog.btrim(display_label)) between 2 and 60)
    check (display_label = pg_catalog.btrim(display_label)),
  profile_classification text not null default 'adult'
    check (profile_classification = 'adult'),
  status text not null default 'proposed'
    check (status in ('proposed', 'active', 'archived', 'suspended', 'disputed_hold')),
  owner_user_id uuid references auth.users(id),
  proposed_by_user_id uuid not null references auth.users(id),
  proposed_at timestamptz not null default now(),
  activated_at timestamptz,
  ownership_acceptance_id uuid,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Active iff owner, acceptance, and activation are all present; any non-active
  -- status (proposed / archived / suspended / disputed_hold in this slice) keeps
  -- these ownership fields null.
  constraint care_recipients_active_fields check (
    (status = 'active'
      and owner_user_id is not null
      and ownership_acceptance_id is not null
      and activated_at is not null)
    or (status <> 'active'
      and owner_user_id is null
      and ownership_acceptance_id is null
      and activated_at is null)
  )
);

create index care_recipients_circle_status
  on public.care_recipients(circle_id, status);
create index care_recipients_owner_active
  on public.care_recipients(owner_user_id)
  where status = 'active';
-- Guarantees no second sole owner can attach to an active recipient row. The id is
-- the primary key, so this is trivially unique; the partial predicate documents the
-- "exactly one active owner per recipient" invariant explicitly.
create unique index care_recipients_one_active_owner
  on public.care_recipients(id)
  where status = 'active' and owner_user_id is not null;

create table public.care_recipient_ownership_invitations (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.family_circles(id),
  care_recipient_id uuid not null
    references public.care_recipients(id) on delete cascade,
  invited_email_digest text not null
    check (invited_email_digest ~ '^[0-9a-f]{64}$'),
  invited_email_mask text not null
    check (char_length(invited_email_mask) between 3 and 320),
  token_digest text not null
    check (token_digest ~ '^[0-9a-f]{64}$'),
  proposer_user_id uuid not null references auth.users(id),
  purpose text not null default 'care_recipient_ownership'
    check (purpose = 'care_recipient_ownership'),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  declined_at timestamptz,
  cancelled_at timestamptz,
  accepted_by_user_id uuid references auth.users(id),
  replaced_by_invitation_id uuid
    references public.care_recipient_ownership_invitations(id),
  version bigint not null default 1,
  constraint cr_ownership_invitations_expires_after_create
    check (expires_at > created_at),
  constraint cr_ownership_invitations_accepted_fields check (
    (status = 'accepted' and accepted_at is not null and accepted_by_user_id is not null)
    or (status <> 'accepted' and accepted_at is null and accepted_by_user_id is null)
  ),
  constraint cr_ownership_invitations_declined_fields check (
    (status = 'declined' and declined_at is not null)
    or (status <> 'declined' and declined_at is null)
  ),
  constraint cr_ownership_invitations_cancelled_fields check (
    (status = 'cancelled' and cancelled_at is not null)
    or (status <> 'cancelled' and cancelled_at is null)
  )
);

create unique index cr_ownership_invitations_token_digest_unique
  on public.care_recipient_ownership_invitations(token_digest);
-- Exactly one outstanding invitation per proposed recipient. The same person may be
-- invited to own several distinct recipients (Dad, Mom), so pending uniqueness is
-- keyed to the care_recipient_id, never to (circle, email).
create unique index cr_ownership_invitations_one_pending_per_recipient
  on public.care_recipient_ownership_invitations(care_recipient_id)
  where status = 'pending';
create index cr_ownership_invitations_circle_status
  on public.care_recipient_ownership_invitations(circle_id, status);
create index cr_ownership_invitations_pending_expires
  on public.care_recipient_ownership_invitations(expires_at)
  where status = 'pending';
create index cr_ownership_invitations_email_digest_status
  on public.care_recipient_ownership_invitations(invited_email_digest, status);

-- Idempotency ledger for proposal / self-add / resend creation requests.
create table public.ownership_proposal_requests (
  user_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  circle_id uuid not null references public.family_circles(id),
  display_label_normalized text not null,
  invited_email_digest text
    check (invited_email_digest is null or invited_email_digest ~ '^[0-9a-f]{64}$'),
  proposal_mode text not null
    check (proposal_mode in ('propose_other', 'self_add', 'resend')),
  care_recipient_id uuid references public.care_recipients(id),
  invitation_id uuid references public.care_recipient_ownership_invitations(id),
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);

-- Immutable ownership acceptance decisions (append-only, blocked by trigger).
create table public.ownership_acceptance_records (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid
    references public.care_recipient_ownership_invitations(id),
  care_recipient_id uuid not null references public.care_recipients(id),
  circle_id uuid not null references public.family_circles(id),
  accepting_user_id uuid not null references auth.users(id),
  consent_version text not null check (char_length(consent_version) between 1 and 120),
  decision text not null check (decision = 'accepted'),
  accepted_at timestamptz not null default now(),
  correlation_id uuid not null
);

create index ownership_acceptance_records_recipient
  on public.ownership_acceptance_records(care_recipient_id, accepted_at desc);
create index ownership_acceptance_records_user
  on public.ownership_acceptance_records(accepting_user_id, accepted_at desc);

-- Deferred FK: an active care_recipient points at the acceptance that activated it.
alter table public.care_recipients
  add constraint care_recipients_ownership_acceptance_fk
  foreign key (ownership_acceptance_id)
  references public.ownership_acceptance_records(id);

-- Immutable consent ledger (append-only, blocked by trigger).
create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.family_circles(id),
  care_recipient_id uuid not null references public.care_recipients(id),
  user_id uuid not null references auth.users(id),
  consent_kind text not null check (consent_kind = 'care_recipient_ownership'),
  consent_version text not null check (char_length(consent_version) between 1 and 120),
  decision text not null check (decision in ('accepted', 'declined')),
  recorded_at timestamptz not null default now(),
  ownership_acceptance_id uuid references public.ownership_acceptance_records(id),
  invitation_id uuid references public.care_recipient_ownership_invitations(id),
  correlation_id uuid not null
);

create index consent_records_recipient
  on public.consent_records(care_recipient_id, recorded_at desc);
create index consent_records_user
  on public.consent_records(user_id, recorded_at desc);

-- Synthetic-only delivery capture for ownership invitations. Never a production
-- transport. Opaque token material is never stored; only a non-reversible marker.
create table public.ownership_invitation_delivery_captures (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null
    references public.care_recipient_ownership_invitations(id),
  circle_id uuid not null references public.family_circles(id),
  destination_domain text not null
    check (destination_domain in ('example.test', 'example.com')),
  delivery_channel text not null default 'synthetic_capture'
    check (delivery_channel = 'synthetic_capture'),
  captured_at timestamptz not null default now(),
  correlation_id uuid not null,
  delivery_marker text not null check (delivery_marker ~ '^[0-9a-f]{64}$')
);

create index ownership_invitation_delivery_captures_invitation
  on public.ownership_invitation_delivery_captures(invitation_id, captured_at desc);
create unique index ownership_invitation_delivery_captures_one_per_invitation
  on public.ownership_invitation_delivery_captures(invitation_id);

-- Idempotency ledger for acceptance requests.
create table public.ownership_acceptance_requests (
  user_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  token_digest_prefix text
    check (token_digest_prefix is null or token_digest_prefix ~ '^[0-9a-f]{1,64}$'),
  care_recipient_id uuid references public.care_recipients(id),
  acceptance_id uuid references public.ownership_acceptance_records(id),
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);

-- ---------------------------------------------------------------------------
-- Row level security, grants, and revokes (deny by default)
-- ---------------------------------------------------------------------------

alter table public.care_recipients enable row level security;
alter table public.care_recipient_ownership_invitations enable row level security;
alter table public.ownership_proposal_requests enable row level security;
alter table public.ownership_acceptance_records enable row level security;
alter table public.consent_records enable row level security;
alter table public.ownership_invitation_delivery_captures enable row level security;
alter table public.ownership_acceptance_requests enable row level security;

-- Only an active sole owner may read their active care_recipients row directly
-- (mirrors the memberships self-read pattern). No policy lets a Circle Head read
-- active recipients: the Circle Head gains no access after activation.
revoke all on public.care_recipients from public, anon, authenticated;
grant select on public.care_recipients to authenticated;

create policy care_recipients_owner_read on public.care_recipients
  for select to authenticated
  using (status = 'active' and owner_user_id = auth.uid());

-- All other tables are RPC-only: no table grants, no select policies.
revoke all on public.care_recipient_ownership_invitations from public, anon, authenticated;
revoke all on public.ownership_proposal_requests from public, anon, authenticated;
revoke all on public.ownership_acceptance_records from public, anon, authenticated;
revoke all on public.consent_records from public, anon, authenticated;
revoke all on public.ownership_invitation_delivery_captures from public, anon, authenticated;
revoke all on public.ownership_acceptance_requests from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helper functions and immutability triggers
-- ---------------------------------------------------------------------------

-- True iff p_user_id is the active sole owner of an active care recipient.
create or replace function public.kinward_is_active_care_recipient_owner(
  p_care_recipient_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.care_recipients recipient
    where recipient.id = p_care_recipient_id
      and recipient.owner_user_id = p_user_id
      and recipient.status = 'active'
  );
$$;

revoke all on function public.kinward_is_active_care_recipient_owner(uuid, uuid)
  from public, anon, authenticated;

-- Returns fresh random 64-hex digest material for single-use token rotation.
create or replace function public.kinward_rotate_token_digest()
returns text
language sql
volatile
set search_path = ''
as $$
  select pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(gen_random_uuid()::text || clock_timestamp()::text, 'UTF8'),
      'sha256'
    ),
    'hex'
  );
$$;

revoke all on function public.kinward_rotate_token_digest()
  from public, anon, authenticated;

-- Append-only guard for acceptance and consent ledgers.
create or replace function public.prevent_ownership_record_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = '55000', message = 'record_is_append_only';
end;
$$;

revoke all on function public.prevent_ownership_record_mutation()
  from public, anon, authenticated;

create trigger ownership_acceptance_records_append_only
  before update or delete on public.ownership_acceptance_records
  for each row execute function public.prevent_ownership_record_mutation();
create trigger ownership_acceptance_records_no_truncate
  before truncate on public.ownership_acceptance_records
  for each statement execute function public.prevent_ownership_record_mutation();

create trigger consent_records_append_only
  before update or delete on public.consent_records
  for each row execute function public.prevent_ownership_record_mutation();
create trigger consent_records_no_truncate
  before truncate on public.consent_records
  for each statement execute function public.prevent_ownership_record_mutation();

-- ---------------------------------------------------------------------------
-- RPC 1: propose_care_recipient
-- ---------------------------------------------------------------------------
-- Circle Head proposes a Care Recipient shell and invites its future owner.
-- Creates a proposed care_recipient + a pending ownership invitation + audit.
-- Unlike ordinary circle invites, an existing member MAY be invited to own a
-- recipient, and account existence is never disclosed.
create or replace function public.propose_care_recipient(
  p_circle_id uuid,
  p_display_label text,
  p_invited_email text,
  p_token_digest text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_label text := pg_catalog.regexp_replace(pg_catalog.btrim(p_display_label), '[[:space:]]+', ' ', 'g');
  v_email text := public.kinward_normalize_email(p_invited_email);
  v_email_digest text;
  v_email_mask text;
  v_domain text;
  v_recipient_id uuid;
  v_invitation_id uuid;
  v_existing_circle uuid;
  v_existing_label text;
  v_existing_digest text;
  v_existing_recipient uuid;
  v_existing_invitation uuid;
begin
  if p_circle_id is null or p_idempotency_key is null
    or p_token_digest is null or p_token_digest !~ '^[0-9a-f]{64}$'
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if char_length(v_label) not between 2 and 60 then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if v_email is null or v_email !~ '^[^@]+@[^@]+\.[^@]+$' or char_length(v_email) > 254 then
    raise exception using errcode = '22023', message = 'invalid_email';
  end if;
  v_domain := split_part(v_email, '@', 2);
  if v_domain not in ('example.test', 'example.com') then
    raise exception using errcode = '22023', message = 'synthetic_email_required';
  end if;
  if not public.kinward_is_active_circle_head(p_circle_id, v_user_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  if not exists (
    select 1 from public.family_circles
    where id = p_circle_id and status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  v_email_digest := public.kinward_email_digest(v_email);
  v_email_mask := public.kinward_mask_email(v_email);

  insert into public.ownership_proposal_requests(
    user_id, idempotency_key, circle_id, display_label_normalized,
    invited_email_digest, proposal_mode
  ) values (
    v_user_id, p_idempotency_key, p_circle_id, v_label,
    v_email_digest, 'propose_other'
  ) on conflict do nothing;

  select circle_id, display_label_normalized, invited_email_digest,
         care_recipient_id, invitation_id
    into v_existing_circle, v_existing_label, v_existing_digest,
         v_existing_recipient, v_existing_invitation
  from public.ownership_proposal_requests
  where user_id = v_user_id and idempotency_key = p_idempotency_key
  for update;

  if v_existing_circle <> p_circle_id
    or v_existing_label <> v_label
    or v_existing_digest is distinct from v_email_digest
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  if v_existing_recipient is not null then
    return jsonb_build_object(
      'care_recipient_id', v_existing_recipient,
      'invitation_id', v_existing_invitation,
      'created', false,
      'deduplicated', true
    );
  end if;

  insert into public.care_recipients(
    circle_id, display_label, status, proposed_by_user_id
  ) values (
    p_circle_id, v_label, 'proposed', v_user_id
  ) returning id into v_recipient_id;

  insert into public.care_recipient_ownership_invitations(
    circle_id, care_recipient_id, invited_email_digest, invited_email_mask,
    token_digest, proposer_user_id, status, expires_at
  ) values (
    p_circle_id, v_recipient_id, v_email_digest, v_email_mask,
    p_token_digest, v_user_id, 'pending', now() + interval '7 days'
  ) returning id into v_invitation_id;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, next_state, correlation_id
  ) values (
    'care_recipient', 'care_recipient.proposed', v_user_id, p_circle_id,
    'care_recipient', v_recipient_id, 'succeeded',
    jsonb_build_object('status', 'proposed', 'classification', 'adult'),
    p_idempotency_key
  ),
  (
    'invitation', 'ownership_invitation.created', v_user_id, p_circle_id,
    'care_recipient_ownership_invitation', v_invitation_id, 'succeeded',
    jsonb_build_object(
      'status', 'pending',
      'purpose', 'care_recipient_ownership',
      'care_recipient_id', v_recipient_id,
      'expires_in_days', 7
    ),
    p_idempotency_key
  );

  update public.ownership_proposal_requests
    set care_recipient_id = v_recipient_id,
        invitation_id = v_invitation_id
  where user_id = v_user_id and idempotency_key = p_idempotency_key;

  return jsonb_build_object(
    'care_recipient_id', v_recipient_id,
    'invitation_id', v_invitation_id,
    'created', true,
    'deduplicated', false
  );
end;
$$;

revoke all on function public.propose_care_recipient(uuid, text, text, text, uuid)
  from public, anon;
grant execute on function public.propose_care_recipient(uuid, text, text, text, uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- RPC 2: self_activate_care_recipient
-- ---------------------------------------------------------------------------
-- UF-03 alternate / Screen 08: an active Circle Head becomes sole owner
-- immediately, with recorded consent, without any invitation.
create or replace function public.self_activate_care_recipient(
  p_circle_id uuid,
  p_display_label text,
  p_idempotency_key uuid,
  p_consent_version text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_label text := pg_catalog.regexp_replace(pg_catalog.btrim(p_display_label), '[[:space:]]+', ' ', 'g');
  v_recipient_id uuid;
  v_acceptance_id uuid;
  v_correlation uuid := gen_random_uuid();
  v_existing_circle uuid;
  v_existing_label text;
  v_existing_recipient uuid;
begin
  if p_circle_id is null or p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if char_length(v_label) not between 2 and 60 then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if p_consent_version is distinct from 'kinward.ownership.v1' then
    raise exception using errcode = '22023', message = 'consent_required';
  end if;
  -- Circle Head status already requires an active membership + active role.
  if not public.kinward_is_active_circle_head(p_circle_id, v_user_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  if not exists (
    select 1 from public.family_circles
    where id = p_circle_id and status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  insert into public.ownership_proposal_requests(
    user_id, idempotency_key, circle_id, display_label_normalized,
    invited_email_digest, proposal_mode
  ) values (
    v_user_id, p_idempotency_key, p_circle_id, v_label, null, 'self_add'
  ) on conflict do nothing;

  select circle_id, display_label_normalized, care_recipient_id
    into v_existing_circle, v_existing_label, v_existing_recipient
  from public.ownership_proposal_requests
  where user_id = v_user_id and idempotency_key = p_idempotency_key
  for update;

  if v_existing_circle <> p_circle_id or v_existing_label <> v_label then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if v_existing_recipient is not null then
    return jsonb_build_object(
      'care_recipient_id', v_existing_recipient,
      'created', false,
      'deduplicated', true
    );
  end if;

  -- Create the shell first so the acceptance record can reference it, then flip
  -- the shell to active (satisfying the active-fields constraint) once ownership
  -- and acceptance exist.
  insert into public.care_recipients(
    circle_id, display_label, status, proposed_by_user_id
  ) values (
    p_circle_id, v_label, 'proposed', v_user_id
  ) returning id into v_recipient_id;

  insert into public.ownership_acceptance_records(
    invitation_id, care_recipient_id, circle_id, accepting_user_id,
    consent_version, decision, correlation_id
  ) values (
    null, v_recipient_id, p_circle_id, v_user_id,
    p_consent_version, 'accepted', v_correlation
  ) returning id into v_acceptance_id;

  update public.care_recipients
    set status = 'active',
        owner_user_id = v_user_id,
        ownership_acceptance_id = v_acceptance_id,
        activated_at = now(),
        version = version + 1,
        updated_at = now()
  where id = v_recipient_id;

  insert into public.consent_records(
    circle_id, care_recipient_id, user_id, consent_kind, consent_version,
    decision, ownership_acceptance_id, invitation_id, correlation_id
  ) values (
    p_circle_id, v_recipient_id, v_user_id, 'care_recipient_ownership',
    p_consent_version, 'accepted', v_acceptance_id, null, v_correlation
  );

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, prior_state, next_state, correlation_id
  ) values (
    'care_recipient', 'care_recipient.proposed', v_user_id, p_circle_id,
    'care_recipient', v_recipient_id, 'succeeded',
    null,
    jsonb_build_object('status', 'proposed', 'source', 'self_add'),
    v_correlation
  ),
  (
    'care_recipient', 'care_recipient.owner_accepted', v_user_id, p_circle_id,
    'care_recipient', v_recipient_id, 'succeeded',
    null,
    jsonb_build_object('owner', 'self', 'consent_version', p_consent_version),
    v_correlation
  ),
  (
    'care_recipient', 'care_recipient.activated', v_user_id, p_circle_id,
    'care_recipient', v_recipient_id, 'succeeded',
    '{"status":"proposed"}'::jsonb,
    '{"status":"active"}'::jsonb,
    v_correlation
  ),
  (
    'authorization', 'ownership.self_activated', v_user_id, p_circle_id,
    'care_recipient', v_recipient_id, 'succeeded',
    null,
    jsonb_build_object('acceptance_id', v_acceptance_id),
    v_correlation
  );

  update public.ownership_proposal_requests
    set care_recipient_id = v_recipient_id
  where user_id = v_user_id and idempotency_key = p_idempotency_key;

  return jsonb_build_object(
    'care_recipient_id', v_recipient_id,
    'created', true,
    'deduplicated', false
  );
end;
$$;

revoke all on function public.self_activate_care_recipient(uuid, text, uuid, text)
  from public, anon;
grant execute on function public.self_activate_care_recipient(uuid, text, uuid, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- RPC 3: capture_ownership_invitation_delivery
-- ---------------------------------------------------------------------------
create or replace function public.capture_ownership_invitation_delivery(
  p_invitation_id uuid,
  p_destination_domain text,
  p_delivery_marker text,
  p_correlation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_circle_id uuid;
  v_status text;
  v_capture_id uuid;
begin
  if p_invitation_id is null or p_correlation_id is null
    or p_delivery_marker is null or p_delivery_marker !~ '^[0-9a-f]{64}$'
    or p_destination_domain not in ('example.test', 'example.com')
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  select circle_id, status into v_circle_id, v_status
  from public.care_recipient_ownership_invitations
  where id = p_invitation_id
  for update;
  if v_circle_id is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  if not public.kinward_is_active_circle_head(v_circle_id, v_user_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  if v_status <> 'pending' then
    raise exception using errcode = '22023', message = 'invalid_transition';
  end if;

  insert into public.ownership_invitation_delivery_captures(
    invitation_id, circle_id, destination_domain, delivery_marker, correlation_id
  ) values (
    p_invitation_id, v_circle_id, p_destination_domain, p_delivery_marker, p_correlation_id
  ) on conflict (invitation_id) do nothing
  returning id into v_capture_id;

  if v_capture_id is null then
    select id into v_capture_id
    from public.ownership_invitation_delivery_captures
    where invitation_id = p_invitation_id;
    return v_capture_id;
  end if;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, next_state, correlation_id
  ) values (
    'invitation', 'ownership_invitation.delivery_captured', v_user_id, v_circle_id,
    'care_recipient_ownership_invitation', p_invitation_id, 'succeeded',
    jsonb_build_object('channel', 'synthetic_capture', 'domain', p_destination_domain),
    p_correlation_id
  );

  return v_capture_id;
end;
$$;

revoke all on function public.capture_ownership_invitation_delivery(uuid, text, text, uuid)
  from public, anon;
grant execute on function public.capture_ownership_invitation_delivery(uuid, text, text, uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- RPC 4: cancel_ownership_proposal
-- ---------------------------------------------------------------------------
-- Circle Head cancels a pending proposal: invitation -> cancelled (token rotated)
-- and the still-pending recipient shell -> archived.
create or replace function public.cancel_ownership_proposal(
  p_care_recipient_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_circle_id uuid;
  v_status text;
  v_invitation_id uuid;
  v_correlation uuid := gen_random_uuid();
begin
  if p_care_recipient_id is null then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  select circle_id, status into v_circle_id, v_status
  from public.care_recipients
  where id = p_care_recipient_id
  for update;
  if v_circle_id is null or not public.kinward_is_active_circle_head(v_circle_id, v_user_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  if v_status = 'archived' then
    return jsonb_build_object(
      'care_recipient_id', p_care_recipient_id,
      'outcome', 'archived',
      'idempotent', true
    );
  end if;
  if v_status <> 'proposed' then
    raise exception using errcode = '22023', message = 'invalid_transition';
  end if;

  update public.care_recipient_ownership_invitations
    set status = 'cancelled',
        cancelled_at = now(),
        token_digest = public.kinward_rotate_token_digest(),
        version = version + 1
  where care_recipient_id = p_care_recipient_id and status = 'pending'
  returning id into v_invitation_id;

  update public.care_recipients
    set status = 'archived',
        version = version + 1,
        updated_at = now()
  where id = p_care_recipient_id;

  if v_invitation_id is not null then
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, prior_state, next_state, correlation_id
    ) values (
      'invitation', 'ownership_invitation.cancelled', v_user_id, v_circle_id,
      'care_recipient_ownership_invitation', v_invitation_id, 'succeeded',
      '{"status":"pending"}'::jsonb,
      '{"status":"cancelled"}'::jsonb,
      v_correlation
    );
  end if;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, prior_state, next_state, correlation_id
  ) values (
    'care_recipient', 'care_recipient.archived', v_user_id, v_circle_id,
    'care_recipient', p_care_recipient_id, 'succeeded',
    '{"status":"proposed"}'::jsonb,
    jsonb_build_object('status', 'archived', 'reason', 'cancelled'),
    v_correlation
  );

  return jsonb_build_object(
    'care_recipient_id', p_care_recipient_id,
    'invitation_id', v_invitation_id,
    'outcome', 'archived',
    'idempotent', false
  );
end;
$$;

revoke all on function public.cancel_ownership_proposal(uuid) from public, anon;
grant execute on function public.cancel_ownership_proposal(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC 5: resend_ownership_invitation
-- ---------------------------------------------------------------------------
-- Cancels the current pending invitation (token rotated) and issues a fresh
-- pending invitation with a new digest, keeping the recipient shell proposed.
create or replace function public.resend_ownership_invitation(
  p_care_recipient_id uuid,
  p_token_digest text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_circle_id uuid;
  v_recipient_status text;
  v_label text;
  v_old_invitation_id uuid;
  v_email_digest text;
  v_email_mask text;
  v_new_invitation_id uuid;
  v_existing_recipient uuid;
  v_existing_invitation uuid;
  v_correlation uuid := gen_random_uuid();
begin
  if p_care_recipient_id is null or p_idempotency_key is null
    or p_token_digest is null or p_token_digest !~ '^[0-9a-f]{64}$'
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  select care_recipient_id, invitation_id
    into v_existing_recipient, v_existing_invitation
  from public.ownership_proposal_requests
  where user_id = v_user_id and idempotency_key = p_idempotency_key
  for update;
  if v_existing_invitation is not null then
    if v_existing_recipient is distinct from p_care_recipient_id then
      raise exception using errcode = '22023', message = 'invalid_request';
    end if;
    return jsonb_build_object(
      'care_recipient_id', p_care_recipient_id,
      'invitation_id', v_existing_invitation,
      'created', false,
      'deduplicated', true
    );
  end if;

  select circle_id, status, display_label
    into v_circle_id, v_recipient_status, v_label
  from public.care_recipients
  where id = p_care_recipient_id
  for update;
  if v_circle_id is null or not public.kinward_is_active_circle_head(v_circle_id, v_user_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  if v_recipient_status <> 'proposed' then
    raise exception using errcode = '22023', message = 'invalid_transition';
  end if;

  select id, invited_email_digest, invited_email_mask
    into v_old_invitation_id, v_email_digest, v_email_mask
  from public.care_recipient_ownership_invitations
  where care_recipient_id = p_care_recipient_id and status = 'pending'
  for update;
  if v_old_invitation_id is null then
    raise exception using errcode = '22023', message = 'invalid_transition';
  end if;

  -- Cancel the old pending invitation first so the one-pending-per-recipient
  -- partial unique index does not collide with the new insert.
  update public.care_recipient_ownership_invitations
    set status = 'cancelled',
        cancelled_at = now(),
        token_digest = public.kinward_rotate_token_digest(),
        version = version + 1
  where id = v_old_invitation_id;

  insert into public.care_recipient_ownership_invitations(
    circle_id, care_recipient_id, invited_email_digest, invited_email_mask,
    token_digest, proposer_user_id, status, expires_at
  ) values (
    v_circle_id, p_care_recipient_id, v_email_digest, v_email_mask,
    p_token_digest, v_user_id, 'pending', now() + interval '7 days'
  ) returning id into v_new_invitation_id;

  update public.care_recipient_ownership_invitations
    set replaced_by_invitation_id = v_new_invitation_id
  where id = v_old_invitation_id;

  insert into public.ownership_proposal_requests(
    user_id, idempotency_key, circle_id, display_label_normalized,
    invited_email_digest, proposal_mode, care_recipient_id, invitation_id
  ) values (
    v_user_id, p_idempotency_key, v_circle_id, v_label,
    v_email_digest, 'resend', p_care_recipient_id, v_new_invitation_id
  );

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, prior_state, next_state, correlation_id
  ) values (
    'invitation', 'ownership_invitation.cancelled', v_user_id, v_circle_id,
    'care_recipient_ownership_invitation', v_old_invitation_id, 'succeeded',
    '{"status":"pending"}'::jsonb,
    jsonb_build_object('status', 'cancelled', 'replaced_by', v_new_invitation_id),
    v_correlation
  ),
  (
    'invitation', 'ownership_invitation.resent', v_user_id, v_circle_id,
    'care_recipient_ownership_invitation', v_new_invitation_id, 'succeeded',
    null,
    jsonb_build_object(
      'status', 'pending',
      'care_recipient_id', p_care_recipient_id,
      'replaces', v_old_invitation_id
    ),
    v_correlation
  );

  return jsonb_build_object(
    'care_recipient_id', p_care_recipient_id,
    'invitation_id', v_new_invitation_id,
    'created', true,
    'deduplicated', false
  );
end;
$$;

revoke all on function public.resend_ownership_invitation(uuid, text, uuid) from public, anon;
grant execute on function public.resend_ownership_invitation(uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC 6: preview_ownership_invitation
-- ---------------------------------------------------------------------------
-- Identity-bound preview. Never leaks on token/identity mismatch; records
-- ownership_invitation.mismatch_denied. Expiry archives the pending shell.
create or replace function public.preview_ownership_invitation(
  p_token_digest text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_invitation public.care_recipient_ownership_invitations%rowtype;
  v_user_email text;
  v_user_digest text;
  v_circle_name text;
  v_recipient_label text;
  v_recipient_status text;
  v_proposer_label text;
  v_correlation uuid := gen_random_uuid();
begin
  if p_token_digest is null or p_token_digest !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select * into v_invitation
  from public.care_recipient_ownership_invitations
  where token_digest = p_token_digest
  for update;

  if not found then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select email into v_user_email from auth.users where id = v_user_id;
  v_user_digest := public.kinward_email_digest(v_user_email);

  if v_user_digest is distinct from v_invitation.invited_email_digest then
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, next_state, correlation_id
    ) values (
      'invitation', 'ownership_invitation.mismatch_denied', v_user_id, v_invitation.circle_id,
      'care_recipient_ownership_invitation', v_invitation.id, 'denied',
      '{"reason":"identity_mismatch"}'::jsonb,
      v_correlation
    );
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  if v_invitation.status = 'pending' and v_invitation.expires_at <= now() then
    update public.care_recipient_ownership_invitations
      set status = 'expired',
          token_digest = public.kinward_rotate_token_digest(),
          version = version + 1
    where id = v_invitation.id and status = 'pending';

    update public.care_recipients
      set status = 'archived', version = version + 1, updated_at = now()
    where id = v_invitation.care_recipient_id and status = 'proposed';

    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, prior_state, next_state, correlation_id
    ) values (
      'invitation', 'ownership_invitation.expired', v_user_id, v_invitation.circle_id,
      'care_recipient_ownership_invitation', v_invitation.id, 'succeeded',
      '{"status":"pending"}'::jsonb,
      '{"status":"expired"}'::jsonb,
      v_correlation
    ),
    (
      'care_recipient', 'care_recipient.archived', v_user_id, v_invitation.circle_id,
      'care_recipient', v_invitation.care_recipient_id, 'succeeded',
      '{"status":"proposed"}'::jsonb,
      jsonb_build_object('status', 'archived', 'reason', 'expired'),
      v_correlation
    );
    return jsonb_build_object('outcome', 'expired');
  end if;

  if v_invitation.status = 'expired' then
    return jsonb_build_object('outcome', 'expired');
  end if;
  if v_invitation.status = 'cancelled' then
    return jsonb_build_object('outcome', 'cancelled');
  end if;
  if v_invitation.status = 'declined' then
    return jsonb_build_object('outcome', 'declined');
  end if;
  if v_invitation.status = 'accepted' then
    return jsonb_build_object('outcome', 'already_used');
  end if;
  if v_invitation.status <> 'pending' then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select display_name into v_circle_name
  from public.family_circles
  where id = v_invitation.circle_id;

  select display_label, status into v_recipient_label, v_recipient_status
  from public.care_recipients
  where id = v_invitation.care_recipient_id;

  if v_recipient_status is distinct from 'proposed' then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select preferred_display_name into v_proposer_label
  from public.user_profiles
  where user_id = v_invitation.proposer_user_id;
  if v_proposer_label is null or pg_catalog.btrim(v_proposer_label) = '' then
    v_proposer_label := 'A Circle Head';
  end if;

  return jsonb_build_object(
    'outcome', 'ready',
    'invitation_id', v_invitation.id,
    'care_recipient_id', v_invitation.care_recipient_id,
    'circle_id', v_invitation.circle_id,
    'circle_name', v_circle_name,
    'proposer_label', v_proposer_label,
    'display_label', v_recipient_label,
    'expires_at', v_invitation.expires_at,
    'created_at', v_invitation.created_at
  );
end;
$$;

revoke all on function public.preview_ownership_invitation(text) from public, anon;
grant execute on function public.preview_ownership_invitation(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC 7: accept_ownership_invitation
-- ---------------------------------------------------------------------------
-- Requires consent_version = 'kinward.ownership.v1'. Atomic: membership (create
-- if missing / reactivate if inactive) + ownership + consent + activation +
-- invitation invalidation + audit. Idempotent by (user, idempotency_key).
create or replace function public.accept_ownership_invitation(
  p_token_digest text,
  p_consent_version text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_invitation public.care_recipient_ownership_invitations%rowtype;
  v_user_email text;
  v_user_digest text;
  v_recipient public.care_recipients%rowtype;
  v_membership_id uuid;
  v_membership_status text;
  v_acceptance_id uuid;
  v_correlation uuid := gen_random_uuid();
  v_created_membership boolean := false;
  v_reactivated_membership boolean := false;
  v_req_recipient uuid;
  v_req_acceptance uuid;
  v_req_prefix text;
begin
  if p_token_digest is null or p_token_digest !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('outcome', 'unavailable');
  end if;
  if p_idempotency_key is null then
    return jsonb_build_object('outcome', 'invalid');
  end if;
  if p_consent_version is distinct from 'kinward.ownership.v1' then
    return jsonb_build_object('outcome', 'consent_required');
  end if;

  insert into public.ownership_acceptance_requests(
    user_id, idempotency_key, token_digest_prefix
  ) values (
    v_user_id, p_idempotency_key, substr(p_token_digest, 1, 16)
  ) on conflict do nothing;

  select care_recipient_id, acceptance_id, token_digest_prefix
    into v_req_recipient, v_req_acceptance, v_req_prefix
  from public.ownership_acceptance_requests
  where user_id = v_user_id and idempotency_key = p_idempotency_key
  for update;

  if v_req_prefix is distinct from substr(p_token_digest, 1, 16) then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  if v_req_acceptance is not null then
    select * into v_recipient
    from public.care_recipients
    where id = v_req_recipient;
    select id into v_membership_id
    from public.circle_memberships
    where circle_id = v_recipient.circle_id and user_id = v_user_id and status = 'active';
    return jsonb_build_object(
      'outcome', 'accepted',
      'care_recipient_id', v_req_recipient,
      'circle_id', v_recipient.circle_id,
      'membership_id', v_membership_id,
      'idempotent', true
    );
  end if;

  select * into v_invitation
  from public.care_recipient_ownership_invitations
  where token_digest = p_token_digest
  for update;

  if not found then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select email into v_user_email from auth.users where id = v_user_id;
  v_user_digest := public.kinward_email_digest(v_user_email);

  if v_user_digest is distinct from v_invitation.invited_email_digest then
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, next_state, correlation_id
    ) values (
      'invitation', 'ownership_invitation.mismatch_denied', v_user_id, v_invitation.circle_id,
      'care_recipient_ownership_invitation', v_invitation.id, 'denied',
      '{"reason":"identity_mismatch"}'::jsonb,
      v_correlation
    );
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  if v_invitation.status = 'accepted' and v_invitation.accepted_by_user_id = v_user_id then
    select id into v_membership_id
    from public.circle_memberships
    where circle_id = v_invitation.circle_id and user_id = v_user_id and status = 'active';
    return jsonb_build_object(
      'outcome', 'accepted',
      'care_recipient_id', v_invitation.care_recipient_id,
      'circle_id', v_invitation.circle_id,
      'membership_id', v_membership_id,
      'idempotent', true
    );
  end if;

  if v_invitation.status = 'pending' and v_invitation.expires_at <= now() then
    update public.care_recipient_ownership_invitations
      set status = 'expired',
          token_digest = public.kinward_rotate_token_digest(),
          version = version + 1
    where id = v_invitation.id and status = 'pending';
    update public.care_recipients
      set status = 'archived', version = version + 1, updated_at = now()
    where id = v_invitation.care_recipient_id and status = 'proposed';
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, prior_state, next_state, correlation_id
    ) values (
      'invitation', 'ownership_invitation.expired', v_user_id, v_invitation.circle_id,
      'care_recipient_ownership_invitation', v_invitation.id, 'succeeded',
      '{"status":"pending"}'::jsonb,
      '{"status":"expired"}'::jsonb,
      v_correlation
    ),
    (
      'care_recipient', 'care_recipient.archived', v_user_id, v_invitation.circle_id,
      'care_recipient', v_invitation.care_recipient_id, 'succeeded',
      '{"status":"proposed"}'::jsonb,
      jsonb_build_object('status', 'archived', 'reason', 'expired'),
      v_correlation
    );
    return jsonb_build_object('outcome', 'expired');
  end if;

  if v_invitation.status <> 'pending' then
    return jsonb_build_object('outcome', case v_invitation.status
      when 'cancelled' then 'cancelled'
      when 'declined' then 'declined'
      when 'expired' then 'expired'
      when 'accepted' then 'already_used'
      else 'unavailable'
    end);
  end if;

  select * into v_recipient
  from public.care_recipients
  where id = v_invitation.care_recipient_id
  for update;

  if v_recipient.status = 'active' then
    if v_recipient.owner_user_id = v_user_id then
      select id into v_membership_id
      from public.circle_memberships
      where circle_id = v_recipient.circle_id and user_id = v_user_id and status = 'active';
      return jsonb_build_object(
        'outcome', 'accepted',
        'care_recipient_id', v_recipient.id,
        'circle_id', v_recipient.circle_id,
        'membership_id', v_membership_id,
        'idempotent', true
      );
    end if;
    return jsonb_build_object('outcome', 'unavailable');
  end if;
  if v_recipient.status <> 'proposed' then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  -- Membership: reuse active, reactivate inactive, or create if missing.
  select id, status into v_membership_id, v_membership_status
  from public.circle_memberships
  where circle_id = v_invitation.circle_id and user_id = v_user_id
  order by case when status = 'active' then 0 else 1 end
  limit 1
  for update;

  if v_membership_id is null then
    begin
      insert into public.circle_memberships(circle_id, user_id)
      values (v_invitation.circle_id, v_user_id)
      returning id into v_membership_id;
      v_created_membership := true;
    exception
      when unique_violation then
        -- A concurrent transaction created the active membership first.
        select id into v_membership_id
        from public.circle_memberships
        where circle_id = v_invitation.circle_id
          and user_id = v_user_id
          and status = 'active';
    end;
  elsif v_membership_status <> 'active' then
    update public.circle_memberships
      set status = 'active', removed_at = null, version = version + 1
    where id = v_membership_id;
    v_reactivated_membership := true;
  end if;

  insert into public.ownership_acceptance_records(
    invitation_id, care_recipient_id, circle_id, accepting_user_id,
    consent_version, decision, correlation_id
  ) values (
    v_invitation.id, v_invitation.care_recipient_id, v_invitation.circle_id, v_user_id,
    p_consent_version, 'accepted', v_correlation
  ) returning id into v_acceptance_id;

  update public.care_recipients
    set status = 'active',
        owner_user_id = v_user_id,
        ownership_acceptance_id = v_acceptance_id,
        activated_at = now(),
        version = version + 1,
        updated_at = now()
  where id = v_invitation.care_recipient_id;

  insert into public.consent_records(
    circle_id, care_recipient_id, user_id, consent_kind, consent_version,
    decision, ownership_acceptance_id, invitation_id, correlation_id
  ) values (
    v_invitation.circle_id, v_invitation.care_recipient_id, v_user_id,
    'care_recipient_ownership', p_consent_version, 'accepted',
    v_acceptance_id, v_invitation.id, v_correlation
  );

  update public.care_recipient_ownership_invitations
    set status = 'accepted',
        accepted_at = now(),
        accepted_by_user_id = v_user_id,
        token_digest = public.kinward_rotate_token_digest(),
        version = version + 1
  where id = v_invitation.id;

  update public.ownership_acceptance_requests
    set acceptance_id = v_acceptance_id,
        care_recipient_id = v_invitation.care_recipient_id
  where user_id = v_user_id and idempotency_key = p_idempotency_key;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, prior_state, next_state, correlation_id
  ) values (
    'invitation', 'ownership_invitation.accepted', v_user_id, v_invitation.circle_id,
    'care_recipient_ownership_invitation', v_invitation.id, 'succeeded',
    '{"status":"pending"}'::jsonb,
    '{"status":"accepted"}'::jsonb,
    v_correlation
  ),
  (
    'care_recipient', 'care_recipient.owner_accepted', v_user_id, v_invitation.circle_id,
    'care_recipient', v_invitation.care_recipient_id, 'succeeded',
    null,
    jsonb_build_object('acceptance_id', v_acceptance_id, 'consent_version', p_consent_version),
    v_correlation
  ),
  (
    'care_recipient', 'care_recipient.activated', v_user_id, v_invitation.circle_id,
    'care_recipient', v_invitation.care_recipient_id, 'succeeded',
    '{"status":"proposed"}'::jsonb,
    '{"status":"active"}'::jsonb,
    v_correlation
  );

  if v_created_membership then
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, next_state, correlation_id
    ) values (
      'membership', 'membership.created', v_user_id, v_invitation.circle_id,
      'circle_membership', v_membership_id, 'succeeded',
      '{"status":"active","source":"ownership"}'::jsonb,
      v_correlation
    );
  elsif v_reactivated_membership then
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, next_state, correlation_id
    ) values (
      'membership', 'membership.created', v_user_id, v_invitation.circle_id,
      'circle_membership', v_membership_id, 'succeeded',
      '{"status":"active","source":"ownership","reactivated":true}'::jsonb,
      v_correlation
    );
  end if;

  return jsonb_build_object(
    'outcome', 'accepted',
    'care_recipient_id', v_invitation.care_recipient_id,
    'circle_id', v_invitation.circle_id,
    'membership_id', v_membership_id,
    'idempotent', false
  );
end;
$$;

revoke all on function public.accept_ownership_invitation(text, text, uuid) from public, anon;
grant execute on function public.accept_ownership_invitation(text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC 8: decline_ownership_invitation
-- ---------------------------------------------------------------------------
-- No membership granted. Invitation -> declined (token rotated), pending shell
-- archived, optional decline consent recorded.
create or replace function public.decline_ownership_invitation(
  p_token_digest text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_invitation public.care_recipient_ownership_invitations%rowtype;
  v_user_email text;
  v_user_digest text;
  v_correlation uuid := gen_random_uuid();
begin
  if p_token_digest is null or p_token_digest !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select * into v_invitation
  from public.care_recipient_ownership_invitations
  where token_digest = p_token_digest
  for update;

  if not found then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select email into v_user_email from auth.users where id = v_user_id;
  v_user_digest := public.kinward_email_digest(v_user_email);

  if v_user_digest is distinct from v_invitation.invited_email_digest then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  if v_invitation.status = 'declined' then
    return jsonb_build_object('outcome', 'declined', 'idempotent', true);
  end if;

  if v_invitation.status = 'pending' and v_invitation.expires_at <= now() then
    update public.care_recipient_ownership_invitations
      set status = 'expired',
          token_digest = public.kinward_rotate_token_digest(),
          version = version + 1
    where id = v_invitation.id and status = 'pending';
    update public.care_recipients
      set status = 'archived', version = version + 1, updated_at = now()
    where id = v_invitation.care_recipient_id and status = 'proposed';
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, prior_state, next_state, correlation_id
    ) values (
      'invitation', 'ownership_invitation.expired', v_user_id, v_invitation.circle_id,
      'care_recipient_ownership_invitation', v_invitation.id, 'succeeded',
      '{"status":"pending"}'::jsonb,
      '{"status":"expired"}'::jsonb,
      v_correlation
    ),
    (
      'care_recipient', 'care_recipient.archived', v_user_id, v_invitation.circle_id,
      'care_recipient', v_invitation.care_recipient_id, 'succeeded',
      '{"status":"proposed"}'::jsonb,
      jsonb_build_object('status', 'archived', 'reason', 'expired'),
      v_correlation
    );
    return jsonb_build_object('outcome', 'expired');
  end if;

  if v_invitation.status <> 'pending' then
    return jsonb_build_object('outcome', case v_invitation.status
      when 'cancelled' then 'cancelled'
      when 'expired' then 'expired'
      when 'accepted' then 'already_used'
      else 'unavailable'
    end);
  end if;

  update public.care_recipient_ownership_invitations
    set status = 'declined',
        declined_at = now(),
        token_digest = public.kinward_rotate_token_digest(),
        version = version + 1
  where id = v_invitation.id;

  update public.care_recipients
    set status = 'archived', version = version + 1, updated_at = now()
  where id = v_invitation.care_recipient_id and status = 'proposed';

  insert into public.consent_records(
    circle_id, care_recipient_id, user_id, consent_kind, consent_version,
    decision, ownership_acceptance_id, invitation_id, correlation_id
  ) values (
    v_invitation.circle_id, v_invitation.care_recipient_id, v_user_id,
    'care_recipient_ownership', 'kinward.ownership.v1', 'declined',
    null, v_invitation.id, v_correlation
  );

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, prior_state, next_state, correlation_id
  ) values (
    'invitation', 'ownership_invitation.declined', v_user_id, v_invitation.circle_id,
    'care_recipient_ownership_invitation', v_invitation.id, 'succeeded',
    '{"status":"pending"}'::jsonb,
    '{"status":"declined"}'::jsonb,
    v_correlation
  ),
  (
    'care_recipient', 'care_recipient.archived', v_user_id, v_invitation.circle_id,
    'care_recipient', v_invitation.care_recipient_id, 'succeeded',
    '{"status":"proposed"}'::jsonb,
    jsonb_build_object('status', 'archived', 'reason', 'declined'),
    v_correlation
  );

  return jsonb_build_object('outcome', 'declined', 'idempotent', false);
end;
$$;

revoke all on function public.decline_ownership_invitation(text) from public, anon;
grant execute on function public.decline_ownership_invitation(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC 9: list_pending_care_recipients
-- ---------------------------------------------------------------------------
create or replace function public.list_pending_care_recipients(
  p_circle_id uuid
)
returns table (
  care_recipient_id uuid,
  display_label text,
  invited_email_mask text,
  invitation_id uuid,
  status text,
  created_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
begin
  if p_circle_id is null or not public.kinward_is_active_circle_head(p_circle_id, v_user_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  return query
  select
    recipient.id,
    recipient.display_label,
    invitation.invited_email_mask,
    invitation.id,
    recipient.status,
    recipient.created_at,
    invitation.expires_at
  from public.care_recipients recipient
  join public.care_recipient_ownership_invitations invitation
    on invitation.care_recipient_id = recipient.id
   and invitation.status = 'pending'
  where recipient.circle_id = p_circle_id
    and recipient.status = 'proposed'
    and invitation.expires_at > now()
  order by recipient.created_at desc;
end;
$$;

revoke all on function public.list_pending_care_recipients(uuid) from public, anon;
grant execute on function public.list_pending_care_recipients(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC 10: get_pending_care_recipient
-- ---------------------------------------------------------------------------
create or replace function public.get_pending_care_recipient(
  p_circle_id uuid,
  p_care_recipient_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_recipient public.care_recipients%rowtype;
  v_invitation public.care_recipient_ownership_invitations%rowtype;
begin
  if p_circle_id is null or p_care_recipient_id is null
    or not public.kinward_is_active_circle_head(p_circle_id, v_user_id)
  then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select * into v_recipient
  from public.care_recipients
  where id = p_care_recipient_id and circle_id = p_circle_id;

  if not found or v_recipient.status <> 'proposed' then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select * into v_invitation
  from public.care_recipient_ownership_invitations
  where care_recipient_id = p_care_recipient_id and status = 'pending';

  if not found then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  if v_invitation.expires_at <= now() then
    return jsonb_build_object('outcome', 'not_pending');
  end if;

  return jsonb_build_object(
    'outcome', 'pending',
    'care_recipient_id', v_recipient.id,
    'display_label', v_recipient.display_label,
    'invitation_id', v_invitation.id,
    'invited_email_mask', v_invitation.invited_email_mask,
    'status', v_recipient.status,
    'created_at', v_recipient.created_at,
    'expires_at', v_invitation.expires_at
  );
end;
$$;

revoke all on function public.get_pending_care_recipient(uuid, uuid) from public, anon;
grant execute on function public.get_pending_care_recipient(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC 11: list_owned_care_recipients
-- ---------------------------------------------------------------------------
-- Active recipients where the caller is the sole owner. Circle role is irrelevant.
create or replace function public.list_owned_care_recipients(
  p_circle_id uuid
)
returns table (
  care_recipient_id uuid,
  display_label text,
  status text,
  activated_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
begin
  if p_circle_id is null then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  return query
  select
    recipient.id,
    recipient.display_label,
    recipient.status,
    recipient.activated_at,
    recipient.created_at
  from public.care_recipients recipient
  where recipient.circle_id = p_circle_id
    and recipient.status = 'active'
    and recipient.owner_user_id = v_user_id
  order by recipient.activated_at desc;
end;
$$;

revoke all on function public.list_owned_care_recipients(uuid) from public, anon;
grant execute on function public.list_owned_care_recipients(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC 12: get_owned_care_recipient
-- ---------------------------------------------------------------------------
create or replace function public.get_owned_care_recipient(
  p_circle_id uuid,
  p_care_recipient_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_recipient public.care_recipients%rowtype;
begin
  if p_circle_id is null or p_care_recipient_id is null then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select * into v_recipient
  from public.care_recipients
  where id = p_care_recipient_id
    and circle_id = p_circle_id
    and status = 'active'
    and owner_user_id = v_user_id;

  if not found then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  return jsonb_build_object(
    'outcome', 'ready',
    'care_recipient_id', v_recipient.id,
    'circle_id', v_recipient.circle_id,
    'display_label', v_recipient.display_label,
    'profile_classification', v_recipient.profile_classification,
    'status', v_recipient.status,
    'activated_at', v_recipient.activated_at,
    'created_at', v_recipient.created_at
  );
end;
$$;

revoke all on function public.get_owned_care_recipient(uuid, uuid) from public, anon;
grant execute on function public.get_owned_care_recipient(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC 13: record_care_recipient_access_denied
-- ---------------------------------------------------------------------------
-- Fingerprint-only denial record (mirrors record_circle_access_denied).
create or replace function public.record_care_recipient_access_denied(
  p_correlation_id uuid,
  p_attempted_context_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or p_correlation_id is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  insert into public.audit_events(
    event_class, event_type, actor_user_id, target_type, target_id, result,
    correlation_id, attempted_context_fingerprint
  ) values (
    'security', 'care_recipient.access_denied', auth.uid(), 'access_attempt',
    p_correlation_id, 'denied', p_correlation_id,
    case when p_attempted_context_id is null then null else
      pg_catalog.encode(extensions.digest(pg_catalog.convert_to(p_attempted_context_id::text, 'UTF8'), 'sha256'), 'hex')
    end
  );
end;
$$;

revoke all on function public.record_care_recipient_access_denied(uuid, uuid) from public, anon;
grant execute on function public.record_care_recipient_access_denied(uuid, uuid) to authenticated;
