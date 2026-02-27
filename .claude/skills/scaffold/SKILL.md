---
name: scaffold
description: Scaffold monorepo (apps/web + services/api + infra/supabase) with basic scripts and env templates.
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

아래 구조로 monorepo를 스캐폴딩하라:

- apps/web : Next.js(App Router) + TS + Tailwind
- services/api : Spring Boot + Gradle + MyBatis
- infra/supabase : schema.sql, rls.sql, seed.sql (또는 migrations 폴더)

필수 작업:

1. 루트 README.md에 로컬 실행 방법 작성
2. .env.example (web/api 각각)
3. pnpm(or npm) 워크스페이스 구성(가능하면)
4. 기본 린트/빌드 스크립트 준비

완료 후:

- web 빌드 명령 1회 실행
- api 빌드 명령 1회 실행
  실패하면 즉시 수정하라.
