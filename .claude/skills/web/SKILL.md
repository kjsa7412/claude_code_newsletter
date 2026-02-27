---
name: web
description: Implement Next.js UI for template CRUD + renderer + ranking using Supabase Auth/Storage.
context: fork
agent: web-ui
---

apps/web에 다음 화면을 구현하라:

1. /login : Google 로그인(Supabase)
2. /templates : 내 템플릿 목록 + 새로 만들기
3. /templates/new : 템플릿 작성(.md 편집 + frontmatter fields 편집 UI)
4. /templates/[id] : 상세/수정 + 공개 전환 + 복제 버튼
5. /use/[id] : fields 기반 폼 자동 생성 → 결과 미리보기 → 복사/다운로드
6. /ranking : 주간 랭킹 리스트(Top N)

기술 요구:

- .md 파싱: YAML frontmatter + body 분리
- placeholder 치환: {{var}} 전부 replace
- 복사: navigator.clipboard
- 다운로드: Blob으로 파일 저장

가이드 UI:

- 템플릿 작성 화면 오른쪽에 “프롬프트 엔지니어링 체크리스트” 사이드 패널(정적) 제공
