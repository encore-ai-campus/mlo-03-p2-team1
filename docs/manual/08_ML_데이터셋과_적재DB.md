# 08. ML 데이터셋과 적재 DB 선택

> **이 문서의 출처**
> - `docs/설계서_초안.md` — ML 데이터셋 (L689–754), 적재 DB 선택: PostgreSQL vs MariaDB (L756–847)
> - `/INTENT.md` — 4장 AI Ready & 학습 모델 의도 (L40–45), 5장 자동 피딩 (L49–67)
> - `/plan.md` — 4. AI Ready · 모델 (L63–69)
>
> 이전 문서: `07_데이터모델_ERD와_Gold.md` · 다음 문서: `09_프론트엔드_3D_대시보드.md`

> 참고: `분석범위_제안.md`는 최종 산출물 방향(대시보드 vs 예측용 학습셋)을 팀 결정 사항으로 남겼지만, `INTENT.md`·`plan.md`는 **아파트 매매가 예측 모델 + 대시보드 표시**를 모두 하는 쪽으로 정리했습니다(`10_진행현황_체크리스트와_미결사항.md` 3장).

---

## 0. 예측 타깃과 모델 방향 (INTENT · plan)

> 출처: `INTENT.md` § 4 (L40–45), `plan.md` § 4 (L63–69)

- **예측 타깃:** 서울 법정동 단위의 **아파트 매매가** (plan: **법정동 × 분기** 아파트 매매가)
- **모델 방향:** Gold 스타 스키마에서 다차원 입지·시계열 피처를 추출해 **AI Ready 데이터셋**을 만들고, **결정 모델(Decision Model)** 혹은 **협업 모델(Collaborative Model)** 을 학습해 개별 지역의 시계열 추세뿐 아니라 법정동 간·주변 인프라 특성 간의 상호작용을 반영한 매매가 예측을 합니다.
- **자동 피딩:** 새 데이터가 들어오면 AI Ready 피처셋을 갱신하고 모델 재학습·최신 예측 추론으로 이어지는 구조를 지향합니다(`04_파이프라인_구조와_실행.md` 1-1).

### plan.md 할 일 (11/22 오전, 대시보드 연동과 병행)

- [ ] 예측 타깃 정의: 법정동 × 분기 아파트 매매가
- [ ] 피처셋 생성 (`pipeline/ai_ready/` → `data/ai_ready/`), 시점 누수 점검
- [ ] 학습/검증 분할 (시간 기준)
- [ ] 베이스라인 모델 학습·평가 지표 기록
- [ ] 예측 결과 저장 (대시보드에서 읽을 형태)
- [ ] (선택) Watch 폴더 자동 피딩 — 신규 파일 감지 → 02·03 → gold 재실행

> ⚠ **문서 간 차이 — 예측 단위:** 아래 1장(설계서)의 메인 과제는 **거래 1건 단위** log(㎡당 거래금액) 회귀(`ml.apt_price_features`, 한 행 = 거래 1건)입니다. INTENT·plan의 타깃은 **법정동(× 분기) 단위 매매가**로, 설계서 과제 목록에서는 5번 "법정동 분기 거래량 예측"과 같은 단위(Gold 단위)에 가깝지만 타깃은 거래량이 아니라 가격입니다. 둘 중 무엇으로 갈지, 또는 둘 다 할지 팀이 정해야 합니다.
> - 법정동 × 분기 단위로 가면 `mart_ldong_infra_qtr`(07 3장)의 `apt_unit_amt_median` 등을 그대로 타깃·피처로 쓸 수 있고, 아래 1-4의 시간 기준 분할·학습셋 기준 스케일링 원칙은 그대로 적용됩니다.
> - "결정/협업 모델"이 구체적으로 어떤 모델인지는 원본 문서에 정의가 없습니다.

---

## 1. ML 데이터셋

> 출처: `설계서_초안.md` § ML 데이터셋 (L689–691)

메인 과제는 아파트 ㎡당 가격 예측(회귀)이고, 보조 과제로 동네 유형 군집화를 합니다. 실거래가는 라벨을, 상가·병원은 입지 피처를 공급하는 구조입니다. Gold 아래에 ml 스키마를 추가해 학습용 테이블을 분리합니다.

### 1-1. 과제 선정

> 출처: L693–701

| 우선순위 | 과제 | 유형 | 타깃 | 필요한 단계 |
| --- | --- | --- | --- | --- |
| 1 | 아파트 ㎡당 가격 예측 | 회귀 | log(㎡당 거래금액) | 1단계부터 가능, 2·3단계로 피처 추가 |
| 2 | 동네 유형 군집화 | 비지도 | 없음 | 3단계 완료 후 |
| 3 | 이상 거래 탐지 | 이상탐지 | 없음 (해제 거래를 약한 라벨로) | 1단계 |
| 4 | 상가 폐업 예측 | 분류 | 다음 분기 스냅샷에서 사라짐 | store_hist 4분기 이상 누적 후 |
| 5 | 법정동 분기 거래량 예측 | 시계열 | 법정동×분기 거래 건수 | 1단계 (Gold 단위와 같음) |

