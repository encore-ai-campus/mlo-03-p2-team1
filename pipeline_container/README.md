# pipeline_container

`apartapart-pipeline` Docker 컨테이너의 빌드 정의와 실행 스크립트를 관리하는 폴더입니다.

## 역할
- `pipeline/`(Bronze → Silver → Gold → Feature → LightGBM 학습), `metadata/`, `samples/`와 컨테이너 실행 스크립트(`pipeline_container/*.py`)를 하나의 이미지로 패키징합니다.
- 컨테이너 기동 시 `watch_pipeline.py`가 기본 실행되어 `data/watch/` 폴더를 주기적으로 폴링하고, 신규 원천 유입 시 전처리·학습·PostgreSQL 적재·FastAPI 캐시 갱신을 자동 수행합니다.

## 구성 파일
- `Dockerfile`: Python 3.13 + `libgomp1`(LightGBM OpenMP) + 파이프라인/DB 의존성 설치 및 `watch_pipeline.py` 엔트리포인트 정의
- `watch_pipeline.py`: `data/watch/` 폴링 및 전체 파이프라인 자동 실행 데몬
- `load_postgres.py`: `data/gold/`, `data/ai_ready/` Parquet 산출물을 PostgreSQL(`gold.*`, `ai_ready.*`)에 적재
- `run_local_e2e.py`: 비식별 샘플 또는 기존 `data/source/`로 10단계 E2E 흐름 수동 실행 및 서빙 검증

## 빌드 및 실행
루트 디렉토리에서 Docker Compose로 실행합니다.

```bash
# 로컬 PostgreSQL 포함 전체 스택 기동
docker compose --profile local-db up -d --build

# 파이프라인 컨테이너만 재빌드
docker compose up -d --build --no-deps pipeline

# 비식별 테스트 원천으로 수동 E2E 실행
docker compose exec pipeline python pipeline_container/run_local_e2e.py --force
```

## 주요 환경변수
- `DBHOST`, `DBPORT`, `DBNAME`, `DBID`, `DBPW`, `DBSSLMODE`: PostgreSQL 접속 정보
- `WATCH_POLL_SECONDS`: `data/watch/` 폴링 주기(초, 기본값 `10`)
- `BACKEND_URL`: 적재 완료 후 캐시 갱신을 호출할 FastAPI 주소 (기본값 `http://backend:8000`)

자세한 실행 및 검증 절차는 [docs/manual/11_로컬_Docker_E2E_실행가이드.md](../docs/manual/11_로컬_Docker_E2E_실행가이드.md)를 참고하세요.
