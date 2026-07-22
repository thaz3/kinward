-- Slice 9: Shared Management completion and Delegated Pending grant/scope foundation.
-- GOV-008: Screens 18–20 only. Pending delegated grants grant zero authority.
-- No expiration, until-revoked, delegated consent/acceptance, activation, or lifecycle.

create table public.management_permission_definitions (
  permission_code text primary key check (permission_code in (
    'recipient.manage_roles',
    'recipient.review_permissions'
  )),
  display_name text not null unique,
  purpose text not null,
  boundary text not null,
  catalog_version text not null default 'kinward.management_scopes.v1'
);

insert into public.management_permission_definitions(
  permission_code, display_name, purpose, boundary
) values
  (
    'recipient.manage_roles',
    'Manage roles',
    'Assign, suspend, or remove exact-Care-Recipient coordination roles.',
    'Creates no ownership, legal authority, or cross-recipient access.'
  ),
  (
    'recipient.review_permissions',
    'Review permissions',
    'Review the Care Recipient permission and role summary for that recipient only.',
    'Creates no ownership change, grant expansion, or medical authority.'
  );

create table public.shared_management_grants (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.family_circles(id),
  care_recipient_id uuid not null references public.care_recipients(id),
  grantor_user_id uuid not null references auth.users(id),
  grantee_membership_id uuid not null,
  status text not null default 'active' check (status in (
    'pending', 'active', 'suspended', 'expired', 'revoked', 'disputed'
  )),
  selection_mode text not null check (selection_mode in ('selected', 'all_current')),
  catalog_version text not null default 'kinward.management_scopes.v1',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  suspended_at timestamptz,
  revoked_at timestamptz,
  consent_id uuid,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (circle_id, care_recipient_id)
    references public.care_recipients(circle_id, id),
  foreign key (circle_id, grantee_membership_id)
    references public.circle_memberships(circle_id, id),
  constraint shared_grant_active_window check (
    (status = 'active' and revoked_at is null and suspended_at is null)
    or status <> 'active'
  )
);

create unique index shared_grants_one_active_grantee
  on public.shared_management_grants(care_recipient_id, grantee_membership_id)
  where status = 'active';
create index shared_grants_exact_scope
  on public.shared_management_grants(circle_id, care_recipient_id, status);

create table public.delegated_management_grants (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.family_circles(id),
  care_recipient_id uuid not null references public.care_recipients(id),
  grantor_user_id uuid not null references auth.users(id),
  representative_membership_id uuid not null,
  status text not null default 'pending' check (status in (
    'pending', 'active', 'suspended', 'expired', 'revoked', 'disputed'
  )),
  selection_mode text not null check (selection_mode in ('selected', 'all_current')),
  catalog_version text not null default 'kinward.management_scopes.v1',
  starts_at timestamptz,
  expires_at timestamptz,
  next_review_at timestamptz,
  consent_id uuid,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (circle_id, care_recipient_id)
    references public.care_recipients(circle_id, id),
  foreign key (circle_id, representative_membership_id)
    references public.circle_memberships(circle_id, id),
  constraint delegated_pending_has_no_activation check (
    (status = 'pending' and starts_at is null and expires_at is null
      and next_review_at is null and consent_id is null)
    or status <> 'pending'
  )
);

create unique index delegated_grants_one_pending_or_active
  on public.delegated_management_grants(care_recipient_id, representative_membership_id)
  where status in ('pending', 'active');
create index delegated_grants_exact_scope
  on public.delegated_management_grants(circle_id, care_recipient_id, status);

create table public.management_grant_scopes (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.family_circles(id),
  care_recipient_id uuid not null references public.care_recipients(id),
  grant_type text not null check (grant_type in ('shared', 'delegated')),
  grant_id uuid not null,
  permission_code text not null
    references public.management_permission_definitions(permission_code),
  catalog_version text not null default 'kinward.management_scopes.v1',
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  foreign key (circle_id, care_recipient_id)
    references public.care_recipients(circle_id, id),
  constraint management_grant_scope_lifecycle check (
    (status = 'active' and removed_at is null)
    or (status = 'removed' and removed_at is not null)
  )
);

