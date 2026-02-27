---
name: db
description: Generate Supabase Postgres schema + RLS policies + weekly ranking SQL.
context: fork
agent: db-architect
---

Supabase(Postgres) 스키마/RLS를 설계하고 infra/supabase/ 아래에 SQL로 저장하라.

요구:

- templates(메타), template_versions(스토리지 경로/스키마), usage_events(사용기록)
- 공개 여부(visibility: private/public)
- 공개 템플릿은 누구나 read 가능, 수정은 소유자만
- usage_events는 로그인 사용자만 insert
- 주간 랭킹: date_trunc('week', used_at)로 집계

결과물:

- infra/supabase/schema.sql
- infra/supabase/rls.sql
- infra/supabase/rankings.sql (view 또는 query)
