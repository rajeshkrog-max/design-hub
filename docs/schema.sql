create extension if not exists "pgcrypto";

create table institutes (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null, logo_url text,
  plan text default 'pilot', status text default 'active',
  pass_bar int default 60, ceo_threshold int default 65,
  created_at timestamptz default now());

create table institute_users (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id) on delete cascade,
  auth_user_id uuid unique not null, email text not null, name text,
  role text not null check (role in ('admin','viewer')),
  status text default 'active', created_at timestamptz default now());

create table batches (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id) on delete cascade,
  name text not null, program text, year int,
  invite_code text unique, created_at timestamptz default now());

-- institute students sign in with institute code + WhatsApp OTP;
-- independent candidates with email + WhatsApp OTP and have no institute, batch or credits from an institute
create table students (
  id uuid primary key default gen_random_uuid(),
  account_type text not null default 'institute' check (account_type in ('institute','independent')),
  institute_id uuid references institutes(id) on delete cascade,
  batch_id uuid references batches(id),
  auth_user_id uuid unique, email text, phone text unique, name text,
  photo_url text, status text default 'invited' check (status in ('invited','active','archived')),
  credits_total int not null default 0, credits_used int not null default 0,
  plan text check (plan in ('standard','pro')),
  consent_at timestamptz, created_at timestamptz default now(),
  unique (institute_id, email),
  check ((account_type = 'institute') = (institute_id is not null)),
  check (account_type = 'independent' or plan is null));

-- institute_id on student-owned rows is null for independent candidates
create table student_profiles (
  student_id uuid primary key references students(id) on delete cascade,
  institute_id uuid references institutes(id),
  personal jsonb, education jsonb, skills jsonb, preferences jsonb,
  summary text, experience jsonb, projects jsonb, certifications jsonb,
  achievements jsonb, activities jsonb, languages jsonb,
  strength_score int default 0, strength_tier text,
  required_complete boolean default false,
  cv_file_key text, cv_extracted jsonb, updated_at timestamptz default now());

create table company_profiles (
  id uuid primary key default gen_random_uuid(),
  source text default 'web' check (source in ('web','manual','yzi_dashboard')),
  name text not null, sector text, sub_sector text, city text, size text,
  role text, ctc_min numeric, ctc_max numeric, tier text,
  jd jsonb, requirements text[], interview_style text,
  sources text[], is_sample boolean default true,
  generated_at timestamptz default now(), expires_at timestamptz);

create table interview_sessions (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid references institutes(id),
  student_id uuid not null references students(id) on delete cascade,
  attempt_no int not null default 1,
  company_profile_id uuid references company_profiles(id),
  company_options uuid[],
  context jsonb,
  status text default 'in_progress' check (status in ('in_progress','completed','abandoned','restarted')),
  average_score numeric, ceo_unlocked boolean default false,
  started_at timestamptz default now(), completed_at timestamptz,
  unique (student_id, attempt_no));

create table session_rounds (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid references institutes(id),
  session_id uuid not null references interview_sessions(id) on delete cascade,
  round text not null check (round in ('screening','hr_bp','functional','ceo')),
  try_no int not null default 1 check (try_no in (1,2)),
  is_current boolean default true,
  persona text, retell_agent_id text, retell_call_id text,
  status text default 'locked' check (status in ('locked','ready','live','completed','incomplete')),
  progress_pct int default 0,
  score int, verdict text check (verdict in ('passed','needs_improvement')),
  rubric jsonb, strengths jsonb, gaps jsonb, expertise text,
  notes_for_next text, transcript_key text,
  resume_used boolean default false, disconnect_count int default 0,
  duration_sec int, started_at timestamptz, ended_at timestamptz,
  unique (session_id, round, try_no));

create table aptitude_attempts (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid references institutes(id),
  round_id uuid not null references session_rounds(id) on delete cascade,
  questions jsonb not null, answers jsonb,
  mcq_score int, written_feedback jsonb, submitted_at timestamptz);

create table offers (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid references institutes(id),
  session_id uuid unique not null references interview_sessions(id) on delete cascade,
  role text, ctc numeric, joining text,
  decision text check (decision in ('pending','accepted','declined')) default 'pending',
  decided_at timestamptz);

