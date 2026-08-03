-- Slice 10: Delegation Lifecycle (Screens 21-26, UF-08 through UF-12, UF-23).
-- Completes the Slice 9 Delegated Management foundation: duration choice,
-- explicit "Until revoked" consent, representative acceptance, owner activation
-- consent, activation, recurring access review, suspension, restoration, and
-- revocation.
--
-- Governing rules implemented here:
--   * The Family Circle's configured IANA time zone is the governing zone. It is
--     snapshotted onto the grant when the duration is chosen; later Circle time
--     zone edits never move an existing grant's boundaries.
--   * Every authoritative timestamp is stored in UTC. A finite expiration is a
--     local calendar date; the grant stays active THROUGH that date and loses all
--     authority at the beginning of the following day in the governing zone, so
--     expires_at is an exclusive UTC boundary evaluated as now() < expires_at.
--   * The suggested duration is 90 calendar days in the governing zone, never
--     90 * 24 hours. Review scheduling uses the same calendar arithmetic.
--   * A review becoming due never suspends, revokes, or removes authority.
--   * Pending grants carry zero authority. Only Active grants with active scopes
--     contribute, and the owner always retains their own access.
--   * Grantable scopes remain exactly recipient.manage_roles and
--     recipient.review_permissions. No wildcard, ownership, cross-Circle, or
--     cross-recipient authority is ever created.
--
-- Out of scope (later slices): managed minor profiles, Backup Circle
-- Administrator, audit-history surfaces, and every medical feature.

-- ---------------------------------------------------------------------------
-- Family Circle governing time zone
-- ---------------------------------------------------------------------------

alter table public.family_circles
  add column if not exists time_zone text not null default 'UTC';
alter table public.family_circles
  add constraint family_circles_time_zone_shape
  check (
    char_length(time_zone) between 1 and 64
    and time_zone = pg_catalog.btrim(time_zone)
  );

