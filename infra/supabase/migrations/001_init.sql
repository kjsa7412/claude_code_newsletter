-- =============================================================================
-- Migration: 001_init.sql
-- Description: Initial schema for prompt template storage/sharing MVP
-- Created: 2026-02-27
-- =============================================================================
-- Tables    : profiles, templates, usage_events
-- Features  : RLS policies, auth trigger, updated_at trigger,
--             indexes, storage bucket, weekly ranking view
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------------

-- pgcrypto는 gen_random_uuid() 지원을 위해 활성화
-- Supabase 프로젝트에서는 기본 활성화되어 있으나 명시적으로 선언
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ---------------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------------

-- 1-1. profiles
-- auth.users 를 미러링하는 공개 프로필 테이블.
-- Supabase Auth 신규 가입 시 트리거로 자동 생성된다.
CREATE TABLE IF NOT EXISTS public.profiles (
    id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email        text        NOT NULL,
    display_name text,
    avatar_url   text,
    created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.profiles              IS 'Mirror of auth.users with public profile fields.';
COMMENT ON COLUMN public.profiles.id           IS 'Matches auth.users.id (UUID v4).';
COMMENT ON COLUMN public.profiles.email        IS 'User email copied from auth.users at signup.';
COMMENT ON COLUMN public.profiles.display_name IS 'Human-readable display name (optional).';
COMMENT ON COLUMN public.profiles.avatar_url   IS 'URL to profile avatar image (optional).';


-- 1-2. templates
-- 프롬프트 템플릿 메타데이터.
-- 실제 템플릿 본문(Markdown)은 Supabase Storage에 저장되고
-- storage_path 컬럼이 해당 경로를 참조한다.
CREATE TABLE IF NOT EXISTS public.templates (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title        text        NOT NULL,
    description  text,
    is_public    boolean     NOT NULL DEFAULT false,
    storage_path text        NOT NULL,   -- Storage 경로: {owner_id}/{template_id}.md
    use_count    integer     NOT NULL DEFAULT 0 CHECK (use_count >= 0),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.templates              IS 'Prompt template metadata. Template body (Markdown) lives in Supabase Storage.';
COMMENT ON COLUMN public.templates.id           IS 'Template UUID, used as part of the Storage path.';
COMMENT ON COLUMN public.templates.owner_id     IS 'FK to profiles.id. Template owner.';
COMMENT ON COLUMN public.templates.title        IS 'Short, human-readable title of the template.';
COMMENT ON COLUMN public.templates.description  IS 'Optional longer description.';
COMMENT ON COLUMN public.templates.is_public    IS 'When true, any authenticated or anonymous user can read this template.';
COMMENT ON COLUMN public.templates.storage_path IS 'Path inside the "templates" Storage bucket, e.g. {owner_id}/{template_id}.md';
COMMENT ON COLUMN public.templates.use_count    IS 'Denormalized counter incremented each time the template is used. Non-negative.';
COMMENT ON COLUMN public.templates.updated_at   IS 'Auto-updated by trigger on every UPDATE.';


-- 1-3. usage_events
-- 템플릿 사용 이벤트 로그. 주간 랭킹 집계의 원본 데이터.
-- user_id는 NOT NULL이므로 비로그인 사용자는 INSERT 불가(RLS로도 이중 차단).
CREATE TABLE IF NOT EXISTS public.usage_events (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid        NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    user_id     uuid        NOT NULL REFERENCES public.profiles(id),
    used_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.usage_events             IS 'Records each time an authenticated user uses a template. Source for weekly ranking.';
COMMENT ON COLUMN public.usage_events.id          IS 'Event UUID.';
COMMENT ON COLUMN public.usage_events.template_id IS 'FK to templates.id.';
COMMENT ON COLUMN public.usage_events.user_id     IS 'FK to profiles.id. Must be the currently authenticated user (enforced by RLS).';
COMMENT ON COLUMN public.usage_events.used_at     IS 'Timestamp of the usage event.';


-- ---------------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------------

-- templates 소유자별 목록 조회
CREATE INDEX IF NOT EXISTS idx_templates_owner_id
    ON public.templates (owner_id);

-- 공개 템플릿 탐색 (부분 인덱스 - 공개 행만 포함하여 크기 최소화)
CREATE INDEX IF NOT EXISTS idx_templates_is_public
    ON public.templates (is_public)
    WHERE is_public = true;

-- 주간 랭킹 집계: template_id + used_at 복합 인덱스
-- date_trunc('week', used_at) GROUP BY 쿼리의 풀 스캔을 줄임
CREATE INDEX IF NOT EXISTS idx_usage_events_template_used_at
    ON public.usage_events (template_id, used_at DESC);

-- 특정 사용자의 사용 이력 조회
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id
    ON public.usage_events (user_id);


-- ---------------------------------------------------------------------------
-- 3. TRIGGER: updated_at 자동 갱신
-- ---------------------------------------------------------------------------

-- 범용 updated_at 갱신 함수 (다른 테이블에도 재사용 가능)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
    'Generic trigger function that sets updated_at = now() on every UPDATE.';

-- templates 테이블에 updated_at 트리거 부착
CREATE OR REPLACE TRIGGER trg_templates_set_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 4. TRIGGER: Supabase Auth 신규 가입 시 profiles 자동 생성
-- ---------------------------------------------------------------------------

-- auth.users 에 새 행이 INSERT 될 때 호출되는 트리거 함수.
-- raw_user_meta_data 에서 full_name / avatar_url 을 추출한다.
-- OAuth(Google, GitHub 등) 및 이메일 가입 모두 처리한다.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        -- full_name 이 없으면 NULL (display_name 은 선택 필드)
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), '')
    )
    ON CONFLICT (id) DO NOTHING;  -- 중복 실행 방어 (idempotent)

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
    'Automatically creates a profiles row when a new user signs up via Supabase Auth.';

