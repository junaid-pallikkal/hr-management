-- JobBridge schema. Run once in the Supabase SQL editor (safe on an empty project).
-- To make a Super Admin, sign up normally, then run:
--   update profiles set platform_role = 'super_admin' where email = 'you@example.com';

-- ============ ENUMS ============
create type platform_role as enum ('super_admin', 'organization_user', 'job_seeker');
create type member_role as enum ('org_admin', 'hr_manager', 'recruiter');
create type member_status as enum ('active', 'suspended');
create type organization_status as enum ('pending', 'verified', 'rejected', 'suspended');
create type invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');
create type job_status as enum ('draft', 'published', 'paused', 'closed', 'archived');
create type employment_type as enum ('full_time', 'part_time', 'contract', 'internship', 'temporary');
create type work_mode as enum ('onsite', 'hybrid', 'remote');
create type experience_level as enum ('entry', 'junior', 'mid', 'senior', 'lead', 'executive');
create type application_status as enum ('applied', 'screening', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn');
create type interview_mode as enum ('in_person', 'phone', 'video');
create type interview_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type recommendation as enum ('strong_yes', 'yes', 'neutral', 'no', 'strong_no');
create type notification_type as enum (
  'application_received', 'application_status_changed', 'interview_scheduled', 'interview_updated',
  'interview_cancelled', 'message_received', 'invitation_received', 'organization_verified',
  'organization_rejected', 'organization_submitted', 'job_published', 'job_closing_soon', 'team_member_joined'
);
create type email_status as enum ('queued', 'sent', 'failed');

-- ============ TABLES ============
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text not null default '',
  phone text,
  avatar_path text,
  platform_role platform_role not null default 'job_seeker',
  is_active boolean not null default true,
  theme text not null default 'system',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  status organization_status not null default 'pending',
  logo_path text,
  cover_path text,
  tagline text,
  about text,
  industry text,
  size_range text,
  founded_year int,
  website text,
  linkedin_url text,
  contact_email text,
  contact_phone text,
  address_line text,
  city text,
  state text,
  country text,
  verified_at timestamptz,
  verified_by uuid references profiles,
  rejection_reason text,
  created_by uuid references profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  role member_role not null,
  status member_status not null default 'active',
  job_title text,
  invited_by uuid references profiles,
  joined_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index on organization_members (user_id);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations on delete cascade,
  email text not null,
  role member_role not null,
  token_hash text unique not null,
  status invitation_status not null default 'pending',
  invited_by uuid references profiles,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index on invitations (organization_id, lower(email)) where status = 'pending';

create table verification_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations on delete cascade,
  doc_type text not null,
  file_path text not null,
  file_name text not null,
  uploaded_by uuid references profiles,
  created_at timestamptz not null default now()
);

create table job_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  sort_order int not null default 0
);

create table skills (
  id uuid primary key default gen_random_uuid(),
  name text not null
);
create unique index on skills (lower(name));

create table jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations on delete cascade,
  created_by uuid references profiles,
  category_id uuid references job_categories,
  title text not null,
  slug text unique not null,
  department text,
  summary text not null default '',
  description text not null default '',
  responsibilities text,
  requirements text,
  benefits text,
  employment_type employment_type not null default 'full_time',
  work_mode work_mode not null default 'onsite',
  experience_level experience_level not null default 'mid',
  min_experience_years int,
  city text,
  state text,
  country text,
  salary_min int,
  salary_max int,
  salary_currency text default 'USD',
  salary_period text default 'year',
  show_salary boolean not null default true,
  openings int not null default 1,
  status job_status not null default 'draft',
  published_at timestamptz,
  closes_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(description, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on jobs (status, published_at desc);
create index on jobs using gin (search_vector);
create index on jobs (organization_id, status);
create index on jobs (city);
create index on jobs (work_mode);
create index on jobs (employment_type);
create index on jobs (experience_level);
create index on jobs (category_id);

create table job_skills (
  job_id uuid not null references jobs on delete cascade,
  skill_id uuid not null references skills on delete cascade,
  primary key (job_id, skill_id)
);

create table candidate_profiles (
  user_id uuid primary key references profiles on delete cascade,
  headline text,
  summary text,
  current_title text,
  city text,
  state text,
  country text,
  years_experience int,
  expected_salary int,
  salary_currency text,
  work_mode_preference work_mode,
  notice_period_days int,
  linkedin_url text,
  portfolio_url text,
  github_url text,
  open_to_work boolean not null default true,
  updated_at timestamptz not null default now()
);

create table candidate_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references candidate_profiles on delete cascade,
  company text not null,
  title text not null,
  location text,
  start_date date not null,
  end_date date,
  description text
);

create table candidate_educations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references candidate_profiles on delete cascade,
  institution text not null,
  degree text not null,
  field_of_study text,
  start_year int,
  end_year int,
  grade text
);

