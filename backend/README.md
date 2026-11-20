# backend

FastAPI로 PostgreSQL 데이터를 대시보드에 제공한다. SQL은 psycopg로 직접 실행한다.

```text
backend/app/
├── main.py                # FastAPI 앱과 라우터 등록
├── db.py                  # PostgreSQL 연결
├── watch.py               # CSV 감지 및 DB 적재 기능 검증
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

## 워치 폴더

워치 폴더는 파일 감지부터 DB 적재까지의 동작을 검증하는 데 사용한다. 검증에는 `public.bronze_file`과 `public.apt_trade` 테이블이 있는 PostgreSQL을 사용한다. 루트 `.env`에 해당 DB 연결을 설정한 뒤, 저장소 루트에서 FastAPI 서버를 실행한다.

```powershell
python -m uvicorn backend.app.main:app --workers 1
```

FastAPI가 시작되면 백그라운드에서 `data/watch/`를 즉시 확인하고, 검사 후 60초마다 다시 확인한다. 감시는 Uvicorn 프로세스마다 시작되므로 같은 폴더를 감시하는 서버 프로세스는 하나만 실행한다.

UTF-8 CSV는 `aptNm`, `dealYear`, `dealAmount` 세 열과 데이터 한 행 이상을 포함해야 한다. 파일마다 고유한 이름을 사용하고, 복사가 끝나면 확장자를 `.part`에서 `.csv`로 바꾼다.

파일 정보와 데이터 행을 `public.bronze_file`, `public.apt_trade`에 한 트랜잭션으로 적재한다. 커밋한 파일은 `data/watch/`와 같은 레벨의 `data/processed/`로 옮긴다. 적재에 실패하면 파일을 남겨 다음 검사에서 다시 시도한다. 실행 로그는 `report/watch.log`에 기록한다.

## 테스트

```powershell
python -m pip install -r backend/requirements-dev.txt
python -m pytest backend
```
