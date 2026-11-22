# 11. 로컬 Docker Compose & E2E 실행 가이드

이 문서는 저장소를 처음 클론한 환경에서 **로컬 Python이나 `libomp`를 별도로 설치하지 않고도 Docker Compose만으로**
**DB·백엔드·프론트 기동 → 비식별 테스트 원천(`source`) 파이프라인 가동(Bronze → Silver → Gold → Feature) → PostgreSQL 적재 → LightGBM 학습 → 학습 결과 DB 적재 → FastAPI 서빙 → 3D 프론트엔드 확인**까지 전체 10단계를 한 번에 재현하는 방법을 안내합니다.

> 저장소에 포함된 비식별 경량 원천 샘플(`samples/local_e2e/source/`, 11종 전체 약 8.9 MB)을 사용하면 대용량 원천 데이터(수 GB) 없이도 **원천(Source)부터 3D 대시보드 확인까지 전체 흐름을 약 15초** 안에 검증할 수 있습니다.

---

## 1. 서비스 구성 및 포트

| 서비스 | 컨테이너 이름 | 프로필 | 호스트 포트 | 역할 |
| --- | --- | :---: | :---: | --- |
| Frontend (Nginx + React/Three.js) | `apartapart-frontend` | 기본 | `http://localhost:5173` | 3D 대시보드 정적 서빙 및 `/api/*` → Backend 리버스 프록시 |
| Backend (FastAPI) | `apartapart-backend` | 기본 | `http://localhost:8000` | PostgreSQL(`gold`, `ai_ready`) 조회 및 대시보드 REST API 서빙 (경량 이미지) |
| Local DB (PostgreSQL 18) | `apartapart-postgres` | `local-db` | `localhost:5432` | 최초 기동 시 `docker/postgres/init/01_schema.sql`로 `gold.*`(8개)·`ai_ready.*`(2개) 테이블 자동 생성 |
| Pipeline (Watch 자동 피딩·학습) | `apartapart-pipeline` | 기본 (상시 폴링) | 없음 (데몬) | `data/watch/`를 10초마다 폴링. 신규 원천 유입 시 `01_bronze` → `05_train` → DB 적재 → FastAPI 캐시 갱신 자동 실행 |

```text
[저장소 폴더]                                 [Docker Compose 컨테이너]

pipeline/ · metadata/ · scripts/ · samples/ ──▶ apartapart-pipeline (Watch 폴링 · 전처리 · 학습 · DB 적재)
                                                     │  ▲
                                  ./data, ./report   │  │ PostgreSQL COPY 적재
                                                     ▼  ▼
docker/postgres/init/01_schema.sql          ──▶ apartapart-postgres (PostgreSQL 18, gold.* · ai_ready.*)
                                                        ▲
                                                        │ SQL 조회 (읽기 전용 서빙)
backend/                                    ──▶ apartapart-backend  (FastAPI, 경량 API 서빙, :8000)
                                                        ▲
                                                        │ /api/* 프록시
frontend/                                   ──▶ apartapart-frontend (Nginx + React/Three.js, :5173)
```

### Watch 폴더 파일 처리 규칙
- **유입 감지**: `data/watch/`에 원천 묶음 폴더(`api/` 또는 `files/` 포함)나 `.zip` 파일이 들어오면 `10초`(`WATCH_POLL_SECONDS`) 간격으로 자동 감지합니다.
- **복사 중 보호**: `.part`, `.tmp` 확장자나 숨김 파일은 무시하며, 이름 변경 후 `2초`(`WATCH_SETTLE_SECONDS`) 이상 수정이 없을 때만 실행합니다.
- **처리 성공**: `data/watch/<이름>` → `data/processed/<YYYYMMDD_HHMMSS>__<이름>` 으로 이동(중복 실행 방지)하고, 원천은 `data/source/`에 보존됩니다.
- **처리 실패·검증 탈락**: `data/watch/<이름>` → `data/quarantine/<YYYYMMDD_HHMMSS>__<이름>` 으로 격리하고 `report/pipeline_watch.log`에 원인을 기록합니다. 워처 데몬은 종료되지 않고 다음 유입을 계속 대기합니다.

---

## 2. 사전 준비

- **Docker** (Docker Desktop 또는 macOS Colima) 및 `docker compose`
- 로컬 Python 가상환경이나 macOS `libomp`는 **필요 없습니다** (전용 `pipeline` 컨테이너에 모두 포함).

---

## 3. 빠른 시작 (클론 → 프론트 확인까지 3줄)

### Step 1. 저장소 클론 및 `.env` 생성

```bash
git clone <레포지토리 URL>
cd mlo-03-p2-team1

# .env.example을 그대로 복사하면 로컬 Docker PostgreSQL 기본값으로 동작합니다.
cp .env.example .env
```

### Step 2. DB · Backend · Frontend · Pipeline(워처) 컨테이너 기동

```bash
docker compose --profile local-db up --build -d
```

네 컨테이너(`apartapart-postgres`, `apartapart-backend`, `apartapart-frontend`, `apartapart-pipeline`)가 정상 기동됐는지 확인합니다.

```bash
docker compose --profile local-db ps
curl -s http://localhost:8000/api/health
# 기대 출력: {"status":"ok"}
```

### Step 3. Watch 폴더에 테스트 원천 투입 → 자동 파이프라인 가동

