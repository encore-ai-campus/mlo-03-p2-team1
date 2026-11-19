# pipeline

`data/`의 각 단계를 만드는 코드. 하위 폴더 이름은 `data/`의 단계 이름과 같다.

| 폴더 | 역할 |
|---|---|
| `common/` | 여러 단계에서 같이 쓰는 코드 (경로, 입출력, DB 연결, 로그) |
| `source/` | 외부(API, 내려받은 파일) → `data/source` (`metadata/src_*.csv`의 출처·수집 계획 사용) |
| `bronze/` | `data/source` → `data/bronze` |
| `silver/` | `data/bronze` → `data/silver` (`metadata/`의 표준·변환 규칙 사용) |
| `gold/` | `data/silver` → `data/gold` |
| `ai_ready/` | `data/gold` → `data/ai_ready` |
| `validation/` | 각 단계 결과 검증 (`metadata/`의 규칙을 읽어 검사, 결과는 `report/`) |

`common/`에는 두 단계 이상에서 쓰는 코드만 둔다. 한 단계에서만 쓰는 코드는 그 단계 폴더에 둔다.