create unique index management_grant_scopes_one_active
  on public.management_grant_scopes(grant_type, grant_id, permission_code)
  where status = 'active';
create index management_grant_scopes_lookup
  on public.management_grant_scopes(circle_id, care_recipient_id, grant_type, grant_id, status);

-- Extend Slice 5 consent ledger for Shared grant confirmation. Delegated consent
-- kinds are allowed in schema only; Slice 9 does not write them.
alter table public.consent_records
  drop constraint if exists consent_records_consent_kind_check;
alter table public.consent_records
  add constraint consent_records_consent_kind_check check (consent_kind in (
    'care_recipient_ownership',
    'shared_management_grant',
    'delegated_management_grant',
    'delegated_representative_acceptance'
  ));
alter table public.consent_records
  add column if not exists target_type text;
alter table public.consent_records
  add column if not exists target_id uuid;

alter table public.shared_management_grants
  add constraint shared_management_grants_consent_fk
  foreign key (consent_id) references public.consent_records(id);
alter table public.delegated_management_grants
  add constraint delegated_management_grants_consent_fk
  foreign key (consent_id) references public.consent_records(id);

create table public.management_grant_mutation_requests (
  actor_user_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  operation text not null check (operation in (
    'create_shared', 'create_pending_delegated'
  )),
  input_fingerprint text not null check (input_fingerprint ~ '^[0-9a-f]{64}$'),
  result jsonb,
  created_at timestamptz not null default now(),
  primary key (actor_user_id, idempotency_key)
);

alter table public.management_permission_definitions enable row level security;
alter table public.shared_management_grants enable row level security;
alter table public.delegated_management_grants enable row level security;
alter table public.management_grant_scopes enable row level security;
alter table public.management_grant_mutation_requests enable row level security;

revoke all on public.management_permission_definitions,
  public.shared_management_grants,
  public.delegated_management_grants,
  public.management_grant_scopes,
  public.management_grant_mutation_requests
  from public, anon, authenticated;