create or replace function public.kinward_is_valid_time_zone(p_time_zone text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_time_zone is not null
    and char_length(p_time_zone) between 1 and 64
    and exists (
      select 1 from pg_catalog.pg_timezone_names zone
      where zone.name = p_time_zone
    );
$$;

revoke all on function public.kinward_is_valid_time_zone(text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Calendar helpers. Every one of these works in the governing IANA zone and
-- returns UTC instants, so no caller performs 24-hour arithmetic.
-- ---------------------------------------------------------------------------

create or replace function public.kinward_local_date(
  p_moment timestamptz, p_time_zone text
)
returns date
language sql
stable
set search_path = ''
as $$
  select (p_moment at time zone p_time_zone)::date;
$$;

-- Adds calendar days in the governing zone while preserving the local clock
-- time, then returns the resulting UTC instant.
create or replace function public.kinward_add_calendar_days(
  p_moment timestamptz, p_days integer, p_time_zone text
)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select ((p_moment at time zone p_time_zone)
    + pg_catalog.make_interval(days => p_days)) at time zone p_time_zone;
$$;

-- A finite expiration date stays active through the whole local date, so the
-- authoritative UTC boundary is the start of the following local day and is
-- exclusive.
create or replace function public.kinward_local_date_exclusive_end_utc(
  p_local_date date, p_time_zone text
)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select ((p_local_date + 1)::timestamp) at time zone p_time_zone;
$$;

revoke all on function public.kinward_local_date(timestamptz, text)
  from public, anon, authenticated;
revoke all on function public.kinward_add_calendar_days(timestamptz, integer, text)
  from public, anon, authenticated;
revoke all on function public.kinward_local_date_exclusive_end_utc(date, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Trusted recent authentication
--
-- The authoritative authentication moment is server controlled: GoTrue writes
-- the session's authentication-method claim rows, and an explicit
-- re-verification records its own server clock value. A client-refreshed access
-- token therefore cannot extend the fifteen-minute window on its own.
-- ---------------------------------------------------------------------------

create table public.account_authentication_state (
  user_id uuid primary key references auth.users(id),
  reauthenticated_at timestamptz not null default now(),
  authentication_method text not null default 'email_verification'
    check (authentication_method in (
      'email_verification', 'email_link', 'password'
    )),
  updated_at timestamptz not null default now()
);

alter table public.account_authentication_state enable row level security;
revoke all on public.account_authentication_state from public, anon, authenticated;

create or replace function public.kinward_trusted_authentication_at()
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_session uuid;
  v_claim_at timestamptz;
  v_session_at timestamptz;
  v_recorded_at timestamptz;
begin
  if v_user is null then
    return null;
  end if;
  begin
    v_session := nullif(auth.jwt() ->> 'session_id', '')::uuid;
  exception when others then
    v_session := null;
  end;
  if v_session is not null then
    select pg_catalog.max(claim.created_at) into v_claim_at
      from auth.mfa_amr_claims claim
      where claim.session_id = v_session;
    select session_row.created_at into v_session_at
      from auth.sessions session_row
      where session_row.id = v_session;
  end if;
  select state.reauthenticated_at into v_recorded_at
    from public.account_authentication_state state
    where state.user_id = v_user;
  -- GREATEST ignores nulls, so a missing source never masks a fresher one.
  return greatest(v_claim_at, v_session_at, v_recorded_at);
end;
$$;

revoke all on function public.kinward_trusted_authentication_at()
  from public, anon, authenticated;

create or replace function public.kinward_require_recent_authentication()
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_trusted_at timestamptz := public.kinward_trusted_authentication_at();
begin
  if v_trusted_at is null or v_trusted_at < now() - interval '15 minutes' then
    raise exception using errcode = '42501',
      message = 'recent_authentication_required';
  end if;
  return v_trusted_at;
end;
$$;

revoke all on function public.kinward_require_recent_authentication()
  from public, anon, authenticated;

-- Called by the application immediately after a verified sign-in or magic-link
-- re-verification. The stored moment is the database clock, never a client value.
create or replace function public.record_trusted_authentication(
  p_authentication_method text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_method text := coalesce(p_authentication_method, 'email_verification');
  v_recorded_at timestamptz;
begin
  if v_method not in ('email_verification', 'email_link', 'password') then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  insert into public.account_authentication_state(
    user_id, reauthenticated_at, authentication_method
  ) values (v_actor, now(), v_method)
  on conflict (user_id) do update
    set reauthenticated_at = now(),
        authentication_method = v_method,
        updated_at = now()
  returning reauthenticated_at into v_recorded_at;
  return v_recorded_at;
end;
$$;

revoke all on function public.record_trusted_authentication(text) from public, anon;
grant execute on function public.record_trusted_authentication(text) to authenticated;

create or replace function public.has_recent_trusted_authentication()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_trusted_at timestamptz;
begin
  perform public.kinward_require_verified_active_adult();
  v_trusted_at := public.kinward_trusted_authentication_at();
  return v_trusted_at is not null
    and v_trusted_at >= now() - interval '15 minutes';
exception when others then return false;
end;
$$;

revoke all on function public.has_recent_trusted_authentication() from public, anon;
grant execute on function public.has_recent_trusted_authentication() to authenticated;

-- ---------------------------------------------------------------------------
-- Circle time zone configuration (Circle administration only; it grants no
-- Care Recipient, medical, or delegated authority).
-- ---------------------------------------------------------------------------

create or replace function public.get_family_circle_time_zone(p_circle_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_time_zone text;
begin
  select circle.time_zone into v_time_zone
    from public.family_circles circle
    join public.circle_memberships membership
      on membership.circle_id = circle.id
     and membership.user_id = v_actor
     and membership.status = 'active'
    where circle.id = p_circle_id and circle.status = 'active';
  if v_time_zone is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  return v_time_zone;
end;
$$;

revoke all on function public.get_family_circle_time_zone(uuid) from public, anon;
grant execute on function public.get_family_circle_time_zone(uuid) to authenticated;

create or replace function public.set_family_circle_time_zone(
  p_circle_id uuid, p_time_zone text, p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_previous text;
begin
  if p_idempotency_key is null
    or not public.kinward_is_valid_time_zone(p_time_zone)
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  perform public.kinward_require_recent_authentication();
  select circle.time_zone into v_previous
    from public.family_circles circle
    where circle.id = p_circle_id and circle.status = 'active'
    for update;
  if v_previous is null
    or not public.kinward_is_active_circle_head(p_circle_id, v_actor)
  then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  if v_previous <> p_time_zone then
    update public.family_circles
      set time_zone = p_time_zone, updated_at = now()
      where id = p_circle_id;
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id, target_type, target_id,
      result, prior_state, next_state, correlation_id
    ) values (
      'circle', 'circle.time_zone_changed', v_actor, p_circle_id,
      'family_circle', p_circle_id, 'succeeded',
      jsonb_build_object('time_zone', v_previous),
      jsonb_build_object('time_zone', p_time_zone),
      p_idempotency_key
    );
  end if;
  return jsonb_build_object('circle_id', p_circle_id, 'time_zone', p_time_zone);
end;
$$;

revoke all on function public.set_family_circle_time_zone(uuid, text, uuid)
  from public, anon;
grant execute on function public.set_family_circle_time_zone(uuid, text, uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Delegated grant lifecycle columns
-- ---------------------------------------------------------------------------

alter table public.delegated_management_grants
  add column governing_time_zone text,
  add column duration_mode text,
  add column expiration_local_date date,
  add column terms_fingerprint text,
  add column activated_at timestamptz,
  add column suspended_at timestamptz,
  add column restored_at timestamptz,
  add column revoked_at timestamptz,
  add column expired_at timestamptz,
  add column last_reviewed_at timestamptz,
  add column last_reviewed_by_user_id uuid references auth.users(id),
  add column last_review_decision text,
  add column until_revoked_consent_id uuid references public.consent_records(id),
  add column representative_acceptance_id uuid
    references public.consent_records(id),
  add column representative_accepted_at timestamptz,
  add column representative_accepted_fingerprint text,
  add column activation_consent_id uuid references public.consent_records(id),
  add column activation_consent_fingerprint text;

alter table public.delegated_management_grants
  add constraint delegated_grant_duration_mode_allowed
  check (duration_mode is null or duration_mode in ('finite', 'until_revoked'));
alter table public.delegated_management_grants
  add constraint delegated_grant_review_decision_allowed
  check (last_review_decision is null or last_review_decision = 'keep_access');
alter table public.delegated_management_grants
  add constraint delegated_grant_time_zone_shape
  check (
    governing_time_zone is null
    or char_length(governing_time_zone) between 1 and 64
  );
alter table public.delegated_management_grants
  add constraint delegated_grant_fingerprint_shape
  check (
    (terms_fingerprint is null or terms_fingerprint ~ '^[0-9a-f]{64}$')
    and (
      representative_accepted_fingerprint is null
      or representative_accepted_fingerprint ~ '^[0-9a-f]{64}$'
    )
    and (
      activation_consent_fingerprint is null
      or activation_consent_fingerprint ~ '^[0-9a-f]{64}$'
    )
  );

-- Slice 9 forbade every duration field while Pending. Slice 10 chooses the
-- duration while the grant is still Pending, so the replacement invariant keeps
-- only activation, review scheduling, and lifecycle endings out of Pending.
alter table public.delegated_management_grants
  drop constraint delegated_pending_has_no_activation;

alter table public.delegated_management_grants
  add constraint delegated_grant_pending_has_no_authority
  check (
    status <> 'pending'
    or (starts_at is null and activated_at is null and next_review_at is null
      and suspended_at is null and restored_at is null and revoked_at is null
      and expired_at is null and activation_consent_id is null
      and last_reviewed_at is null)
  );

-- A duration choice always snapshots the governing zone, and each mode stores
-- exactly the fields that mode can have.
alter table public.delegated_management_grants
  add constraint delegated_grant_duration_fields
  check (
    duration_mode is null
    or (
      governing_time_zone is not null
      and (
        (duration_mode = 'finite'
          and expiration_local_date is not null
          and expires_at is not null
          and until_revoked_consent_id is null)
        or (duration_mode = 'until_revoked'
          and expiration_local_date is null
          and expires_at is null
          and until_revoked_consent_id is not null)
      )
    )
  );

alter table public.delegated_management_grants
  add constraint delegated_grant_active_fields
  check (
    status <> 'active'
    or (activated_at is not null and starts_at is not null
      and duration_mode is not null and governing_time_zone is not null
      and next_review_at is not null and terms_fingerprint is not null
      and representative_acceptance_id is not null
      and activation_consent_id is not null
      and suspended_at is null and revoked_at is null and expired_at is null)
  );
alter table public.delegated_management_grants
  add constraint delegated_grant_suspended_fields
  check (
    status <> 'suspended'
    or (suspended_at is not null and activated_at is not null
      and revoked_at is null and expired_at is null)
  );
alter table public.delegated_management_grants
  add constraint delegated_grant_revoked_fields
  check (status <> 'revoked' or revoked_at is not null);
alter table public.delegated_management_grants
  add constraint delegated_grant_expired_fields
  check (
    status <> 'expired'
    or (expired_at is not null and expires_at is not null)
  );

create index delegated_grants_review_due
  on public.delegated_management_grants(next_review_at)
  where status = 'active';
create index delegated_grants_expiring
  on public.delegated_management_grants(expires_at)
  where status in ('active', 'suspended');

alter table public.management_grant_mutation_requests
  drop constraint management_grant_mutation_requests_operation_check;
alter table public.management_grant_mutation_requests
  add constraint management_grant_mutation_requests_operation_check
  check (operation in (
    'create_shared',
    'create_pending_delegated',
    'set_delegation_finite_expiration',
    'set_delegation_until_revoked',
    'accept_delegation',
    'activate_delegated',
    'suspend_delegated',
    'restore_delegated',
    'revoke_delegated',
    'complete_access_review'
  ));

-- On-behalf-of provenance for delegated actions (AT-008).
alter table public.audit_events
  add column on_behalf_of_user_id uuid references auth.users(id),
  add column delegated_grant_id uuid
    references public.delegated_management_grants(id);

-- ---------------------------------------------------------------------------
-- Delegation terms fingerprint
--
-- The fingerprint binds representative acceptance and owner activation consent
-- to the exact delegation version: representative, Care Recipient, scope
-- snapshot, duration mode, expiration date, and governing time zone. Changing
-- any of those changes the fingerprint, which invalidates the prior acceptance
-- and activation consent.
-- ---------------------------------------------------------------------------

create or replace function public.kinward_delegation_terms_fingerprint(
  p_grant_id uuid
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    grant_row.circle_id::text || ':' || grant_row.care_recipient_id::text || ':'
      || grant_row.representative_membership_id::text || ':'
      || grant_row.selection_mode || ':' || grant_row.catalog_version || ':'
      || coalesce(grant_row.duration_mode, 'unset') || ':'
      || coalesce(grant_row.expiration_local_date::text, 'none') || ':'
      || coalesce(grant_row.governing_time_zone, 'none') || ':'
      || coalesce((
        select pg_catalog.string_agg(
          scope_row.permission_code, ',' order by scope_row.permission_code
        )
        from public.management_grant_scopes scope_row
        where scope_row.grant_type = 'delegated'
          and scope_row.grant_id = grant_row.id
          and scope_row.status = 'active'
      ), 'none'),
    'UTF8'), 'sha256'), 'hex')
  from public.delegated_management_grants grant_row
  where grant_row.id = p_grant_id;
$$;

revoke all on function public.kinward_delegation_terms_fingerprint(uuid)
  from public, anon, authenticated;

-- Recomputes the fingerprint after a material change and drops any acceptance or
-- activation consent that no longer covers the current terms. The grant stays
-- Pending until the representative accepts again and the owner consents again.
create or replace function public.kinward_refresh_delegation_terms(
  p_grant_id uuid, p_actor_user_id uuid, p_correlation_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_grant public.delegated_management_grants%rowtype;
  v_fingerprint text := public.kinward_delegation_terms_fingerprint(p_grant_id);
begin
  select * into v_grant from public.delegated_management_grants
    where id = p_grant_id;
  if v_grant.id is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  if v_grant.terms_fingerprint is not distinct from v_fingerprint then
    return v_fingerprint;
  end if;
  update public.delegated_management_grants
    set terms_fingerprint = v_fingerprint,
        representative_acceptance_id = null,
        representative_accepted_at = null,
        representative_accepted_fingerprint = null,
        activation_consent_id = null,
        activation_consent_fingerprint = null,
        updated_at = now()
    where id = p_grant_id;
  if v_grant.representative_acceptance_id is not null
    or v_grant.activation_consent_id is not null
  then
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id, care_recipient_id,
      target_type, target_id, result, prior_state, next_state, correlation_id,
      delegated_grant_id
    ) values (
      'authorization', 'delegation.acceptance_invalidated', p_actor_user_id,
      v_grant.circle_id, v_grant.care_recipient_id,
      'delegated_management_grant', p_grant_id, 'succeeded',
      jsonb_build_object(
        'representative_accepted', v_grant.representative_acceptance_id is not null,
        'owner_activation_consent', v_grant.activation_consent_id is not null
      ),
      jsonb_build_object(
        'representative_accepted', false, 'owner_activation_consent', false
      ),
      p_correlation_id, p_grant_id
    );
  end if;
  return v_fingerprint;
end;
$$;

revoke all on function public.kinward_refresh_delegation_terms(uuid, uuid, uuid)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Expiration materialization
--
-- Authorization always evaluates expiration lazily against the exclusive UTC
-- boundary, so authority ends the instant now() reaches expires_at even before
-- the row is materialized. This function makes the stored status agree.
-- ---------------------------------------------------------------------------

create or replace function public.kinward_materialize_delegated_expiration(
  p_grant_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_grant public.delegated_management_grants%rowtype;
begin
  select * into v_grant from public.delegated_management_grants
    where id = p_grant_id for update;
  if v_grant.id is null then
    return null;
  end if;
  if v_grant.status not in ('active', 'suspended')
    or v_grant.expires_at is null
    or now() < v_grant.expires_at
  then
    return v_grant.status;
  end if;
  update public.delegated_management_grants
    set status = 'expired',
        expired_at = now(),
        version = version + 1,
        updated_at = now()
    where id = v_grant.id;
  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, prior_state, next_state, correlation_id,
    delegated_grant_id
  ) values (
    'authorization', 'delegation.expired', v_grant.grantor_user_id,
    v_grant.circle_id, v_grant.care_recipient_id, 'delegated_management_grant',
    v_grant.id, 'succeeded',
    jsonb_build_object('status', v_grant.status),
    jsonb_build_object(
      'status', 'expired',
      'expires_at', v_grant.expires_at,
      'governing_time_zone', v_grant.governing_time_zone
    ),
    v_grant.id, v_grant.id
  );
  return 'expired';
end;
$$;

revoke all on function public.kinward_materialize_delegated_expiration(uuid)
  from public, anon, authenticated;

create or replace function public.kinward_materialize_recipient_delegations(
  p_care_recipient_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_grant_id uuid;
begin
  for v_grant_id in
    select id from public.delegated_management_grants
    where care_recipient_id = p_care_recipient_id
      and status in ('active', 'suspended')
      and expires_at is not null
      and now() >= expires_at
    order by id
  loop
    perform public.kinward_materialize_delegated_expiration(v_grant_id);
  end loop;
end;
$$;

revoke all on function public.kinward_materialize_recipient_delegations(uuid)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Effective authorization
--
-- Shared and Delegated authority are evaluated separately and both remain
-- limited to the two grantable Milestone One scopes. Pending, Suspended,
-- Expired, Revoked, and Disputed delegated grants contribute nothing.
-- ---------------------------------------------------------------------------

create or replace function public.kinward_has_management_scope(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_user_id uuid,
  p_permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_permission_code in (
      'recipient.manage_roles', 'recipient.review_permissions'
    )
    and (
      exists (
        select 1
        from public.care_recipients recipient
        join public.care_management_modes mode
          on mode.circle_id = recipient.circle_id
         and mode.care_recipient_id = recipient.id
         and mode.status = 'active'
         and mode.mode_code = 'shared_management'
        join public.circle_memberships membership
          on membership.circle_id = recipient.circle_id
         and membership.user_id = p_user_id
        join public.shared_management_grants grant_row
          on grant_row.circle_id = recipient.circle_id
         and grant_row.care_recipient_id = recipient.id
         and grant_row.grantee_membership_id = membership.id
        join public.management_grant_scopes scope_row
          on scope_row.grant_type = 'shared'
         and scope_row.grant_id = grant_row.id
         and scope_row.permission_code = p_permission_code
        where recipient.id = p_care_recipient_id
          and recipient.circle_id = p_circle_id
          and recipient.status = 'active'
          and membership.status = 'active'
          and grant_row.status = 'active'
          and scope_row.status = 'active'
      )
      or exists (
        select 1
        from public.care_recipients recipient
        join public.care_management_modes mode
          on mode.circle_id = recipient.circle_id
         and mode.care_recipient_id = recipient.id
         and mode.status = 'active'
         and mode.mode_code = 'delegated_management'
        join public.circle_memberships membership
          on membership.circle_id = recipient.circle_id
         and membership.user_id = p_user_id
        join public.delegated_management_grants grant_row
          on grant_row.circle_id = recipient.circle_id
         and grant_row.care_recipient_id = recipient.id
         and grant_row.representative_membership_id = membership.id
        join public.management_grant_scopes scope_row
          on scope_row.grant_type = 'delegated'
         and scope_row.grant_id = grant_row.id
         and scope_row.permission_code = p_permission_code
        where recipient.id = p_care_recipient_id
          and recipient.circle_id = p_circle_id
          and recipient.status = 'active'
          and membership.status = 'active'
          and scope_row.status = 'active'
          and grant_row.status = 'active'
          and grant_row.activated_at is not null
          and (grant_row.expires_at is null or now() < grant_row.expires_at)
      )
    );
$$;

revoke all on function public.kinward_has_management_scope(uuid, uuid, uuid, text)
  from public, anon, authenticated;

-- Identifies the exact delegated grant that authorized an on-behalf-of action so
-- the audit trail can name it. Returns null when authority came from ownership
-- or from a Shared grant.
create or replace function public.kinward_active_delegated_grant_id(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_user_id uuid,
  p_permission_code text
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select grant_row.id
  from public.care_recipients recipient
  join public.care_management_modes mode
    on mode.circle_id = recipient.circle_id
   and mode.care_recipient_id = recipient.id
   and mode.status = 'active'
   and mode.mode_code = 'delegated_management'
  join public.circle_memberships membership
    on membership.circle_id = recipient.circle_id
   and membership.user_id = p_user_id
  join public.delegated_management_grants grant_row
    on grant_row.circle_id = recipient.circle_id
   and grant_row.care_recipient_id = recipient.id
   and grant_row.representative_membership_id = membership.id
  join public.management_grant_scopes scope_row
    on scope_row.grant_type = 'delegated'
   and scope_row.grant_id = grant_row.id
   and scope_row.permission_code = p_permission_code
   and scope_row.status = 'active'
  where recipient.id = p_care_recipient_id
    and recipient.circle_id = p_circle_id
    and recipient.status = 'active'
    and recipient.owner_user_id <> p_user_id
    and membership.status = 'active'
    and grant_row.status = 'active'
    and grant_row.activated_at is not null
    and (grant_row.expires_at is null or now() < grant_row.expires_at)
    and p_permission_code in (
      'recipient.manage_roles', 'recipient.review_permissions'
    )
  order by grant_row.activated_at desc, grant_row.id
  limit 1;
$$;

revoke all on function public.kinward_active_delegated_grant_id(
  uuid, uuid, uuid, text
) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Owner reads
-- ---------------------------------------------------------------------------

create or replace function public.list_delegated_management_grants(
  p_circle_id uuid, p_care_recipient_id uuid
)
returns table (
  grant_id uuid,
  membership_id uuid,
  display_name text,
  grant_status text,
  selection_mode text,
  duration_mode text,
  governing_time_zone text,
  expiration_local_date date,
  expires_at timestamptz,
  next_review_at timestamptz,
  activated_at timestamptz,
  suspended_at timestamptz,
  revoked_at timestamptz,
  expired_at timestamptz,
  last_reviewed_at timestamptz,
  last_review_decision text,
  representative_accepted boolean,
  owner_activation_consented boolean,
  review_due boolean,
  grant_version bigint,
  permission_code text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_management_grants(p_circle_id, p_care_recipient_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  perform public.kinward_materialize_recipient_delegations(p_care_recipient_id);
  return query
  select grant_row.id,
    grant_row.representative_membership_id,
    coalesce(
      nullif(membership.display_name_override, ''),
      nullif(profile.preferred_display_name, ''),
      'Circle member'
    ),
    grant_row.status,
    grant_row.selection_mode,
    grant_row.duration_mode,
    grant_row.governing_time_zone,
    grant_row.expiration_local_date,
    grant_row.expires_at,
    grant_row.next_review_at,
    grant_row.activated_at,
    grant_row.suspended_at,
    grant_row.revoked_at,
    grant_row.expired_at,
    grant_row.last_reviewed_at,
    grant_row.last_review_decision,
    grant_row.representative_acceptance_id is not null,
    grant_row.activation_consent_id is not null,
    grant_row.status = 'active'
      and grant_row.next_review_at is not null
      and grant_row.next_review_at <= now(),
    grant_row.version,
    scope_row.permission_code
  from public.delegated_management_grants grant_row
  join public.circle_memberships membership
    on membership.id = grant_row.representative_membership_id
  join public.user_profiles profile on profile.user_id = membership.user_id
  left join public.management_grant_scopes scope_row
    on scope_row.grant_type = 'delegated'
   and scope_row.grant_id = grant_row.id
   and scope_row.status = 'active'
  where grant_row.circle_id = p_circle_id
    and grant_row.care_recipient_id = p_care_recipient_id
  order by grant_row.created_at desc, grant_row.id, scope_row.permission_code;
end;
$$;

revoke all on function public.list_delegated_management_grants(uuid, uuid)
  from public, anon;
grant execute on function public.list_delegated_management_grants(uuid, uuid)
  to authenticated;

-- The account-level review-due placement. It lists only delegations the caller
-- may already manage, so it reveals no grant that the caller cannot see, and it
-- never changes a lifecycle state by being read.
create or replace function public.list_delegation_reviews_due()
returns table (
  grant_id uuid,
  circle_id uuid,
  care_recipient_id uuid,
  care_recipient_label text,
  representative_name text,
  governing_time_zone text,
  next_review_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare v_actor uuid := public.kinward_require_verified_active_adult();
begin
  return query
  select grant_row.id,
    grant_row.circle_id,
    grant_row.care_recipient_id,
    recipient.display_label,
    coalesce(
      nullif(membership.display_name_override, ''),
      nullif(profile.preferred_display_name, ''),
      'Circle member'
    ),
    grant_row.governing_time_zone,
    grant_row.next_review_at
  from public.delegated_management_grants grant_row
  join public.care_recipients recipient
    on recipient.id = grant_row.care_recipient_id
   and recipient.status = 'active'
  join public.circle_memberships membership
    on membership.id = grant_row.representative_membership_id
  join public.user_profiles profile on profile.user_id = membership.user_id
  where grant_row.status = 'active'
    and grant_row.next_review_at is not null
    and grant_row.next_review_at <= now()
    and recipient.owner_user_id = v_actor
    and public.can_manage_management_grants(
      grant_row.circle_id, grant_row.care_recipient_id
    )
  order by grant_row.next_review_at, grant_row.id;
end;
$$;

revoke all on function public.list_delegation_reviews_due() from public, anon;
grant execute on function public.list_delegation_reviews_due() to authenticated;

-- Grant-scoped detail for exactly two audiences: the Care Recipient owner and
-- the named representative. Circle authority alone reveals nothing.
create or replace function public.get_delegated_grant_detail(
  p_circle_id uuid, p_care_recipient_id uuid, p_grant_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_grant public.delegated_management_grants%rowtype;
  v_viewer_role text;
  v_codes text[];
  v_display_name text;
  v_circle_time_zone text;
  v_recipient_label text;
begin
  select * into v_grant from public.delegated_management_grants
    where id = p_grant_id
      and circle_id = p_circle_id
      and care_recipient_id = p_care_recipient_id;
  if v_grant.id is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  if public.can_manage_management_grants(p_circle_id, p_care_recipient_id) then
    v_viewer_role := 'owner';
  elsif exists (
    select 1 from public.circle_memberships membership
    join public.care_recipients recipient
      on recipient.circle_id = membership.circle_id
    where membership.id = v_grant.representative_membership_id
      and membership.user_id = v_actor
      and membership.status = 'active'
      and recipient.id = p_care_recipient_id
      and recipient.status = 'active'
  ) then
    v_viewer_role := 'representative';
  else
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  perform public.kinward_materialize_delegated_expiration(p_grant_id);
  select * into v_grant from public.delegated_management_grants
    where id = p_grant_id;

  select array_agg(scope_row.permission_code order by scope_row.permission_code)
    into v_codes
    from public.management_grant_scopes scope_row
    where scope_row.grant_type = 'delegated'
      and scope_row.grant_id = p_grant_id
      and scope_row.status = 'active';

  select coalesce(
      nullif(membership.display_name_override, ''),
      nullif(profile.preferred_display_name, ''),
      'Circle member'
    ) into v_display_name
    from public.circle_memberships membership
    join public.user_profiles profile on profile.user_id = membership.user_id
    where membership.id = v_grant.representative_membership_id;

  select circle.time_zone into v_circle_time_zone
    from public.family_circles circle where circle.id = p_circle_id;

  select recipient.display_label into v_recipient_label
    from public.care_recipients recipient where recipient.id = p_care_recipient_id;

  return jsonb_build_object(
    'grant_id', v_grant.id,
    'viewer_role', v_viewer_role,
    'care_recipient_label', v_recipient_label,
    'membership_id', v_grant.representative_membership_id,
    'display_name', v_display_name,
    'status', v_grant.status,
    'selection_mode', v_grant.selection_mode,
    'catalog_version', v_grant.catalog_version,
    'permission_codes', coalesce(to_jsonb(v_codes), '[]'::jsonb),
    'duration_mode', v_grant.duration_mode,
    'governing_time_zone', v_grant.governing_time_zone,
    'circle_time_zone', v_circle_time_zone,
    'expiration_local_date', v_grant.expiration_local_date,
    'expires_at', v_grant.expires_at,
    'starts_at', v_grant.starts_at,
    'activated_at', v_grant.activated_at,
    'suspended_at', v_grant.suspended_at,
    'restored_at', v_grant.restored_at,
    'revoked_at', v_grant.revoked_at,
    'expired_at', v_grant.expired_at,
    'next_review_at', v_grant.next_review_at,
    'last_reviewed_at', v_grant.last_reviewed_at,
    'last_review_decision', v_grant.last_review_decision,
    'review_due', v_grant.status = 'active'
      and v_grant.next_review_at is not null
      and v_grant.next_review_at <= now(),
    'terms_fingerprint', v_grant.terms_fingerprint,
    'representative_accepted', v_grant.representative_acceptance_id is not null,
    'owner_activation_consented', v_grant.activation_consent_id is not null,
    'version', v_grant.version
  );
end;
$$;

revoke all on function public.get_delegated_grant_detail(uuid, uuid, uuid)
  from public, anon;
grant execute on function public.get_delegated_grant_detail(uuid, uuid, uuid)
  to authenticated;

-- The representative's own view of delegations naming them, so they can accept a
-- pending delegation and see the exact scope they hold.
create or replace function public.list_delegations_as_representative(
  p_circle_id uuid
)
returns table (
  grant_id uuid,
  care_recipient_id uuid,
  grant_status text,
  duration_mode text,
  expires_at timestamptz,
  next_review_at timestamptz,
  representative_accepted boolean,
  grant_version bigint,
  permission_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare v_actor uuid := public.kinward_require_verified_active_adult();
begin
  if not exists (
    select 1 from public.circle_memberships membership
    where membership.circle_id = p_circle_id
      and membership.user_id = v_actor
      and membership.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  return query
  select grant_row.id,
    grant_row.care_recipient_id,
    grant_row.status,
    grant_row.duration_mode,
    grant_row.expires_at,
    grant_row.next_review_at,
    grant_row.representative_acceptance_id is not null,
    grant_row.version,
    scope_row.permission_code
  from public.delegated_management_grants grant_row
  join public.circle_memberships membership
    on membership.id = grant_row.representative_membership_id
  join public.care_recipients recipient
    on recipient.id = grant_row.care_recipient_id
   and recipient.status = 'active'
  left join public.management_grant_scopes scope_row
    on scope_row.grant_type = 'delegated'
   and scope_row.grant_id = grant_row.id
   and scope_row.status = 'active'
  where grant_row.circle_id = p_circle_id
    and membership.user_id = v_actor
    and membership.status = 'active'
    and grant_row.status in ('pending', 'active', 'suspended')
  order by grant_row.created_at desc, grant_row.id, scope_row.permission_code;
end;
$$;

revoke all on function public.list_delegations_as_representative(uuid)
  from public, anon;
grant execute on function public.list_delegations_as_representative(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Shared mutation preamble helpers
-- ---------------------------------------------------------------------------

-- Locks the exact owner scope in a single order everywhere (recipient, then
-- membership, then grant) and confirms every Slice 10 invariant that is common
-- to owner lifecycle mutations.
create or replace function public.kinward_lock_owner_delegation_scope(
  p_circle_id uuid, p_care_recipient_id uuid, p_grant_id uuid
)
returns public.delegated_management_grants
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_grant public.delegated_management_grants%rowtype;
begin
  perform 1 from public.care_recipients recipient
    where recipient.id = p_care_recipient_id
      and recipient.circle_id = p_circle_id
      and recipient.status = 'active'
    for update;
  if not found or not public.can_manage_management_grants(
    p_circle_id, p_care_recipient_id
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  if not exists (
    select 1 from public.care_management_modes mode
    where mode.care_recipient_id = p_care_recipient_id
      and mode.circle_id = p_circle_id
      and mode.status = 'active'
      and mode.mode_code = 'delegated_management'
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  select * into v_grant from public.delegated_management_grants
    where id = p_grant_id
      and circle_id = p_circle_id
      and care_recipient_id = p_care_recipient_id;
  if v_grant.id is null or v_grant.grantor_user_id <> v_actor then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  perform 1 from public.circle_memberships membership
    join public.user_profiles profile on profile.user_id = membership.user_id
    join auth.users account on account.id = membership.user_id
    where membership.id = v_grant.representative_membership_id
      and membership.circle_id = p_circle_id
      and membership.status = 'active'
      and profile.account_status = 'active'
      and account.email_confirmed_at is not null
      and membership.user_id <> v_actor
    for update of membership;
  if not found then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  select * into v_grant from public.delegated_management_grants
    where id = p_grant_id for update;
  return v_grant;
end;
$$;

revoke all on function public.kinward_lock_owner_delegation_scope(uuid, uuid, uuid)
  from public, anon, authenticated;

create or replace function public.kinward_claim_grant_mutation(
  p_actor_user_id uuid,
  p_idempotency_key uuid,
  p_operation text,
  p_fingerprint text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing_fingerprint text;
  v_existing_result jsonb;
begin
  insert into public.management_grant_mutation_requests(
    actor_user_id, idempotency_key, operation, input_fingerprint
  ) values (p_actor_user_id, p_idempotency_key, p_operation, p_fingerprint)
  on conflict do nothing;
  select input_fingerprint, result
    into v_existing_fingerprint, v_existing_result
    from public.management_grant_mutation_requests
    where actor_user_id = p_actor_user_id
      and idempotency_key = p_idempotency_key
    for update;
  if v_existing_fingerprint <> p_fingerprint then
    raise exception using errcode = '22023', message = 'idempotency_conflict';
  end if;
  return v_existing_result;
end;
$$;

revoke all on function public.kinward_claim_grant_mutation(uuid, uuid, text, text)
  from public, anon, authenticated;

create or replace function public.kinward_grant_mutation_fingerprint(
  p_parts text
)
returns text
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(p_parts, 'UTF8'), 'sha256'), 'hex'
  );
$$;

revoke all on function public.kinward_grant_mutation_fingerprint(text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Screen 21 — finite expiration selection (UF-09; AT-009, AT-010)
--
-- The selected value is a local calendar date in the governing Circle zone. The
-- grant stays active through that whole date, so the stored UTC boundary is the
-- start of the following local day and is exclusive.
-- ---------------------------------------------------------------------------

create or replace function public.suggested_delegation_expiration_date(
  p_circle_id uuid
)
returns date
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_time_zone text := public.get_family_circle_time_zone(p_circle_id);
begin
  -- Ninety calendar days in the governing zone, never ninety times 24 hours.
  return public.kinward_local_date(now(), v_time_zone) + 90;
end;
$$;

revoke all on function public.suggested_delegation_expiration_date(uuid)
  from public, anon;
grant execute on function public.suggested_delegation_expiration_date(uuid)
  to authenticated;

create or replace function public.set_delegation_finite_expiration(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_grant_id uuid,
  p_expiration_local_date date,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_grant public.delegated_management_grants%rowtype;
  v_time_zone text;
  v_expires_at timestamptz;
  v_fingerprint text;
  v_existing jsonb;
  v_terms text;
  v_result jsonb;
begin
  if p_idempotency_key is null
    or p_grant_id is null
    or p_expiration_local_date is null
    or p_expected_version is null
    or p_expected_version < 1
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  perform public.kinward_require_recent_authentication();

  v_grant := public.kinward_lock_owner_delegation_scope(
    p_circle_id, p_care_recipient_id, p_grant_id
  );

  select circle.time_zone into v_time_zone
    from public.family_circles circle
    where circle.id = p_circle_id and circle.status = 'active';
  if not public.kinward_is_valid_time_zone(v_time_zone) then
    raise exception using errcode = '22023', message = 'invalid_time_zone';
  end if;
  if p_expiration_local_date
     <= public.kinward_local_date(now(), v_time_zone) then
    raise exception using errcode = '22023', message = 'expiration_not_future';
  end if;
  v_expires_at := public.kinward_local_date_exclusive_end_utc(
    p_expiration_local_date, v_time_zone
  );
  if v_expires_at <= now() then
    raise exception using errcode = '22023', message = 'expiration_not_future';
  end if;

  v_fingerprint := public.kinward_grant_mutation_fingerprint(
    p_grant_id::text || ':finite:' || p_expiration_local_date::text || ':'
      || v_time_zone || ':' || p_expected_version::text
  );
  v_existing := public.kinward_claim_grant_mutation(
    v_actor, p_idempotency_key, 'set_delegation_finite_expiration', v_fingerprint
  );
  if v_existing is not null then
    return v_existing;
  end if;

  -- Duration is chosen while the delegation is still Pending and grants nothing.
  if v_grant.status <> 'pending' or v_grant.version <> p_expected_version then
    raise exception using errcode = '55000', message = 'stale_state';
  end if;

  update public.delegated_management_grants
    set duration_mode = 'finite',
        expiration_local_date = p_expiration_local_date,
        expires_at = v_expires_at,
        governing_time_zone = v_time_zone,
        until_revoked_consent_id = null,
        version = version + 1,
        updated_at = now()
    where id = p_grant_id;

  v_terms := public.kinward_refresh_delegation_terms(
    p_grant_id, v_actor, p_idempotency_key
  );

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, prior_state, next_state, correlation_id,
    delegated_grant_id
  ) values (
    'authorization', 'delegation.expiration_selected', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    jsonb_build_object(
      'duration_mode', v_grant.duration_mode,
      'expiration_local_date', v_grant.expiration_local_date
    ),
    jsonb_build_object(
      'status', 'pending',
      'duration_mode', 'finite',
      'expiration_local_date', p_expiration_local_date,
      'expires_at', v_expires_at,
      'governing_time_zone', v_time_zone
    ),
    p_idempotency_key, p_grant_id
  );

  v_result := jsonb_build_object(
    'grant_id', p_grant_id,
    'status', 'pending',
    'duration_mode', 'finite',
    'expiration_local_date', p_expiration_local_date,
    'expires_at', v_expires_at,
    'governing_time_zone', v_time_zone,
    'terms_fingerprint', v_terms,
    'version', v_grant.version + 1
  );
  update public.management_grant_mutation_requests
    set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.set_delegation_finite_expiration(
  uuid, uuid, uuid, date, bigint, uuid
) from public, anon;
grant execute on function public.set_delegation_finite_expiration(
  uuid, uuid, uuid, date, bigint, uuid
) to authenticated;

-- ---------------------------------------------------------------------------
-- Screen 22 — explicit "Until revoked" consent (UF-10; AT-011)
--
-- No fixed expiry, and an explicit versioned owner consent that acknowledges the
-- absence of automatic expiration. The recurring review is still scheduled, and a
-- due review never changes the lifecycle state.
-- ---------------------------------------------------------------------------

create or replace function public.set_delegation_until_revoked(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_grant_id uuid,
  p_consent_version text,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_grant public.delegated_management_grants%rowtype;
  v_time_zone text;
  v_fingerprint text;
  v_existing jsonb;
  v_consent_id uuid;
  v_terms text;
  v_result jsonb;
begin
  if p_idempotency_key is null
    or p_grant_id is null
    or p_expected_version is null
    or p_expected_version < 1
    or p_consent_version <> 'kinward.delegation_until_revoked_consent.v1'
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  perform public.kinward_require_recent_authentication();

  v_grant := public.kinward_lock_owner_delegation_scope(
    p_circle_id, p_care_recipient_id, p_grant_id
  );

  select circle.time_zone into v_time_zone
    from public.family_circles circle
    where circle.id = p_circle_id and circle.status = 'active';
  if not public.kinward_is_valid_time_zone(v_time_zone) then
    raise exception using errcode = '22023', message = 'invalid_time_zone';
  end if;

  v_fingerprint := public.kinward_grant_mutation_fingerprint(
    p_grant_id::text || ':until_revoked:' || v_time_zone || ':'
      || p_consent_version || ':' || p_expected_version::text
  );
  v_existing := public.kinward_claim_grant_mutation(
    v_actor, p_idempotency_key, 'set_delegation_until_revoked', v_fingerprint
  );
  if v_existing is not null then
    return v_existing;
  end if;

  if v_grant.status <> 'pending' or v_grant.version <> p_expected_version then
    raise exception using errcode = '55000', message = 'stale_state';
  end if;

  insert into public.consent_records(
    circle_id, care_recipient_id, user_id, consent_kind, consent_version,
    decision, target_type, target_id, correlation_id
  ) values (
    p_circle_id, p_care_recipient_id, v_actor, 'delegated_management_grant',
    p_consent_version, 'accepted', 'delegated_management_grant', p_grant_id,
    p_idempotency_key
  ) returning id into v_consent_id;

  update public.delegated_management_grants
    set duration_mode = 'until_revoked',
        expiration_local_date = null,
        expires_at = null,
        governing_time_zone = v_time_zone,
        until_revoked_consent_id = v_consent_id,
        version = version + 1,
        updated_at = now()
    where id = p_grant_id;

  v_terms := public.kinward_refresh_delegation_terms(
    p_grant_id, v_actor, p_idempotency_key
  );

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, prior_state, next_state, correlation_id,
    delegated_grant_id
  ) values (
    'authorization', 'delegation.no_expiration_selected', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    jsonb_build_object('duration_mode', v_grant.duration_mode),
    jsonb_build_object(
      'status', 'pending',
      'duration_mode', 'until_revoked',
      'expires_at', null,
      'governing_time_zone', v_time_zone
    ),
    p_idempotency_key, p_grant_id
  ), (
    'authorization', 'delegation.consent_recorded', v_actor, p_circle_id,
    p_care_recipient_id, 'consent_record', v_consent_id, 'succeeded',
    null::jsonb,
    jsonb_build_object(
      'consent_kind', 'delegated_management_grant',
      'consent_version', p_consent_version,
      'purpose', 'until_revoked'
    ),
    p_idempotency_key, p_grant_id
  );

  v_result := jsonb_build_object(
    'grant_id', p_grant_id,
    'status', 'pending',
    'duration_mode', 'until_revoked',
    'expires_at', null,
    'governing_time_zone', v_time_zone,
    'until_revoked_consent_id', v_consent_id,
    'terms_fingerprint', v_terms,
    'version', v_grant.version + 1
  );
  update public.management_grant_mutation_requests
    set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.set_delegation_until_revoked(
  uuid, uuid, uuid, text, bigint, uuid
) from public, anon;
grant execute on function public.set_delegation_until_revoked(
  uuid, uuid, uuid, text, bigint, uuid
) to authenticated;

-- ---------------------------------------------------------------------------
-- Representative acceptance of the exact delegation version (UF-08)
-- ---------------------------------------------------------------------------

create or replace function public.accept_delegation_as_representative(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_grant_id uuid,
  p_terms_fingerprint text,
  p_consent_version text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_grant public.delegated_management_grants%rowtype;
  v_current_terms text;
  v_fingerprint text;
  v_existing jsonb;
  v_consent_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null
    or p_grant_id is null
    or p_terms_fingerprint !~ '^[0-9a-f]{64}$'
    or p_consent_version <> 'kinward.delegation_acceptance.v1'
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  perform public.kinward_require_recent_authentication();

  perform 1 from public.care_recipients recipient
    where recipient.id = p_care_recipient_id
      and recipient.circle_id = p_circle_id
      and recipient.status = 'active'
    for update;
  if not found then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  if not exists (
    select 1 from public.care_management_modes mode
    where mode.care_recipient_id = p_care_recipient_id
      and mode.circle_id = p_circle_id
      and mode.status = 'active'
      and mode.mode_code = 'delegated_management'
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  select * into v_grant from public.delegated_management_grants
    where id = p_grant_id
      and circle_id = p_circle_id
      and care_recipient_id = p_care_recipient_id;
  if v_grant.id is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  -- Only the named representative may accept, and only for themselves.
  perform 1 from public.circle_memberships membership
    join public.user_profiles profile on profile.user_id = membership.user_id
    join auth.users account on account.id = membership.user_id
    where membership.id = v_grant.representative_membership_id
      and membership.circle_id = p_circle_id
      and membership.user_id = v_actor
      and membership.status = 'active'
      and profile.account_status = 'active'
      and account.email_confirmed_at is not null
      and membership.user_id <> v_grant.grantor_user_id
    for update of membership;
  if not found then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  select * into v_grant from public.delegated_management_grants
    where id = p_grant_id for update;

  v_fingerprint := public.kinward_grant_mutation_fingerprint(
    p_grant_id::text || ':accept:' || p_terms_fingerprint || ':'
      || p_consent_version
  );
  v_existing := public.kinward_claim_grant_mutation(
    v_actor, p_idempotency_key, 'accept_delegation', v_fingerprint
  );
  if v_existing is not null then
    return v_existing;
  end if;

  -- Acceptance requires a complete, unchanged, still-Pending delegation version.
  if v_grant.status <> 'pending' or v_grant.duration_mode is null then
    raise exception using errcode = '55000', message = 'stale_state';
  end if;
  v_current_terms := public.kinward_delegation_terms_fingerprint(p_grant_id);
  if v_current_terms is distinct from v_grant.terms_fingerprint
    or v_current_terms is distinct from p_terms_fingerprint
  then
    raise exception using errcode = '55000', message = 'delegation_terms_changed';
  end if;

  insert into public.consent_records(
    circle_id, care_recipient_id, user_id, consent_kind, consent_version,
    decision, target_type, target_id, correlation_id
  ) values (
    p_circle_id, p_care_recipient_id, v_actor,
    'delegated_representative_acceptance', p_consent_version, 'accepted',
    'delegated_management_grant', p_grant_id, p_idempotency_key
  ) returning id into v_consent_id;

  update public.delegated_management_grants
    set representative_acceptance_id = v_consent_id,
        representative_accepted_at = now(),
        representative_accepted_fingerprint = v_current_terms,
        version = version + 1,
        updated_at = now()
    where id = p_grant_id;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, next_state, correlation_id,
    delegated_grant_id
  ) values (
    'authorization', 'delegation.accepted', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    jsonb_build_object(
      'status', 'pending',
      'representative_accepted', true,
      'consent_version', p_consent_version
    ),
    p_idempotency_key, p_grant_id
  );

  v_result := jsonb_build_object(
    'grant_id', p_grant_id,
    'status', 'pending',
    'representative_accepted', true,
    'acceptance_id', v_consent_id,
    'terms_fingerprint', v_current_terms,
    'version', v_grant.version + 1
  );
  update public.management_grant_mutation_requests
    set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.accept_delegation_as_representative(
  uuid, uuid, uuid, text, text, uuid
) from public, anon;
grant execute on function public.accept_delegation_as_representative(
  uuid, uuid, uuid, text, text, uuid
) to authenticated;

-- ---------------------------------------------------------------------------
-- Activation (UF-08; AT-008, AT-010, AT-011)
--
-- Every one of the closed activation preconditions is enforced here:
--   1. a duration mode is selected;
--   2. a finite mode has a valid future local expiration date whose exclusive UTC
--      boundary was computed in the governing zone;
--   3. an until-revoked mode has explicit versioned owner consent;
--   4. an immutable exact scope snapshot exists;
--   5. the snapshot holds only Manage roles and Review permissions;
--   6. the representative accepted this exact delegation version and snapshot;
--   7. the owner records final activation consent covering representative, Care
--      Recipient, exact scopes, duration mode, and expiration where applicable;
--   8. the owner satisfies the fifteen-minute trusted-authentication window; and
--   9. the review schedule is generated in the governing Circle time zone.
-- Activation, review scheduling, audit, and the idempotency result commit
-- together, and a duplicate activation is idempotent.
-- ---------------------------------------------------------------------------

create or replace function public.activate_delegated_grant(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_grant_id uuid,
  p_terms_fingerprint text,
  p_consent_version text,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_grant public.delegated_management_grants%rowtype;
  v_circle_time_zone text;
  v_codes text[];
  v_current_terms text;
  v_fingerprint text;
  v_existing jsonb;
  v_consent_id uuid;
  v_activated_at timestamptz;
  v_next_review_at timestamptz;
  v_result jsonb;
begin
  if p_idempotency_key is null
    or p_grant_id is null
    or p_expected_version is null
    or p_expected_version < 1
    or p_terms_fingerprint !~ '^[0-9a-f]{64}$'
    or p_consent_version <> 'kinward.delegation_activation_consent.v1'
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  -- Precondition 8.
  perform public.kinward_require_recent_authentication();

  v_grant := public.kinward_lock_owner_delegation_scope(
    p_circle_id, p_care_recipient_id, p_grant_id
  );

  v_fingerprint := public.kinward_grant_mutation_fingerprint(
    p_grant_id::text || ':activate:' || p_terms_fingerprint || ':'
      || p_consent_version || ':' || p_expected_version::text
  );
  v_existing := public.kinward_claim_grant_mutation(
    v_actor, p_idempotency_key, 'activate_delegated', v_fingerprint
  );
  if v_existing is not null then
    return v_existing;
  end if;

  if v_grant.status <> 'pending' or v_grant.version <> p_expected_version then
    raise exception using errcode = '55000', message = 'stale_state';
  end if;

  -- Preconditions 1-3.
  if v_grant.duration_mode is null or v_grant.governing_time_zone is null then
    raise exception using errcode = '55000', message = 'duration_required';
  end if;
  if v_grant.duration_mode = 'finite' then
    if v_grant.expiration_local_date is null
      or v_grant.expires_at is null
      or v_grant.expires_at <= now()
    then
      raise exception using errcode = '55000', message = 'expiration_not_future';
    end if;
    if v_grant.expires_at <> public.kinward_local_date_exclusive_end_utc(
      v_grant.expiration_local_date, v_grant.governing_time_zone
    ) then
      raise exception using errcode = '55000', message = 'stale_state';
    end if;
  else
    if v_grant.expires_at is not null
      or v_grant.until_revoked_consent_id is null
    then
      raise exception using errcode = '55000', message = 'stale_state';
    end if;
  end if;

  -- The governing zone is snapshotted at activation as well: a Circle time zone
  -- edit after the duration choice must be re-confirmed rather than silently
  -- moving an expiration boundary.
  select circle.time_zone into v_circle_time_zone
    from public.family_circles circle
    where circle.id = p_circle_id and circle.status = 'active';
  if v_circle_time_zone is null
    or v_circle_time_zone <> v_grant.governing_time_zone
  then
    raise exception using errcode = '55000', message = 'governing_time_zone_changed';
  end if;

  -- Preconditions 4-5.
  select array_agg(scope_row.permission_code order by scope_row.permission_code)
    into v_codes
    from public.management_grant_scopes scope_row
    where scope_row.grant_type = 'delegated'
      and scope_row.grant_id = p_grant_id
      and scope_row.status = 'active';
  if v_codes is null or cardinality(v_codes) = 0 then
    raise exception using errcode = '55000', message = 'scope_snapshot_required';
  end if;
  if exists (
    select 1 from unnest(v_codes) as code
    where code not in ('recipient.manage_roles', 'recipient.review_permissions')
  ) then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  -- Precondition 6.
  v_current_terms := public.kinward_delegation_terms_fingerprint(p_grant_id);
  if v_current_terms is distinct from v_grant.terms_fingerprint
    or v_current_terms is distinct from p_terms_fingerprint
  then
    raise exception using errcode = '55000', message = 'delegation_terms_changed';
  end if;
  if v_grant.representative_acceptance_id is null
    or v_grant.representative_accepted_fingerprint is distinct from v_current_terms
  then
    raise exception using errcode = '55000',
      message = 'representative_acceptance_required';
  end if;

  v_activated_at := now();
  -- Precondition 9: ninety calendar days in the governing zone.
  v_next_review_at := public.kinward_add_calendar_days(
    v_activated_at, 90, v_grant.governing_time_zone
  );

  -- Precondition 7.
  insert into public.consent_records(
    circle_id, care_recipient_id, user_id, consent_kind, consent_version,
    decision, target_type, target_id, correlation_id
  ) values (
    p_circle_id, p_care_recipient_id, v_actor, 'delegated_management_grant',
    p_consent_version, 'accepted', 'delegated_management_grant', p_grant_id,
    p_idempotency_key
  ) returning id into v_consent_id;

  update public.delegated_management_grants
    set status = 'active',
        starts_at = v_activated_at,
        activated_at = v_activated_at,
        next_review_at = v_next_review_at,
        activation_consent_id = v_consent_id,
        activation_consent_fingerprint = v_current_terms,
        consent_id = v_consent_id,
        version = version + 1,
        updated_at = now()
    where id = p_grant_id;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, prior_state, next_state, correlation_id,
    delegated_grant_id
  ) values (
    'authorization', 'delegation.consent_recorded', v_actor, p_circle_id,
    p_care_recipient_id, 'consent_record', v_consent_id, 'succeeded',
    null::jsonb,
    jsonb_build_object(
      'consent_kind', 'delegated_management_grant',
      'consent_version', p_consent_version,
      'purpose', 'activation',
      'terms_fingerprint', v_current_terms
    ),
    p_idempotency_key, p_grant_id
  ), (
    'authorization', 'delegation.activated', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    jsonb_build_object('status', 'pending'),
    jsonb_build_object(
      'status', 'active',
      'duration_mode', v_grant.duration_mode,
      'expiration_local_date', v_grant.expiration_local_date,
      'expires_at', v_grant.expires_at,
      'governing_time_zone', v_grant.governing_time_zone,
      'permission_codes', to_jsonb(v_codes),
      'activated_at', v_activated_at
    ),
    p_idempotency_key, p_grant_id
  ), (
    'authorization', 'delegation.review_scheduled', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    null::jsonb,
    jsonb_build_object(
      'next_review_at', v_next_review_at,
      'review_interval_calendar_days', 90,
      'governing_time_zone', v_grant.governing_time_zone
    ),
    p_idempotency_key, p_grant_id
  ), (
    'authorization', 'permission_scopes.recorded', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    null::jsonb,
    jsonb_build_object(
      'catalog_version', v_grant.catalog_version,
      'permission_codes', to_jsonb(v_codes),
      'selection_mode', v_grant.selection_mode,
      'status', 'active'
    ),
    p_idempotency_key, p_grant_id
  );

  v_result := jsonb_build_object(
    'grant_id', p_grant_id,
    'status', 'active',
    'duration_mode', v_grant.duration_mode,
    'expiration_local_date', v_grant.expiration_local_date,
    'expires_at', v_grant.expires_at,
    'governing_time_zone', v_grant.governing_time_zone,
    'activated_at', v_activated_at,
    'next_review_at', v_next_review_at,
    'permission_codes', to_jsonb(v_codes),
    'activation_consent_id', v_consent_id,
    'version', v_grant.version + 1
  );
  update public.management_grant_mutation_requests
    set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.activate_delegated_grant(
  uuid, uuid, uuid, text, text, bigint, uuid
) from public, anon;
grant execute on function public.activate_delegated_grant(
  uuid, uuid, uuid, text, text, bigint, uuid
) to authenticated;

-- ---------------------------------------------------------------------------
-- Screen 24 — access review (UF-23; AT-011)
--
-- Completing a review records the reviewer and decision and schedules the next
-- review ninety calendar days ahead in the governing zone. It never changes the
-- lifecycle state, the scope snapshot, or the expiration boundary.
-- ---------------------------------------------------------------------------

create or replace function public.complete_delegation_access_review(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_grant_id uuid,
  p_decision text,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_grant public.delegated_management_grants%rowtype;
  v_fingerprint text;
  v_existing jsonb;
  v_reviewed_at timestamptz;
  v_next_review_at timestamptz;
  v_result jsonb;
begin
  if p_idempotency_key is null
    or p_grant_id is null
    or p_expected_version is null
    or p_expected_version < 1
    or p_decision <> 'keep_access'
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  perform public.kinward_require_recent_authentication();

  v_grant := public.kinward_lock_owner_delegation_scope(
    p_circle_id, p_care_recipient_id, p_grant_id
  );
  perform public.kinward_materialize_delegated_expiration(p_grant_id);
  select * into v_grant from public.delegated_management_grants
    where id = p_grant_id for update;

  v_fingerprint := public.kinward_grant_mutation_fingerprint(
    p_grant_id::text || ':review:' || p_decision || ':'
      || p_expected_version::text
  );
  v_existing := public.kinward_claim_grant_mutation(
    v_actor, p_idempotency_key, 'complete_access_review', v_fingerprint
  );
  if v_existing is not null then
    return v_existing;
  end if;

  if v_grant.status <> 'active' or v_grant.version <> p_expected_version then
    raise exception using errcode = '55000', message = 'stale_state';
  end if;

  v_reviewed_at := now();
  v_next_review_at := public.kinward_add_calendar_days(
    v_reviewed_at, 90, v_grant.governing_time_zone
  );

  update public.delegated_management_grants
    set last_reviewed_at = v_reviewed_at,
        last_reviewed_by_user_id = v_actor,
        last_review_decision = 'keep_access',
        next_review_at = v_next_review_at,
        version = version + 1,
        updated_at = now()
    where id = p_grant_id;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, prior_state, next_state, correlation_id,
    delegated_grant_id
  ) values (
    'authorization', 'delegation.review_completed', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    jsonb_build_object(
      'status', 'active', 'next_review_at', v_grant.next_review_at
    ),
    jsonb_build_object(
      'status', 'active',
      'decision', 'keep_access',
      'last_reviewed_at', v_reviewed_at
    ),
    p_idempotency_key, p_grant_id
  ), (
    'authorization', 'delegation.review_scheduled', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    null::jsonb,
    jsonb_build_object(
      'next_review_at', v_next_review_at,
      'review_interval_calendar_days', 90,
      'governing_time_zone', v_grant.governing_time_zone
    ),
    p_idempotency_key, p_grant_id
  );

  v_result := jsonb_build_object(
    'grant_id', p_grant_id,
    'status', 'active',
    'decision', 'keep_access',
    'last_reviewed_at', v_reviewed_at,
    'next_review_at', v_next_review_at,
    'version', v_grant.version + 1
  );
  update public.management_grant_mutation_requests
    set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.complete_delegation_access_review(
  uuid, uuid, uuid, text, bigint, uuid
) from public, anon;
grant execute on function public.complete_delegation_access_review(
  uuid, uuid, uuid, text, bigint, uuid
) to authenticated;

-- ---------------------------------------------------------------------------
-- Screen 25 — suspension and restoration (UF-11; AT-012)
--
-- Suspension removes every delegated permission immediately and keeps the grant
-- and its history. Restoration is available only for a suspended grant that has
-- not passed its expiration boundary and was never revoked.
-- ---------------------------------------------------------------------------

create or replace function public.suspend_delegated_grant(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_grant_id uuid,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_grant public.delegated_management_grants%rowtype;
  v_fingerprint text;
  v_existing jsonb;
  v_suspended_at timestamptz;
  v_result jsonb;
begin
  if p_idempotency_key is null
    or p_grant_id is null
    or p_expected_version is null
    or p_expected_version < 1
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  perform public.kinward_require_recent_authentication();

  v_grant := public.kinward_lock_owner_delegation_scope(
    p_circle_id, p_care_recipient_id, p_grant_id
  );
  perform public.kinward_materialize_delegated_expiration(p_grant_id);
  select * into v_grant from public.delegated_management_grants
    where id = p_grant_id for update;

  v_fingerprint := public.kinward_grant_mutation_fingerprint(
    p_grant_id::text || ':suspend:' || p_expected_version::text
  );
  v_existing := public.kinward_claim_grant_mutation(
    v_actor, p_idempotency_key, 'suspend_delegated', v_fingerprint
  );
  if v_existing is not null then
    return v_existing;
  end if;

  -- A concurrent revocation or expiration wins; the caller reloads current state.
  if v_grant.status <> 'active' or v_grant.version <> p_expected_version then
    raise exception using errcode = '55000', message = 'stale_state';
  end if;

  v_suspended_at := now();
  update public.delegated_management_grants
    set status = 'suspended',
        suspended_at = v_suspended_at,
        restored_at = null,
        version = version + 1,
        updated_at = now()
    where id = p_grant_id;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, prior_state, next_state, correlation_id,
    delegated_grant_id
  ) values (
    'authorization', 'delegation.suspended', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    jsonb_build_object('status', 'active'),
    jsonb_build_object('status', 'suspended', 'suspended_at', v_suspended_at),
    p_idempotency_key, p_grant_id
  ), (
    'security', 'delegated_sessions.invalidated', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    null::jsonb,
    jsonb_build_object(
      'enforcement', 'authorization_reevaluated_per_request',
      'delegated_scopes_effective', false
    ),
    p_idempotency_key, p_grant_id
  );

  v_result := jsonb_build_object(
    'grant_id', p_grant_id,
    'status', 'suspended',
    'suspended_at', v_suspended_at,
    'version', v_grant.version + 1
  );
  update public.management_grant_mutation_requests
    set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.suspend_delegated_grant(uuid, uuid, uuid, bigint, uuid)
  from public, anon;
grant execute on function public.suspend_delegated_grant(uuid, uuid, uuid, bigint, uuid)
  to authenticated;

create or replace function public.restore_delegated_grant(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_grant_id uuid,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_grant public.delegated_management_grants%rowtype;
  v_fingerprint text;
  v_existing jsonb;
  v_restored_at timestamptz;
  v_result jsonb;
begin
  if p_idempotency_key is null
    or p_grant_id is null
    or p_expected_version is null
    or p_expected_version < 1
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  perform public.kinward_require_recent_authentication();

  v_grant := public.kinward_lock_owner_delegation_scope(
    p_circle_id, p_care_recipient_id, p_grant_id
  );
  perform public.kinward_materialize_delegated_expiration(p_grant_id);
  select * into v_grant from public.delegated_management_grants
    where id = p_grant_id for update;

  v_fingerprint := public.kinward_grant_mutation_fingerprint(
    p_grant_id::text || ':restore:' || p_expected_version::text
  );
  v_existing := public.kinward_claim_grant_mutation(
    v_actor, p_idempotency_key, 'restore_delegated', v_fingerprint
  );
  if v_existing is not null then
    return v_existing;
  end if;

  -- Only a suspended grant restores, and revoked or expired never does.
  if v_grant.status <> 'suspended' or v_grant.version <> p_expected_version then
    raise exception using errcode = '55000', message = 'stale_state';
  end if;
  if v_grant.revoked_at is not null then
    raise exception using errcode = '55000', message = 'stale_state';
  end if;
  if v_grant.expires_at is not null and now() >= v_grant.expires_at then
    raise exception using errcode = '55000', message = 'expiration_passed';
  end if;

  v_restored_at := now();
  update public.delegated_management_grants
    set status = 'active',
        suspended_at = null,
        restored_at = v_restored_at,
        version = version + 1,
        updated_at = now()
    where id = p_grant_id;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, prior_state, next_state, correlation_id,
    delegated_grant_id
  ) values (
    'authorization', 'delegation.restored', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    jsonb_build_object(
      'status', 'suspended', 'suspended_at', v_grant.suspended_at
    ),
    jsonb_build_object(
      'status', 'active',
      'restored_at', v_restored_at,
      'expires_at', v_grant.expires_at,
      'next_review_at', v_grant.next_review_at
    ),
    p_idempotency_key, p_grant_id
  );

  v_result := jsonb_build_object(
    'grant_id', p_grant_id,
    'status', 'active',
    'restored_at', v_restored_at,
    'expires_at', v_grant.expires_at,
    'next_review_at', v_grant.next_review_at,
    'version', v_grant.version + 1
  );
  update public.management_grant_mutation_requests
    set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.restore_delegated_grant(uuid, uuid, uuid, bigint, uuid)
  from public, anon;
grant execute on function public.restore_delegated_grant(uuid, uuid, uuid, bigint, uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Screen 26 — revocation (UF-12; AT-013)
--
-- Revocation is terminal: the scope snapshot is closed, the grant can never
-- return to Active, and an already revoked or expired grant answers with the
-- current state instead of an error.
-- ---------------------------------------------------------------------------

create or replace function public.revoke_delegated_grant(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_grant_id uuid,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_grant public.delegated_management_grants%rowtype;
  v_fingerprint text;
  v_existing jsonb;
  v_revoked_at timestamptz;
  v_removed_codes text[];
  v_result jsonb;
begin
  if p_idempotency_key is null
    or p_grant_id is null
    or p_expected_version is null
    or p_expected_version < 1
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  perform public.kinward_require_recent_authentication();

  v_grant := public.kinward_lock_owner_delegation_scope(
    p_circle_id, p_care_recipient_id, p_grant_id
  );
  perform public.kinward_materialize_delegated_expiration(p_grant_id);
  select * into v_grant from public.delegated_management_grants
    where id = p_grant_id for update;

  v_fingerprint := public.kinward_grant_mutation_fingerprint(
    p_grant_id::text || ':revoke:' || p_expected_version::text
  );
  v_existing := public.kinward_claim_grant_mutation(
    v_actor, p_idempotency_key, 'revoke_delegated', v_fingerprint
  );
  if v_existing is not null then
    return v_existing;
  end if;

  if v_grant.status in ('revoked', 'expired') then
    v_result := jsonb_build_object(
      'grant_id', p_grant_id,
      'status', v_grant.status,
      'revoked_at', v_grant.revoked_at,
      'already_ended', true,
      'version', v_grant.version
    );
    update public.management_grant_mutation_requests
      set result = v_result
      where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
    return v_result;
  end if;
  if v_grant.status not in ('active', 'suspended')
    or v_grant.version <> p_expected_version
  then
    raise exception using errcode = '55000', message = 'stale_state';
  end if;

  v_revoked_at := now();
  update public.delegated_management_grants
    set status = 'revoked',
        revoked_at = v_revoked_at,
        version = version + 1,
        updated_at = now()
    where id = p_grant_id;

  with removed as (
    update public.management_grant_scopes
      set status = 'removed', removed_at = v_revoked_at
      where grant_type = 'delegated'
        and grant_id = p_grant_id
        and status = 'active'
      returning permission_code
  )
  select array_agg(permission_code order by permission_code)
    into v_removed_codes from removed;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, prior_state, next_state, correlation_id,
    delegated_grant_id
  ) values (
    'authorization', 'delegation.revoked', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    jsonb_build_object('status', v_grant.status),
    jsonb_build_object(
      'status', 'revoked',
      'revoked_at', v_revoked_at,
      'restorable', false
    ),
    p_idempotency_key, p_grant_id
  ), (
    'authorization', 'permission_scopes.removed', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    null::jsonb,
    jsonb_build_object(
      'catalog_version', v_grant.catalog_version,
      'permission_codes', coalesce(to_jsonb(v_removed_codes), '[]'::jsonb),
      'status', 'removed'
    ),
    p_idempotency_key, p_grant_id
  ), (
    'security', 'delegated_sessions.invalidated', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', p_grant_id, 'succeeded',
    null::jsonb,
    jsonb_build_object(
      'enforcement', 'authorization_reevaluated_per_request',
      'delegated_scopes_effective', false
    ),
    p_idempotency_key, p_grant_id
  );

  v_result := jsonb_build_object(
    'grant_id', p_grant_id,
    'status', 'revoked',
    'revoked_at', v_revoked_at,
    'removed_permission_codes', coalesce(to_jsonb(v_removed_codes), '[]'::jsonb),
    'already_ended', false,
    'version', v_grant.version + 1
  );
  update public.management_grant_mutation_requests
    set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.revoke_delegated_grant(uuid, uuid, uuid, bigint, uuid)
  from public, anon;
grant execute on function public.revoke_delegated_grant(uuid, uuid, uuid, bigint, uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- On-behalf-of provenance for delegated coordination actions (AT-008)
--
-- The Slice 7 role mutations are unchanged except that a representative acting
-- through an active delegated grant is now recorded as acting for the Care
-- Recipient owner, naming the exact delegation.
-- ---------------------------------------------------------------------------

create or replace function public.assign_recipient_role(
  p_circle_id uuid, p_care_recipient_id uuid, p_membership_id uuid,
  p_role_code text, p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_fingerprint text; v_existing_fingerprint text; v_existing_result jsonb;
  v_assignment_id uuid; v_result jsonb;
  v_owner_user_id uuid; v_delegated_grant_id uuid;
begin
  if p_idempotency_key is null or p_role_code not in (
    'care_lead', 'medical_lead', 'chemo_care_lead', 'backup_caregiver'
  ) then raise exception using errcode = '22023', message = 'invalid_request'; end if;
  select recipient.owner_user_id into v_owner_user_id
    from public.care_recipients recipient
    where recipient.id = p_care_recipient_id and recipient.circle_id = p_circle_id
      and recipient.status = 'active' for update;
  if v_owner_user_id is null or not public.can_manage_recipient_roles(
    p_circle_id, p_care_recipient_id
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  perform 1 from public.circle_memberships membership
    join public.user_profiles profile on profile.user_id = membership.user_id
    join auth.users account on account.id = membership.user_id
    where membership.id = p_membership_id and membership.circle_id = p_circle_id
      and membership.status = 'active' and profile.account_status = 'active'
      and account.email_confirmed_at is not null and membership.user_id <> v_actor
    for update of membership;
  if not found then raise exception using errcode = '42501', message = 'not_authorized'; end if;
  v_delegated_grant_id := public.kinward_active_delegated_grant_id(
    p_circle_id, p_care_recipient_id, v_actor, 'recipient.manage_roles'
  );
  v_fingerprint := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    p_circle_id::text || ':' || p_care_recipient_id::text || ':' || p_membership_id::text || ':' || p_role_code,
    'UTF8'), 'sha256'), 'hex');
  insert into public.care_recipient_role_mutation_requests(actor_user_id, idempotency_key, operation, input_fingerprint)
  values (v_actor, p_idempotency_key, 'assign', v_fingerprint) on conflict do nothing;
  select input_fingerprint, result into v_existing_fingerprint, v_existing_result
    from public.care_recipient_role_mutation_requests
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key for update;
  if v_existing_fingerprint <> v_fingerprint then
    raise exception using errcode = '22023', message = 'idempotency_conflict';
  end if;
  if v_existing_result is not null then return v_existing_result; end if;
  select id into v_assignment_id from public.care_recipient_role_assignments
    where care_recipient_id = p_care_recipient_id and membership_id = p_membership_id
      and role_code = p_role_code
    order by updated_at desc, id desc limit 1 for update;
  if v_assignment_id is null then
    insert into public.care_recipient_role_assignments(circle_id, care_recipient_id,
      membership_id, role_code, assigned_by_user_id, changed_by_user_id)
    values (p_circle_id, p_care_recipient_id, p_membership_id, p_role_code, v_actor, v_actor)
    returning id into v_assignment_id;
    insert into public.audit_events(event_class, event_type, actor_user_id, circle_id,
      care_recipient_id, target_type, target_id, result, next_state, correlation_id,
      on_behalf_of_user_id, delegated_grant_id)
    values ('authorization', 'recipient_role.assigned', v_actor, p_circle_id,
      p_care_recipient_id, 'care_recipient_role_assignment', v_assignment_id,
      'succeeded', jsonb_build_object(
        'role_code', p_role_code,
        'status', 'active',
        'acted_through', case when v_delegated_grant_id is null
          then 'own_authority' else 'delegated_management_grant' end
      ), p_idempotency_key,
      case when v_delegated_grant_id is null then null else v_owner_user_id end,
      v_delegated_grant_id);
  elsif not exists (
    select 1 from public.care_recipient_role_assignments
      where id = v_assignment_id and status = 'active'
  ) then
    raise exception using errcode = '55000', message = 'role_lifecycle_closed';
  end if;
  v_result := jsonb_build_object('assignment_id', v_assignment_id, 'status', 'active');
  update public.care_recipient_role_mutation_requests set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.assign_recipient_role(uuid, uuid, uuid, text, uuid) from public, anon;
grant execute on function public.assign_recipient_role(uuid, uuid, uuid, text, uuid) to authenticated;

