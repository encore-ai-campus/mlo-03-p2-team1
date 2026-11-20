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

현재 FastAPI의 워치 기능은 파일 감지부터 DB 적재까지를 확인하는 검증용 구현이다. 운영 목표는 Watch 폴더에서 파일을 감지하고 데이터 파이프라인에서 변환·검증한 결과를 DB에 적재하는 것이다. 아래 검증 절차에는 `public.bronze_file`과 `public.apt_trade` 테이블이 있는 PostgreSQL을 사용한다. 루트 `.env`에 해당 DB 연결을 설정한 뒤, 저장소 루트에서 FastAPI 서버를 실행한다.

```powershell
python -m uvicorn backend.app.main:app --workers 1
```

FastAPI가 시작되면 백그라운드에서 `data/watch/`를 즉시 확인하고, 검사 후 60초마다 다시 확인한다. 감시는 Uvicorn 프로세스마다 시작되므로 같은 폴더를 감시하는 서버 프로세스는 하나만 실행한다.

UTF-8 CSV는 `aptNm`, `dealYear`, `dealAmount` 세 열과 데이터 한 행 이상을 포함해야 한다. 파일마다 고유한 이름을 사용하고, 복사가 끝나면 확장자를 `.part`에서 `.csv`로 바꾼다.

파일 정보와 데이터 행을 `public.bronze_file`, `public.apt_trade`에 한 트랜잭션으로 적재한다. 커밋한 파일은 `data/watch/`와 같은 레벨의 `data/processed/`로 옮긴다. 적재에 실패하면 파일을 남겨 다음 검사에서 다시 시도한다. 실행 로그는 `report/watch.log`에 기록한다.

## 실거래 XML 파이프라인 감시

수집 서버의 `00_collect.py`가 시군구·계약월별 XML 수집을 끝내면 `data/source/api/apt_trade/<계약년월>/_done_<시군구코드>`를 기록한다. FastAPI 파이프라인 감시는 완료 표시와 XML 페이지·행 수를 확인하고, 완료된 실거래 데이터 전체를 Bronze 01 → Silver 02·03에 전달한다.

```powershell
python -m pip install -r backend/requirements-pipeline.txt
$env:APT_PIPELINE_WATCH = "1"
python -m uvicorn backend.app.main:app --workers 1
```

이 모드에서 FastAPI 프로세스 하나가 60초마다 수집 완료를 확인한다. 기본 원천은 저장소의 `data/source/`이며, 배포 환경에서 `APT_PIPELINE_SOURCE`로 원천 디렉터리를 지정할 수 있다. 루트의 파이프라인 코드, 메타데이터, 완료된 XML과 법정동 원천은 백엔드의 `backend/.apt-pipeline/`에 복사해 사용한다. 서버 실행 결과, Parquet, 성공 기록은 이 작업 공간에 남는다. 단계별 로그는 `backend/.apt-pipeline/report/apt_pipeline.log`에 기록된다.

DB 모드는 Bronze → Silver → Gold → PostgreSQL 스타 스키마 적재 → SQL 조회·Python 학습 → PostgreSQL 예측 저장 순서로 실행된다. Silver까지만 실행하는 것이 기본이다. DB 연결 없이 Gold와 학습을 검증하려면 아래처럼 Parquet 모드를 실행한다.

```powershell
$env:APT_GOLD_SILVER_DIR = "C:\path\to\silver"
$env:APT_PIPELINE_DASHBOARD = "1"
python -m backend.app.pipeline.feed
```

입력 디렉터리에는 `apt_trade`, `ldong_code`, `food_general`, `food_rest`, `clinic`, `pharmacy`, `beauty`의 `03_silver__<데이터셋>.parquet`가 필요하다. 파일은 입력 디렉터리 바로 아래나 데이터셋별 하위 폴더에 둔다. 전체 실거래 이력의 Silver 03을 기준으로 삼고, 감시로 만든 실거래 Silver가 있으면 같은 원천 파일명의 행을 갱신한다. Gold 산출물은 `backend/.apt-pipeline/data/gold/`에, 학습 결과는 `backend/.apt-pipeline/report/apt_training.json`에 저장한다.

학습은 Perceptron의 `09. 결정트리.ipynb`와 `22. 고객행동이벤트_스타스키마_답지.ipynb`처럼 결정트리 분류에 `fit`, `predict`, `predict_proba`를 적용한다. 앞 분기의 가격·실측 상승률·거래 수로 다음 분기의 전년 동분기 대비 가격 상승 여부를 예측한다. 마지막 실측 분기는 최신 정제본을 사용한 오프라인 검증에 남긴다. 학습 또는 검증 데이터가 부족하면 예측이 비어 있다.

`.env`에 PostgreSQL 연결을 설정하고 `APT_PIPELINE_LOAD_DB=1`을 켜면 `dashboard_gold` 스키마에 발행한다. DB 발행에는 전체 이력의 실거래 Silver 03 기준 파일이 필요하다. Gold 관측 데이터를 적재한 뒤 같은 트랜잭션에서 분기 마트를 SQL로 조회해 학습한다. 예측을 `fact_apt_prediction`에 저장하고 전부 성공하면 커밋한다. 실패하면 이전 대시보드 데이터가 유지된다. 같은 입력의 의도적인 재발행에는 `python -m backend.app.pipeline.feed --force`를 사용한다.

- `GET /api/dashboard/quarters`는 조회 가능한 실측·예측 분기를 반환한다.
- `GET /api/dashboard/regions?year=2026&quarter=3`는 법정동별 실측 가격, 가격 상승률, 인허가 집계와 예측 결과를 반환한다. `regionCode`에 10자리 법정동 코드를 지정할 수 있다.
- 가격은 원/㎡, 상승률은 %다. 모델 응답은 `predictedRise`와 0~1 범위의 `riseProbability`다. 예측만 있는 미래 분기의 거래 수와 실측 가격은 `null`이다. 프론트가 다른 출처에서 동작하면 `DASHBOARD_ORIGINS`로 허용할 출처를 설정한다.

## 테스트

```powershell
python -m pip install -r backend/requirements-dev.txt
python -m pytest backend
```
