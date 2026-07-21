-- Slice 4: Circle invitations, proposed assignments, synthetic delivery capture.
-- Ordinary adult Circle invitations only. Care Recipient ownership invitations remain Slice 5.
-- GOV-005: membership-only invitations are excluded; Slice 4 proposes Family Coordinator only.

alter table public.circle_role_assignments
  drop constraint if exists circle_role_assignments_role_code_check;
alter table public.circle_role_assignments
  add constraint circle_role_assignments_role_code_check
  check (role_code in ('circle_head', 'family_coordinator'));

create table public.circle_invitations (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.family_circles(id),
  invited_email_digest text not null
    check (invited_email_digest ~ '^[0-9a-f]{64}$'),
  invited_email_mask text not null
    check (char_length(invited_email_mask) between 3 and 320),
  token_digest text not null
    check (token_digest ~ '^[0-9a-f]{64}$'),
  inviter_user_id uuid not null references auth.users(id),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  declined_at timestamptz,
  cancelled_at timestamptz,
  accepted_by_user_id uuid references auth.users(id),
  replaced_by_invitation_id uuid references public.circle_invitations(id),
  version bigint not null default 1,
  constraint circle_invitations_expires_after_create check (expires_at > created_at),
  constraint circle_invitations_accepted_fields check (
    (status = 'accepted' and accepted_at is not null and accepted_by_user_id is not null)
    or (status <> 'accepted' and accepted_at is null and accepted_by_user_id is null)
  ),
  constraint circle_invitations_declined_fields check (
    (status = 'declined' and declined_at is not null)
    or (status <> 'declined' and declined_at is null)
  ),
  constraint circle_invitations_cancelled_fields check (
    (status = 'cancelled' and cancelled_at is not null)
    or (status <> 'cancelled' and cancelled_at is null)
  )
);

create unique index circle_invitations_token_digest_unique
  on public.circle_invitations(token_digest);
create unique index circle_invitations_one_pending_email_per_circle
  on public.circle_invitations(circle_id, invited_email_digest)
  where status = 'pending';
create index circle_invitations_circle_status
  on public.circle_invitations(circle_id, status);
create index circle_invitations_pending_expires
  on public.circle_invitations(expires_at)
  where status = 'pending';
create index circle_invitations_email_digest_status
  on public.circle_invitations(invited_email_digest, status);

create table public.invitation_proposed_assignments (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.circle_invitations(id) on delete cascade,
  circle_id uuid not null references public.family_circles(id),
  assignment_kind text not null default 'circle_wide_role'
    check (assignment_kind = 'circle_wide_role'),
  role_code text not null check (role_code = 'family_coordinator'),
  status text not null default 'proposed'
    check (status in ('proposed', 'activated', 'cancelled', 'expired', 'declined')),
  activated_at timestamptz,
  activated_role_assignment_id uuid references public.circle_role_assignments(id),
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  constraint invitation_proposed_assignments_no_wildcard check (role_code <> '*'),
  constraint invitation_proposed_assignments_activated_fields check (
    (status = 'activated' and activated_at is not null and activated_role_assignment_id is not null)
    or (status <> 'activated' and activated_at is null and activated_role_assignment_id is null)
  )
);

create unique index invitation_proposed_assignments_one_role
  on public.invitation_proposed_assignments(invitation_id, role_code);
create index invitation_proposed_assignments_circle
  on public.invitation_proposed_assignments(circle_id, status);

create table public.invitation_creation_requests (
  user_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  circle_id uuid not null references public.family_circles(id),
  invited_email_digest text not null
    check (invited_email_digest ~ '^[0-9a-f]{64}$'),
  invitation_id uuid references public.circle_invitations(id),
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);

-- Synthetic-only delivery capture. Never a production mail transport.
create table public.invitation_delivery_captures (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.circle_invitations(id),
  circle_id uuid not null references public.family_circles(id),
  destination_domain text not null
    check (destination_domain in ('example.test', 'example.com')),
  delivery_channel text not null default 'synthetic_capture'
    check (delivery_channel = 'synthetic_capture'),
  captured_at timestamptz not null default now(),
  correlation_id uuid not null,
  -- Opaque token material is never stored. Only a non-reversible delivery marker.
  delivery_marker text not null check (delivery_marker ~ '^[0-9a-f]{64}$')
);