> 관련: `분석범위_제안.md` 1장은 인허가 시계열 재구성으로 "예측 모델(폐업 위험, 생존분석)에 쓸 타깃 변수가 생긴다"고 적고 있습니다(`01_프로젝트_개요와_분석범위.md` 3-1).

### 1-2. 가격 예측 피처 테이블 (ml.apt_price_features)

> 출처: L703–717

한 행이 거래 1건이고, 모든 피처는 거래일(as_of_dt) 시점에 알 수 있던 값만 씁니다.

| 피처 그룹 | 컬럼 예시 | 출처 | 시점 규칙 |
| --- | --- | --- | --- |
| 키·타깃 | trd_id, as_of_dt, target_log_unit_amt | apt_trd | — |
| 거래·단지 | excl_ar, flr, bld_age(거래연도 − 건축년도) | apt_trd, apt_cmplx | 거래 당시 값 |
| 시점 | trd_month, trd_qtr | dim_date | — |
| 동네 시세 | ldong_unit_amt_median_3m, ldong_trd_cnt_3m | apt_trd | 거래월 제외, 직전 3개월만 |
| 상권 | store_cnt_ldong, store_cnt_food, store_cnt_retail | store_hist | 거래월에 유효한 이력 행만 |
| 의료 | clinic_cnt_ldong, pharmacy_cnt_ldong, dist_general_hosp_km | med_inst | 스냅샷뿐이라 누적 전까지는 최근 거래에만 사용 |
| (선택) 거시 | base_rate | 한국은행 ECOS | 거래일 이전 마지막 값 |

처음에는 반경 계산 없이 같은 법정동 단위 개수로 시작하고, 공간 함수가 준비되면 반경 500m·1km 피처로 바꿉니다.

### 1-3. Point-in-time 결합 예시

> 출처: L719–734

거래월에 유효했던 상가 이력만 세는 SQL입니다. PostgreSQL 문법이며, MariaDB에서는 to_char 대신 DATE_FORMAT(t.trd_dt, '%Y%m')를 씁니다.

```sql
SELECT t.trd_id,
       COUNT(s.store_no) AS store_cnt_ldong
FROM silver.apt_trd t
JOIN silver.apt_cmplx c ON c.apt_cmplx_cd = t.apt_cmplx_cd
LEFT JOIN silver.store_hist s
       ON s.ldong_cd = c.ldong_cd
      AND s.valid_from_ym <= to_char(t.trd_dt, 'YYYYMM')
      AND s.valid_to_ym   >  to_char(t.trd_dt, 'YYYYMM')
WHERE NOT t.ccl_yn
GROUP BY t.trd_id;
```

### 1-4. 분할과 누수 방지 규칙

> 출처: L736–744

- **시간 기준 분할:** 2024년 학습, 2025년 상반기 검증, 2025년 하반기 테스트. 무작위 분할은 같은 단지 거래가 양쪽에 섞여 점수가 부풀려집니다.
- 해제 거래는 학습에서 제외하고, 직거래 포함 여부는 데이터 카드에 기록합니다.
- 스케일링·인코딩 파라미터(평균, 표준편차, 범주 목록)는 학습셋으로만 계산합니다.
- **베이스라인**은 "같은 법정동 직전 3개월 ㎡당 중위가"입니다. 모델은 이 값을 이겨야 의미가 있습니다.
- 데이터셋마다 버전(기준일)과 데이터 카드(행 수, 피처 정의, 제외 규칙)를 남깁니다.

군집화는 법정동별 인프라 프로필(업종별 상가 수, 의료기관 수, ㎡당 중위가)을 z-score로 표준화한 뒤 수행합니다. 표준화 전후 군집 결과를 비교하면 정규화가 왜 필요한지 바로 확인됩니다.

### 1-5. 확장 가능 과제 · 수출입 연계 (검토 중, 미확정)

> 출처: L746–754

아파트 가격을 지역 수출입 지표와 연계해 보는 과제는 **추가할 수 있는 선택지로만 남겨 둡니다.** 진행 여부는 메인 과제 결과를 본 뒤 정합니다.