-- auth 스키마 트리거: Supabase Auth가 관리하는 스키마이므로 SECURITY DEFINER 필수
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events  ENABLE ROW LEVEL SECURITY;

-- FORCE RLS: 테이블 소유자(service_role)도 RLS를 우회하지 못하도록 강제.
-- 단, Supabase 내부 service_role 키를 직접 쓰는 백엔드 서버가 있다면
-- FORCE 를 제거하고 서버 측에서 별도 권한 검사를 수행해야 한다.
-- MVP 단계에서는 클라이언트 SDK 직접 접근만 허용하므로 FORCE를 적용.
ALTER TABLE public.profiles      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.templates     FORCE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events  FORCE ROW LEVEL SECURITY;


-- ------------------------------------
-- 5-1. profiles RLS 정책
-- ------------------------------------

-- 본인 프로필만 조회 가능
CREATE POLICY "profiles: select own"
    ON public.profiles
    FOR SELECT
    USING (id = auth.uid());

-- 본인 프로필만 수정 가능
CREATE POLICY "profiles: update own"
    ON public.profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());


-- ------------------------------------
-- 5-2. templates RLS 정책
-- ------------------------------------

-- SELECT: 공개 템플릿이거나 본인 소유 템플릿만 조회
CREATE POLICY "templates: select public or own"
    ON public.templates
    FOR SELECT
    USING (
        is_public = true
        OR owner_id = auth.uid()
    );

-- INSERT: 반드시 본인 소유로만 등록
-- WITH CHECK 는 삽입/갱신될 데이터 자체를 검증한다.
CREATE POLICY "templates: insert own"
    ON public.templates
    FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- UPDATE: 본인 소유 템플릿만 수정
CREATE POLICY "templates: update own"
    ON public.templates
    FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- DELETE: 본인 소유 템플릿만 삭제
CREATE POLICY "templates: delete own"
    ON public.templates
    FOR DELETE
    USING (owner_id = auth.uid());


-- ------------------------------------
-- 5-3. usage_events RLS 정책
-- ------------------------------------

