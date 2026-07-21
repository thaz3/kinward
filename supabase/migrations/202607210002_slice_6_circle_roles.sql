-- Slice 6: governed Circle-wide roles for synthetic Milestone One.
-- New Circle Head assignment remains intentionally unavailable pending an
-- approved verified-adult proposal-and-acceptance workflow.

create table public.circle_role_definitions (
  role_code text primary key check (role_code in ('circle_head', 'family_coordinator')),
  display_name text not null,
  purpose text not null,
  boundary text not null
);

insert into public.circle_role_definitions(role_code, display_name, purpose, boundary)
values
  ('circle_head', 'Circle Head', 'Manages approved shared Circle administration.', 'Grants no Care Recipient, medical, management, delegation, backup, or legal authority.'),
  ('family_coordinator', 'Family Coordinator', 'Coordinates approved non-medical Circle organization.', 'Cannot assign roles or access any Care Recipient through this role.');

create table public.circle_role_permissions (
  role_code text not null references public.circle_role_definitions(role_code),
  permission_code text not null check (permission_code in (
    'circle.roles.view', 'circle.roles.manage_family_coordinator'
  )),
  primary key (role_code, permission_code)
);

insert into public.circle_role_permissions(role_code, permission_code)
values
  ('circle_head', 'circle.roles.view'),
  ('circle_head', 'circle.roles.manage_family_coordinator'),
  ('family_coordinator', 'circle.roles.view');

create table public.circle_role_restrictions (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.family_circles(id),
  membership_id uuid not null,
  permission_code text not null check (permission_code in (
    'circle.roles.view', 'circle.roles.manage_family_coordinator'
  )),
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  foreign key (circle_id, membership_id)
    references public.circle_memberships(circle_id, id),
  constraint circle_role_restrictions_lifecycle check (
    (status = 'active' and removed_at is null)
    or (status = 'removed' and removed_at is not null)
  )
);

create unique index circle_role_restrictions_one_active
  on public.circle_role_restrictions(circle_id, membership_id, permission_code)
  where status = 'active';

alter table public.circle_role_definitions enable row level security;
alter table public.circle_role_permissions enable row level security;
alter table public.circle_role_restrictions enable row level security;
revoke all on public.circle_role_definitions, public.circle_role_permissions,
  public.circle_role_restrictions from public, anon, authenticated;

alter table public.circle_role_assignments
  add column updated_at timestamptz not null default now(),
  add column changed_by_user_id uuid references auth.users(id),
  add constraint circle_role_assignments_lifecycle_times check (
    (status = 'active' and ends_at is null)
    or (status in ('suspended', 'expired', 'removed') and ends_at is not null)
  );

create index circle_role_assignments_circle_status_role
  on public.circle_role_assignments(circle_id, status, role_code);

create table public.circle_role_mutation_requests (
  actor_user_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  operation text not null check (operation in ('assign_family_coordinator', 'suspend', 'remove')),
  input_fingerprint text not null check (input_fingerprint ~ '^[0-9a-f]{64}$'),
  result jsonb,
  created_at timestamptz not null default now(),
  primary key (actor_user_id, idempotency_key)
);

alter table public.circle_role_mutation_requests enable row level security;
revoke all on public.circle_role_mutation_requests from public, anon, authenticated;

create or replace function public.kinward_has_circle_permission(
  p_circle_id uuid,
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
      'circle.roles.view', 'circle.roles.manage_family_coordinator'
    ) and exists (
    select 1
    from public.circle_memberships membership
    join public.circle_role_assignments assignment
      on assignment.circle_id = membership.circle_id
     and assignment.membership_id = membership.id
    join public.circle_role_permissions permission
      on permission.role_code = assignment.role_code
    where membership.circle_id = p_circle_id
      and membership.user_id = p_user_id
      and membership.status = 'active'
      and assignment.status = 'active'
      and assignment.starts_at <= now()
      and assignment.ends_at is null
      and permission.permission_code = p_permission_code
  ) and not exists (
    select 1
    from public.circle_memberships membership
    join public.circle_role_restrictions restriction
      on restriction.circle_id = membership.circle_id
     and restriction.membership_id = membership.id
    where membership.circle_id = p_circle_id
      and membership.user_id = p_user_id
      and restriction.permission_code = p_permission_code
      and restriction.status = 'active'
  );
$$;

revoke all on function public.kinward_has_circle_permission(uuid, uuid, text)
  from public, anon, authenticated;