- **데이터:** 공공데이터포털의 관세청 시군구별·시도별 품목별 수출입실적 API. 시군구 단위면 `SGG_CD`로 붙일 수 있습니다.
- **형태:** 거래 단위가 아니라 시군구 × 월 가격지수 변화율을 예측하는 별도 과제. 기본 모델과 "기본 + 수출입 피처" 모델을 비교합니다.
- **가설:** 반도체 등 수출 비중이 큰 시군(화성·평택·이천 등)에서 수출 증감이 집값의 선행 지표로 작동하는지.
- **주의:** 공표 시차를 고려해 1~3개월 시차 피처만 쓰고, 금리를 함께 넣어 비교합니다. 시군구 실적의 집계 기준(공장 소재지 / 본사 소재지)은 API 명세로 확인이 필요합니다.
- 서울은 수출입과의 연결고리가 약해 효과가 작게 나올 가능성이 큽니다.

---

## 2. 적재 DB 선택: PostgreSQL vs MariaDB

> 출처: `설계서_초안.md` § 적재 DB 선택 (L756–847)

이 프로젝트에는 **PostgreSQL + PostGIS를 권장**합니다. 반경 피처, SCD2 이력, MERGE, dbt 공식 어댑터가 모두 이 프로젝트의 핵심 작업과 직결되기 때문입니다. 팀 표준이 MySQL 계열이거나 운영 경험이 MariaDB 쪽에 있다면 MariaDB로도 전체 파이프라인을 문제없이 구현할 수 있습니다. 확인 기준일: Nov 17, 2026

> 참고: 루트 `SPEC.md`에는 DB 연결 정보가 PostgreSQL 기준으로 적혀 있습니다(이번 정리 범위 밖).

### 2-1. 한눈에 비교

| 항목 | PostgreSQL | MariaDB |
| --- | --- | --- |
| 권장 버전 | 18 (2025-09-25 출시) | 12.3 LTS (2026-05-28 출시, 2029-06 지원) 또는 11.8 LTS |
| 계층 분리 | DB 하나에 스키마 bronze / silver / gold / ml | 스키마 = 데이터베이스. 계층마다 DB를 만들고 같은 서버 안에서 DB 간 조인 |
| 대량 적재 | COPY / \copy (psycopg의 copy 지원) | LOAD DATA LOCAL INFILE (local_infile 활성화 필요) |
| 업서트 | INSERT … ON CONFLICT, MERGE (15 이상) | INSERT … ON DUPLICATE KEY UPDATE, REPLACE. MERGE 없음 |
| 중복 제거 | DISTINCT ON, ROW_NUMBER | ROW_NUMBER 서브쿼리 |
| 공간 처리 | PostGIS 3.6 (geography, ST_DWithin, GiST 인덱스) | 내장 GIS + ST_Distance_Sphere, SPATIAL 인덱스. PostGIS보다 기능 범위가 좁음 |
| 이력(SCD2) 지원 | 18의 WITHOUT OVERLAPS 시간 제약으로 유효기간 중복 방지 | 템포럴(시스템 버전) 테이블 |
| 반정형 원본 보관 | JSONB (인덱스 가능) | JSON (텍스트 기반) |
| 벡터(임베딩) | pgvector 확장 | 11.8 LTS부터 VECTOR 타입 내장 |
| dbt | dbt-postgres (공식) | dbt-mysql (커뮤니티, 실험적, MariaDB 10.5에서 테스트) |
| Python 드라이버 | psycopg 3, SQLAlchemy | mariadb 커넥터 또는 PyMySQL, SQLAlchemy |

### 2-2. 방법 A · PostgreSQL로 적재

1. 스키마 생성: bronze, silver, gold, ml. Bronze 테이블은 전부 TEXT 컬럼 + 원본 한 행을 담는 raw JSONB 컬럼.
2. Bronze 적재: XML을 파싱해 CSV 스트림으로 만든 뒤 psycopg의 COPY로 적재. 파티션 단위로 DELETE 후 COPY하면 재실행에도 안전합니다.
3. Silver 변환: 표준화 뷰 → MERGE 또는 INSERT … ON CONFLICT DO UPDATE.
4. 공간 피처: med_inst, store_hist에 geography(Point, 4326) 컬럼과 GiST 인덱스를 두고 ST_DWithin으로 반경 500m 개수 계산.
5. SCD2: store_hist에 유효기간 범위 컬럼을 두고 PRIMARY KEY (store_no, valid_period WITHOUT OVERLAPS)로 겹침 자체를 막음.

```sql
-- 반경 500m 내 상가 수 (PostGIS)
SELECT t.trd_id, COUNT(s.store_no) AS store_cnt_500m
FROM silver.apt_trd t
JOIN silver.apt_cmplx c ON c.apt_cmplx_cd = t.apt_cmplx_cd
LEFT JOIN silver.store_hist s
       ON ST_DWithin(s.geog, c.geog, 500)
      AND s.valid_from_ym <= to_char(t.trd_dt, 'YYYYMM')
      AND s.valid_to_ym   >  to_char(t.trd_dt, 'YYYYMM')
GROUP BY t.trd_id;
```