-- INSERT: 로그인 사용자만, 반드시 자신의 user_id로만 기록
CREATE POLICY "usage_events: insert own"
    ON public.usage_events
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- SELECT: 본인 사용 이력만 조회
CREATE POLICY "usage_events: select own"
    ON public.usage_events
    FOR SELECT
    USING (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 6. WEEKLY RANKING VIEW
-- ---------------------------------------------------------------------------

-- 현재 ISO 주간 기준(월요일 시작) 상위 템플릿 랭킹.
-- date_trunc('week', ...) 는 PostgreSQL 기본값(월요일 시작 ISO 8601) 을 따름.
-- 이 뷰는 SECURITY DEFINER 함수 없이 RLS를 통과한 집계를 반환한다.
-- 즉, 비공개 템플릿의 사용 횟수는 소유자가 아닌 사용자에게 노출되지 않는다.
--
-- 사용 예:
--   SELECT * FROM public.weekly_template_ranking LIMIT 20;

CREATE OR REPLACE VIEW public.weekly_template_ranking
WITH (security_invoker = true)   -- 뷰 호출자의 RLS 정책을 그대로 적용
AS
SELECT
    t.id                                                    AS template_id,
    t.title,
    t.description,
    t.owner_id,
    p.display_name                                          AS owner_display_name,
    t.is_public,
    date_trunc('week', ue.used_at)                          AS week_start,
    COUNT(ue.id)                                            AS weekly_use_count,
    RANK() OVER (
        PARTITION BY date_trunc('week', ue.used_at)
        ORDER BY COUNT(ue.id) DESC
    )                                                       AS rank
FROM public.usage_events ue
JOIN public.templates     t ON t.id = ue.template_id
JOIN public.profiles      p ON p.id = t.owner_id
WHERE
    -- 현재 진행 중인 주간만 집계 (지난 주 + 이번 주 포함하려면 조건 조정)
    ue.used_at >= date_trunc('week', now())
GROUP BY
    t.id,
    t.title,
    t.description,
    t.owner_id,
    p.display_name,
    t.is_public,
    date_trunc('week', ue.used_at)
ORDER BY
    week_start DESC,
    weekly_use_count DESC;

COMMENT ON VIEW public.weekly_template_ranking IS
    'Weekly template usage ranking aggregated from usage_events. '
    'Uses security_invoker so RLS policies of the calling user are applied. '
    'Partition: ISO week (Monday start). Filter: current week only.';


-- ---------------------------------------------------------------------------
-- 6-1. 전체 주간 누적 랭킹 (히스토리 포함, 공개 템플릿 전용)
-- ---------------------------------------------------------------------------

-- 모든 과거 주간을 포함하는 누적 랭킹.
-- is_public = true 인 템플릿만 노출하므로 비인증 클라이언트에서도 안전하게 사용 가능.
-- 단, RLS 정책으로 인해 anon 역할은 templates 테이블 접근 자체가 차단된다.
-- 공개 랭킹 페이지에서는 Supabase Edge Function + service_role 을 통해
-- 캐싱된 결과를 제공하는 패턴을 권장한다.

CREATE OR REPLACE VIEW public.weekly_template_ranking_all
WITH (security_invoker = true)
AS
SELECT
    t.id                                                    AS template_id,
    t.title,
    t.description,
    t.owner_id,
    p.display_name                                          AS owner_display_name,
    date_trunc('week', ue.used_at)                          AS week_start,
    COUNT(ue.id)                                            AS weekly_use_count,
    RANK() OVER (
        PARTITION BY date_trunc('week', ue.used_at)
        ORDER BY COUNT(ue.id) DESC
    )                                                       AS rank
FROM public.usage_events ue
JOIN public.templates     t ON t.id = ue.template_id
JOIN public.profiles      p ON p.id = t.owner_id
WHERE
    t.is_public = true
GROUP BY
    t.id,
    t.title,
    t.description,
    t.owner_id,
    p.display_name,
    date_trunc('week', ue.used_at)
ORDER BY
    week_start DESC,
    weekly_use_count DESC;

COMMENT ON VIEW public.weekly_template_ranking_all IS
    'Historical weekly ranking for public templates only. '
    'All past weeks are included. Intended for leaderboard / analytics pages.';


-- ---------------------------------------------------------------------------
-- 7. SUPABASE STORAGE: "templates" 버킷
-- ---------------------------------------------------------------------------

-- 버킷 구조 (Storage 경로 규칙):
--   templates/
--     {owner_id}/            <-- profiles.id (UUID)
--       {template_id}.md     <-- templates.id (UUID) + .md 확장자
--
-- 예시:
--   templates/a1b2c3d4-e5f6-7890-abcd-ef1234567890/
--     f9e8d7c6-b5a4-3210-fedc-ba9876543210.md
--
-- 버전 관리가 필요한 경우 경로를 다음과 같이 확장할 수 있다:
--   templates/{owner_id}/{template_id}/v{version}.md
-- 해당 패턴으로 전환하려면 templates.storage_path 형식과 아래 Storage RLS를 함께 수정한다.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'templates',
    'templates',
    false,              -- private 버킷: 직접 URL 접근 불가, RLS로 접근 제어
    512000,             -- 최대 파일 크기 500 KB (Markdown 파일 기준 충분)
    ARRAY['text/plain', 'text/markdown']  -- .md / .txt 만 허용
)
ON CONFLICT (id) DO UPDATE
    SET
        name               = EXCLUDED.name,
        public             = EXCLUDED.public,
        file_size_limit    = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ---------------------------------------------------------------------------