create or replace function public.list_circle_role_members(p_circle_id uuid)
returns table (
  membership_id uuid,
  display_name text,
  assignment_id uuid,
  role_code text,
  role_status text,
  assignment_version bigint,
  is_current_actor boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
begin
  if not public.kinward_has_circle_permission(
    p_circle_id, v_actor, 'circle.roles.view'
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  return query
  select membership.id,
    coalesce(nullif(membership.display_name_override, ''), nullif(profile.preferred_display_name, ''), 'Circle member'),
    assignment.id, assignment.role_code, assignment.status, assignment.version,
    membership.user_id = v_actor
  from public.circle_memberships membership
  join public.user_profiles profile on profile.user_id = membership.user_id
  left join public.circle_role_assignments assignment
    on assignment.circle_id = membership.circle_id
   and assignment.membership_id = membership.id
   and assignment.status in ('active', 'suspended')
  where membership.circle_id = p_circle_id
    and membership.status = 'active'
    and profile.account_status = 'active'
  order by display_name, membership.id, assignment.role_code;
end;
$$;

revoke all on function public.list_circle_role_members(uuid) from public, anon;
grant execute on function public.list_circle_role_members(uuid) to authenticated;

-- A data-free authorization boundary for routes and services. This deliberately
-- returns only a boolean and never exposes Circle or member attributes.
create or replace function public.can_view_circle_roles(p_circle_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
begin
  v_actor := public.kinward_require_verified_active_adult();
  return public.kinward_has_circle_permission(
    p_circle_id, v_actor, 'circle.roles.view'
  );
exception when others then
  return false;
end;
$$;

revoke all on function public.can_view_circle_roles(uuid) from public, anon;
grant execute on function public.can_view_circle_roles(uuid) to authenticated;

create or replace function public.assign_family_coordinator(
  p_circle_id uuid,
  p_membership_id uuid,
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
  v_assignment_id uuid;
  v_result jsonb;
begin
  if p_circle_id is null or p_membership_id is null or p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if not public.kinward_has_circle_permission(p_circle_id, v_actor, 'circle.roles.manage_family_coordinator') then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  if exists (
    select 1 from public.circle_memberships
    where id = p_membership_id and user_id = v_actor
  ) then
    raise exception using errcode = '42501', message = 'self_escalation_denied';
  end if;
  perform 1
  from public.circle_memberships membership
  join public.user_profiles profile on profile.user_id = membership.user_id
  join auth.users account on account.id = membership.user_id
  where membership.id = p_membership_id
    and membership.circle_id = p_circle_id
    and membership.status = 'active'
    and profile.account_status = 'active'
    and account.email_confirmed_at is not null
  for update of membership;
  if not found then raise exception using errcode = '42501', message = 'not_authorized'; end if;

  v_fingerprint := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(p_circle_id::text || ':' || p_membership_id::text || ':family_coordinator', 'UTF8'), 'sha256'), 'hex');
  insert into public.circle_role_mutation_requests(actor_user_id, idempotency_key, operation, input_fingerprint)
  values (v_actor, p_idempotency_key, 'assign_family_coordinator', v_fingerprint)
  on conflict do nothing;
  select input_fingerprint, result into v_existing_fingerprint, v_existing_result
  from public.circle_role_mutation_requests
  where actor_user_id = v_actor and idempotency_key = p_idempotency_key for update;
  if v_existing_fingerprint <> v_fingerprint then
    raise exception using errcode = '22023', message = 'idempotency_conflict';
  end if;
  if v_existing_result is not null then return v_existing_result; end if;

  select id into v_assignment_id from public.circle_role_assignments
  where circle_id = p_circle_id and membership_id = p_membership_id
    and role_code = 'family_coordinator'
  order by updated_at desc, id desc
  limit 1 for update;
  if v_assignment_id is null then
    insert into public.circle_role_assignments(
      circle_id, membership_id, role_code, assigned_by_user_id, changed_by_user_id
    ) values (p_circle_id, p_membership_id, 'family_coordinator', v_actor, v_actor)
    returning id into v_assignment_id;
    insert into public.audit_events(event_class, event_type, actor_user_id, circle_id,
      target_type, target_id, result, next_state, correlation_id)
    values ('authorization', 'circle_role.assigned', v_actor, p_circle_id,
      'circle_role_assignment', v_assignment_id, 'succeeded',
      '{"role_code":"family_coordinator","status":"active"}'::jsonb, p_idempotency_key);
  elsif not exists (
    select 1 from public.circle_role_assignments
    where id = v_assignment_id and status = 'active'
  ) then
    raise exception using errcode = '55000', message = 'role_lifecycle_closed';
  end if;
  v_result := jsonb_build_object('assignment_id', v_assignment_id, 'status', 'active');
  update public.circle_role_mutation_requests set result = v_result
  where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.assign_family_coordinator(uuid, uuid, uuid) from public, anon;
grant execute on function public.assign_family_coordinator(uuid, uuid, uuid) to authenticated;

create or replace function public.transition_circle_role(
  p_assignment_id uuid,
  p_operation text,
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
  v_assignment public.circle_role_assignments%rowtype;
  v_fingerprint text;
  v_existing_fingerprint text;
  v_existing_result jsonb;
  v_result jsonb;
  v_active_heads int;
  v_status text;
begin
  if p_assignment_id is null or p_idempotency_key is null
    or p_operation not in ('suspend', 'remove') or p_expected_version is null then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if coalesce((auth.jwt() ->> 'iat')::bigint, 0) < extract(epoch from now() - interval '15 minutes')::bigint then
    raise exception using errcode = '42501', message = 'recent_authentication_required';
  end if;
  select * into v_assignment from public.circle_role_assignments
  where id = p_assignment_id for update;
  if v_assignment.id is null
    or not public.kinward_has_circle_permission(v_assignment.circle_id, v_actor, 'circle.roles.manage_family_coordinator') then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  v_fingerprint := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(p_assignment_id::text || ':' || p_operation || ':' || p_expected_version::text, 'UTF8'),
    'sha256'), 'hex');
  insert into public.circle_role_mutation_requests(actor_user_id, idempotency_key, operation, input_fingerprint)
  values (v_actor, p_idempotency_key, p_operation, v_fingerprint)
  on conflict do nothing;
  select input_fingerprint, result into v_existing_fingerprint, v_existing_result
  from public.circle_role_mutation_requests
  where actor_user_id = v_actor and idempotency_key = p_idempotency_key for update;
  if v_existing_fingerprint <> v_fingerprint then
    raise exception using errcode = '22023', message = 'idempotency_conflict';
  end if;
  if v_existing_result is not null then return v_existing_result; end if;
  if v_assignment.status <> 'active' or v_assignment.version <> p_expected_version then
    raise exception using errcode = '40001', message = 'stale_state';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_assignment.circle_id::text, 0));
  if v_assignment.role_code = 'circle_head' then
    select count(*) into v_active_heads from public.circle_role_assignments assignment
    join public.circle_memberships membership
      on membership.circle_id = assignment.circle_id and membership.id = assignment.membership_id
    where assignment.circle_id = v_assignment.circle_id
      and assignment.role_code = 'circle_head' and assignment.status = 'active'
      and membership.status = 'active';
    if v_active_heads <= 1 then
      insert into public.audit_events(event_class, event_type, actor_user_id, circle_id,
        target_type, target_id, result, prior_state, next_state, correlation_id)
      values ('authorization', 'circle_role.final_head_change_denied', v_actor,
        v_assignment.circle_id, 'circle_role_assignment', v_assignment.id, 'denied',
        '{"role_code":"circle_head","status":"active"}'::jsonb,
        jsonb_build_object('attempted_operation', p_operation), p_idempotency_key);
      v_result := jsonb_build_object('outcome', 'final_head_blocked');
      update public.circle_role_mutation_requests set result = v_result
      where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
      return v_result;
    end if;
  end if;
  v_status := case when p_operation = 'suspend' then 'suspended' else 'removed' end;
  update public.circle_role_assignments set status = v_status, ends_at = now(),
    updated_at = now(), changed_by_user_id = v_actor, version = version + 1
  where id = v_assignment.id;
  insert into public.audit_events(event_class, event_type, actor_user_id, circle_id,
    target_type, target_id, result, prior_state, next_state, correlation_id)
  values ('authorization', 'circle_role.' || v_status, v_actor, v_assignment.circle_id,
    'circle_role_assignment', v_assignment.id, 'succeeded',
    jsonb_build_object('role_code', v_assignment.role_code, 'status', 'active'),
    jsonb_build_object('role_code', v_assignment.role_code, 'status', v_status), p_idempotency_key);
  v_result := jsonb_build_object('assignment_id', v_assignment.id, 'status', v_status);
  update public.circle_role_mutation_requests set result = v_result
  where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.transition_circle_role(uuid, text, bigint, uuid) from public, anon;
