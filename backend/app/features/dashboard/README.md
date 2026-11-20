# Dashboard

서울 법정동별 분기 실측, 인허가 집계, 가격 상승 여부 예측을 제공하는 조회 기능.

- `router.py`에 대시보드 HTTP 라우트를 둔다.
- `schemas.py`에 API 요청·응답 모델을 둔다.
- `queries.py`에서 `app/db.py`의 연결을 사용해 대시보드 SQL을 실행한다. 입력값은 psycopg 쿼리 파라미터로 바인딩한다.
- `tests/`에 대시보드 HTTP 응답 검증을 둔다.

PostgreSQL의 `dashboard_gold` 스키마를 조회한다. `GET /api/dashboard/quarters`에서 분기별 실측·가격·예측 가용성을 확인하고, `GET /api/dashboard/regions?year=2026&quarter=3`에서 10자리 법정동 코드 기준 지표를 받는다. `regionCode`는 선택 필터다. 계약과 예시는 FastAPI `/docs`에서 확인할 수 있다.
