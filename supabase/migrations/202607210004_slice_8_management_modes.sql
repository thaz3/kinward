-- Slice 8: Care Management Mode history and owner-only transitions.
-- Mode selection never transfers ownership, creates grants, or becomes legal authority.
-- Shared and Delegated grants remain Slice 9+.

create table public.care_management_modes (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.family_circles(id),
  care_recipient_id uuid not null references public.care_recipients(id),
  mode_code text not null check (mode_code in (
    'self_managed', 'shared_management', 'delegated_management'
  )),
  status text not null default 'active' check (status in ('active', 'superseded')),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  selected_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  foreign key (circle_id, care_recipient_id)
    references public.care_recipients(circle_id, id),
  constraint care_management_mode_lifecycle check (
    (status = 'active' and effective_to is null)
    or (status = 'superseded' and effective_to is not null)
  )
);

create unique index care_management_modes_one_active
  on public.care_management_modes(care_recipient_id)
  where status = 'active';
create index care_management_modes_exact_scope
  on public.care_management_modes(circle_id, care_recipient_id, status);
create index care_management_modes_mode_status
  on public.care_management_modes(mode_code, status);

create table public.care_management_mode_mutation_requests (
  actor_user_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  operation text not null check (operation = 'select'),
  input_fingerprint text not null check (input_fingerprint ~ '^[0-9a-f]{64}$'),
  result jsonb,
  created_at timestamptz not null default now(),
  primary key (actor_user_id, idempotency_key)
);

alter table public.care_management_modes enable row level security;
alter table public.care_management_mode_mutation_requests enable row level security;
revoke all on public.care_management_modes,
  public.care_management_mode_mutation_requests from public, anon, authenticated;

create or replace function public.can_select_management_mode(
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

revoke all on function public.can_select_management_mode(uuid, uuid) from public, anon;
grant execute on function public.can_select_management_mode(uuid, uuid) to authenticated;

create or replace function public.get_care_management_mode(
  p_circle_id uuid, p_care_recipient_id uuid
)
returns table (
  mode_id uuid,
  mode_code text,
  mode_status text,
  mode_version bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.can_select_management_mode(p_circle_id, p_care_recipient_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  return query
  select mode.id, mode.mode_code, mode.status, mode.version
  from public.care_management_modes mode
  where mode.circle_id = p_circle_id
    and mode.care_recipient_id = p_care_recipient_id
    and mode.status = 'active'
  limit 1;
end;
$$;

revoke all on function public.get_care_management_mode(uuid, uuid) from public, anon;
grant execute on function public.get_care_management_mode(uuid, uuid) to authenticated;

create or replace function public.select_care_management_mode(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_mode_code text,
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
  v_fingerprint text;
  v_existing_fingerprint text;
  v_existing_result jsonb;
  v_current public.care_management_modes%rowtype;
  v_mode_id uuid;
  v_next_version bigint;
  v_result jsonb;
begin
  if p_idempotency_key is null
    or p_expected_version is null
    or p_expected_version < 0
    or p_mode_code not in (
      'self_managed', 'shared_management', 'delegated_management'
    )
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  if coalesce((auth.jwt() ->> 'iat')::bigint, 0)
     < extract(epoch from now() - interval '15 minutes')::bigint then
    raise exception using errcode = '42501', message = 'recent_authentication_required';
  end if;

  perform 1 from public.care_recipients recipient
    where recipient.id = p_care_recipient_id
      and recipient.circle_id = p_circle_id
      and recipient.status = 'active'
    for update;
  if not found or not public.can_select_management_mode(
    p_circle_id, p_care_recipient_id
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  perform 1 from public.circle_memberships membership
    where membership.circle_id = p_circle_id
      and membership.user_id = v_actor
      and membership.status = 'active'
    for update;
  if not found then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  v_fingerprint := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    p_circle_id::text || ':' || p_care_recipient_id::text || ':'
      || p_mode_code || ':' || p_expected_version::text,
    'UTF8'), 'sha256'), 'hex');

  insert into public.care_management_mode_mutation_requests(
    actor_user_id, idempotency_key, operation, input_fingerprint
  ) values (v_actor, p_idempotency_key, 'select', v_fingerprint)
  on conflict do nothing;

  select input_fingerprint, result
    into v_existing_fingerprint, v_existing_result
    from public.care_management_mode_mutation_requests
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key
    for update;
  if v_existing_fingerprint <> v_fingerprint then
    raise exception using errcode = '22023', message = 'idempotency_conflict';
  end if;
  if v_existing_result is not null then
    return v_existing_result;
  end if;

  select * into v_current
    from public.care_management_modes mode
    where mode.care_recipient_id = p_care_recipient_id
      and mode.status = 'active'
    for update;

  if v_current.id is null then
    if p_expected_version <> 0 then
      raise exception using errcode = '55000', message = 'stale_state';
    end if;
    insert into public.care_management_modes(
      circle_id, care_recipient_id, mode_code, selected_by_user_id, version
    ) values (
      p_circle_id, p_care_recipient_id, p_mode_code, v_actor, 1
    ) returning id into v_mode_id;
    insert into public.audit_events(
      event_class, event_type, actor_user_id, circle_id, care_recipient_id,
      target_type, target_id, result, prior_state, next_state, correlation_id
    ) values (
      'authorization', 'management_mode.changed', v_actor, p_circle_id,
      p_care_recipient_id, 'care_management_mode', v_mode_id, 'succeeded',
      jsonb_build_object('mode_code', null, 'status', 'unset'),
      jsonb_build_object('mode_code', p_mode_code, 'status', 'active'),
      p_idempotency_key
    );
    v_result := jsonb_build_object(
      'mode_id', v_mode_id,
      'mode_code', p_mode_code,
      'status', 'active',
      'version', 1
    );
  else
    if v_current.version <> p_expected_version then
      raise exception using errcode = '55000', message = 'stale_state';
    end if;
    if v_current.mode_code = p_mode_code then
      v_result := jsonb_build_object(
        'mode_id', v_current.id,
        'mode_code', v_current.mode_code,
        'status', 'active',
        'version', v_current.version
      );
    else
      v_next_version := v_current.version + 1;
      update public.care_management_modes
        set status = 'superseded',
            effective_to = now(),
            updated_at = now()
        where id = v_current.id;
      insert into public.care_management_modes(
        circle_id, care_recipient_id, mode_code, selected_by_user_id, version
      ) values (
        p_circle_id, p_care_recipient_id, p_mode_code, v_actor, v_next_version
      ) returning id into v_mode_id;
      insert into public.audit_events(
        event_class, event_type, actor_user_id, circle_id, care_recipient_id,
        target_type, target_id, result, prior_state, next_state, correlation_id
      ) values (
        'authorization', 'management_mode.changed', v_actor, p_circle_id,
        p_care_recipient_id, 'care_management_mode', v_mode_id, 'succeeded',
        jsonb_build_object(
          'mode_id', v_current.id,
          'mode_code', v_current.mode_code,
          'status', 'active'
        ),
        jsonb_build_object(
          'mode_id', v_mode_id,
          'mode_code', p_mode_code,
          'status', 'active'
        ),
        p_idempotency_key
      );
      v_result := jsonb_build_object(
        'mode_id', v_mode_id,
        'mode_code', p_mode_code,
        'status', 'active',
        'version', v_next_version
      );
    end if;
  end if;

  update public.care_management_mode_mutation_requests
    set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.select_care_management_mode(
  uuid, uuid, text, bigint, uuid
) from public, anon;
grant execute on function public.select_care_management_mode(
  uuid, uuid, text, bigint, uuid
) to authenticated;
