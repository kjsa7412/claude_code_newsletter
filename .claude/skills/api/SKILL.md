---
name: api
description: Implement Spring Boot + MyBatis API for templates metadata, usage logging, and weekly ranking.
context: fork
agent: spring-api
---

services/api에 REST API를 구현하라.

엔드포인트(예시):

- GET /api/templates (내 템플릿)
- POST /api/templates (생성)
- GET /api/templates/{id}
- PUT /api/templates/{id}
- POST /api/templates/{id}/publish (public 전환)
- POST /api/templates/{id}/clone (복제)
- POST /api/templates/{id}/use (사용 이벤트 기록)
- GET /api/rankings/weekly?week=YYYY-WW (없으면 현재 week)

주의:

- MVP에서는 인증을 단순화해도 되지만, 최소한 소유자 기반 제한 로직은 포함.
- SQL은 MyBatis mapper로 분리.
- 랭킹은 DB 집계 쿼리 사용.
