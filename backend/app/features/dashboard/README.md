# Dashboard

지역별 실측값·예측값·오차와 연도 요약을 제공하는 조회 기능.

- `router.py`에 대시보드 HTTP 라우트를 둔다.
- `schemas.py`에 API 요청·응답 모델을 둔다.
- `queries.py`에서 `app/db.py`의 연결을 사용해 대시보드 SQL을 실행한다. 입력값은 psycopg 쿼리 파라미터로 바인딩한다.
- `tests/`에 대시보드 HTTP 응답 검증을 둔다.

PostgreSQL에 조회용 테이블이나 뷰가 준비되면 실제 컬럼을 기준으로 쿼리와 응답 모델을 추가한다. 화면에서 사용하는 필드는 `frontend/src/types/dashboard.ts`에서 확인할 수 있다.
