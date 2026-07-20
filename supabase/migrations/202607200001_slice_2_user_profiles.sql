-- Slice 2 only: minimal adult account profile. Synthetic local/preview environments only.
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  preferred_display_name text not null default '' check (char_length(preferred_display_name) <= 80),
  locale text not null default 'en-US' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  time_zone text not null default 'UTC' check (char_length(time_zone) between 1 and 64),
  accessibility_preferences jsonb not null default '{"reduced_motion":false,"high_contrast":false,"larger_text":false}'::jsonb
    check (accessibility_preferences ?& array['reduced_motion','high_contrast','larger_text'])
    check ((accessibility_preferences - 'reduced_motion' - 'high_contrast' - 'larger_text') = '{}'::jsonb)
    check (jsonb_typeof(accessibility_preferences->'reduced_motion') = 'boolean')
    check (jsonb_typeof(accessibility_preferences->'high_contrast') = 'boolean')
    check (jsonb_typeof(accessibility_preferences->'larger_text') = 'boolean'),
  account_status text not null default 'active' check (account_status in ('active', 'disabled', 'archived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

revoke all on table public.user_profiles from anon, authenticated;
grant select (user_id, preferred_display_name, locale, time_zone, accessibility_preferences, account_status, version, created_at, updated_at)
  on public.user_profiles to authenticated;
grant update (preferred_display_name, locale, time_zone, accessibility_preferences, updated_at)
  on public.user_profiles to authenticated;

create policy "adult reads own active profile"
  on public.user_profiles for select to authenticated
  using (auth.uid() = user_id and account_status = 'active');

create policy "adult updates own active profile"
  on public.user_profiles for update to authenticated
  using (auth.uid() = user_id and account_status = 'active')
  with check (auth.uid() = user_id and account_status = 'active');

create or replace function public.create_adult_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (user_id) values (new.id);
  return new;
end;
$$;

revoke all on function public.create_adult_user_profile() from public, anon, authenticated;

drop trigger if exists create_adult_user_profile_after_signup on auth.users;
create trigger create_adult_user_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_adult_user_profile();

-- Managed minors are intentionally absent from auth.users and user_profiles.
