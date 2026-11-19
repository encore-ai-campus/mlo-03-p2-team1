"""프로젝트 경로와 파일명 규칙. pipeline/ 아래 모든 단계가 같이 쓴다."""
from __future__ import annotations

from pathlib import Path

# ──────────────────────────────────────────────────────────────
# 1. 경로
# ──────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parents[2]   # mlo-03-p2-team1/
DATA_DIR = PROJECT_ROOT / "data"
SOURCE_DIR = DATA_DIR / "source"          # 원천 (읽기 전용, 수정·이동·덮어쓰기 금지)
BRONZE_DIR = DATA_DIR / "bronze"          # 1차 결과 (02 단계에서는 읽기만 함)
SILVER_DIR = DATA_DIR / "silver"          # 2차 결과
METADATA_DIR = PROJECT_ROOT / "metadata"  # 기준: 데이터셋 정의, 표준 단어·도메인·용어 사전 (CSV)
REPORT_DIR = PROJECT_ROOT / "report"      # 실행 결과: manifest, 변경 내역

# bronze 의 _source_file 값 앞에 붙는 원천 이름.
# 폴더 이름은 data/source 지만, 이미 만든 bronze 파일과 값이 같아야 재실행 결과가 같으므로 'Source' 표기를 유지한다.
SOURCE_LABEL = "Source"

# ──────────────────────────────────────────────────────────────
# 2. 단계 이름 (인덱스 = 실행 순서 = 파일명 접두어)
# ──────────────────────────────────────────────────────────────
STAGES = {
    "00": "source",
    "01": "bronze",
    "02": "silver",
}


def stage_file_name(idx: str, dataset: str, detail: str | None = None, ext: str = "parquet") -> str:
    """파일명 규칙: {단계인덱스}_{단계명}__{데이터셋}[__{세부}].{확장자}

    예) 02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_서울_202609.parquet
    """
    name = f"{idx}_{STAGES[idx]}__{dataset}"
    if detail:
        name += f"__{detail}"
    return f"{name}.{ext}"


def stage_detail(file_name: str, idx: str, dataset: str) -> str | None:
    """파일명에서 세부 이름만 꺼낸다. stage_file_name 의 반대.

    예) 01_bronze__apt_trade.parquet → None
        01_bronze__beauty__20261119.parquet → '20261119'
    """
    stem = Path(file_name).stem
    prefix = f"{idx}_{STAGES[idx]}__{dataset}"
    rest = stem[len(prefix):]
    if rest.startswith("__"):
        return rest[2:]
    return None


def relative(path: Path) -> str:
    """프로젝트 루트 기준 경로 (기록용). 예) data/bronze/apt_trade/01_bronze__apt_trade.parquet"""
    return path.resolve().relative_to(PROJECT_ROOT).as_posix()
