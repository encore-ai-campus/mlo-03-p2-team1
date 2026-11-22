# Local E2E 비식별 테스트 원천 샘플 (`samples/local_e2e/source/`)

저장소를 `git clone`한 직후 대용량 원천 데이터(`data/source/`, 수 GB) 없이도 **원천(Source) → `01_bronze` → `02_normalize` → `03_clean` → `04_gold` → `05_feature_set` → `05_train` → PostgreSQL 적재 → FastAPI 서빙 → 3D 프론트엔드 확인**까지 전체 10단계 파이프라인을 약 15초 안에 재현할 수 있도록 경량 슬라이스·비식별 마스킹한 원천 데이터셋입니다.

## 구성 및 비식별 마스킹 내역 (11종 전체, 약 8.9 MB)

| 경로 | 원천 데이터셋 | 구성 및 마스킹 내용 |
| --- | --- | --- |
| `files/ldong_code/` | 법정동코드 전체자료 | 행정표준코드 공개 기준표 (서울 467개 법정동 포함) |
| `files/store_info/` | 상가(상권)정보 | 16개 시도 CSV 각 1행 (상호명·업소번호·상세주소 마스킹) |
| `files/hira_inst/` | 전국 병의원·약국 현황 | 12개 CSV 각 5행 (요양기호·기관명·전화·주소·홈페이지 마스킹) |
| `files/food_general_file/` | 일반음식점 인허가 CSV | 250행 (API `food_general`과 1:1 키 매칭, 사업장명·전화·주소 마스킹) |
| `api/apt_rent/` | 아파트 전월세 실거래가 XML | 15건 (단지명·지번·층·일자 마스킹) |
| `api/apt_trade/` | 아파트 매매 실거래가 XML | 서울 18개 자치구 30개 대표 법정동 × 2017Q1~2026Q3 (9,113건). 단지명(`샘플단지_*`)·단지코드·지번·도로명·층수·거래일자 마스킹 및 면적(1㎡)/거래가(100만원) 반올림 |
| `api/{food_general,food_rest,clinic,pharmacy,beauty}/` | 서울시 인허가 5종 XML | 각 250건 (관리번호·사업장명·전화번호·상세주소·좌표 마스킹, 구·동 prefix 및 카페/편의점 분류 키워드만 유지) |

## 사용법

자세한 단계별 안내는 [11_로컬_Docker_E2E_실행가이드.md](../../docs/manual/11_로컬_Docker_E2E_실행가이드.md)를 참고하세요.

```bash
# 1) 환경 파일 준비 & DB·백엔드·프론트·파이프라인(Watch 폴링) 실행
cp .env.example .env
docker compose --profile local-db up --build -d

# 2) Watch 폴더에 테스트 원천 투입 → 10초 내 자동 감지·학습·DB 적재·캐시 갱신
mkdir -p data/watch
cp -R samples/local_e2e/source data/watch/sample_batch.part && mv data/watch/sample_batch.part data/watch/sample_batch
docker compose logs -f pipeline
```