grant execute on function public.transition_circle_role(uuid, text, bigint, uuid) to authenticated;

create or replace function public.prevent_final_circle_head_loss()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'active' and new.status <> 'active' and exists (
    select 1 from public.circle_role_assignments role
    where role.membership_id = old.id and role.circle_id = old.circle_id
      and role.role_code = 'circle_head' and role.status = 'active'
  ) and not exists (
    select 1 from public.circle_role_assignments role
    join public.circle_memberships membership
      on membership.id = role.membership_id and membership.circle_id = role.circle_id
    where role.circle_id = old.circle_id and role.role_code = 'circle_head'
      and role.status = 'active' and membership.status = 'active'
      and membership.id <> old.id
  ) then
    raise exception using errcode = '23514', message = 'final_circle_head_required';
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_final_circle_head_loss() from public, anon, authenticated;
create trigger circle_memberships_protect_final_head
  before update of status on public.circle_memberships
  for each row execute function public.prevent_final_circle_head_loss();

create or replace function public.prevent_final_circle_head_assignment_loss()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role_code = 'circle_head' and old.status = 'active'
    and (tg_op = 'DELETE' or new.status <> 'active')
    and not exists (
      select 1 from public.circle_role_assignments role
      join public.circle_memberships membership
        on membership.id = role.membership_id and membership.circle_id = role.circle_id
      where role.circle_id = old.circle_id and role.role_code = 'circle_head'
        and role.status = 'active' and role.id <> old.id
        and membership.status = 'active'
    )
  then
    raise exception using errcode = '23514', message = 'final_circle_head_required';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.prevent_final_circle_head_assignment_loss()
  from public, anon, authenticated;
create trigger circle_role_assignments_protect_final_head
  before update of status or delete on public.circle_role_assignments
  for each row execute function public.prevent_final_circle_head_assignment_loss();