create or replace function public.can_manage_management_grants(
  p_circle_id uuid, p_care_recipient_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_actor uuid;
begin
  v_actor := public.kinward_require_verified_active_adult();
  return exists (
    select 1 from public.care_recipients recipient
    join public.circle_memberships membership
      on membership.circle_id = recipient.circle_id
     and membership.user_id = v_actor
    where recipient.id = p_care_recipient_id
      and recipient.circle_id = p_circle_id
      and recipient.status = 'active'
      and recipient.owner_user_id = v_actor
      and membership.status = 'active'
  );
exception when others then return false;
end;
$$;

revoke all on function public.can_manage_management_grants(uuid, uuid) from public, anon;
grant execute on function public.can_manage_management_grants(uuid, uuid) to authenticated;

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
  select exists (
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
      and p_permission_code in (
        'recipient.manage_roles', 'recipient.review_permissions'
      )
  );
$$;

revoke all on function public.kinward_has_management_scope(uuid, uuid, uuid, text)
  from public, anon, authenticated;

-- Owners retain role management; active Shared "Manage roles" also qualifies.
-- Pending delegated grants never contribute.
create or replace function public.can_manage_recipient_roles(
  p_circle_id uuid, p_care_recipient_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_actor uuid;
begin
  v_actor := public.kinward_require_verified_active_adult();
  if exists (
    select 1 from public.care_recipients recipient
    join public.circle_memberships membership
      on membership.circle_id = recipient.circle_id
     and membership.user_id = v_actor
    where recipient.id = p_care_recipient_id
      and recipient.circle_id = p_circle_id
      and recipient.status = 'active'
      and recipient.owner_user_id = v_actor
      and membership.status = 'active'
  ) then
    return true;
  end if;
  return public.kinward_has_management_scope(
    p_circle_id, p_care_recipient_id, v_actor, 'recipient.manage_roles'
  );
exception when others then return false;
end;
$$;

create or replace function public.list_management_grant_members(
  p_circle_id uuid, p_care_recipient_id uuid
)
returns table (
  membership_id uuid,
  display_name text,
  is_current_actor boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_actor uuid := public.kinward_require_verified_active_adult();
begin
  if not public.can_manage_management_grants(p_circle_id, p_care_recipient_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  return query
  select membership.id,
    coalesce(
      nullif(membership.display_name_override, ''),
      nullif(profile.preferred_display_name, ''),
      'Circle member'
    ),
    membership.user_id = v_actor
  from public.circle_memberships membership
  join public.user_profiles profile on profile.user_id = membership.user_id
  join auth.users account on account.id = membership.user_id
  where membership.circle_id = p_circle_id
    and membership.status = 'active'
    and profile.account_status = 'active'
    and account.email_confirmed_at is not null
    and membership.user_id <> v_actor
  order by 2, membership.id;
end;
$$;

revoke all on function public.list_management_grant_members(uuid, uuid) from public, anon;
grant execute on function public.list_management_grant_members(uuid, uuid) to authenticated;

create or replace function public.list_shared_management_grants(
  p_circle_id uuid, p_care_recipient_id uuid
)
returns table (
  grant_id uuid,
  membership_id uuid,
  display_name text,
  grant_status text,
  selection_mode text,
  permission_code text,
  grant_version bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_management_grants(p_circle_id, p_care_recipient_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  return query
  select grant_row.id,
    grant_row.grantee_membership_id,
    coalesce(
      nullif(membership.display_name_override, ''),
      nullif(profile.preferred_display_name, ''),
      'Circle member'
    ),
    grant_row.status,
    grant_row.selection_mode,
    scope_row.permission_code,
    grant_row.version
  from public.shared_management_grants grant_row
  join public.circle_memberships membership
    on membership.id = grant_row.grantee_membership_id
  join public.user_profiles profile on profile.user_id = membership.user_id
  left join public.management_grant_scopes scope_row
    on scope_row.grant_type = 'shared'
   and scope_row.grant_id = grant_row.id
   and scope_row.status = 'active'
  where grant_row.circle_id = p_circle_id
    and grant_row.care_recipient_id = p_care_recipient_id
    and grant_row.status = 'active'
  order by 3, grant_row.id, scope_row.permission_code;
end;
$$;

revoke all on function public.list_shared_management_grants(uuid, uuid) from public, anon;
grant execute on function public.list_shared_management_grants(uuid, uuid) to authenticated;

create or replace function public.create_shared_management_grant(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_membership_id uuid,
  p_permission_codes text[],
  p_selection_mode text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_fingerprint text;
  v_existing_fingerprint text;
  v_existing_result jsonb;
  v_grant_id uuid;
  v_consent_id uuid;
  v_code text;
  v_codes text[];
  v_result jsonb;
begin
  if p_idempotency_key is null
    or p_selection_mode not in ('selected', 'all_current')
    or p_permission_codes is null
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  if coalesce((auth.jwt() ->> 'iat')::bigint, 0)
     < extract(epoch from now() - interval '15 minutes')::bigint then
    raise exception using errcode = '42501', message = 'recent_authentication_required';
  end if;

  -- Normalize and validate scopes before any durable write.
  select array_agg(distinct code order by code) into v_codes
  from unnest(p_permission_codes) as code;
  if v_codes is null or cardinality(v_codes) = 0 then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if exists (
    select 1 from unnest(v_codes) as code
    where code not in ('recipient.manage_roles', 'recipient.review_permissions')
       or code = 'recipient.change_ownership'
       or code = '*'
  ) then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if p_selection_mode = 'all_current'
    and (
      cardinality(v_codes) <> 2
      or not ('recipient.manage_roles' = any (v_codes))
      or not ('recipient.review_permissions' = any (v_codes))
    )
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

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
      and mode.mode_code = 'shared_management'
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  perform 1 from public.circle_memberships membership
    join public.user_profiles profile on profile.user_id = membership.user_id
    join auth.users account on account.id = membership.user_id
    where membership.id = p_membership_id
      and membership.circle_id = p_circle_id
      and membership.status = 'active'
      and profile.account_status = 'active'
      and account.email_confirmed_at is not null
      and membership.user_id <> v_actor
    for update of membership;
  if not found then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  v_fingerprint := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    p_circle_id::text || ':' || p_care_recipient_id::text || ':'
      || p_membership_id::text || ':' || p_selection_mode || ':'
      || array_to_string(v_codes, ','),
    'UTF8'), 'sha256'), 'hex');

  insert into public.management_grant_mutation_requests(
    actor_user_id, idempotency_key, operation, input_fingerprint
  ) values (v_actor, p_idempotency_key, 'create_shared', v_fingerprint)
  on conflict do nothing;

  select input_fingerprint, result into v_existing_fingerprint, v_existing_result
    from public.management_grant_mutation_requests
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key
    for update;
  if v_existing_fingerprint <> v_fingerprint then
    raise exception using errcode = '22023', message = 'idempotency_conflict';
  end if;
  if v_existing_result is not null then
    return v_existing_result;
  end if;

  if exists (
    select 1 from public.shared_management_grants
    where care_recipient_id = p_care_recipient_id
      and grantee_membership_id = p_membership_id
      and status = 'active'
  ) then
    raise exception using errcode = '55000', message = 'stale_state';
  end if;

  insert into public.shared_management_grants(
    circle_id, care_recipient_id, grantor_user_id, grantee_membership_id,
    status, selection_mode
  ) values (
    p_circle_id, p_care_recipient_id, v_actor, p_membership_id,
    'active', p_selection_mode
  ) returning id into v_grant_id;

  insert into public.consent_records(
    circle_id, care_recipient_id, user_id, consent_kind, consent_version,
    decision, target_type, target_id, correlation_id
  ) values (
    p_circle_id, p_care_recipient_id, v_actor, 'shared_management_grant',
    'kinward.shared_grant_consent.v1', 'accepted',
    'shared_management_grant', v_grant_id, p_idempotency_key
  ) returning id into v_consent_id;

  update public.shared_management_grants
    set consent_id = v_consent_id, updated_at = now()
    where id = v_grant_id;

  foreach v_code in array v_codes loop
    insert into public.management_grant_scopes(
      circle_id, care_recipient_id, grant_type, grant_id, permission_code
    ) values (
      p_circle_id, p_care_recipient_id, 'shared', v_grant_id, v_code
    );
  end loop;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, next_state, correlation_id
  ) values (
    'authorization', 'shared_grant.created', v_actor, p_circle_id,
    p_care_recipient_id, 'shared_management_grant', v_grant_id, 'succeeded',
    jsonb_build_object(
      'status', 'active',
      'selection_mode', p_selection_mode,
      'permission_codes', to_jsonb(v_codes)
    ),
    p_idempotency_key
  );

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, next_state, correlation_id
  ) values (
    'authorization', 'permission_scopes.recorded', v_actor, p_circle_id,
    p_care_recipient_id, 'shared_management_grant', v_grant_id, 'succeeded',
    jsonb_build_object(
      'catalog_version', 'kinward.management_scopes.v1',
      'permission_codes', to_jsonb(v_codes),
      'selection_mode', p_selection_mode
    ),
    p_idempotency_key
  );

  v_result := jsonb_build_object(
    'grant_id', v_grant_id,
    'status', 'active',
    'selection_mode', p_selection_mode,
    'permission_codes', to_jsonb(v_codes)
  );
  update public.management_grant_mutation_requests
    set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.create_shared_management_grant(
  uuid, uuid, uuid, text[], text, uuid
) from public, anon;
grant execute on function public.create_shared_management_grant(
  uuid, uuid, uuid, text[], text, uuid
) to authenticated;

create or replace function public.create_pending_delegated_grant(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_membership_id uuid,
  p_permission_codes text[],
  p_selection_mode text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_fingerprint text;
  v_existing_fingerprint text;
  v_existing_result jsonb;
  v_grant_id uuid;
  v_code text;
  v_codes text[];
  v_result jsonb;
begin
  if p_idempotency_key is null
    or p_selection_mode not in ('selected', 'all_current')
    or p_permission_codes is null
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  if coalesce((auth.jwt() ->> 'iat')::bigint, 0)
     < extract(epoch from now() - interval '15 minutes')::bigint then
    raise exception using errcode = '42501', message = 'recent_authentication_required';
  end if;

  select array_agg(distinct code order by code) into v_codes
  from unnest(p_permission_codes) as code;
  if v_codes is null or cardinality(v_codes) = 0 then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if exists (
    select 1 from unnest(v_codes) as code
    where code not in ('recipient.manage_roles', 'recipient.review_permissions')
       or code in ('recipient.change_ownership', '*')
  ) then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if p_selection_mode = 'all_current'
    and (
      cardinality(v_codes) <> 2
      or not ('recipient.manage_roles' = any (v_codes))
      or not ('recipient.review_permissions' = any (v_codes))
    )
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

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

  perform 1 from public.circle_memberships membership
    join public.user_profiles profile on profile.user_id = membership.user_id
    join auth.users account on account.id = membership.user_id
    where membership.id = p_membership_id
      and membership.circle_id = p_circle_id
      and membership.status = 'active'
      and profile.account_status = 'active'
      and account.email_confirmed_at is not null
      and membership.user_id <> v_actor
    for update of membership;
  if not found then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  v_fingerprint := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    p_circle_id::text || ':' || p_care_recipient_id::text || ':'
      || p_membership_id::text || ':' || p_selection_mode || ':'
      || array_to_string(v_codes, ','),
    'UTF8'), 'sha256'), 'hex');

  insert into public.management_grant_mutation_requests(
    actor_user_id, idempotency_key, operation, input_fingerprint
  ) values (
    v_actor, p_idempotency_key, 'create_pending_delegated', v_fingerprint
  ) on conflict do nothing;

  select input_fingerprint, result into v_existing_fingerprint, v_existing_result
    from public.management_grant_mutation_requests
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key
    for update;
  if v_existing_fingerprint <> v_fingerprint then
    raise exception using errcode = '22023', message = 'idempotency_conflict';
  end if;
  if v_existing_result is not null then
    return v_existing_result;
  end if;

  if exists (
    select 1 from public.delegated_management_grants
    where care_recipient_id = p_care_recipient_id
      and representative_membership_id = p_membership_id
      and status in ('pending', 'active')
  ) then
    raise exception using errcode = '55000', message = 'stale_state';
  end if;

  insert into public.delegated_management_grants(
    circle_id, care_recipient_id, grantor_user_id,
    representative_membership_id, status, selection_mode
  ) values (
    p_circle_id, p_care_recipient_id, v_actor,
    p_membership_id, 'pending', p_selection_mode
  ) returning id into v_grant_id;

  foreach v_code in array v_codes loop
    insert into public.management_grant_scopes(
      circle_id, care_recipient_id, grant_type, grant_id, permission_code
    ) values (
      p_circle_id, p_care_recipient_id, 'delegated', v_grant_id, v_code
    );
  end loop;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, next_state, correlation_id
  ) values (
    'authorization', 'delegation.created', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', v_grant_id, 'succeeded',
    jsonb_build_object(
      'status', 'pending',
      'selection_mode', p_selection_mode,
      'permission_codes', to_jsonb(v_codes)
    ),
    p_idempotency_key
  );

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, next_state, correlation_id
  ) values (
    'authorization', 'permission_scopes.recorded', v_actor, p_circle_id,
    p_care_recipient_id, 'delegated_management_grant', v_grant_id, 'succeeded',
    jsonb_build_object(
      'catalog_version', 'kinward.management_scopes.v1',
      'permission_codes', to_jsonb(v_codes),
      'selection_mode', p_selection_mode,
      'status', 'pending'
    ),
    p_idempotency_key
  );

  v_result := jsonb_build_object(
    'grant_id', v_grant_id,
    'status', 'pending',
    'selection_mode', p_selection_mode,
    'permission_codes', to_jsonb(v_codes),
    'next_step', 'duration'
  );
  update public.management_grant_mutation_requests
    set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.create_pending_delegated_grant(
  uuid, uuid, uuid, text[], text, uuid
) from public, anon;
grant execute on function public.create_pending_delegated_grant(
  uuid, uuid, uuid, text[], text, uuid
) to authenticated;
