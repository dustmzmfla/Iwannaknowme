-- ============================================================================
-- 나를 알려줘 (I wanna know me) — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 한 번 실행하세요.
-- 카카오 로그인은 Supabase Auth > Providers > Kakao 에서 별도로 설정합니다
-- (REST API 키 / Client Secret을 등록하고, 카카오 디벨로퍼스에는
--  `${SUPABASE_URL}/auth/v1/callback` 을 Redirect URI로 등록).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── profiles ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  kakao_id text unique not null,
  name text not null default '사용자',
  avatar_url text,
  birth_date date,
  status text not null default 'active' check (status in ('active', 'suspended')),
  role text not null default 'user' check (role in ('user', 'admin')),
  terms_agreed_at timestamptz,
  privacy_required_agreed_at timestamptz,
  privacy_optional_agreed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── admin_allowlist ─────────────────────────────────────────────────────
-- 여기 등록된 kakao_id로 로그인하면 자동으로 profiles.role = 'admin' 이 됩니다.
create table if not exists public.admin_allowlist (
  kakao_id text primary key,
  label text,
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── categories / question_bank ──────────────────────────────────────────
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  text text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── questionnaires / responses ──────────────────────────────────────────
-- questions는 "발행 시점 스냅샷"입니다. 질문지는 발행 후 수정할 수 없습니다
-- (이미 받은 답변과 안 꼬이게 하기 위해 의도적으로 UPDATE 정책을 두지 않았습니다).
create table if not exists public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  creator_name text not null,
  questions jsonb not null,
  relation_required boolean not null default true,
  final_message_required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.questionnaires(id) on delete cascade,
  nickname text,
  is_anonymous boolean not null default false,
  relation_duration text not null,
  relation_closeness text not null check (relation_closeness in ('악연', '지인', '친구', '절친', '인연')),
  final_message text not null,
  answers jsonb not null default '{}'::jsonb,
  visibility text not null default 'active' check (visibility in ('active', 'hidden_by_user', 'purged')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_label text not null,
  action text not null,
  target_type text not null check (target_type in ('response', 'user', 'admin')),
  target_id text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_question_bank_category on public.question_bank(category_id);
create index if not exists idx_questionnaires_owner on public.questionnaires(owner_id);
create index if not exists idx_responses_questionnaire on public.responses(questionnaire_id);
create index if not exists idx_audit_log_target on public.admin_audit_log(target_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.admin_allowlist enable row level security;
alter table public.categories enable row level security;
alter table public.question_bank enable row level security;
alter table public.questionnaires enable row level security;
alter table public.responses enable row level security;
alter table public.admin_audit_log enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "admin_allowlist_select_admin" on public.admin_allowlist
  for select using (public.is_admin());
create policy "admin_audit_log_select_admin" on public.admin_audit_log
  for select using (public.is_admin());

create policy "categories_select_all" on public.categories for select using (true);
create policy "question_bank_select_all" on public.question_bank for select using (true);

create policy "questionnaires_select_all" on public.questionnaires for select using (true);
create policy "questionnaires_insert_own" on public.questionnaires
  for insert to authenticated with check (owner_id = auth.uid());

create policy "responses_insert_anyone" on public.responses
  for insert with check (visibility = 'active');
create policy "responses_select_owner_or_admin" on public.responses
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.questionnaires q
      where q.id = questionnaire_id and q.owner_id = auth.uid()
    )
  );

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.question_bank, public.questionnaires to anon, authenticated;
grant insert on public.questionnaires to authenticated;
grant insert on public.responses to anon, authenticated;
grant select on public.responses to anon, authenticated;
grant select on public.profiles, public.admin_allowlist, public.admin_audit_log to authenticated;

-- ============================================================================
-- 신규 가입 시 profiles 자동 생성 + admin_allowlist 동기화
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kakao_id text;
  v_name text;
  v_avatar text;
  v_role text := 'user';
begin
  -- ⚠️ 카카오 로그인 시 Supabase가 raw_user_meta_data에 채워주는 필드명은
  -- 실제 로그인 1회 후 auth.users.raw_user_meta_data를 확인해서 필요하면 조정하세요.
  v_kakao_id := coalesce(
    new.raw_user_meta_data ->> 'provider_id',
    new.raw_user_meta_data ->> 'sub',
    new.id::text
  );
  v_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'nickname',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'preferred_username',
    '사용자'
  );
  v_avatar := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );

  if exists (select 1 from public.admin_allowlist where kakao_id = v_kakao_id) then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, kakao_id, name, avatar_url, role)
  values (new.id, v_kakao_id, v_name, v_avatar, v_role)
  on conflict (id) do update
    set name = excluded.name, avatar_url = excluded.avatar_url;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RPC 함수 (전부 SECURITY DEFINER — 권한 검사를 함수 내부에서 직접 수행)
