# 11. 로컬 Docker Compose & E2E 실행 가이드

이 문서는 저장소를 처음 클론한 환경에서 **로컬 Python이나 `libomp`를 별도로 설치하지 않고도 Docker Compose만으로**
**DB·백엔드·프론트 기동 → 테스트 샘플 파이프라인 가동 → PostgreSQL 적재 → LightGBM 학습 → 학습 결과 DB 적재 → FastAPI 서빙 → 3D 프론트엔드 확인**까지 한 번에 재현하는 방법을 안내합니다.

> 저장소에 포함된 경량 테스트 샘플(`samples/local_e2e/gold/`, 약 2.1 MB)을 사용하면 대용량 원천 데이터(`data/source/`, 수 GB) 없이도 서울 467개 법정동 × 39개 분기(2017Q1~2026Q3) + 2026Q4 예측 전체 흐름을 **10초 이내**로 검증할 수 있습니다.

---

## 1. 서비스 구성 및 포트

| 서비스 | 컨테이너 이름 | 프로필 | 호스트 포트 | 역할 |
| --- | --- | :---: | :---: | --- |
| Frontend (Nginx + React/Three.js) | `apartapart-frontend` | 기본 | `http://localhost:5173` | 3D 대시보드 정적 서빙 및 `/api/*` → Backend 리버스 프록시 |
| Backend (FastAPI) | `apartapart-backend` | 기본 | `http://localhost:8000` | PostgreSQL(`gold`, `ai_ready`) 조회 및 대시보드 REST API 서빙 (경량 이미지) |
| Local DB (PostgreSQL 18) | `apartapart-postgres` | `local-db` | `localhost:5432` | 최초 기동 시 `docker/postgres/init/01_schema.sql`로 `gold.*`(8개)·`ai_ready.*`(2개) 테이블 자동 생성 |
| Pipeline (배치·학습 전용) | `apartapart-pipeline` | `pipeline` | 없음 (일회성 실행) | `pipeline/` + `metadata/` + `scripts/` + `samples/` + LightGBM(`libgomp1`) 포함. 전처리·학습·DB 적재·검증 실행 |

> **구조 장점**: 서빙 서버(`backend`)는 가볍게 유지하고, 무거운 데이터 처리·LightGBM 학습은 전용 `pipeline` 컨테이너에서 분리 실행합니다.

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

### Step 2. DB · Backend · Frontend 컨테이너 기동

```bash
docker compose --profile local-db up --build -d
```

세 컨테이너(`apartapart-postgres`, `apartapart-backend`, `apartapart-frontend`)가 정상 기동됐는지 확인합니다.

```bash
docker compose --profile local-db ps
curl -s http://localhost:8000/api/health
# 기대 출력: {"status":"ok"}
```

### Step 3. 전용 `pipeline` 컨테이너로 테스트 E2E 한 번에 실행

```bash
docker compose --profile pipeline run --rm --build pipeline
```

이 명령은 전용 `pipeline` 컨테이너 안에서 아래 6단계를 순서대로 실행한 뒤 자동 종료됩니다 (빌드 이후 실행 약 7초 소요):

1. **테스트 샘플 배치**: `samples/local_e2e/gold/*.parquet` (8개 파일, 약 2.1 MB) → `data/gold/` 복사
2. **피처셋 생성**: `python pipeline/ai_ready/05_feature_set.py` → `data/ai_ready/05_ai_ready__feature_set.parquet` 생성 (7,521행, 48개 피처)
3. **Gold DB 적재**: `python scripts/load_postgres.py --stage gold` → 로컬 PostgreSQL `gold.*` 8개 테이블(340,703행) 적재
4. **LightGBM 학습·예측**: `python pipeline/ai_ready/05_train.py` → 롤링 CV(2021~2026) + `2026Q4` 예측(`data/ai_ready/05_ai_ready__prediction.parquet`, 12,837행) 생성
5. **학습 결과 DB 적재**: `python scripts/load_postgres.py --stage ai_ready` → 로컬 PostgreSQL `ai_ready.feature_set`, `ai_ready.prediction` 적재
6. **API·프론트 서빙 검증**:
   - `GET http://backend:8000/api/health`
   - `GET http://backend:8000/api/dashboard/bootstrap?refresh=true` (백엔드 인메모리 캐시 갱신)
   - `GET http://backend:8000/api/dashboard/quarters/2026Q3` 및 `2026Q4` (실제 시세 + AI 예측 응답 확인)
   - `GET http://frontend/` 및 `http://frontend/api/health` (Nginx 프론트 + API 프록시 확인)

