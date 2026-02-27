---
name: review
description: Security review for RLS, auth, storage, and web vulnerabilities; produce actionable fixes.
context: fork
agent: security-review
---

다음을 집중 점검해라:

- Supabase RLS 정책 누락/우회 가능성
- 공개 템플릿 접근 범위
- Storage 경로 노출/권한
- Web에서 Markdown 렌더링/XSS 위험
- .env/secret 노출
  발견 항목별로: 위험도(상/중/하) + 수정안 + 관련 파일 경로를 제시하라.
