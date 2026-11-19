# backend

FastAPI로 PostgreSQL 데이터를 대시보드에 제공한다. SQL은 psycopg로 직접 실행한다.

```text
backend/app/
├── main.py                # FastAPI 앱과 라우터 등록
├── db.py                  # PostgreSQL 연결
└── features/
    ├── dashboard/         # 대시보드 조회 기능의 구성과 구현 위치
    └── health/            # DB 상태 확인 API와 테스트
```

저장소 루트의 `.env.example`을 참고해 `.env`에 `DBPW`를 설정한다.
DB 기본값은 `100.100.100.60:5432`, 데이터베이스와 사용자 이름은 각각 `web`, TLS 모드는 `require`다. 같은 이름의 환경 변수를 설정하면 `.env` 값보다 우선한다.

저장소 루트에서 실행한다.

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload
```

- `/api/health`는 PostgreSQL에서 `SELECT 1`을 실행한다. 성공 시 HTTP 200, DB 오류 시 HTTP 503을 반환한다.
- `/docs`에서 API 문서를 확인할 수 있다.

```powershell
python -m pip install -r backend/requirements-dev.txt
python -m pytest backend
```
