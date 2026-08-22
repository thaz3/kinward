-- Slice 10 manual QA repair: accessible Care Recipient contexts for owners and
-- active delegated representatives; historical scope snapshots on ended grants;
-- read-only role listing for Review permissions without weakening ownership.

-- ---------------------------------------------------------------------------
-- Review recipient role assignments (read-only). Manage mutations remain on
-- can_manage_recipient_roles, which requires owner or Manage roles scope.
-- ---------------------------------------------------------------------------

create or replace function public.can_review_recipient_permissions(
  p_circle_id uuid,
  p_care_recipient_id uuid
)
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
  if exists (
    select 1
    from public.care_recipients recipient
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
    p_circle_id, p_care_recipient_id, v_actor, 'recipient.review_permissions'
  )
    or public.kinward_has_management_scope(
      p_circle_id, p_care_recipient_id, v_actor, 'recipient.manage_roles'
    );
exception
  when others then
    return false;
end;
$$;

revoke all on function public.can_review_recipient_permissions(uuid, uuid)
  from public, anon;
grant execute on function public.can_review_recipient_permissions(uuid, uuid)
  to authenticated;

create or replace function public.list_recipient_role_members(
  p_circle_id uuid,
  p_care_recipient_id uuid
)
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
  if not public.can_review_recipient_permissions(p_circle_id, p_care_recipient_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  return query
  select
    membership.id,
    coalesce(
      nullif(membership.display_name_override, ''),
      nullif(profile.preferred_display_name, ''),
      'Circle member'
    ),
    assignment.id,
    assignment.role_code,
    assignment.status,
    assignment.version,
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

-- ---------------------------------------------------------------------------
-- Accessible Care Recipient contexts (deny by default).
--
-- These reads materialize finite expiration before evaluating access, so they
-- are VOLATILE rather than STABLE. Pending, suspended, expired, revoked, and
-- disputed grants never appear. Owner access wins over delegated access.
-- ---------------------------------------------------------------------------

create or replace function public.kinward_materialize_actor_circle_delegations(
  p_circle_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_grant_id uuid;
begin
  for v_grant_id in
    select grant_row.id
    from public.delegated_management_grants grant_row
    join public.circle_memberships membership
      on membership.id = grant_row.representative_membership_id
    where grant_row.circle_id = p_circle_id
      and membership.user_id = p_user_id
      and grant_row.status in ('active', 'suspended')
      and grant_row.expires_at is not null
      and now() >= grant_row.expires_at
    order by grant_row.id
  loop
    perform public.kinward_materialize_delegated_expiration(v_grant_id);
  end loop;
end;
$$;

revoke all on function public.kinward_materialize_actor_circle_delegations(uuid, uuid)
  from public, anon, authenticated;

create or replace function public.list_accessible_care_recipient_contexts(
  p_circle_id uuid
)
returns table (
  care_recipient_id uuid,
  display_label text,
  access_kind text,
  permission_codes text[],
  delegated_grant_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
begin
  if p_circle_id is null then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if not exists (
    select 1
    from public.circle_memberships membership
    where membership.circle_id = p_circle_id
      and membership.user_id = v_actor
      and membership.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  perform public.kinward_materialize_actor_circle_delegations(p_circle_id, v_actor);

  return query
  select
    contexts.care_recipient_id,
    contexts.display_label,
    contexts.access_kind,
    contexts.permission_codes,
    contexts.delegated_grant_id
  from (
    select
      recipient.id care_recipient_id,
      recipient.display_label,
      'owner'::text access_kind,
      array[
        'recipient.manage_roles',
        'recipient.review_permissions'
      ]::text[] permission_codes,
      null::uuid delegated_grant_id
    from public.care_recipients recipient
    join public.circle_memberships membership
      on membership.circle_id = recipient.circle_id
     and membership.user_id = v_actor
    where recipient.circle_id = p_circle_id
      and recipient.status = 'active'
      and recipient.owner_user_id = v_actor
      and membership.status = 'active'

    union all

    select
      recipient.id care_recipient_id,
      recipient.display_label,
      'delegated'::text access_kind,
      coalesce(
        (
          select array_agg(scope_row.permission_code order by scope_row.permission_code)
          from public.management_grant_scopes scope_row
          where scope_row.grant_type = 'delegated'
            and scope_row.grant_id = grant_row.id
            and scope_row.status = 'active'
        ),
        '{}'::text[]
      ) permission_codes,
      grant_row.id delegated_grant_id
    from public.delegated_management_grants grant_row
    join public.care_recipients recipient
      on recipient.id = grant_row.care_recipient_id
     and recipient.circle_id = grant_row.circle_id
    join public.care_management_modes mode
      on mode.circle_id = recipient.circle_id
     and mode.care_recipient_id = recipient.id
     and mode.status = 'active'
     and mode.mode_code = 'delegated_management'
    join public.circle_memberships membership
      on membership.id = grant_row.representative_membership_id
    where grant_row.circle_id = p_circle_id
      and membership.user_id = v_actor
      and membership.status = 'active'
      and recipient.status = 'active'
      and grant_row.status = 'active'
      and grant_row.activated_at is not null
      and (grant_row.expires_at is null or now() < grant_row.expires_at)
      and not exists (
        select 1
        from public.care_recipients owned_recipient
        where owned_recipient.id = recipient.id
          and owned_recipient.owner_user_id = v_actor
      )
      and exists (
        select 1
        from public.management_grant_scopes scope_row
        where scope_row.grant_type = 'delegated'
          and scope_row.grant_id = grant_row.id
          and scope_row.status = 'active'
          and scope_row.permission_code in (
            'recipient.manage_roles', 'recipient.review_permissions'
          )
      )
  ) contexts
  order by contexts.display_label, contexts.care_recipient_id;
end;
$$;

revoke all on function public.list_accessible_care_recipient_contexts(uuid)
  from public, anon;
grant execute on function public.list_accessible_care_recipient_contexts(uuid)
  to authenticated;

create or replace function public.get_accessible_care_recipient(
  p_circle_id uuid,
  p_care_recipient_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.kinward_require_verified_active_adult();
  v_grant public.delegated_management_grants%rowtype;
  v_codes text[];
begin
  if p_circle_id is null or p_care_recipient_id is null then
    return jsonb_build_object('outcome', 'unavailable');
  end if;
  if not exists (
    select 1
    from public.circle_memberships membership
    where membership.circle_id = p_circle_id
      and membership.user_id = v_actor
      and membership.status = 'active'
  ) then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  if exists (
    select 1
    from public.care_recipients recipient
    join public.circle_memberships membership
      on membership.circle_id = recipient.circle_id
     and membership.user_id = v_actor
    where recipient.id = p_care_recipient_id
      and recipient.circle_id = p_circle_id
      and recipient.status = 'active'
      and recipient.owner_user_id = v_actor
      and membership.status = 'active'
  ) then
    return jsonb_build_object(
      'outcome', 'ready',
      'access_kind', 'owner',
      'care_recipient_id', p_care_recipient_id,
      'circle_id', p_circle_id,
      'display_label', (
        select recipient.display_label
        from public.care_recipients recipient
        where recipient.id = p_care_recipient_id
      ),
      'permission_codes', jsonb_build_array(
        'recipient.manage_roles',
        'recipient.review_permissions'
      ),
      'delegated_grant_id', null
    );
  end if;

  perform public.kinward_materialize_actor_circle_delegations(p_circle_id, v_actor);

  select grant_row.* into v_grant
  from public.delegated_management_grants grant_row
  join public.care_recipients recipient
    on recipient.id = grant_row.care_recipient_id
   and recipient.circle_id = grant_row.circle_id
  join public.care_management_modes mode
    on mode.circle_id = recipient.circle_id
   and mode.care_recipient_id = recipient.id
   and mode.status = 'active'
   and mode.mode_code = 'delegated_management'
  join public.circle_memberships membership
    on membership.id = grant_row.representative_membership_id
  where grant_row.circle_id = p_circle_id
    and grant_row.care_recipient_id = p_care_recipient_id
    and membership.user_id = v_actor
    and membership.status = 'active'
    and recipient.status = 'active'
    and grant_row.status = 'active'
    and grant_row.activated_at is not null
    and (grant_row.expires_at is null or now() < grant_row.expires_at)
  order by grant_row.activated_at desc
  limit 1;

  if v_grant.id is null then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select array_agg(scope_row.permission_code order by scope_row.permission_code)
    into v_codes
  from public.management_grant_scopes scope_row
  where scope_row.grant_type = 'delegated'
    and scope_row.grant_id = v_grant.id
    and scope_row.status = 'active'
    and scope_row.permission_code in (
      'recipient.manage_roles', 'recipient.review_permissions'
    );

  if v_codes is null or cardinality(v_codes) = 0 then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  return jsonb_build_object(
    'outcome', 'ready',
    'access_kind', 'delegated',
    'care_recipient_id', p_care_recipient_id,
    'circle_id', p_circle_id,
    'display_label', (
      select recipient.display_label
      from public.care_recipients recipient
      where recipient.id = p_care_recipient_id
    ),
    'permission_codes', to_jsonb(v_codes),
    'delegated_grant_id', v_grant.id
  );
end;
$$;

revoke all on function public.get_accessible_care_recipient(uuid, uuid)
  from public, anon;
grant execute on function public.get_accessible_care_recipient(uuid, uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Delegation detail: preserve historical scope snapshots on ended grants.
-- Ended grants return active-or-removed scope rows for audit only; removed
-- scopes never become effective again.
-- ---------------------------------------------------------------------------

create or replace function public.get_delegated_grant_detail(
  p_circle_id uuid,
  p_care_recipient_id uuid,
  p_grant_id uuid
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
  v_scope_snapshot_kind text;
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

  if v_grant.status in ('revoked', 'expired') then
    v_scope_snapshot_kind := 'historical';
    select array_agg(scope_row.permission_code order by scope_row.permission_code)
      into v_codes
    from public.management_grant_scopes scope_row
    where scope_row.grant_type = 'delegated'
      and scope_row.grant_id = p_grant_id
      and scope_row.status in ('active', 'removed');
  else
    v_scope_snapshot_kind := 'current';
    select array_agg(scope_row.permission_code order by scope_row.permission_code)
      into v_codes
    from public.management_grant_scopes scope_row
    where scope_row.grant_type = 'delegated'
      and scope_row.grant_id = p_grant_id
      and scope_row.status = 'active';
  end if;

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
    'scope_snapshot_kind', v_scope_snapshot_kind,
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

-- ---------------------------------------------------------------------------
-- Role lifecycle mutations: record on-behalf-of provenance for delegated
-- Manage roles actions, matching assign_recipient_role from Slice 10.
-- ---------------------------------------------------------------------------

create or replace function public.transition_recipient_role(
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
  v_assignment public.care_recipient_role_assignments%rowtype;
  v_fingerprint text;
  v_existing_fingerprint text;
  v_existing_result jsonb;
  v_status text;
  v_result jsonb;
  v_owner_user_id uuid;
  v_delegated_grant_id uuid;
begin
  if p_operation not in ('suspend', 'remove')
    or p_expected_version is null
    or p_idempotency_key is null
  then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if coalesce((auth.jwt() ->> 'iat')::bigint, 0)
     < extract(epoch from now() - interval '15 minutes')::bigint
  then
    raise exception using errcode = '42501', message = 'recent_authentication_required';
  end if;

  select * into v_assignment from public.care_recipient_role_assignments
    where id = p_assignment_id;
  if v_assignment.id is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  select recipient.owner_user_id into v_owner_user_id
    from public.care_recipients recipient
    where recipient.id = v_assignment.care_recipient_id
      and recipient.circle_id = v_assignment.circle_id
      and recipient.status = 'active'
    for update;
  if v_owner_user_id is null
    or not public.can_manage_recipient_roles(
      v_assignment.circle_id, v_assignment.care_recipient_id
    )
  then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  perform 1 from public.circle_memberships membership
    where membership.id = v_assignment.membership_id
      and membership.circle_id = v_assignment.circle_id
    for update;
  if not found then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  v_delegated_grant_id := public.kinward_active_delegated_grant_id(
    v_assignment.circle_id,
    v_assignment.care_recipient_id,
    v_actor,
    'recipient.manage_roles'
  );

  v_fingerprint := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    p_assignment_id::text || ':' || p_operation || ':' || p_expected_version::text,
    'UTF8'), 'sha256'), 'hex');
  insert into public.care_recipient_role_mutation_requests(
    actor_user_id, idempotency_key, operation, input_fingerprint
  )
  values (v_actor, p_idempotency_key, p_operation, v_fingerprint)
  on conflict do nothing;
  select input_fingerprint, result into v_existing_fingerprint, v_existing_result
    from public.care_recipient_role_mutation_requests
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key
    for update;
  if v_existing_fingerprint <> v_fingerprint then
    raise exception using errcode = '22023', message = 'idempotency_conflict';
  end if;
  if v_existing_result is not null then
    return v_existing_result;
  end if;

  select * into v_assignment from public.care_recipient_role_assignments
    where id = p_assignment_id for update;
  if v_assignment.id is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  if v_assignment.status <> 'active'
    or v_assignment.version <> p_expected_version
  then
    raise exception using errcode = '55000', message = 'stale_state';
  end if;

  v_status := case when p_operation = 'suspend' then 'suspended' else 'removed' end;
  update public.care_recipient_role_assignments
    set status = v_status,
        ends_at = now(),
        updated_at = now(),
        changed_by_user_id = v_actor,
        version = version + 1
    where id = v_assignment.id;

  insert into public.audit_events(
    event_class, event_type, actor_user_id, circle_id, care_recipient_id,
    target_type, target_id, result, prior_state, next_state, correlation_id,
    on_behalf_of_user_id, delegated_grant_id
  ) values (
    'authorization',
    'recipient_role.' || v_status,
    v_actor,
    v_assignment.circle_id,
    v_assignment.care_recipient_id,
    'care_recipient_role_assignment',
    v_assignment.id,
    'succeeded',
    jsonb_build_object('role_code', v_assignment.role_code, 'status', 'active'),
    jsonb_build_object(
      'role_code', v_assignment.role_code,
      'status', v_status,
      'acted_through', case when v_delegated_grant_id is null
        then 'own_authority' else 'delegated_management_grant' end
    ),
    p_idempotency_key,
    case when v_delegated_grant_id is null then null else v_owner_user_id end,
    v_delegated_grant_id
  );

  v_result := jsonb_build_object('assignment_id', v_assignment.id, 'status', v_status);
  update public.care_recipient_role_mutation_requests
    set result = v_result
    where actor_user_id = v_actor and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.transition_recipient_role(uuid, text, bigint, uuid)
  from public, anon;
grant execute on function public.transition_recipient_role(uuid, text, bigint, uuid)
  to authenticated;
