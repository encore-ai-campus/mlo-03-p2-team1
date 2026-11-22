# db

`apartapart-postgres` 로컬 PostgreSQL 18 Docker 컨테이너의 빌드 정의와 초기 스키마를 관리하는 폴더입니다.

## 구성 파일
- `Dockerfile`: `postgres:18-alpine` 기반 이미지에 `01_schema.sql`을 `/docker-entrypoint-initdb.d/`로 포함
- `01_schema.sql`: 최초 볼륨 초기화 시 `gold.*`(8개) 및 `ai_ready.*`(2개) 테이블과 인덱스 자동 생성

## 실행
루트 디렉터리에서 `local-db` 프로필로 기동합니다.

```bash
# 로컬 DB 포함 전체 스택 기동
docker compose --profile local-db up -d --build

# DB 스키마를 처음부터 다시 초기화할 때 (기존 로컬 볼륨 삭제)
docker compose --profile local-db down -v
docker compose --profile local-db up -d --build postgres
```
