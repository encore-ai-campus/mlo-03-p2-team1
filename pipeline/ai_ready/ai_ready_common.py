"""05 AI Ready 단계에서 같이 쓰는 기준 읽기와 결과 기록."""
from __future__ import annotations

from pathlib import Path

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

from common.files import replace_if_changed, sha256_file
from common.paths import DATA_DIR, METADATA_DIR, REPORT_DIR, relative, stage_file_name
from common.report import write_csv

GOLD_DIR = DATA_DIR / "gold"
AI_READY_DIR = DATA_DIR / "ai_ready"
AI_READY_REPORT_DIR = REPORT_DIR / "ai_ready"
PARAM_CSV = METADATA_DIR / "rule_ai_ready_param.csv"
FEATURE_CSV = METADATA_DIR / "rule_ai_ready_feature.csv"
GOLD_PRICE_CSV = METADATA_DIR / "rule_gold_apt_price.csv"
GOLD_INDUTY_CSV = METADATA_DIR / "rule_gold_induty.csv"

KEY_COLS = ["LDONG_CD", "YQ", "TARGET_YQ", "SPLIT_NM"]
TARGET_COL = "TARGET_RET"
# 피처는 아니지만 예측값을 매매가·지수로 되돌릴 때 쓰는 분기 t 기준값
BASE_COLS = ["BASE_UNIT_AMT", "BASE_PRICE_IDX", "BASE_IDX_SEG_NO"]
MODELS = {"baseline": [], "price": ["PRICE"], "price_lcns": ["PRICE", "LCNS"]}


def gold_file(gold_dir: Path, name: str) -> Path:
    return gold_dir / stage_file_name("04", name)


def out_file(out_dir: Path, name: str) -> Path:
    return out_dir / stage_file_name("05", name)


def report_file(name: str, ext: str = "csv") -> Path:
    return AI_READY_REPORT_DIR / stage_file_name("05", name, ext=ext)


def load_params() -> dict[str, str]:
    rules = pd.read_csv(PARAM_CSV, dtype=str, keep_default_na=False)
    if rules["param"].duplicated().any():
        raise ValueError(f"{relative(PARAM_CSV)}: param 중복")
    return dict(zip(rules["param"], rules["value"]))


def load_min_price_samples() -> int:
    rules = pd.read_csv(GOLD_PRICE_CSV, dtype=str, keep_default_na=False)
    value = int(rules.loc[rules["param"].eq("MIN_PRICE_SAMPLE_CNT"), "value"].item())
    if value < 1:
        raise ValueError("MIN_PRICE_SAMPLE_CNT는 양의 정수여야 합니다.")
    return value


def load_features() -> pd.DataFrame:
    features = pd.read_csv(FEATURE_CSV, dtype=str, keep_default_na=False)
    if features["feature"].duplicated().any():
        raise ValueError(f"{relative(FEATURE_CSV)}: feature 중복")
    unknown = set(features["feature_group"]) - {"PRICE", "LCNS"}
    if unknown:
        raise ValueError(f"{relative(FEATURE_CSV)}: 알 수 없는 feature_group {sorted(unknown)}")
    return features


def model_features(features: pd.DataFrame, model_nm: str) -> list[str]:
    return features.loc[features["feature_group"].isin(MODELS[model_nm]), "feature"].tolist()


def write_parquet(df: pd.DataFrame, target: Path) -> tuple[str, str]:
    """임시 파일에 쓴 뒤 내용이 바뀐 경우에만 교체한다."""
    target.parent.mkdir(parents=True, exist_ok=True)
    temp = target.with_name(f".{target.name}.tmp")
    pq.write_table(pa.Table.from_pandas(df, preserve_index=False), temp, compression="snappy")
    return replace_if_changed(temp, target)


def write_text_if_changed(target: Path, write) -> str:
    """write(temp_path)로 만든 파일을 내용이 바뀐 경우에만 교체한다."""
    target.parent.mkdir(parents=True, exist_ok=True)
    temp = target.with_name(f".{target.name}.tmp")
    write(temp)
    return replace_if_changed(temp, target)[0]


def input_rows(step: str, paths: dict[str, Path]) -> list[dict]:
    return [{
        "step": step, "kind": "input", "dataset": name, "file": relative(path),
        "rows": "", "columns": "", "sha256": sha256_file(path), "status": "read",
    } for name, path in paths.items()]


def output_row(step: str, name: str, path: Path, df: pd.DataFrame, status: str, sha: str) -> dict:
    return {
        "step": step, "kind": "output", "dataset": name, "file": relative(path),
        "rows": len(df), "columns": len(df.columns), "sha256": sha, "status": status,
    }


def update_manifest(step: str, rows: list[dict]) -> None:
    """이번 step 행만 바꾸고 다른 step 행은 유지한다."""
    path = report_file("manifest")
    run = pd.DataFrame(rows).astype(str)
    if path.exists():
        previous = pd.read_csv(path, dtype=str, keep_default_na=False, encoding="utf-8-sig")
        run = pd.concat([previous[previous["step"].ne(step)], run], ignore_index=True)
    order = {"feature_set": 0, "train": 1}
    run = run.sort_values(["step", "kind"], key=lambda s: s.map(order) if s.name == "step" else s,
                          kind="stable").reset_index(drop=True)
    write_text_if_changed(path, lambda temp: write_csv(temp, run))