create index invitation_delivery_captures_invitation
  on public.invitation_delivery_captures(invitation_id, captured_at desc);
create unique index invitation_delivery_captures_one_per_invitation
  on public.invitation_delivery_captures(invitation_id);

alter table public.circle_invitations enable row level security;
alter table public.invitation_proposed_assignments enable row level security;
alter table public.invitation_creation_requests enable row level security;
alter table public.invitation_delivery_captures enable row level security;

-- No direct table grants for invitation secrets or lifecycle mutation.
revoke all on public.circle_invitations from public, anon, authenticated;
revoke all on public.invitation_proposed_assignments from public, anon, authenticated;
revoke all on public.invitation_creation_requests from public, anon, authenticated;
revoke all on public.invitation_delivery_captures from public, anon, authenticated;

create or replace function public.kinward_is_active_circle_head(p_circle_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.circle_memberships membership
    join public.circle_role_assignments role
      on role.membership_id = membership.id
     and role.circle_id = membership.circle_id
    where membership.circle_id = p_circle_id
      and membership.user_id = p_user_id
      and membership.status = 'active'
      and role.status = 'active'
      and role.role_code = 'circle_head'
  );
$$;

revoke all on function public.kinward_is_active_circle_head(uuid, uuid) from public, anon, authenticated;

create or replace function public.kinward_normalize_email(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_email is null then null
    else lower(pg_catalog.btrim(p_email))
  end;
$$;

revoke all on function public.kinward_normalize_email(text) from public, anon, authenticated;

create or replace function public.kinward_email_digest(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(public.kinward_normalize_email(p_email), 'UTF8'),
      'sha256'
    ),
    'hex'
  );
$$;

revoke all on function public.kinward_email_digest(text) from public, anon, authenticated;