### 2-3. 방법 B · MariaDB로 적재

1. 데이터베이스 생성: bronze, silver, gold, ml. 문자셋은 utf8mb4, 엔진은 InnoDB.
2. Bronze 적재: 파싱한 행을 임시 CSV로 저장하고 LOAD DATA LOCAL INFILE로 적재. 서버와 클라이언트 모두 local_infile을 켜야 합니다.
3. Silver 변환: INSERT … SELECT … ON DUPLICATE KEY UPDATE. 중복 제거는 ROW_NUMBER() 서브쿼리로.
4. 공간 피처: POINT 컬럼 + SPATIAL INDEX, ST_Distance_Sphere(a, b) <= 500. 크기가 커지면 MBRContains로 먼저 사각 영역을 걸러야 인덱스가 쓰입니다.
5. SCD2: valid_from_ym / valid_to_ym 컬럼을 직접 관리하거나, 변경 이력 자체는 시스템 버전 테이블에 맡길 수 있습니다.

```sql
-- 반경 500m 내 상가 수 (MariaDB)
SELECT t.trd_id, COUNT(s.store_no) AS store_cnt_500m
FROM silver.apt_trd t
JOIN silver.apt_cmplx c ON c.apt_cmplx_cd = t.apt_cmplx_cd
LEFT JOIN silver.store_hist s
       ON ST_Distance_Sphere(s.pt, c.pt) <= 500
      AND s.valid_from_ym <= DATE_FORMAT(t.trd_dt, '%Y%m')
      AND s.valid_to_ym   >  DATE_FORMAT(t.trd_dt, '%Y%m')
GROUP BY t.trd_id;
```

### 2-4. 코드 뼈대에서 바뀌는 부분

파이프라인은 단계별 parquet 파일로 동작해 DB와 무관합니다. 적재 단계(번호는 DB를 정한 뒤 부여)가 Silver·Gold parquet를 PostgreSQL 또는 MariaDB로 올립니다. 변환을 DB 안의 SQL로 옮길 때는 아래 방언 차이를 참고합니다(첫 열은 비교용 DuckDB 문법).

| DuckDB (비교용) | PostgreSQL | MariaDB |
| --- | --- | --- |
| INSERT (executemany) | COPY | LOAD DATA LOCAL INFILE |
| QUALIFY row_number() … | DISTINCT ON 또는 서브쿼리 | 서브쿼리 |
| make_date(y, m, d) | make_date(y, m, d) | STR_TO_DATE(CONCAT(y, '-', m, '-', d), '%Y-%c-%e') |
| try_cast(x AS INT) | 정규식 검사 후 CAST | 정규식 검사 후 CAST |
| regexp_replace(s, p, r, 'g') | regexp_replace(s, p, r, 'g') | REGEXP_REPLACE(s, p, r) (기본이 전체 치환) |
| median(x) | percentile_cont(0.5) WITHIN GROUP | MEDIAN() 윈도 함수 |
| 스키마 silver.테이블 | 그대로 | DB silver.테이블 (표기 동일) |

DB 연결을 하나의 어댑터 모듈로 감싸고 SQL 파일을 sql/postgres, sql/mariadb로 나누면, 결정 전에도 두 DB에서 모두 돌려볼 수 있습니다.

### 2-5. 결정 기준

- 반경·최근접 거리 피처를 많이 쓸 계획이면 PostgreSQL + PostGIS
- dbt로 Silver/Gold를 관리할 계획이면 PostgreSQL (MariaDB는 커뮤니티 어댑터만 있음)
- 회사·팀 표준이 MySQL 계열이거나 기존 MariaDB 운영 환경을 재사용한다면 MariaDB
- 나중에 문서 임베딩을 같은 DB에 두려면 둘 다 가능 (pgvector / MariaDB VECTOR)

### 2-6. 참고 링크

- [PostgreSQL 18 릴리스 노트](https://www.postgresql.org/docs/release/18/)
- [PostGIS 3.6.1 릴리스](https://postgis.net/2025/11/PostGIS-3.6.1)
- [MariaDB 릴리스·지원 기간 (endoflife.date)](https://endoflife.date/mariadb)
- [MariaDB Vector 개요](https://mariadb.com/docs/server/reference/sql-structure/vectors/vector-overview)
- [MariaDB ST_DISTANCE_SPHERE](https://mariadb.com/docs/server/reference/sql-statements/geometry-constructors/geometry-relations/st_distance_sphere)
- [MERGE 지원 비교](https://canmydb.pages.dev/features/merge-statement/)
- [dbt MySQL/MariaDB 어댑터](https://docs.getdbt.com/docs/local/connect-data-platform/mysql-setup)