-- 8. STORAGE RLS (storage.objects)
-- ---------------------------------------------------------------------------

-- Supabase Storage의 RLS는 storage.objects 테이블에 설정한다.
-- storage.foldername(name) 은 경로를 '/' 기준 배열로 분리한다.
--   예) 'a1b2.../f9e8....md' -> ARRAY['a1b2...', 'f9e8....md']
--   [1] 이 owner_id (첫 번째 폴더 세그먼트)

-- 8-0. storage.objects 에 RLS 활성화 (Supabase 기본 활성화 상태이지만 명시)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


-- 8-1. 업로드(INSERT): 소유자만 자신의 폴더에 업로드 가능
CREATE POLICY "storage templates: insert own"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'templates'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );


-- 8-2. 다운로드(SELECT): 소유자 또는 공개 템플릿 접근 허용
-- storage_path 는 버킷 내 상대 경로 (버킷 이름 제외) 이므로
-- templates.storage_path = name 으로 직접 비교한다.
CREATE POLICY "storage templates: select own or public"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'templates'
        AND (
            -- 소유자 본인
            auth.uid()::text = (storage.foldername(name))[1]
            -- 또는 공개로 설정된 템플릿
            OR EXISTS (
                SELECT 1
                FROM public.templates t
                WHERE t.storage_path = name
                  AND t.is_public    = true
            )
        )
    );


-- 8-3. 수정(UPDATE): 소유자만 자신의 파일 수정 가능
CREATE POLICY "storage templates: update own"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'templates'
        AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'templates'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );


-- 8-4. 삭제(DELETE): 소유자만 자신의 파일 삭제 가능
CREATE POLICY "storage templates: delete own"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'templates'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );


-- ---------------------------------------------------------------------------
-- 9. GRANTS
-- ---------------------------------------------------------------------------

-- anon 역할: 인증 없는 요청. RLS가 차단하므로 실질적 데이터 접근은 불가.
-- authenticated 역할: 로그인 사용자. RLS 정책 범위 내에서 CRUD 가능.

GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.profiles
    TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.templates
    TO authenticated;

GRANT SELECT, INSERT
    ON public.usage_events
    TO authenticated;

-- 주간 랭킹 뷰: 로그인 사용자에게만 조회 허용
GRANT SELECT ON public.weekly_template_ranking     TO authenticated;
GRANT SELECT ON public.weekly_template_ranking_all TO authenticated;

-- anon 는 어떤 테이블도 직접 접근 불가
-- (필요 시 is_public 조건의 SELECT만 허용하는 별도 정책 추가 가능)
REVOKE ALL ON public.profiles      FROM anon;
REVOKE ALL ON public.templates     FROM anon;
REVOKE ALL ON public.usage_events  FROM anon;

-- ---------------------------------------------------------------------------
-- END OF MIGRATION
-- ---------------------------------------------------------------------------

COMMIT;