> **단계별 개별 실행이 필요할 때 (`pipeline` 컨테이너 안에서 원하는 명령만 실행)**
> ```bash
> docker compose --profile pipeline run --rm pipeline python pipeline/ai_ready/05_feature_set.py
> docker compose --profile pipeline run --rm pipeline python scripts/load_postgres.py --stage gold
> docker compose --profile pipeline run --rm pipeline python pipeline/ai_ready/05_train.py
> docker compose --profile pipeline run --rm pipeline python scripts/load_postgres.py --stage ai_ready
> curl -s "http://localhost:8000/api/dashboard/bootstrap?refresh=true" > /dev/null
> ```

### Step 4. 브라우저에서 프론트엔드 확인

브라우저에서 아래 주소로 접속합니다.

- **대시보드**: `http://localhost:5173`
- **API 문서 (Swagger UI)**: `http://localhost:8000/docs`

확인 포인트:
- 첫 화면이 **`2017Q1`** 기준으로 열리고 서울 467개 법정동 3D 지도와 지하철 주요 노선이 표시됩니다.
- 하단 타임라인 재생 버튼 또는 슬라이더로 **`2017Q1` ~ `2026Q4`** 분기 이동이 가능합니다.
- 상단 모드 전환 버튼으로 **`실제 시세`** / **`AI 예측 시세`**를 전환하고, 방금 학습해 DB에 적재한 LightGBM 예측 결과(`2026Q3` 오차 검증, `2026Q4` 차기 분기 예측)를 확인할 수 있습니다.

---

## 4. 전체 실데이터(`data/source/`)로 풀 파이프라인 실행하기

전체 원천 데이터(`data/source/api/`, `data/source/files/`)를 로컬에 보유하고 있다면 `pipeline` 컨테이너에서 01~04 단계를 실행한 뒤 `--use-existing-gold` 옵션으로 DB 적재·학습·서빙까지 이어서 실행할 수 있습니다. (`./data`와 `./report`가 호스트와 볼륨 마운트되어 있어 컨테이너 안팎의 결과가 그대로 공유됩니다.)

```bash
# 1) 원천 → Bronze → Silver → Gold (전체 원천 기준 약 15~20분 소요)
docker compose --profile pipeline run --rm pipeline sh -c "
  python pipeline/bronze/01_bronze.py &&
  python pipeline/silver/02_normalize.py &&
  python pipeline/silver/03_clean.py &&
  python pipeline/gold/04_gold.py
"

# 2) 생성된 data/gold/ 를 그대로 사용해 피처 생성 → DB 적재 → 학습 → 서빙 검증
docker compose --profile pipeline run --rm pipeline python scripts/run_local_e2e.py --use-existing-gold
```

---

## 5. 팀 공용 PostgreSQL DB로 전환하기

로컬 DB 대신 팀 공용 PostgreSQL에 바로 연결해 서빙하려면 `.env`에서 `DBHOST`·`DBPORT`·`DBPW`·`DBSSLMODE`를 팀 DB 정보로 수정한 뒤 `--profile local-db` 없이 기동합니다.

```bash
docker compose up --build -d
```

---

## 6. (선택) 호스트 로컬 Python으로 직접 실행하기

Docker `pipeline` 컨테이너 대신 호스트 Python 가상환경(`.venv`)에서 직접 실행하고 싶다면 아래와 같이 실행할 수 있습니다. (macOS는 `brew install libomp` 필요)

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r pipeline/requirements.txt -r backend/requirements.txt
python scripts/run_local_e2e.py --force
```

---

## 7. 종료 및 자주 겪는 문제 해결

### 컨테이너 종료 / DB 볼륨 초기화
```bash
# 컨테이너만 종료 (DB 데이터 유지)
docker compose --profile local-db down

# DB 볼륨까지 완전히 초기화 (비밀번호 변경·스키마 재생성 시)
docker compose --profile local-db down -v
```

### 문제 해결
- **팀원이 루트의 `pipeline/`이나 `metadata/`를 수정했을 때**: `docker compose --profile pipeline run --rm --build pipeline`처럼 `--build`를 붙여 이미지를 다시 빌드하면 최신 코드가 바로 반영됩니다.
- **DB 적재 후 프론트/API에 새 데이터가 바로 안 보일 때**: 백엔드가 부트스트랩 응답을 메모리에 캐시하므로 `curl -s "http://localhost:8000/api/dashboard/bootstrap?refresh=true"`를 호출하거나 `docker compose restart backend`를 실행합니다.
- **`password authentication failed for user "web"`**: 기존 PostgreSQL 볼륨이 다른 `DBPW`로 초기화된 상태입니다. `docker compose --profile local-db down -v` 후 다시 `up -d`로 기동하세요.
- **호스트에서 `DBHOST=postgres` 연결 오류**: `scripts/load_postgres.py`는 호스트 실행 시 `DBHOST=postgres`를 자동으로 `127.0.0.1`로 변환합니다. 다른 호스트/포트를 쓰려면 `--host`·`--port` 옵션을 지정하세요.