create table candidate_skills (
  user_id uuid not null references candidate_profiles on delete cascade,
  skill_id uuid not null references skills on delete cascade,
  level text,
  primary key (user_id, skill_id)
);

create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  label text not null,
  file_path text not null,
  file_name text not null,
  file_size int,
  mime_type text,
  is_default boolean not null default false,
  is_removed boolean not null default false,
  created_at timestamptz not null default now()
);

create table saved_jobs (
  user_id uuid not null references profiles on delete cascade,
  job_id uuid not null references jobs on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs on delete cascade,
  organization_id uuid not null references organizations on delete cascade,
  candidate_id uuid not null references profiles on delete cascade,
  resume_id uuid not null references resumes,
  cover_letter text,
  status application_status not null default 'applied',
  rating smallint check (rating between 1 and 5),
  is_shortlisted boolean not null default false,
  sort_order numeric not null default 0,
  applied_at timestamptz not null default now(),
  status_changed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);
create index on applications (job_id, status, sort_order);
create index on applications (candidate_id, applied_at desc);
create index on applications (organization_id, status);

create table application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications on delete cascade,
  organization_id uuid not null references organizations on delete cascade,
  from_status application_status,
  to_status application_status not null,
  changed_by uuid references profiles,
  note text,
  created_at timestamptz not null default now()
);
create index on application_status_history (application_id, created_at);

create table application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications on delete cascade,
  organization_id uuid not null references organizations on delete cascade,
  author_id uuid not null references profiles,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table application_evaluations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications on delete cascade,
  organization_id uuid not null references organizations on delete cascade,
  evaluator_id uuid not null references profiles,
  rating smallint not null check (rating between 1 and 5),
  recommendation recommendation not null,
  strengths text,
  concerns text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, evaluator_id)
);

create table application_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications on delete cascade,
  organization_id uuid not null references organizations on delete cascade,
  sender_id uuid not null references profiles,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on application_messages (application_id, created_at);

create table interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications on delete cascade,
  organization_id uuid not null references organizations on delete cascade,
  title text not null,
  round_number smallint not null default 1,
  mode interview_mode not null default 'video',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text,
  location_or_link text,
  instructions text,
  status interview_status not null default 'scheduled',
  scheduled_by uuid references profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index on interviews (organization_id, starts_at);

create table interview_participants (
  interview_id uuid not null references interviews on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  primary key (interview_id, user_id)
);

