# Local E2E 테스트 샘플 (`samples/local_e2e/gold/`)

저장소를 `git clone`한 직후 대용량 원천 데이터(`data/source/`, 수 GB) 없이도 **로컬 Docker Compose 환경에서 파이프라인 → PostgreSQL 적재 → LightGBM 학습 → 학습 결과 DB 적재 → FastAPI 서빙 → 3D 프론트엔드 확인**까지 전체 흐름을 수십 초 안에 검증할 수 있도록 경량화한 Gold Parquet 샘플입니다.

## 구성 (총 약 2.1 MB)

| 파일 | 행 수 | 설명 |
| --- | ---: | --- |
| `04_gold__dim_date.parquet` | 39 | 2017Q1 ~ 2026Q3 분기 차원 (전체) |
| `04_gold__dim_lcns_induty.parquet` | 14 | 분석 업종 차원 (전체) |
| `04_gold__dim_region.parquet` | 467 | 서울특별시 467개 법정동 차원 (전체) |
| `04_gold__fact_apt_idx_qtr.parquet` | 18,213 | 법정동 × 분기 아파트 가격 지수·변화율 (전체) |
| `04_gold__fact_apt_trd_qtr.parquet` | 18,213 | 법정동 × 분기 아파트 매매 집계 (전체) |
| `04_gold__fact_lcns_qtr.parquet` | 254,982 | 법정동 × 분기 × 업종 인허가 집계 (전체) |
| `04_gold__mart_ldong_infra_qtr.parquet` | 18,213 | 법정동 × 분기 시세·상권 통합 마트 (전체) |
| `04_gold__fact_apt_trd.parquet` | 30,562 | 개별 매매 샘플 (전체 611,300건 중 `(LDONG_CD, YQ)`별 최소·중앙·최대 단가 대표 3건 추출) |

## 사용법

자세한 단계별 안내는 [11_로컬_Docker_E2E_실행가이드.md](../../docs/manual/11_로컬_Docker_E2E_실행가이드.md)를 참고하세요.

```bash
# 1) 환경 파일 준비 & Docker Compose 실행
cp .env.example .env
docker compose --profile local-db up --build -d

# 2) 테스트 샘플로 파이프라인·DB 적재·학습·API 검증 한 번에 실행
python scripts/run_local_e2e.py --force
```
