-- Slice 7: exact-Care-Recipient coordination roles. These designations create
-- no ownership, management mode, grant, delegation, legal, or medical authority.

create table public.care_recipient_role_definitions (
  role_code text primary key check (role_code in (
    'care_lead', 'medical_lead', 'chemo_care_lead', 'backup_caregiver'
  )),
  display_name text not null unique,
  purpose text not null,
  boundary text not null,
  permission_bundle_version text not null default 'kinward.recipient_roles.v1'
);

insert into public.care_recipient_role_definitions(role_code, display_name, purpose, boundary)
values
  ('care_lead', 'Care Lead', 'Coordinates approved practical daily support.', 'No medical, ownership, management, delegation, or legal authority.'),
  ('medical_lead', 'Medical Lead', 'Coordinates approved information from the healthcare team.', 'Cannot diagnose, interpret, recommend treatment, or access another Care Recipient.'),
  ('chemo_care_lead', 'Chemo Care Lead', 'Coordinates approved family logistics around a configured treatment window.', 'Creates no clinical guidance and grants only exact-recipient coordination authority.'),
  ('backup_caregiver', 'Backup Caregiver', 'Provides approved temporary practical coverage.', 'Creates no permanent medical, caregiver-record, ownership, or management access.');

create table public.care_recipient_role_permissions (
  role_code text not null references public.care_recipient_role_definitions(role_code),
  permission_code text not null check (permission_code in (
    'recipient.roles.view',
    'recipient.coordinate_practical_support',
    'recipient.coordinate_healthcare_team_information',
    'recipient.coordinate_treatment_logistics',
    'recipient.coordinate_temporary_coverage'
  )),
  primary key (role_code, permission_code)
);

insert into public.care_recipient_role_permissions(role_code, permission_code)
values
  ('care_lead', 'recipient.roles.view'),
  ('care_lead', 'recipient.coordinate_practical_support'),
  ('medical_lead', 'recipient.roles.view'),
  ('medical_lead', 'recipient.coordinate_healthcare_team_information'),
  ('chemo_care_lead', 'recipient.roles.view'),
  ('chemo_care_lead', 'recipient.coordinate_treatment_logistics'),
  ('backup_caregiver', 'recipient.roles.view'),
  ('backup_caregiver', 'recipient.coordinate_temporary_coverage');

alter table public.care_recipients
  add constraint care_recipients_circle_id_id_unique unique (circle_id, id);
alter table public.audit_events
  add column care_recipient_id uuid references public.care_recipients(id);