create table interview_feedback (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews on delete cascade,
  organization_id uuid not null references organizations on delete cascade,
  author_id uuid not null references profiles,
  rating smallint not null check (rating between 1 and 5),
  recommendation recommendation not null,
  comments text,
  created_at timestamptz not null default now(),
  unique (interview_id, author_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link text,
  entity_type text,
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on notifications (user_id, is_read, created_at desc);

create table notification_preferences (
  user_id uuid not null references profiles on delete cascade,
  type notification_type not null,
  in_app boolean not null default true,
  email boolean not null default true,
  primary key (user_id, type)
);

create table email_outbox (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  template text not null,
  payload jsonb not null default '{}',
  status email_status not null default 'queued',
  attempts smallint not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations on delete cascade,
  actor_id uuid references profiles on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on activity_logs (organization_id, created_at desc);

-- ============ HELPERS (used by policies) ============
create function is_super_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and platform_role = 'super_admin' and is_active)
$$;

-- A Super Admin counts as a full member (admin) of every organization.
create function is_org_member(org uuid) returns boolean language sql stable security definer set search_path = public as $$
  select is_super_admin() or exists (
    select 1 from organization_members m
    join organizations o on o.id = m.organization_id
    join profiles p on p.id = m.user_id
    where m.organization_id = org and m.user_id = auth.uid() and m.status = 'active'
      and o.status <> 'suspended' and p.is_active)
$$;

create function has_org_role(org uuid, roles member_role[]) returns boolean language sql stable security definer set search_path = public as $$
  select is_super_admin() or exists (
    select 1 from organization_members m
    join organizations o on o.id = m.organization_id
    join profiles p on p.id = m.user_id
    where m.organization_id = org and m.user_id = auth.uid() and m.status = 'active'
      and m.role = any (roles) and o.status <> 'suspended' and p.is_active)
$$;

create function is_org_member_any(org uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members where organization_id = org and user_id = auth.uid())
$$;

create function org_is_verified(org uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from organizations where id = org and status = 'verified')
$$;

create function shares_org_with(u uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members a join organization_members b on a.organization_id = b.organization_id
    where a.user_id = auth.uid() and a.status = 'active' and b.user_id = u)
$$;

create function is_hiring_team_for(candidate uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from applications a where a.candidate_id = candidate and is_org_member(a.organization_id))
$$;

create function is_member_of_applied_org(u uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from applications a join organization_members m on m.organization_id = a.organization_id
    where a.candidate_id = auth.uid() and m.user_id = u)
$$;

create function can_edit_job(job uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from jobs j where j.id = job and (
      has_org_role(j.organization_id, '{org_admin,hr_manager}')
      or (has_org_role(j.organization_id, '{recruiter}') and j.created_by = auth.uid())))
$$;

create function is_candidate_of(app uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from applications where id = app and candidate_id = auth.uid())
$$;

-- ============ INTERNAL HELPERS ============
create function log_activity(p_org uuid, p_action text, p_entity_type text, p_entity_id uuid, p_meta jsonb default '{}')
returns void language sql security definer set search_path = public as $$
  insert into activity_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  values (p_org, auth.uid(), p_action, p_entity_type, p_entity_id, p_meta)
$$;

create function notify(p_user uuid, p_type notification_type, p_title text, p_body text, p_link text,
  p_entity_type text default null, p_entity_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_in_app boolean; v_email boolean;
begin
  v_in_app := coalesce((select in_app from notification_preferences where user_id = p_user and type = p_type), true);
  v_email := coalesce((select email from notification_preferences where user_id = p_user and type = p_type), true);
  if v_in_app then
    insert into notifications (user_id, type, title, body, link, entity_type, entity_id)
    values (p_user, p_type, p_title, p_body, p_link, p_entity_type, p_entity_id);
  end if;
  if v_email then
    insert into email_outbox (to_email, template, payload)
    select email, p_type::text, jsonb_build_object('title', p_title, 'body', p_body, 'link', p_link)
    from profiles where id = p_user;
  end if;
end $$;

revoke execute on function log_activity(uuid, text, text, uuid, jsonb) from public, anon, authenticated;
revoke execute on function notify(uuid, notification_type, text, text, text, text, uuid) from public, anon, authenticated;

-- ============ TRIGGERS ============
create function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['profiles', 'organizations', 'jobs', 'candidate_profiles', 'applications',
    'application_notes', 'application_evaluations', 'interviews'] loop
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
  end loop;
end $$;

create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare v_role platform_role;
begin
  v_role := case when new.raw_user_meta_data ->> 'account_type' = 'organization_user'
    then 'organization_user'::platform_role else 'job_seeker'::platform_role end;
  insert into profiles (id, email, full_name, platform_role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''), v_role);
  if v_role = 'job_seeker' then insert into candidate_profiles (user_id) values (new.id); end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create function protect_profile() returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not is_super_admin() and (new.platform_role is distinct from old.platform_role
    or new.is_active is distinct from old.is_active or new.email is distinct from old.email) then
    raise exception 'NOT_ALLOWED';
  end if;
  return new;
end $$;
create trigger protect_profile before update on profiles for each row execute function protect_profile();

create function protect_organization() returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not is_super_admin() then
    if new.status is distinct from old.status then
      if old.status = 'rejected' and new.status = 'pending' then new.rejection_reason = null;
      else raise exception 'NOT_ALLOWED'; end if;
    end if;
    if new.verified_at is distinct from old.verified_at or new.verified_by is distinct from old.verified_by
      or new.created_by is distinct from old.created_by then raise exception 'NOT_ALLOWED'; end if;
  end if;
  return new;
end $$;
create trigger protect_organization before update on organizations for each row execute function protect_organization();

create function protect_last_admin() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'org_admin' and old.status = 'active'
    and (tg_op = 'DELETE' or new.role <> 'org_admin' or new.status <> 'active') then
    if not exists (select 1 from organization_members
      where organization_id = old.organization_id and role = 'org_admin' and status = 'active' and id <> old.id) then
      raise exception 'LAST_ADMIN';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger protect_last_admin before update or delete on organization_members for each row execute function protect_last_admin();

create function job_rules() returns trigger language plpgsql as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if not org_is_verified(new.organization_id) then raise exception 'ORG_NOT_VERIFIED'; end if;
    new.published_at = now();
  end if;
  if tg_op = 'UPDATE' and new.status = 'archived' and old.status <> 'archived'
    and not has_org_role(new.organization_id, '{org_admin,hr_manager}') then
    raise exception 'NOT_ALLOWED';
  end if;
  return new;
end $$;
create trigger job_rules before insert or update on jobs for each row execute function job_rules();

create function job_activity() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    perform log_activity(new.organization_id, 'job.' || new.status::text, 'job', new.id, jsonb_build_object('title', new.title));
  end if;
  return new;
end $$;
create trigger job_activity after insert or update on jobs for each row execute function job_activity();

create function org_from_application() returns trigger language plpgsql security definer set search_path = public as $$
begin
  select organization_id into new.organization_id from applications where id = new.application_id;
  return new;
end $$;
create trigger set_org before insert on application_notes for each row execute function org_from_application();
create trigger set_org before insert on application_evaluations for each row execute function org_from_application();
create trigger set_org before insert on application_messages for each row execute function org_from_application();

create function org_from_interview() returns trigger language plpgsql security definer set search_path = public as $$
begin
  select organization_id into new.organization_id from interviews where id = new.interview_id;
  return new;
end $$;
create trigger set_org before insert on interview_feedback for each row execute function org_from_interview();

create function message_notify() returns trigger language plpgsql security definer set search_path = public as $$
declare a applications; r record;
begin
  select * into a from applications where id = new.application_id;
  if new.sender_id = a.candidate_id then
    for r in select user_id from organization_members where organization_id = a.organization_id and status = 'active' loop
      perform notify(r.user_id, 'message_received', 'New message from a candidate', left(new.body, 120),
        '/org/applications/' || a.id, 'application', a.id);
    end loop;
  else
    perform notify(a.candidate_id, 'message_received', 'New message about your application', left(new.body, 120),
      '/seeker/applications', 'application', a.id);
  end if;
  return new;
end $$;
create trigger message_notify after insert on application_messages for each row execute function message_notify();

create function interview_clash() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from interview_participants p
    join interviews i on i.id = p.interview_id
    join interviews n on n.id = new.interview_id
    where p.user_id = new.user_id and i.id <> n.id and i.status = 'scheduled' and n.status = 'scheduled'
      and tstzrange(i.starts_at, i.ends_at) && tstzrange(n.starts_at, n.ends_at)) then
    raise exception 'INTERVIEWER_BUSY';
  end if;
  return new;
end $$;
create trigger interview_clash before insert on interview_participants for each row execute function interview_clash();

create function interview_notify() returns trigger language plpgsql security definer set search_path = public as $$
declare cand uuid; r record;
begin
  select candidate_id into cand from applications where id = new.application_id;
  if tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled' then
    perform notify(cand, 'interview_cancelled', 'Interview cancelled', new.title, '/seeker/interviews', 'interview', new.id);
    for r in select user_id from interview_participants where interview_id = new.id loop
      perform notify(r.user_id, 'interview_cancelled', 'Interview cancelled', new.title, '/org/interviews', 'interview', new.id);
    end loop;
  elsif tg_op = 'UPDATE' and new.status = 'scheduled' and (new.starts_at <> old.starts_at or new.location_or_link is distinct from old.location_or_link) then
    perform notify(cand, 'interview_updated', 'Interview details changed', new.title, '/seeker/interviews', 'interview', new.id);
    for r in select user_id from interview_participants where interview_id = new.id loop
      perform notify(r.user_id, 'interview_updated', 'Interview details changed', new.title, '/org/interviews', 'interview', new.id);
    end loop;
  end if;
  return new;
end $$;
create trigger interview_notify after update on interviews for each row execute function interview_notify();

-- ============ ACTIONS (called from the app) ============
create function create_organization(p_name text, p_slug text, p_industry text, p_city text, p_country text, p_email text)
returns uuid language plpgsql security definer set search_path = public as $$
declare oid uuid; r record;
begin
  if not exists (select 1 from profiles where id = auth.uid() and platform_role = 'organization_user' and is_active) then
    raise exception 'NOT_ALLOWED';
  end if;
  insert into organizations (name, slug, industry, city, country, contact_email, created_by)
  values (p_name, p_slug, p_industry, p_city, p_country, p_email, auth.uid()) returning id into oid;
  insert into organization_members (organization_id, user_id, role) values (oid, auth.uid(), 'org_admin');
  perform log_activity(oid, 'organization.created', 'organization', oid, jsonb_build_object('name', p_name));
  for r in select id from profiles where platform_role = 'super_admin' and is_active loop
    perform notify(r.id, 'organization_submitted', 'New organization to review', p_name, '/admin/organizations/' || oid, 'organization', oid);
  end loop;
  return oid;
end $$;

create function review_organization(p_org uuid, p_status organization_status, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare o organizations; r record;
begin
  if not is_super_admin() then raise exception 'NOT_ALLOWED'; end if;
  select * into o from organizations where id = p_org;
  if not found then raise exception 'NOT_FOUND'; end if;
  update organizations set status = p_status,
    verified_at = case when p_status = 'verified' then now() else verified_at end,
    verified_by = case when p_status = 'verified' then auth.uid() else verified_by end,
    rejection_reason = case when p_status in ('rejected', 'suspended') then p_reason else null end
  where id = p_org;
  perform log_activity(p_org, 'organization.' || p_status::text, 'organization', p_org, jsonb_build_object('reason', p_reason));
  for r in select user_id from organization_members where organization_id = p_org and role = 'org_admin' loop
    perform notify(r.user_id,
      case when p_status = 'verified' then 'organization_verified'::notification_type else 'organization_rejected'::notification_type end,
      case p_status when 'verified' then 'Your organization is verified'
        when 'rejected' then 'Your organization was not approved'
        when 'suspended' then 'Your organization was suspended'
        else 'Your organization status changed' end,
      p_reason, case when p_status = 'verified' then '/org/jobs' else '/org/settings' end, 'organization', p_org);
  end loop;
end $$;

create function invite_info(p_token text)
returns table (org_name text, role member_role, email text, valid boolean)
language sql stable security definer set search_path = public as $$
  select o.name, i.role, i.email, (i.status = 'pending' and i.expires_at > now())
  from invitations i join organizations o on o.id = i.organization_id
  where i.token_hash = encode(sha256(convert_to(p_token, 'utf8')), 'hex')
$$;

create function accept_invitation(p_token text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv invitations; mail text; r record;
begin
  select * into inv from invitations
  where token_hash = encode(sha256(convert_to(p_token, 'utf8')), 'hex') and status = 'pending' for update;
  if not found or inv.expires_at < now() then raise exception 'INVITE_INVALID'; end if;
  select email into mail from profiles where id = auth.uid();
  if lower(mail) <> lower(inv.email) then raise exception 'INVITE_WRONG_EMAIL'; end if;
  if not exists (select 1 from profiles where id = auth.uid() and platform_role = 'organization_user') then
    raise exception 'INVITE_WRONG_ACCOUNT';
  end if;
  insert into organization_members (organization_id, user_id, role, invited_by)
  values (inv.organization_id, auth.uid(), inv.role, inv.invited_by)
  on conflict (organization_id, user_id) do update set role = excluded.role, status = 'active';
  update invitations set status = 'accepted', accepted_at = now() where id = inv.id;
  perform log_activity(inv.organization_id, 'member.joined', 'member', auth.uid(), jsonb_build_object('role', inv.role));
  for r in select user_id from organization_members where organization_id = inv.organization_id and role = 'org_admin' loop
    perform notify(r.user_id, 'team_member_joined', 'A new team member joined', mail, '/org/team');
  end loop;
  return inv.organization_id;
end $$;

create function apply_to_job(p_job uuid, p_resume uuid, p_cover text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare j jobs; app uuid; r record;
begin
  if not exists (select 1 from profiles where id = auth.uid() and platform_role = 'job_seeker' and is_active) then
    raise exception 'NOT_ALLOWED';
  end if;
  select * into j from jobs where id = p_job;
  if not found or j.status <> 'published' or (j.closes_at is not null and j.closes_at < now())
    or not org_is_verified(j.organization_id) then raise exception 'JOB_CLOSED'; end if;
  if exists (select 1 from applications where job_id = p_job and candidate_id = auth.uid()) then
    raise exception 'ALREADY_APPLIED';
  end if;
  if not exists (select 1 from resumes where id = p_resume and user_id = auth.uid() and not is_removed) then
    raise exception 'BAD_RESUME';
  end if;
  insert into applications (job_id, organization_id, candidate_id, resume_id, cover_letter)
  values (p_job, j.organization_id, auth.uid(), p_resume, nullif(trim(p_cover), '')) returning id into app;
  insert into application_status_history (application_id, organization_id, from_status, to_status, changed_by)
  values (app, j.organization_id, null, 'applied', auth.uid());
  for r in select user_id from organization_members where organization_id = j.organization_id and status = 'active' loop
    perform notify(r.user_id, 'application_received', 'New application', j.title, '/org/applications/' || app, 'application', app);
  end loop;
  perform log_activity(j.organization_id, 'application.received', 'application', app, jsonb_build_object('job', j.title));
  return app;
end $$;

create function change_application_status(p_app uuid, p_status application_status, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare a applications; t text;
begin
  select * into a from applications where id = p_app;
  if not found or not has_org_role(a.organization_id, '{org_admin,hr_manager,recruiter}') then raise exception 'NOT_ALLOWED'; end if;
  if a.status = 'withdrawn' or p_status = 'withdrawn' then raise exception 'NOT_ALLOWED'; end if;
  if a.status = p_status then return; end if;
  update applications set status = p_status, status_changed_at = now(),
    is_shortlisted = is_shortlisted or p_status = 'shortlisted' where id = p_app;
  insert into application_status_history (application_id, organization_id, from_status, to_status, changed_by, note)
  values (p_app, a.organization_id, a.status, p_status, auth.uid(), nullif(trim(p_note), ''));
  select title into t from jobs where id = a.job_id;
  perform notify(a.candidate_id, 'application_status_changed', 'Your application was updated',
    t || ': ' || initcap(replace(p_status::text, '_', ' ')), '/seeker/applications', 'application', p_app);
  perform log_activity(a.organization_id, 'application.' || p_status::text, 'application', p_app, jsonb_build_object('job', t));
end $$;

create function rate_application(p_app uuid, p_rating smallint) returns void
language plpgsql security definer set search_path = public as $$
declare org uuid;
begin
  select organization_id into org from applications where id = p_app;
  if org is null or not has_org_role(org, '{org_admin,hr_manager,recruiter}') then raise exception 'NOT_ALLOWED'; end if;
  update applications set rating = p_rating where id = p_app;
end $$;

create function withdraw_application(p_app uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a applications;
begin
  select * into a from applications where id = p_app and candidate_id = auth.uid();
  if not found or a.status in ('hired', 'rejected', 'withdrawn') then raise exception 'NOT_ALLOWED'; end if;
  update applications set status = 'withdrawn', status_changed_at = now() where id = p_app;
  insert into application_status_history (application_id, organization_id, from_status, to_status, changed_by)
  values (p_app, a.organization_id, a.status, 'withdrawn', auth.uid());
  perform log_activity(a.organization_id, 'application.withdrawn', 'application', p_app);
end $$;

create function my_application_timeline(p_app uuid) returns table (to_status application_status, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select h.to_status, h.created_at from application_status_history h
  join applications a on a.id = h.application_id
  where h.application_id = p_app and a.candidate_id = auth.uid() order by h.created_at
$$;

create function schedule_interview(p_app uuid, p_title text, p_mode interview_mode, p_starts timestamptz, p_ends timestamptz,
  p_place text, p_instructions text, p_participants uuid[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare a applications; iid uuid; u uuid; t text;
begin
  select * into a from applications where id = p_app;
  if not found or not has_org_role(a.organization_id, '{org_admin,hr_manager,recruiter}') then raise exception 'NOT_ALLOWED'; end if;
  insert into interviews (application_id, organization_id, title, mode, starts_at, ends_at, location_or_link, instructions, scheduled_by)
  values (p_app, a.organization_id, p_title, p_mode, p_starts, p_ends, nullif(trim(p_place), ''), nullif(trim(p_instructions), ''), auth.uid())
  returning id into iid;
  foreach u in array coalesce(p_participants, '{}') loop
    if not exists (select 1 from organization_members where organization_id = a.organization_id and user_id = u and status = 'active') then
      raise exception 'NOT_ALLOWED';
    end if;
    insert into interview_participants (interview_id, user_id) values (iid, u);
    perform notify(u, 'interview_scheduled', 'You have an interview to run', p_title, '/org/interviews', 'interview', iid);
  end loop;
  select title into t from jobs where id = a.job_id;
  perform notify(a.candidate_id, 'interview_scheduled', 'Interview scheduled', t || ': ' || p_title, '/seeker/interviews', 'interview', iid);
  perform log_activity(a.organization_id, 'interview.scheduled', 'interview', iid, jsonb_build_object('job', t));
  return iid;
end $$;

-- ============ NUMBERS FOR DASHBOARDS ============
create function org_dashboard_stats(p_org uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_org_member(p_org) then raise exception 'NOT_ALLOWED'; end if;
  return jsonb_build_object(
    'open_jobs', (select count(*) from jobs where organization_id = p_org and status = 'published'),
    'total_applications', (select count(*) from applications where organization_id = p_org),
    'new_applications_week', (select count(*) from applications where organization_id = p_org and applied_at > now() - interval '7 days'),
    'interviews_week', (select count(*) from interviews where organization_id = p_org and status = 'scheduled'
      and starts_at between now() and now() + interval '7 days'),
    'hires_month', (select count(*) from applications where organization_id = p_org and status = 'hired'
      and status_changed_at > date_trunc('month', now())));
end $$;

create function org_analytics(p_org uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare all_access boolean;
begin
  if not is_org_member(p_org) then raise exception 'NOT_ALLOWED'; end if;
  all_access := has_org_role(p_org, '{org_admin,hr_manager}');
  return jsonb_build_object(
    'funnel', (select coalesce(jsonb_agg(jsonb_build_object('status', s, 'count', c)), '[]') from (
      select a.status as s, count(*) as c from applications a join jobs j on j.id = a.job_id
      where a.organization_id = p_org and (all_access or j.created_by = auth.uid()) group by a.status) f),
    'per_job', (select coalesce(jsonb_agg(jsonb_build_object('title', title, 'count', c)), '[]') from (
      select j.title, count(a.id) as c from jobs j left join applications a on a.job_id = j.id
      where j.organization_id = p_org and (all_access or j.created_by = auth.uid())
      group by j.id, j.title order by c desc limit 8) p),
    'days_to_hire', (select round(avg(extract(epoch from (a.status_changed_at - a.applied_at)) / 86400)::numeric, 1)
      from applications a join jobs j on j.id = a.job_id
      where a.organization_id = p_org and a.status = 'hired' and (all_access or j.created_by = auth.uid())),
    'hires_by_month', (select coalesce(jsonb_agg(jsonb_build_object('month', m, 'count', c) order by d), '[]') from (
      select to_char(date_trunc('month', a.status_changed_at), 'Mon YY') as m, date_trunc('month', a.status_changed_at) as d, count(*) as c
      from applications a join jobs j on j.id = a.job_id
      where a.organization_id = p_org and a.status = 'hired' and a.status_changed_at > now() - interval '6 months'
        and (all_access or j.created_by = auth.uid()) group by 1, 2) h));
end $$;

create function platform_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_super_admin() then raise exception 'NOT_ALLOWED'; end if;
  return jsonb_build_object(
    'orgs_by_status', (select coalesce(jsonb_agg(jsonb_build_object('label', status, 'count', c)), '[]')
      from (select status, count(*) c from organizations group by status) o),
    'users_by_role', (select coalesce(jsonb_agg(jsonb_build_object('label', platform_role, 'count', c)), '[]')
      from (select platform_role, count(*) c from profiles group by platform_role) u),
    'jobs_by_status', (select coalesce(jsonb_agg(jsonb_build_object('label', status, 'count', c)), '[]')
      from (select status, count(*) c from jobs group by status) j),
    'total_applications', (select count(*) from applications),
    'signups_by_week', (select coalesce(jsonb_agg(jsonb_build_object('label', w, 'count', c) order by d), '[]') from (
      select to_char(date_trunc('week', created_at), 'DD Mon') as w, date_trunc('week', created_at) as d, count(*) as c
      from profiles where created_at > now() - interval '8 weeks' group by 1, 2) s));
end $$;

-- ============ ROW LEVEL SECURITY ============
do $$ declare t text; begin
  foreach t in array array['profiles', 'organizations', 'organization_members', 'invitations', 'verification_documents',
    'job_categories', 'skills', 'jobs', 'job_skills', 'candidate_profiles', 'candidate_experiences', 'candidate_educations',
    'candidate_skills', 'resumes', 'saved_jobs', 'applications', 'application_status_history', 'application_notes',
    'application_evaluations', 'application_messages', 'interviews', 'interview_participants', 'interview_feedback',
    'notifications', 'notification_preferences', 'email_outbox', 'activity_logs'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- profiles
create policy "read" on profiles for select using (
  id = auth.uid() or is_super_admin() or shares_org_with(id) or is_hiring_team_for(id) or is_member_of_applied_org(id));
create policy "update" on profiles for update using (id = auth.uid() or is_super_admin()) with check (id = auth.uid() or is_super_admin());

-- organizations
create policy "read" on organizations for select using (status = 'verified' or is_super_admin() or is_org_member_any(id));
create policy "update" on organizations for update using (has_org_role(id, '{org_admin}') or is_super_admin())
  with check (has_org_role(id, '{org_admin}') or is_super_admin());

-- members
create policy "read" on organization_members for select using (user_id = auth.uid() or is_org_member(organization_id) or is_super_admin());
create policy "admin update" on organization_members for update using (has_org_role(organization_id, '{org_admin}'))
  with check (has_org_role(organization_id, '{org_admin}'));
create policy "hr update recruiters" on organization_members for update using (has_org_role(organization_id, '{hr_manager}') and role = 'recruiter')
  with check (role = 'recruiter');
create policy "admin delete" on organization_members for delete using (has_org_role(organization_id, '{org_admin}'));
create policy "hr delete recruiters" on organization_members for delete using (has_org_role(organization_id, '{hr_manager}') and role = 'recruiter');

-- invitations
create policy "read" on invitations for select using (has_org_role(organization_id, '{org_admin,hr_manager}'));
create policy "insert" on invitations for insert with check (
  invited_by = auth.uid() and (has_org_role(organization_id, '{org_admin}') or (has_org_role(organization_id, '{hr_manager}') and role = 'recruiter')));
create policy "update" on invitations for update using (has_org_role(organization_id, '{org_admin,hr_manager}'))
  with check (has_org_role(organization_id, '{org_admin}') or (has_org_role(organization_id, '{hr_manager}') and role = 'recruiter'));

-- verification documents
create policy "read" on verification_documents for select using (has_org_role(organization_id, '{org_admin}') or is_super_admin());
create policy "insert" on verification_documents for insert with check (has_org_role(organization_id, '{org_admin}') and uploaded_by = auth.uid());
create policy "delete" on verification_documents for delete using (
  has_org_role(organization_id, '{org_admin}') and exists (select 1 from organizations o where o.id = organization_id and o.status in ('pending', 'rejected')));

-- categories and skills
create policy "read" on job_categories for select using (true);
create policy "admin write" on job_categories for all using (is_super_admin()) with check (is_super_admin());
create policy "read" on skills for select using (true);
create policy "add" on skills for insert with check (auth.uid() is not null);
create policy "admin delete" on skills for delete using (is_super_admin());

-- jobs
create policy "read" on jobs for select using (
  (status = 'published' and (closes_at is null or closes_at > now()) and org_is_verified(organization_id))
  or is_org_member(organization_id) or is_super_admin());
create policy "insert" on jobs for insert with check (has_org_role(organization_id, '{org_admin,hr_manager,recruiter}') and created_by = auth.uid());
create policy "update" on jobs for update using (can_edit_job(id)) with check (has_org_role(organization_id, '{org_admin,hr_manager,recruiter}'));
create policy "delete" on jobs for delete using (has_org_role(organization_id, '{org_admin,hr_manager}'));
create policy "read" on job_skills for select using (exists (select 1 from jobs j where j.id = job_id));
create policy "write" on job_skills for all using (can_edit_job(job_id)) with check (can_edit_job(job_id));

-- candidates
create policy "read" on candidate_profiles for select using (user_id = auth.uid() or is_hiring_team_for(user_id) or is_super_admin());
create policy "write" on candidate_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
do $$ declare t text; begin
  foreach t in array array['candidate_experiences', 'candidate_educations', 'candidate_skills'] loop
    execute format('create policy "read" on %I for select using (user_id = auth.uid() or is_hiring_team_for(user_id) or is_super_admin())', t);
    execute format('create policy "write" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
create policy "read" on resumes for select using (
  user_id = auth.uid() or exists (select 1 from applications a where a.resume_id = resumes.id and is_org_member(a.organization_id)));
create policy "write" on resumes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner" on saved_jobs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- applications (changes go through the actions above)
create policy "read" on applications for select using (candidate_id = auth.uid() or is_org_member(organization_id) or is_super_admin());
create policy "read" on application_status_history for select using (is_org_member(organization_id) or is_super_admin());

create policy "read" on application_notes for select using (is_org_member(organization_id));
create policy "insert" on application_notes for insert with check (author_id = auth.uid() and is_org_member(organization_id));
create policy "update" on application_notes for update using (author_id = auth.uid() and is_org_member(organization_id));
create policy "delete" on application_notes for delete using (author_id = auth.uid() and is_org_member(organization_id));

create policy "read" on application_evaluations for select using (is_org_member(organization_id));
create policy "insert" on application_evaluations for insert with check (evaluator_id = auth.uid() and is_org_member(organization_id));
create policy "update" on application_evaluations for update using (evaluator_id = auth.uid() and is_org_member(organization_id));
create policy "delete" on application_evaluations for delete using (evaluator_id = auth.uid() and is_org_member(organization_id));

create policy "read" on application_messages for select using (is_org_member(organization_id) or is_candidate_of(application_id));
create policy "insert" on application_messages for insert with check (
  sender_id = auth.uid() and (is_org_member(organization_id) or is_candidate_of(application_id)));

-- interviews
create policy "read" on interviews for select using (is_org_member(organization_id) or is_candidate_of(application_id));
create policy "update" on interviews for update using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy "read" on interview_participants for select using (exists (select 1 from interviews i where i.id = interview_id));
create policy "read" on interview_feedback for select using (is_org_member(organization_id));
create policy "insert" on interview_feedback for insert with check (author_id = auth.uid() and is_org_member(organization_id));
create policy "update" on interview_feedback for update using (author_id = auth.uid() and is_org_member(organization_id));
create policy "delete" on interview_feedback for delete using (author_id = auth.uid() and is_org_member(organization_id));

-- notifications and logs
create policy "read" on notifications for select using (user_id = auth.uid());
create policy "update" on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete" on notifications for delete using (user_id = auth.uid());
create policy "owner" on notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read" on activity_logs for select using (has_org_role(organization_id, '{org_admin}') or is_super_admin());

alter publication supabase_realtime add table notifications;

-- ============ STORAGE ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('org-assets', 'org-assets', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('resumes', 'resumes', false, 5242880, array['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('verification-docs', 'verification-docs', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "public read" on storage.objects for select using (bucket_id in ('avatars', 'org-assets'));
create policy "avatars write" on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "org assets write" on storage.objects for all
  using (bucket_id = 'org-assets' and has_org_role(((storage.foldername(name))[1])::uuid, '{org_admin}'))
  with check (bucket_id = 'org-assets' and has_org_role(((storage.foldername(name))[1])::uuid, '{org_admin}'));
create policy "resumes read" on storage.objects for select using (bucket_id = 'resumes' and (
  (storage.foldername(name))[1] = auth.uid()::text
  or exists (select 1 from resumes r join applications a on a.resume_id = r.id
    where r.file_path = name and is_org_member(a.organization_id))));
create policy "resumes write" on storage.objects for insert
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resumes delete" on storage.objects for delete
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "docs read" on storage.objects for select using (bucket_id = 'verification-docs' and (
  has_org_role(((storage.foldername(name))[1])::uuid, '{org_admin}') or is_super_admin()));
create policy "docs write" on storage.objects for insert
  with check (bucket_id = 'verification-docs' and has_org_role(((storage.foldername(name))[1])::uuid, '{org_admin}'));
create policy "docs delete" on storage.objects for delete
  using (bucket_id = 'verification-docs' and has_org_role(((storage.foldername(name))[1])::uuid, '{org_admin}'));
