# mlo-03-p2-team1

정리되지 않은 원천 데이터를 Bronze → Silver → Gold 단계로 정제해 **AI Ready Data**로 만드는 데이터 엔지니어링 프로젝트.

주제는 **서울 부동산 실거래가와 상권·의료 인프라(업종별 개업·폐업) 시계열의 결합**이며, 대시보드로 지역별 매매가와 예측가를 보여준다.
분석 범위와 근거는 [분석범위 제안서(초안)](docs/분석범위_제안.md)를 본다.

데이터의 양보다 **얼마나 더러운 데이터를 얼마나 깔끔하게 만들었는지**에 집중하고, 그 과정을 코드·메타데이터·검증 결과로 증명한다.

## 파이프라인

```
원천 데이터 → Bronze → Silver → 품질 관리 → Gold → AI Ready Data
```

| 단계 | 하는 일 |
|---|---|
| Source | 원천 데이터 (여러 시스템·파일 형식, 오염 포함) |
| Bronze | 원천을 거의 그대로 적재, 형식만 통일 |
| Silver | `metadata/`의 표준(용어·도메인·코드)에 맞춰 표준화·정제 |
| 품질 관리 | `metadata/`의 품질 규칙으로 검증, 결과를 `report/`에 기록 |
| Gold | 분석용으로 집계·조인 |
| AI Ready | AI 학습·활용에 바로 쓸 수 있는 최종 데이터 |

## 기술 스택

| 영역 | 기술 |
|---|---|
| 파이프라인 · Backend | Python |
| DB | PostgreSQL |
| Frontend | React, TypeScript |

## 폴더 구조

```
├── data/          단계별 데이터 (source, bronze, silver, gold, ai_ready)
├── pipeline/      단계별 변환 코드와 검증 코드 (data/와 단계 이름이 같음)
├── metadata/      데이터 기준: 컬럼 사전, 표준 용어·코드, 변환·품질 규칙
├── report/        실행 결과: 검증 결과, 변환 건수, 정답지 대조 결과
├── docs/          사람이 읽는 문서: 개요, 시나리오, 결정 이유, 회의록
├── backend/       API 서버 (DB → 대시보드)
└── frontend/      지역 부동산 매매가·예측가 대시보드
```

각 폴더의 자세한 규칙은 폴더 안의 `README.md`를 본다.

## 산출물과 위치

| 산출물 | 위치 |
|---|---|
| 각 단계의 데이터 | `data/` |
| 각 단계 작업 코드 | `pipeline/bronze`, `silver`, `gold`, `ai_ready` |
| 각 단계 검증 코드 | `pipeline/validation` |
| 메타데이터 (데이터 설명서) | `metadata/` |
| 검증 결과 | `report/` |

## 작업 원칙

- **데이터 파일은 커밋하지 않는다.** `data/` 아래는 `.gitignore`로 제외하고, 폴더 구조(`.gitkeep`)와 `README.md`만 남긴다. 데이터 출처와 받는 방법은 각 폴더의 `README.md`에 적는다.
- **기준은 `metadata/`, 결과는 `report/`.** "이렇게 되어야 한다"는 기준은 `metadata/`에, "이번 실행에서 이렇게 됐다"는 결과는 `report/`에 둔다.
- **정제 규칙은 코드에 직접 쓰지 않는다.** 변환·검증 코드는 `metadata/`의 CSV를 읽어서 동작한다.
- **`data/`는 언제든 다시 만들 수 있어야 한다.** `pipeline/`을 실행하면 같은 결과가 나와야 한다.

## 진행 상황

- [x] 폴더 구조, `.gitignore`, `.gitattributes`
- [ ] 원천 데이터 선정과 오염 시나리오 설계
- [ ] 예측 방식 결정 (직접 모델링 여부)
- [ ] PostgreSQL 설계 (테이블 생성 SQL, docker-compose 위치)
- [ ] Bronze / Silver / Gold / AI Ready 파이프라인
- [ ] 검증과 리포트
- [ ] Backend API, Frontend 대시보드