-- ============================================================================

create or replace function public.complete_signup(
  p_terms_agreed boolean,
  p_privacy_required_agreed boolean,
  p_privacy_optional_agreed boolean,
  p_birth_date date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kakao_id text;
  v_should_be_admin boolean;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;

  select kakao_id into v_kakao_id from public.profiles where id = auth.uid();
  v_should_be_admin := exists (select 1 from public.admin_allowlist where kakao_id = v_kakao_id);

  update public.profiles set
    terms_agreed_at = case when p_terms_agreed then now() else terms_agreed_at end,
    privacy_required_agreed_at = case when p_privacy_required_agreed then now() else privacy_required_agreed_at end,
    privacy_optional_agreed_at = case when p_privacy_optional_agreed then now() else privacy_optional_agreed_at end,
    birth_date = case when p_privacy_optional_agreed then p_birth_date else null end,
    role = case when v_should_be_admin then 'admin' else role end
  where id = auth.uid();
end;
$$;

create or replace function public.admin_set_user_status(p_user_id uuid, p_suspended boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 가능합니다'; end if;
  update public.profiles set status = case when p_suspended then 'suspended' else 'active' end
    where id = p_user_id;
  insert into public.admin_audit_log (actor_id, actor_label, action, target_type, target_id)
  values (auth.uid(), coalesce((select name from public.profiles where id = auth.uid()), '관리자'),
    case when p_suspended then 'suspend_user' else 'unsuspend_user' end, 'user', p_user_id::text);
end;
$$;

create or replace function public.admin_hide_response(p_response_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 가능합니다'; end if;
  update public.responses set visibility = 'hidden_by_user', moderated_at = now() where id = p_response_id;
  insert into public.admin_audit_log (actor_id, actor_label, action, target_type, target_id, note)
  values (auth.uid(), coalesce((select name from public.profiles where id = auth.uid()), '관리자'),
    'hide_response', 'response', p_response_id::text, '관리자가 직접 숨김 처리함');
end;
$$;

create or replace function public.admin_restore_response(p_response_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 가능합니다'; end if;
  update public.responses set visibility = 'active', moderated_at = now() where id = p_response_id;
  insert into public.admin_audit_log (actor_id, actor_label, action, target_type, target_id)
  values (auth.uid(), coalesce((select name from public.profiles where id = auth.uid()), '관리자'),
    'restore_response', 'response', p_response_id::text);
end;
$$;

create or replace function public.admin_purge_response(p_response_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 가능합니다'; end if;
  update public.responses set visibility = 'purged', moderated_at = now() where id = p_response_id;
  insert into public.admin_audit_log (actor_id, actor_label, action, target_type, target_id, note)
  values (auth.uid(), coalesce((select name from public.profiles where id = auth.uid()), '관리자'),
    'purge_response', 'response', p_response_id::text, '영구 삭제 — 이후 어떤 관리자도 복구할 수 없음');
end;
$$;

create or replace function public.user_hide_own_response(p_response_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.responses r
    join public.questionnaires q on q.id = r.questionnaire_id
    where r.id = p_response_id and q.owner_id = auth.uid()
  ) then
    raise exception '본인 질문지의 답변만 삭제할 수 있습니다';
  end if;
  update public.responses set visibility = 'hidden_by_user', moderated_at = now() where id = p_response_id;
  insert into public.admin_audit_log (actor_id, actor_label, action, target_type, target_id, note)
  values ('system', '유저 본인', 'hide_response', 'response', p_response_id::text,
    '유저가 자신의 화면에서 답변을 삭제함 (관리자에게는 계속 조회/복구 가능)');
end;
$$;

create or replace function public.admin_add_admin(p_kakao_id text, p_label text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 가능합니다'; end if;
  insert into public.admin_allowlist (kakao_id, label, added_by) values (p_kakao_id, p_label, auth.uid())
    on conflict (kakao_id) do update set label = excluded.label;
  update public.profiles set role = 'admin' where kakao_id = p_kakao_id;
  insert into public.admin_audit_log (actor_id, actor_label, action, target_type, target_id, note)
  values (auth.uid(), coalesce((select name from public.profiles where id = auth.uid()), '관리자'),
    'grant_admin', 'admin', p_kakao_id, p_label);
end;
$$;

create or replace function public.admin_remove_admin(p_kakao_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 가능합니다'; end if;
  if (select count(*) from public.admin_allowlist) <= 1 then
    raise exception '마지막 남은 관리자는 삭제할 수 없습니다';
  end if;
  delete from public.admin_allowlist where kakao_id = p_kakao_id;
  update public.profiles set role = 'user' where kakao_id = p_kakao_id;
  insert into public.admin_audit_log (actor_id, actor_label, action, target_type, target_id)
  values (auth.uid(), coalesce((select name from public.profiles where id = auth.uid()), '관리자'),
    'revoke_admin', 'admin', p_kakao_id);
end;
$$;

create or replace function public.admin_add_category(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception '관리자만 가능합니다'; end if;
  insert into public.categories (name, sort_order)
    values (p_name, coalesce((select max(sort_order) + 1 from public.categories), 0))
    returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.admin_delete_category(p_category_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 가능합니다'; end if;
  delete from public.categories where id = p_category_id;
end;
$$;

create or replace function public.admin_add_question(p_category_id uuid, p_text text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception '관리자만 가능합니다'; end if;
  insert into public.question_bank (category_id, text, sort_order)
    values (p_category_id, p_text,
      coalesce((select max(sort_order) + 1 from public.question_bank where category_id = p_category_id), 0))
    returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.admin_update_question(p_question_id uuid, p_text text, p_is_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 가능합니다'; end if;
  update public.question_bank set text = p_text, is_active = p_is_active where id = p_question_id;
end;
$$;

create or replace function public.admin_delete_question(p_question_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 가능합니다'; end if;
  delete from public.question_bank where id = p_question_id;
end;
$$;

grant execute on all functions in schema public to authenticated;

-- ============================================================================
-- 초기 카테고리 시드 (lib/questionPool.ts 기본 데이터와 동일한 6개 카테고리)
-- ============================================================================
insert into public.categories (name, sort_order)
values ('외모', 0), ('패션', 1), ('성격', 2), ('관계', 3), ('추억', 4), ('가십', 5)
on conflict (name) do nothing;

-- ============================================================================
-- ⚠️ 최초 관리자 부트스트랩 (딱 한 번만 수동으로 실행)
-- 본인 카카오 계정으로 사이트에 최소 1번 로그인한 뒤, 아래 kakao_id를
-- 실제 값으로 바꿔서 실행하세요. profiles.kakao_id 컬럼에서 본인 값을 확인할 수 있습니다.
-- 이후 추가 관리자는 /admin/admins 페이지에서 등록하면 됩니다.
-- ============================================================================
-- insert into public.admin_allowlist (kakao_id, label) values ('여기에_본인_kakao_id', '최초 관리자')
--   on conflict (kakao_id) do nothing;
-- update public.profiles set role = 'admin' where kakao_id = '여기에_본인_kakao_id';