`apartapart-pipeline` 컨테이너가 `data/watch/` 폴더를 10초마다 폴링하고 있습니다. 비식별 테스트 원천(`samples/local_e2e/source/`)을 `data/watch/`에 넣기만 하면 전체 파이프라인이 자동으로 실행됩니다.

```bash
mkdir -p data/watch
# 복사 중 부분 읽기를 막기 위해 .part 로 복사 후 이름 변경 권장
cp -R samples/local_e2e/source data/watch/sample_batch.part \
  && mv data/watch/sample_batch.part data/watch/sample_batch

# 실시간 자동 실행 로그 확인 (약 10초 내 감지 → 전체 처리 약 10초 소요)
docker compose logs -f pipeline
```

자동 실행되는 단계:

1. **Watch 감지 및 원천 반영**: `data/watch/sample_batch/`(또는 `.zip`) 감지 → `data/source/`에 반영
2. **01 Bronze**: `python pipeline/bronze/01_bronze.py` (SHA-256 검증·읽기 전용 보호 + Parquet 변환)
3. **02 Silver 표준화**: `python pipeline/silver/02_normalize.py` (표준용어 사전 적용)
4. **03 Silver 정제**: `python pipeline/silver/03_clean.py` (중복·법정동·업종 정제 및 완료 조건 검증)
5. **04 Gold 집계**: `python pipeline/gold/04_gold.py` (서울 467개 법정동 × 39개 분기 스타 스키마 8종 생성)
6. **05 AI Ready 피처셋**: `python pipeline/ai_ready/05_feature_set.py` (48개 피처 생성)
7. **Gold DB 적재**: `python scripts/load_postgres.py --stage gold` (로컬 PostgreSQL `gold.*` 8개 테이블 적재)
8. **05 LightGBM 학습·예측**: `python pipeline/ai_ready/05_train.py` (롤링 CV 2021~2026 + `2026Q4` 예측)
9. **학습 결과 DB 적재**: `python scripts/load_postgres.py --stage ai_ready` (`ai_ready.feature_set`, `ai_ready.prediction` 적재)
10. **캐시 갱신 및 아카이브**:
    - `GET http://backend:8000/api/dashboard/bootstrap?refresh=true`로 백엔드 캐시 즉시 갱신
    - 성공 시 `data/watch/sample_batch` → `data/processed/<timestamp>__sample_batch` 이동
    - 실패/검증 오류 시 `data/quarantine/<timestamp>__sample_batch` 격리 및 `report/pipeline_watch.log` 기록

> **Watch 대신 즉시 수동 E2E 실행이 필요할 때**
> ```bash
> docker compose exec pipeline python scripts/run_local_e2e.py --force
> ```

### Step 4. 브라우저에서 프론트엔드 확인

- **대시보드**: `http://localhost:5173`
- **API 문서 (Swagger UI)**: `http://localhost:8000/docs`

확인 포인트:
- 첫 화면이 **`2017Q1`** 기준으로 열리고 서울 467개 법정동 3D 지도와 지하철 노선이 표시됩니다.
- 상단 모드 전환 버튼으로 **`실제 시세`** / **`AI 예측 시세`**를 전환하고, 방금 원천 데이터부터 학습해 DB에 적재한 LightGBM 예측 결과(`2026Q3` 검증, `2026Q4` 예측)를 확인할 수 있습니다.

---

## 4. 전체 실데이터(`data/source/`)로 풀 파이프라인 실행하기

전체 원천 데이터(`data/source/api/`, `data/source/files/`)를 로컬에 보유하고 있다면 `--use-existing-source` 옵션으로 01 Bronze부터 DB 적재·학습·서빙 검증까지 한 번에 실행할 수 있습니다. (전체 원천 기준 약 15~20분 소요)

```bash
docker compose exec pipeline python scripts/run_local_e2e.py --use-existing-source
```

---

## 5. 팀 공용 PostgreSQL DB로 전환하기

로컬 DB 대신 팀 공용 PostgreSQL에 바로 연결해 서빙하려면 `.env`에서 `DBHOST`·`DBPORT`·`DBPW`·`DBSSLMODE`를 팀 DB 정보로 수정한 뒤 `--profile local-db` 없이 기동합니다.

```bash
docker compose up --build -d
```

---

## 6. 종료 및 자주 겪는 문제 해결

```bash
# 컨테이너만 종료 (DB 데이터 유지)
docker compose --profile local-db down

# DB 볼륨까지 완전히 초기화 (비밀번호 변경·스키마 재생성 시)
docker compose --profile local-db down -v
```

- **팀원이 루트의 `pipeline/`이나 `metadata/`를 수정했을 때**: `docker compose --profile local-db up --build -d pipeline`으로 `pipeline` 컨테이너만 다시 빌드해 재기동하면 최신 코드가 즉시 반영됩니다.
- **DB 적재 후 프론트/API에 새 데이터가 안 보일 때**: `curl -s "http://localhost:8000/api/dashboard/bootstrap?refresh=true"`를 호출하거나 `docker compose restart backend`를 실행합니다.
- **`password authentication failed for user "web"`**: `docker compose --profile local-db down -v`로 볼륨 초기화 후 다시 `up -d`로 기동하세요.
- **검증 로그 참고**: 상시 Watch 데몬 실가동 E2E 검증 기록은 [live-watch-daemon-e2e-20261122-140425-85ba98d.txt](../evidence/live-watch-daemon-e2e-20261122-140425-85ba98d.txt)에서 확인할 수 있습니다.