create or replace function public.kinward_mask_email(p_email text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_email text := public.kinward_normalize_email(p_email);
  v_local text;
  v_domain text;
  v_at int;
begin
  if v_email is null or v_email !~ '^[^@]+@[^@]+$' then
    return '•••@••••';
  end if;
  v_at := position('@' in v_email);
  v_local := substr(v_email, 1, v_at - 1);
  v_domain := substr(v_email, v_at + 1);
  return substr(v_local, 1, 1)
    || repeat('•', least(3, greatest(1, char_length(v_local) - 1)))
    || '@'
    || v_domain;
end;
$$;

revoke all on function public.kinward_mask_email(text) from public, anon, authenticated;

create or replace function public.kinward_require_verified_active_adult()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null
    or not exists (
      select 1 from auth.users
      where id = v_user_id and email_confirmed_at is not null and email is not null
    )
    or not exists (
      select 1 from public.user_profiles
      where user_id = v_user_id and account_status = 'active'
    )
  then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  return v_user_id;
end;
$$;

revoke all on function public.kinward_require_verified_active_adult() from public, anon, authenticated;

create or replace function public.create_circle_invitation(
  p_circle_id uuid,
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
  v_email text := public.kinward_normalize_email(p_invited_email);
  v_email_digest text;
  v_email_mask text;
  v_invitation_id uuid;
  v_existing_circle uuid;
  v_existing_digest text;
  v_existing_invitation uuid;
  v_domain text;
  v_pending_id uuid;
begin
  if p_circle_id is null or p_idempotency_key is null
    or p_token_digest is null or p_token_digest !~ '^[0-9a-f]{64}$'
  then
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

  insert into public.invitation_creation_requests(
    user_id, idempotency_key, circle_id, invited_email_digest
  ) values (v_user_id, p_idempotency_key, p_circle_id, v_email_digest)
  on conflict do nothing;

  select circle_id, invited_email_digest, invitation_id
    into v_existing_circle, v_existing_digest, v_existing_invitation
  from public.invitation_creation_requests
  where user_id = v_user_id and idempotency_key = p_idempotency_key
  for update;

  if v_existing_circle <> p_circle_id or v_existing_digest <> v_email_digest then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if v_existing_invitation is not null then
    return jsonb_build_object(
      'invitation_id', v_existing_invitation,
      'created', false,
      'deduplicated', true
    );
  end if;

  -- Already an active member: create no pending invitation; return dedicated conflict.
  if exists (
    select 1 from public.circle_memberships
    join auth.users on auth.users.id = circle_memberships.user_id
    where circle_memberships.circle_id = p_circle_id
      and circle_memberships.status = 'active'
      and public.kinward_email_digest(auth.users.email) = v_email_digest
  ) then
    raise exception using errcode = '23505', message = 'already_member';
  end if;

  select id into v_pending_id
  from public.circle_invitations
  where circle_id = p_circle_id
    and invited_email_digest = v_email_digest
    and status = 'pending'
  for update;
  if v_pending_id is not null then
    update public.invitation_creation_requests
      set invitation_id = v_pending_id
    where user_id = v_user_id and idempotency_key = p_idempotency_key;
    return jsonb_build_object(
      'invitation_id', v_pending_id,
      'created', false,
      'deduplicated', true
    );
  end if;

  begin
    insert into public.circle_invitations(
      circle_id, invited_email_digest, invited_email_mask, token_digest,
      inviter_user_id, status, expires_at
    ) values (
      p_circle_id, v_email_digest, v_email_mask, p_token_digest,
      v_user_id, 'pending', now() + interval '7 days'
    ) returning id into v_invitation_id;
  exception
    when unique_violation then
      select id into v_pending_id
      from public.circle_invitations
      where circle_id = p_circle_id
        and invited_email_digest = v_email_digest
        and status = 'pending';
      if v_pending_id is null then
        raise;
      end if;
      update public.invitation_creation_requests
        set invitation_id = v_pending_id
      where user_id = v_user_id and idempotency_key = p_idempotency_key;
      return jsonb_build_object(
        'invitation_id', v_pending_id,
        'created', false,
        'deduplicated', true
      );
  end;

  insert into public.invitation_proposed_assignments(
    invitation_id, circle_id, assignment_kind, role_code, status
  ) values (
    v_invitation_id, p_circle_id, 'circle_wide_role', 'family_coordinator', 'proposed'
  );

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, next_state, correlation_id
  ) values (
    'invitation', 'invitation.created', v_user_id, p_circle_id,
    'circle_invitation', v_invitation_id, 'succeeded',
    jsonb_build_object(
      'status', 'pending',
      'proposed_role', 'family_coordinator',
      'expires_in_days', 7
    ),
    p_idempotency_key
  );

  update public.invitation_creation_requests
    set invitation_id = v_invitation_id
  where user_id = v_user_id and idempotency_key = p_idempotency_key;

  return jsonb_build_object(
    'invitation_id', v_invitation_id,
    'created', true,
    'deduplicated', false
  );
end;
$$;

revoke all on function public.create_circle_invitation(uuid, text, text, uuid) from public, anon;
grant execute on function public.create_circle_invitation(uuid, text, text, uuid) to authenticated;

create or replace function public.capture_invitation_delivery(
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
  from public.circle_invitations
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

  insert into public.invitation_delivery_captures(
    invitation_id, circle_id, destination_domain, delivery_marker, correlation_id
  ) values (
    p_invitation_id, v_circle_id, p_destination_domain, p_delivery_marker, p_correlation_id
  ) on conflict (invitation_id) do nothing
  returning id into v_capture_id;

  if v_capture_id is null then
    select id into v_capture_id
    from public.invitation_delivery_captures
    where invitation_id = p_invitation_id;
    return v_capture_id;
  end if;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, next_state, correlation_id
  ) values (
    'invitation', 'invitation.delivery_captured', v_user_id, v_circle_id,
    'circle_invitation', p_invitation_id, 'succeeded',
    jsonb_build_object('channel', 'synthetic_capture', 'domain', p_destination_domain),
    p_correlation_id
  );

  return v_capture_id;
end;
$$;

revoke all on function public.capture_invitation_delivery(uuid, text, text, uuid) from public, anon;
grant execute on function public.capture_invitation_delivery(uuid, text, text, uuid) to authenticated;

create or replace function public.cancel_circle_invitation(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_circle_id uuid;
  v_status text;
  v_correlation uuid := gen_random_uuid();
begin
  if p_invitation_id is null then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  select circle_id, status into v_circle_id, v_status
  from public.circle_invitations
  where id = p_invitation_id
  for update;
  if v_circle_id is null or not public.kinward_is_active_circle_head(v_circle_id, v_user_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  if v_status = 'cancelled' then
    return p_invitation_id;
  end if;
  if v_status <> 'pending' then
    raise exception using errcode = '22023', message = 'invalid_transition';
  end if;

  update public.circle_invitations
    set status = 'cancelled',
        cancelled_at = now(),
        token_digest = pg_catalog.encode(
          extensions.digest(
            pg_catalog.convert_to(gen_random_uuid()::text || clock_timestamp()::text, 'UTF8'),
            'sha256'
          ),
          'hex'
        ),
        version = version + 1
  where id = p_invitation_id;

  update public.invitation_proposed_assignments
    set status = 'cancelled', version = version + 1
  where invitation_id = p_invitation_id and status = 'proposed';

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, prior_state, next_state, correlation_id
  ) values (
    'invitation', 'invitation.cancelled', v_user_id, v_circle_id,
    'circle_invitation', p_invitation_id, 'succeeded',
    '{"status":"pending"}'::jsonb,
    '{"status":"cancelled"}'::jsonb,
    v_correlation
  );

  return p_invitation_id;
end;
$$;

revoke all on function public.cancel_circle_invitation(uuid) from public, anon;
grant execute on function public.cancel_circle_invitation(uuid) to authenticated;

create or replace function public.resend_circle_invitation(
  p_invitation_id uuid,
  p_token_digest text,
  p_idempotency_key uuid
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
  v_email_digest text;
  v_email_mask text;
  v_new_id uuid;
  v_existing uuid;
begin
  if p_invitation_id is null or p_idempotency_key is null
    or p_token_digest is null or p_token_digest !~ '^[0-9a-f]{64}$'
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  select invitation_id into v_existing
  from public.invitation_creation_requests
  where user_id = v_user_id and idempotency_key = p_idempotency_key
  for update;
  if v_existing is not null then
    return v_existing;
  end if;

  select circle_id, status, invited_email_digest, invited_email_mask
    into v_circle_id, v_status, v_email_digest, v_email_mask
  from public.circle_invitations
  where id = p_invitation_id
  for update;

  if v_circle_id is null or not public.kinward_is_active_circle_head(v_circle_id, v_user_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  if v_status = 'cancelled' then
    select replaced_by_invitation_id into v_new_id
    from public.circle_invitations
    where id = p_invitation_id;
    if v_new_id is not null then
      return v_new_id;
    end if;
  end if;
  if v_status <> 'pending' then
    raise exception using errcode = '22023', message = 'invalid_transition';
  end if;

  update public.circle_invitations
    set status = 'cancelled',
        cancelled_at = now(),
        token_digest = pg_catalog.encode(
          extensions.digest(
            pg_catalog.convert_to(gen_random_uuid()::text || clock_timestamp()::text, 'UTF8'),
            'sha256'
          ),
          'hex'
        ),
        version = version + 1
  where id = p_invitation_id;

  update public.invitation_proposed_assignments
    set status = 'cancelled', version = version + 1
  where invitation_id = p_invitation_id and status = 'proposed';

  insert into public.circle_invitations(
    circle_id, invited_email_digest, invited_email_mask, token_digest,
    inviter_user_id, status, expires_at
  ) values (
    v_circle_id, v_email_digest, v_email_mask, p_token_digest,
    v_user_id, 'pending', now() + interval '7 days'
  ) returning id into v_new_id;

  update public.circle_invitations
    set replaced_by_invitation_id = v_new_id
  where id = p_invitation_id;

  insert into public.invitation_proposed_assignments(
    invitation_id, circle_id, assignment_kind, role_code, status
  ) values (
    v_new_id, v_circle_id, 'circle_wide_role', 'family_coordinator', 'proposed'
  );

  insert into public.invitation_creation_requests(
    user_id, idempotency_key, circle_id, invited_email_digest, invitation_id
  ) values (
    v_user_id, p_idempotency_key, v_circle_id, v_email_digest, v_new_id
  );

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, prior_state, next_state, correlation_id
  ) values
    (
      'invitation', 'invitation.cancelled', v_user_id, v_circle_id,
      'circle_invitation', p_invitation_id, 'succeeded',
      '{"status":"pending"}'::jsonb,
      jsonb_build_object('status', 'cancelled', 'replaced_by', v_new_id),
      p_idempotency_key
    ),
    (
      'invitation', 'invitation.created', v_user_id, v_circle_id,
      'circle_invitation', v_new_id, 'succeeded',
      null,
      jsonb_build_object(
        'status', 'pending',
        'proposed_role', 'family_coordinator',
        'replaces', p_invitation_id
      ),
      p_idempotency_key
    );

  return v_new_id;
end;
$$;

revoke all on function public.resend_circle_invitation(uuid, text, uuid) from public, anon;
grant execute on function public.resend_circle_invitation(uuid, text, uuid) to authenticated;

create or replace function public.preview_circle_invitation(p_token_digest text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_invitation public.circle_invitations%rowtype;
  v_user_email text;
  v_user_digest text;
  v_circle_name text;
begin
  if p_token_digest is null or p_token_digest !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select * into v_invitation
  from public.circle_invitations
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
      'invitation', 'invitation.mismatch_denied', v_user_id, v_invitation.circle_id,
      'circle_invitation', v_invitation.id, 'denied',
      '{"reason":"identity_mismatch"}'::jsonb,
      gen_random_uuid()
    );
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  if v_invitation.status = 'pending' and v_invitation.expires_at <= now() then
    update public.circle_invitations
      set status = 'expired',
          token_digest = pg_catalog.encode(
            extensions.digest(
              pg_catalog.convert_to(gen_random_uuid()::text || clock_timestamp()::text, 'UTF8'),
              'sha256'
            ),
            'hex'
          ),
          version = version + 1
    where id = v_invitation.id and status = 'pending';

    update public.invitation_proposed_assignments
      set status = 'expired', version = version + 1
    where invitation_id = v_invitation.id and status = 'proposed';

    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, prior_state, next_state, correlation_id
    ) values (
      'invitation', 'invitation.expired', v_user_id, v_invitation.circle_id,
      'circle_invitation', v_invitation.id, 'succeeded',
      '{"status":"pending"}'::jsonb,
      '{"status":"expired"}'::jsonb,
      gen_random_uuid()
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

  return jsonb_build_object(
    'outcome', 'ready',
    'invitation_id', v_invitation.id,
    'circle_id', v_invitation.circle_id,
    'circle_name', v_circle_name,
    'proposed_role', 'family_coordinator',
    'expires_at', v_invitation.expires_at,
    'created_at', v_invitation.created_at
  );
end;
$$;

revoke all on function public.preview_circle_invitation(text) from public, anon;
grant execute on function public.preview_circle_invitation(text) to authenticated;

create or replace function public.accept_circle_invitation(p_token_digest text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_invitation public.circle_invitations%rowtype;
  v_user_email text;
  v_user_digest text;
  v_membership_id uuid;
  v_role_id uuid;
  v_assignment public.invitation_proposed_assignments%rowtype;
  v_correlation uuid := gen_random_uuid();
  v_created_membership boolean := false;
  v_activated_role boolean := false;
begin
  if p_token_digest is null or p_token_digest !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select * into v_invitation
  from public.circle_invitations
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
      'invitation', 'invitation.mismatch_denied', v_user_id, v_invitation.circle_id,
      'circle_invitation', v_invitation.id, 'denied',
      '{"reason":"identity_mismatch"}'::jsonb,
      v_correlation
    );
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  if v_invitation.status = 'accepted' and v_invitation.accepted_by_user_id = v_user_id then
    select id into v_membership_id
    from public.circle_memberships
    where circle_id = v_invitation.circle_id
      and user_id = v_user_id
      and status = 'active';
    return jsonb_build_object(
      'outcome', 'accepted',
      'circle_id', v_invitation.circle_id,
      'membership_id', v_membership_id,
      'idempotent', true
    );
  end if;

  if v_invitation.status = 'pending' and v_invitation.expires_at <= now() then
    update public.circle_invitations
      set status = 'expired',
          token_digest = pg_catalog.encode(
            extensions.digest(
              pg_catalog.convert_to(gen_random_uuid()::text || clock_timestamp()::text, 'UTF8'),
              'sha256'
            ),
            'hex'
          ),
          version = version + 1
    where id = v_invitation.id and status = 'pending';
    update public.invitation_proposed_assignments
      set status = 'expired', version = version + 1
    where invitation_id = v_invitation.id and status = 'proposed';
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, prior_state, next_state, correlation_id
    ) values (
      'invitation', 'invitation.expired', v_user_id, v_invitation.circle_id,
      'circle_invitation', v_invitation.id, 'succeeded',
      '{"status":"pending"}'::jsonb,
      '{"status":"expired"}'::jsonb,
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

  select id into v_membership_id
  from public.circle_memberships
  where circle_id = v_invitation.circle_id
    and user_id = v_user_id
    and status = 'active';

  if v_membership_id is null then
    insert into public.circle_memberships(circle_id, user_id)
    values (v_invitation.circle_id, v_user_id)
    returning id into v_membership_id;
    v_created_membership := true;
  end if;

  select * into v_assignment
  from public.invitation_proposed_assignments
  where invitation_id = v_invitation.id
    and status = 'proposed'
  for update;

  if found then
    select id into v_role_id
    from public.circle_role_assignments
    where circle_id = v_invitation.circle_id
      and membership_id = v_membership_id
      and role_code = v_assignment.role_code
      and status = 'active';

    if v_role_id is null then
      insert into public.circle_role_assignments(
        circle_id, membership_id, role_code, assigned_by_user_id
      ) values (
        v_invitation.circle_id, v_membership_id, v_assignment.role_code, v_invitation.inviter_user_id
      ) returning id into v_role_id;
      v_activated_role := true;
    end if;

    update public.invitation_proposed_assignments
      set status = 'activated',
          activated_at = now(),
          activated_role_assignment_id = v_role_id,
          version = version + 1
    where id = v_assignment.id;
  end if;

  update public.circle_invitations
    set status = 'accepted',
        accepted_at = now(),
        accepted_by_user_id = v_user_id,
        token_digest = pg_catalog.encode(
          extensions.digest(
            pg_catalog.convert_to(gen_random_uuid()::text || clock_timestamp()::text, 'UTF8'),
            'sha256'
          ),
          'hex'
        ),
        version = version + 1
  where id = v_invitation.id;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, prior_state, next_state, correlation_id
  ) values (
    'invitation', 'invitation.accepted', v_user_id, v_invitation.circle_id,
    'circle_invitation', v_invitation.id, 'succeeded',
    '{"status":"pending"}'::jsonb,
    '{"status":"accepted"}'::jsonb,
    v_correlation
  );

  if v_created_membership then
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, next_state, correlation_id
    ) values (
      'membership', 'membership.created', v_user_id, v_invitation.circle_id,
      'circle_membership', v_membership_id, 'succeeded',
      '{"status":"active","source":"invitation"}'::jsonb,
      v_correlation
    );
  end if;

  if v_activated_role then
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, next_state, correlation_id
    ) values (
      'authorization', 'circle_role.assigned', v_user_id, v_invitation.circle_id,
      'circle_membership', v_membership_id, 'succeeded',
      jsonb_build_object(
        'role_code', 'family_coordinator',
        'status', 'active',
        'source', 'invitation'
      ),
      v_correlation
    );
  end if;

  return jsonb_build_object(
    'outcome', 'accepted',
    'circle_id', v_invitation.circle_id,
    'membership_id', v_membership_id,
    'idempotent', false
  );
