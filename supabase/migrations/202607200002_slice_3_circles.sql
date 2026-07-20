create table public.family_circles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 60),
  creator_user_id uuid not null references auth.users(id),
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.circle_memberships (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.family_circles(id),
  user_id uuid not null references auth.users(id),
  display_name_override text,
  status text not null default 'active' check (status in ('active', 'suspended', 'removed', 'archived')),
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  version bigint not null default 1,
  unique (circle_id, id)
);

create unique index circle_memberships_one_active_user
  on public.circle_memberships(circle_id, user_id) where status = 'active';
create index circle_memberships_user_status on public.circle_memberships(user_id, status);
create index circle_memberships_circle_status on public.circle_memberships(circle_id, status);

create table public.circle_role_assignments (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.family_circles(id),
  membership_id uuid not null,
  role_code text not null check (role_code in ('circle_head')),
  status text not null default 'active' check (status in ('active', 'suspended', 'expired', 'removed')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  assigned_by_user_id uuid not null references auth.users(id),
  version bigint not null default 1,
  foreign key (circle_id, membership_id) references public.circle_memberships(circle_id, id)
);

create unique index circle_role_assignments_one_active_role
  on public.circle_role_assignments(circle_id, membership_id, role_code) where status = 'active';

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  event_class text not null,
  event_type text not null,
  actor_user_id uuid references auth.users(id),
  circle_id uuid references public.family_circles(id),
  target_type text not null,
  target_id uuid not null,
  result text not null check (result in ('succeeded', 'denied', 'failed')),
  prior_state jsonb,
  next_state jsonb,
  occurred_at timestamptz not null default now(),
  correlation_id uuid not null,
  retention_class text not null default 'security'
);

alter table public.audit_events add column attempted_context_fingerprint text
  check (attempted_context_fingerprint is null or attempted_context_fingerprint ~ '^[0-9a-f]{64}$');

create index family_circles_creator_status on public.family_circles(creator_user_id, status);
create index family_circles_status on public.family_circles(status);

create table public.circle_creation_requests (
  user_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  requested_name text not null,
  circle_id uuid references public.family_circles(id),
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);

alter table public.family_circles enable row level security;
alter table public.circle_memberships enable row level security;
alter table public.circle_role_assignments enable row level security;
alter table public.audit_events enable row level security;
alter table public.circle_creation_requests enable row level security;

create policy circles_active_members_read on public.family_circles for select to authenticated
using (status = 'active' and exists (
  select 1 from public.circle_memberships membership
  where membership.circle_id = family_circles.id and membership.user_id = auth.uid() and membership.status = 'active'
));

create policy memberships_self_read on public.circle_memberships for select to authenticated
using (user_id = auth.uid() and status = 'active');

create policy circle_roles_self_read on public.circle_role_assignments for select to authenticated
using (status = 'active' and exists (
  select 1 from public.circle_memberships membership
  where membership.id = membership_id and membership.user_id = auth.uid() and membership.status = 'active'
));

grant select on public.family_circles, public.circle_memberships, public.circle_role_assignments to authenticated;
revoke all on public.audit_events from anon, authenticated;
revoke all on public.circle_creation_requests from anon, authenticated;
revoke insert, update, delete on public.family_circles, public.circle_memberships, public.circle_role_assignments from anon, authenticated;

create or replace function public.create_family_circle(p_display_name text, p_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_name text := pg_catalog.regexp_replace(pg_catalog.btrim(p_display_name), '[[:space:]]+', ' ', 'g');
  v_circle_id uuid;
  v_membership_id uuid;
  v_existing_name text;
begin
  if v_user_id is null or not exists (
    select 1 from auth.users where id = v_user_id and email_confirmed_at is not null
  ) or not exists (
    select 1 from public.user_profiles where user_id = v_user_id and account_status = 'active'
  ) then raise exception using errcode = '42501', message = 'not_authorized'; end if;
  if p_idempotency_key is null or char_length(v_name) not between 2 and 60 then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  insert into public.circle_creation_requests(user_id, idempotency_key, requested_name)
  values (v_user_id, p_idempotency_key, v_name) on conflict do nothing;
  select requested_name, circle_id into v_existing_name, v_circle_id
    from public.circle_creation_requests where user_id = v_user_id and idempotency_key = p_idempotency_key for update;
  if v_existing_name <> v_name then raise exception using errcode = '22023', message = 'invalid_request'; end if;
  if v_circle_id is not null then return v_circle_id; end if;

  insert into public.family_circles(display_name, creator_user_id) values (v_name, v_user_id) returning id into v_circle_id;
  insert into public.circle_memberships(circle_id, user_id) values (v_circle_id, v_user_id) returning id into v_membership_id;
  insert into public.circle_role_assignments(circle_id, membership_id, role_code, assigned_by_user_id)
    values (v_circle_id, v_membership_id, 'circle_head', v_user_id);
  insert into public.audit_events(event_class, event_type, actor_user_id, circle_id, target_type, target_id, result, next_state, correlation_id)
    values
      ('circle', 'circle.created', v_user_id, v_circle_id, 'family_circle', v_circle_id, 'succeeded', '{"status":"active"}', p_idempotency_key),
      ('membership', 'membership.created', v_user_id, v_circle_id, 'circle_membership', v_membership_id, 'succeeded', '{"status":"active"}', p_idempotency_key),
      ('authorization', 'circle_role.assigned', v_user_id, v_circle_id, 'circle_membership', v_membership_id, 'succeeded', '{"role_code":"circle_head","status":"active"}', p_idempotency_key);
  update public.circle_creation_requests set circle_id = v_circle_id where user_id = v_user_id and idempotency_key = p_idempotency_key;
  return v_circle_id;
end $$;

revoke all on function public.create_family_circle(text, uuid) from public, anon;
grant execute on function public.create_family_circle(text, uuid) to authenticated;

create or replace function public.record_circle_access_denied(
  p_correlation_id uuid,
  p_attempted_context_id uuid default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or p_correlation_id is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  insert into public.audit_events(
    event_class, event_type, actor_user_id, target_type, target_id, result,
    correlation_id, attempted_context_fingerprint
  ) values (
    'security', 'circle.access_denied', auth.uid(), 'access_attempt',
    p_correlation_id, 'denied', p_correlation_id,
    case when p_attempted_context_id is null then null else
      pg_catalog.encode(extensions.digest(pg_catalog.convert_to(p_attempted_context_id::text, 'UTF8'), 'sha256'), 'hex')
    end
  );
end $$;

revoke all on function public.record_circle_access_denied(uuid, uuid) from public, anon;
grant execute on function public.record_circle_access_denied(uuid, uuid) to authenticated;

create or replace function public.prevent_audit_event_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception using errcode = '55000', message = 'audit_events_are_append_only';
end $$;

revoke all on function public.prevent_audit_event_mutation() from public, anon, authenticated;
create trigger audit_events_append_only
  before update or delete on public.audit_events
  for each row execute function public.prevent_audit_event_mutation();
create trigger audit_events_no_truncate
  before truncate on public.audit_events
  for each statement execute function public.prevent_audit_event_mutation();