create table reports (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid references institutes(id),
  session_id uuid not null references interview_sessions(id) on delete cascade,
  overall_score int, verdict text, report jsonb,
  pdf_key text, created_at timestamptz default now());

create table gap_diagnoses (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid references institutes(id),
  session_id uuid not null references interview_sessions(id) on delete cascade,
  gap_type text check (gap_type in ('communication','skill','expectation','aptitude')),
  title text, evidence text, resource_ids uuid[]);

create table resources (
  id uuid primary key default gen_random_uuid(),
  gap_type text, skill text, level text, title text, url text,
  kind text, is_paid boolean default false, is_affiliate boolean default false);

create table restart_requests (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id),
  student_id uuid not null references students(id) on delete cascade,
  session_id uuid not null references interview_sessions(id),
  reason text, status text default 'pending' check (status in ('pending','approved','declined','used')),
  decided_by uuid references institute_users(id), decided_at timestamptz,
  created_at timestamptz default now());

create table batch_reports (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id),
  batch_id uuid not null references batches(id) on delete cascade,
  period_start date, period_end date, summary jsonb, pdf_key text,
  generated_by uuid references institute_users(id), created_at timestamptz default now());

create table consents (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid references institutes(id),
  student_id uuid not null references students(id) on delete cascade,
  purpose text, version text, guardian_ref text, at timestamptz default now());

create table audit_log (
  id bigserial primary key,
  institute_id uuid references institutes(id),
  actor_id uuid, actor_type text, action text, target_type text, target_id uuid,
  at timestamptz default now());

-- helpers
create or replace function my_institute_id() returns uuid
language sql stable security definer as $$
  select institute_id from institute_users where auth_user_id = auth.uid() and status = 'active'
$$;
create or replace function my_student_id() returns uuid
language sql stable security definer as $$
  select id from students where auth_user_id = auth.uid()
$$;

-- row level security: institutes see only their own rows, students only their own.
-- independent candidates have institute_id null, so no institute policy ever matches their rows.
alter table institutes enable row level security;
alter table institute_users enable row level security;
alter table batches enable row level security;
alter table students enable row level security;
alter table student_profiles enable row level security;
alter table interview_sessions enable row level security;
alter table session_rounds enable row level security;
alter table aptitude_attempts enable row level security;
alter table offers enable row level security;
alter table reports enable row level security;
alter table gap_diagnoses enable row level security;
alter table restart_requests enable row level security;
alter table batch_reports enable row level security;
alter table consents enable row level security;
alter table audit_log enable row level security;

create policy inst_self on institutes for select using (id = my_institute_id());
create policy inst_users on institute_users for select using (institute_id = my_institute_id());
create policy inst_batches on batches for all using (institute_id = my_institute_id());
create policy inst_students on students for select using (institute_id = my_institute_id());
create policy stu_self on students for select using (id = my_student_id());

-- the same two policies for every student-owned table
create policy inst_read on student_profiles for select using (institute_id = my_institute_id());
create policy stu_rw on student_profiles for all using (student_id = my_student_id());
create policy inst_read on interview_sessions for select using (institute_id = my_institute_id());
create policy stu_read on interview_sessions for select using (student_id = my_student_id());
create policy inst_read on session_rounds for select using (institute_id = my_institute_id());
create policy stu_read on session_rounds for select using (session_id in (select id from interview_sessions where student_id = my_student_id()));
create policy inst_read on aptitude_attempts for select using (institute_id = my_institute_id());
create policy inst_read on offers for select using (institute_id = my_institute_id());
create policy stu_read on offers for select using (session_id in (select id from interview_sessions where student_id = my_student_id()));
create policy inst_read on reports for select using (institute_id = my_institute_id());
create policy stu_read on reports for select using (session_id in (select id from interview_sessions where student_id = my_student_id()));
create policy inst_read on gap_diagnoses for select using (institute_id = my_institute_id());
create policy inst_rw on restart_requests for all using (institute_id = my_institute_id());
create policy stu_req on restart_requests for select using (student_id = my_student_id());
create policy inst_rw on batch_reports for all using (institute_id = my_institute_id());
create policy inst_read on consents for select using (institute_id = my_institute_id());
create policy inst_read on audit_log for select using (institute_id = my_institute_id());
-- scores, verdicts, offers and round results are written only by server functions (service role), never by the browser.