end;
$$;

revoke all on function public.accept_circle_invitation(text) from public, anon;
grant execute on function public.accept_circle_invitation(text) to authenticated;

create or replace function public.decline_circle_invitation(p_token_digest text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_invitation public.circle_invitations%rowtype;
  v_user_email text;
  v_user_digest text;
  v_correlation uuid := gen_random_uuid();
begin
  if p_token_digest is null or p_token_digest !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select * into v_invitation
  from public.circle_invitations
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
    update public.circle_invitations
      set status = 'expired',
          token_digest = pg_catalog.encode(
            extensions.digest(
              pg_catalog.convert_to(gen_random_uuid()::text || clock_timestamp()::text, 'UTF8'),
              'sha256'
            ),
            'hex'
          ),
          version = version + 1
    where id = v_invitation.id and status = 'pending';
    update public.invitation_proposed_assignments
      set status = 'expired', version = version + 1
    where invitation_id = v_invitation.id and status = 'proposed';
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, prior_state, next_state, correlation_id
    ) values (
      'invitation', 'invitation.expired', v_user_id, v_invitation.circle_id,
      'circle_invitation', v_invitation.id, 'succeeded',
      '{"status":"pending"}'::jsonb,
      '{"status":"expired"}'::jsonb,
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

  update public.circle_invitations
    set status = 'declined',
        declined_at = now(),
        token_digest = pg_catalog.encode(
          extensions.digest(
            pg_catalog.convert_to(gen_random_uuid()::text || clock_timestamp()::text, 'UTF8'),
            'sha256'
          ),
          'hex'
        ),
        version = version + 1
  where id = v_invitation.id;

  update public.invitation_proposed_assignments
    set status = 'declined', version = version + 1
  where invitation_id = v_invitation.id and status = 'proposed';

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, prior_state, next_state, correlation_id
  ) values (
    'invitation', 'invitation.declined', v_user_id, v_invitation.circle_id,
    'circle_invitation', v_invitation.id, 'succeeded',
    '{"status":"pending"}'::jsonb,
    '{"status":"declined"}'::jsonb,
    v_correlation
  );

  return jsonb_build_object('outcome', 'declined', 'idempotent', false);