create table public.care_recipient_role_assignments (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.family_circles(id),
  care_recipient_id uuid not null references public.care_recipients(id),
  membership_id uuid not null,
  role_code text not null references public.care_recipient_role_definitions(role_code),
  permission_bundle_version text not null default 'kinward.recipient_roles.v1',
  status text not null default 'active' check (status in ('active', 'suspended', 'expired', 'removed')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  assigned_by_user_id uuid not null references auth.users(id),
  changed_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  foreign key (circle_id, membership_id)
    references public.circle_memberships(circle_id, id),
  foreign key (circle_id, care_recipient_id)
    references public.care_recipients(circle_id, id),
  constraint recipient_role_lifecycle check (
    (status = 'active' and ends_at is null)
    or (status in ('suspended', 'expired', 'removed') and ends_at is not null)
  )
);

create unique index recipient_roles_one_active
  on public.care_recipient_role_assignments(care_recipient_id, membership_id, role_code)
  where status = 'active';
create index recipient_roles_exact_scope
  on public.care_recipient_role_assignments(circle_id, care_recipient_id, status);

create table public.care_recipient_role_restrictions (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.family_circles(id),
  care_recipient_id uuid not null references public.care_recipients(id),
  membership_id uuid not null,
  permission_code text not null,
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  foreign key (circle_id, membership_id)
    references public.circle_memberships(circle_id, id),
  foreign key (circle_id, care_recipient_id)
    references public.care_recipients(circle_id, id),
  constraint recipient_role_restriction_lifecycle check (
    (status = 'active' and removed_at is null)
    or (status = 'removed' and removed_at is not null)
  )
);

create table public.care_recipient_role_mutation_requests (
  actor_user_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  operation text not null check (operation in ('assign', 'suspend', 'remove')),
  input_fingerprint text not null check (input_fingerprint ~ '^[0-9a-f]{64}$'),
  result jsonb,
  created_at timestamptz not null default now(),
  primary key (actor_user_id, idempotency_key)
);

alter table public.care_recipient_role_definitions enable row level security;
alter table public.care_recipient_role_permissions enable row level security;
alter table public.care_recipient_role_assignments enable row level security;
alter table public.care_recipient_role_restrictions enable row level security;
alter table public.care_recipient_role_mutation_requests enable row level security;
revoke all on public.care_recipient_role_definitions,
  public.care_recipient_role_permissions,
  public.care_recipient_role_assignments,
  public.care_recipient_role_restrictions,
  public.care_recipient_role_mutation_requests from public, anon, authenticated;

create or replace function public.kinward_has_recipient_permission(
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
    join public.circle_memberships membership
      on membership.circle_id = recipient.circle_id
     and membership.user_id = p_user_id
    join public.care_recipient_role_assignments assignment
      on assignment.circle_id = recipient.circle_id
     and assignment.care_recipient_id = recipient.id
     and assignment.membership_id = membership.id
    join public.care_recipient_role_permissions permission
      on permission.role_code = assignment.role_code
    where recipient.id = p_care_recipient_id
      and recipient.circle_id = p_circle_id
      and recipient.status = 'active'
      and membership.status = 'active'
      and assignment.status = 'active'
      and assignment.starts_at <= now()
      and assignment.ends_at is null
      and permission.permission_code = p_permission_code
  ) and not exists (
    select 1
    from public.circle_memberships membership
    join public.care_recipient_role_restrictions restriction
      on restriction.circle_id = membership.circle_id
     and restriction.membership_id = membership.id
    where membership.circle_id = p_circle_id
      and membership.user_id = p_user_id
      and restriction.care_recipient_id = p_care_recipient_id
      and restriction.permission_code = p_permission_code
      and restriction.status = 'active'
  );
$$;

revoke all on function public.kinward_has_recipient_permission(uuid, uuid, uuid, text)
  from public, anon, authenticated;

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

revoke all on function public.can_manage_recipient_roles(uuid, uuid) from public, anon;
grant execute on function public.can_manage_recipient_roles(uuid, uuid) to authenticated;

create or replace function public.list_recipient_role_members(
  p_circle_id uuid, p_care_recipient_id uuid
)
returns table (
  membership_id uuid, display_name text, assignment_id uuid,
  role_code text, role_status text, assignment_version bigint,
  is_current_actor boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_actor uuid := public.kinward_require_verified_active_adult();
begin
  if not public.can_manage_recipient_roles(p_circle_id, p_care_recipient_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  return query
  select membership.id,
    coalesce(nullif(membership.display_name_override, ''), nullif(profile.preferred_display_name, ''), 'Circle member'),
    assignment.id, assignment.role_code, assignment.status, assignment.version,
    membership.user_id = v_actor
  from public.circle_memberships membership
  join public.user_profiles profile on profile.user_id = membership.user_id
  left join public.care_recipient_role_assignments assignment
    on assignment.circle_id = membership.circle_id
   and assignment.care_recipient_id = p_care_recipient_id
   and assignment.membership_id = membership.id
   and assignment.status in ('active', 'suspended')
  where membership.circle_id = p_circle_id
    and membership.status = 'active'
    and profile.account_status = 'active'
  order by display_name, membership.id, assignment.role_code;
end;
$$;

revoke all on function public.list_recipient_role_members(uuid, uuid) from public, anon;
grant execute on function public.list_recipient_role_members(uuid, uuid) to authenticated;

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
begin
  if p_idempotency_key is null or p_role_code not in (
    'care_lead', 'medical_lead', 'chemo_care_lead', 'backup_caregiver'
  ) then raise exception using errcode = '22023', message = 'invalid_request'; end if;
  perform 1 from public.care_recipients recipient
    where recipient.id = p_care_recipient_id and recipient.circle_id = p_circle_id
      and recipient.status = 'active' for update;
  if not found or not public.can_manage_recipient_roles(p_circle_id, p_care_recipient_id) then
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
      care_recipient_id, target_type, target_id, result, next_state, correlation_id)
    values ('authorization', 'recipient_role.assigned', v_actor, p_circle_id,
      p_care_recipient_id, 'care_recipient_role_assignment', v_assignment_id,
      'succeeded', jsonb_build_object('role_code', p_role_code, 'status', 'active'), p_idempotency_key);
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

create or replace function public.transition_recipient_role(
  p_assignment_id uuid, p_operation text, p_expected_version bigint, p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_assignment public.care_recipient_role_assignments%rowtype;
  v_fingerprint text; v_existing_fingerprint text; v_existing_result jsonb;
  v_status text; v_result jsonb;
begin
  if p_operation not in ('suspend', 'remove') or p_expected_version is null or p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if coalesce((auth.jwt() ->> 'iat')::bigint, 0) < extract(epoch from now() - interval '15 minutes')::bigint then
    raise exception using errcode = '42501', message = 'recent_authentication_required';
  end if;
  -- Discover the exact scope without taking a row lock, then acquire locks in
  -- the same recipient -> membership -> assignment order used by assignment.
  -- This prevents an assignment/lifecycle FK lock cycle while the final locked
  -- read below still governs stale lifecycle state.
  select * into v_assignment from public.care_recipient_role_assignments
    where id = p_assignment_id;
  if v_assignment.id is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  perform 1 from public.care_recipients recipient
    where recipient.id = v_assignment.care_recipient_id
      and recipient.circle_id = v_assignment.circle_id
      and recipient.status = 'active'
    for update;
  if not found or not public.can_manage_recipient_roles(
    v_assignment.circle_id, v_assignment.care_recipient_id
  ) then raise exception using errcode = '42501', message = 'not_authorized'; end if;
  perform 1 from public.circle_memberships membership
    where membership.id = v_assignment.membership_id
      and membership.circle_id = v_assignment.circle_id
    for update;
  if not found then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  v_fingerprint := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    p_assignment_id::text || ':' || p_operation || ':' || p_expected_version::text,
    'UTF8'), 'sha256'), 'hex');
  insert into public.care_recipient_role_mutation_requests(actor_user_id, idempotency_key, operation, input_fingerprint)
  values (v_actor, p_idempotency_key, p_operation, v_fingerprint) on conflict do nothing;
  select input_fingerprint, result into v_existing_fingerprint, v_existing_result
    from public.care_recipient_role_mutation_requests
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key for update;
  if v_existing_fingerprint <> v_fingerprint then
    raise exception using errcode = '22023', message = 'idempotency_conflict';
  end if;
  if v_existing_result is not null then return v_existing_result; end if;
  select * into v_assignment from public.care_recipient_role_assignments
    where id = p_assignment_id for update;
  if v_assignment.id is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  -- Use 55000 (object_not_in_prerequisite_state), never 40001.
  -- PostgREST treats SQLSTATE 40001 as serialization_failure and retries the
  -- whole statement indefinitely, which hangs concurrent suspend/remove races.
  if v_assignment.status <> 'active' or v_assignment.version <> p_expected_version then
    raise exception using errcode = '55000', message = 'stale_state';
  end if;
  v_status := case when p_operation = 'suspend' then 'suspended' else 'removed' end;
  update public.care_recipient_role_assignments set status = v_status, ends_at = now(),
    updated_at = now(), changed_by_user_id = v_actor, version = version + 1
    where id = v_assignment.id;
  insert into public.audit_events(event_class, event_type, actor_user_id, circle_id,
    care_recipient_id, target_type, target_id, result, prior_state, next_state, correlation_id)
  values ('authorization', 'recipient_role.' || v_status, v_actor, v_assignment.circle_id,
    v_assignment.care_recipient_id, 'care_recipient_role_assignment', v_assignment.id,
    'succeeded', jsonb_build_object('role_code', v_assignment.role_code, 'status', 'active'),
    jsonb_build_object('role_code', v_assignment.role_code, 'status', v_status), p_idempotency_key);
  v_result := jsonb_build_object('assignment_id', v_assignment.id, 'status', v_status);
  update public.care_recipient_role_mutation_requests set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.transition_recipient_role(uuid, text, bigint, uuid) from public, anon;
grant execute on function public.transition_recipient_role(uuid, text, bigint, uuid) to authenticated;