end;
$$;

revoke all on function public.decline_circle_invitation(text) from public, anon;
grant execute on function public.decline_circle_invitation(text) to authenticated;

create or replace function public.list_pending_circle_invitations(p_circle_id uuid)
returns table (
  invitation_id uuid,
  invited_email_mask text,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  proposed_role text
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
    invitation.id,
    invitation.invited_email_mask,
    invitation.status,
    invitation.created_at,
    invitation.expires_at,
    'family_coordinator'::text
  from public.circle_invitations invitation
  where invitation.circle_id = p_circle_id
    and invitation.status = 'pending'
    and invitation.expires_at > now()
  order by invitation.created_at desc;
end;
$$;

revoke all on function public.list_pending_circle_invitations(uuid) from public, anon;
grant execute on function public.list_pending_circle_invitations(uuid) to authenticated;

create or replace function public.get_pending_circle_invitation(
  p_circle_id uuid,
  p_invitation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_row public.circle_invitations%rowtype;
begin
  if p_circle_id is null or p_invitation_id is null
    or not public.kinward_is_active_circle_head(p_circle_id, v_user_id)
  then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select * into v_row
  from public.circle_invitations
  where id = p_invitation_id and circle_id = p_circle_id;

  if not found then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  if v_row.status = 'pending' and v_row.expires_at <= now() then
    return jsonb_build_object('outcome', 'not_pending');
  end if;
  if v_row.status <> 'pending' then
    return jsonb_build_object('outcome', 'not_pending');
  end if;

  return jsonb_build_object(
    'outcome', 'pending',
    'invitation_id', v_row.id,
    'invited_email_mask', v_row.invited_email_mask,
    'status', v_row.status,
    'created_at', v_row.created_at,
    'expires_at', v_row.expires_at,
    'proposed_role', 'family_coordinator',
    'care_recipient_access', 'none'
  );
end;
$$;

revoke all on function public.get_pending_circle_invitation(uuid, uuid) from public, anon;
grant execute on function public.get_pending_circle_invitation(uuid, uuid) to authenticated;

create or replace function public.list_my_pending_invitations()
returns table (
  invitation_id uuid,
  circle_id uuid,
  circle_name text,
  proposed_role text,
  expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_digest text;
begin
  select public.kinward_email_digest(email) into v_digest
  from auth.users where id = v_user_id;

  return query
  select
    invitation.id,
    invitation.circle_id,
    circle.display_name,
    'family_coordinator'::text,
    invitation.expires_at,
    invitation.created_at
  from public.circle_invitations invitation
  join public.family_circles circle on circle.id = invitation.circle_id
  where invitation.invited_email_digest = v_digest
    and invitation.status = 'pending'
    and invitation.expires_at > now()
    and circle.status = 'active'
  order by invitation.created_at desc;
end;
$$;

revoke all on function public.list_my_pending_invitations() from public, anon;
grant execute on function public.list_my_pending_invitations() to authenticated;

create or replace function public.preview_my_circle_invitation(p_invitation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public.kinward_require_verified_active_adult();
  v_invitation public.circle_invitations%rowtype;
  v_digest text;
  v_circle_name text;
begin
  if p_invitation_id is null then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select public.kinward_email_digest(email) into v_digest
  from auth.users where id = v_user_id;

  select * into v_invitation
  from public.circle_invitations
  where id = p_invitation_id
  for update;

  if not found or v_invitation.invited_email_digest is distinct from v_digest then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  if v_invitation.status = 'pending' and v_invitation.expires_at <= now() then
    update public.circle_invitations
      set status = 'expired',
          token_digest = pg_catalog.encode(
            extensions.digest(
              pg_catalog.convert_to(gen_random_uuid()::text || clock_timestamp()::text, 'UTF8'),
              'sha256'
            ),
            'hex'
          ),
          version = version + 1
    where id = v_invitation.id and status = 'pending';
    update public.invitation_proposed_assignments
      set status = 'expired', version = version + 1
    where invitation_id = v_invitation.id and status = 'proposed';
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, prior_state, next_state, correlation_id
    ) values (
      'invitation', 'invitation.expired', v_user_id, v_invitation.circle_id,
      'circle_invitation', v_invitation.id, 'succeeded',
      '{"status":"pending"}'::jsonb,
      '{"status":"expired"}'::jsonb,
      gen_random_uuid()
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

  select display_name into v_circle_name
  from public.family_circles where id = v_invitation.circle_id;

  return jsonb_build_object(
    'outcome', 'ready',
    'invitation_id', v_invitation.id,
    'circle_id', v_invitation.circle_id,
    'circle_name', v_circle_name,
    'proposed_role', 'family_coordinator',
    'expires_at', v_invitation.expires_at,
    'created_at', v_invitation.created_at
  );
end;
$$;

revoke all on function public.preview_my_circle_invitation(uuid) from public, anon;
grant execute on function public.preview_my_circle_invitation(uuid) to authenticated;

create or replace function public.decline_my_circle_invitation(p_invitation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_digest text;
  v_token text;
begin
  if p_invitation_id is null then
    return jsonb_build_object('outcome', 'unavailable');
  end if;
  perform public.kinward_require_verified_active_adult();
  select public.kinward_email_digest(email) into v_digest
  from auth.users where id = auth.uid();
  select token_digest into v_token
  from public.circle_invitations
  where id = p_invitation_id
    and invited_email_digest = v_digest
    and status = 'pending';
  if v_token is null then
    return public.preview_my_circle_invitation(p_invitation_id);
  end if;
  return public.decline_circle_invitation(v_token);
end;
$$;

revoke all on function public.decline_my_circle_invitation(uuid) from public, anon;
grant execute on function public.decline_my_circle_invitation(uuid) to authenticated;
