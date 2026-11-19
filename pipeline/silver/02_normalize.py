"""[02] Silver 표준화: data/bronze/*.parquet → data/silver/*.parquet

사용법
  python pipeline/silver/02_normalize.py                        # bronze 의 모든 데이터셋
  python pipeline/silver/02_normalize.py --dataset apt_trade    # 특정 데이터셋만 (결과 기록의 다른 데이터셋 행은 유지)
  python pipeline/silver/02_normalize.py --check                # 사전 검증만 (파일을 쓰지 않음)

하는 일
1. metadata/std_*.csv 를 읽어 형식을 검증한다 (이름 규칙, 접미사 ↔ 타입, 규칙 ↔ 타입, 표준 단어).
   bronze 컬럼 중 사전에 없는 것이 하나라도 있으면 아무것도 쓰지 않고 멈춘다.
2. bronze parquet 를 읽기만 한다 (실행 전후 SHA-256 비교).
3. 사전의 줄마다 '원천 컬럼 → 변환 규칙 → 표준 컬럼' 을 적용해
   data/silver/{데이터셋}/02_silver__{데이터셋}[__{세부}].parquet 로 저장한다.
   행은 지우거나 합치지 않는다. 변환에 실패한 칸은 NULL 이 되고, 그 행의 STD_ERR_TXT 에 표준 컬럼명이 남는다.
4. 결과 기록
   - report/silver/02_silver__manifest.csv   : 파일별 행 수 검증, 실패 칸 수, 재실행 상태
   - report/silver/02_silver__change_log.csv : 컬럼별 빈 값→NULL, 값이 바뀐 건수, 실패 건수, 변경 전→후 예시
   - data/silver/README.md                   : 위 내용을 사람이 읽기 좋게 요약
완료 조건: silver 행 수 = bronze 행 수 (모든 파일), bronze 불변, 다시 실행하면 같은 파일 (status=unchanged).
하나라도 어기면 종료 코드 1.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # pipeline/ → from common import ...

from common.files import replace_if_changed, snapshot_files
from common.paths import BRONZE_DIR, METADATA_DIR, REPORT_DIR, SILVER_DIR, relative, stage_detail, stage_file_name
from common.report import human_size, md_table, merge_dataset_rows, now_kst, write_csv, write_markdown
from common.std_dictionary import Term, load_terms, terms_for_file
from common.std_rules import apply_rule

IDX = "02"
ERR_COL = "STD_ERR_TXT"
REPORT_SILVER_DIR = REPORT_DIR / "silver"

# ──────────────────────────────────────────────────────────────
# 실행 옵션 (바꾸면 결과 파일이 달라지므로 고정한다)
# ──────────────────────────────────────────────────────────────
BATCH_SIZE = 100_000       # bronze 를 나눠 읽는 행 수 = silver row group 크기
COMPRESSION = "snappy"

# 사전 타입 → parquet 타입
ARROW_TYPES = {
    "STRING": pa.string(),
    "INT64": pa.int64(),
    "FLOAT64": pa.float64(),
    "DATE": pa.date32(),
    "DATETIME": pa.timestamp("s"),
    "TIME": pa.time32("s"),
    "BOOL": pa.bool_(),
}


# ──────────────────────────────────────────────────────────────
# bronze 목록
# ──────────────────────────────────────────────────────────────
def bronze_files(datasets: list[str] | None) -> list[tuple[str, Path]]:
    """(데이터셋, bronze 파일) 목록. 데이터셋 이름 = bronze 하위 폴더 이름."""
    folders = sorted(p for p in BRONZE_DIR.iterdir() if p.is_dir())
    out = []
    for folder in folders:
        if datasets and folder.name not in datasets:
            continue
        files = sorted(folder.glob("*.parquet"), key=lambda p: p.name.casefold())
        out += [(folder.name, f) for f in files]
    return out


def silver_path(dataset: str, bronze: Path) -> Path:
    detail = stage_detail(bronze.name, "01", dataset)
    return SILVER_DIR / dataset / stage_file_name(IDX, dataset, detail)


# ──────────────────────────────────────────────────────────────
# 변경 내역 (컬럼 하나, 파일 하나 단위로 누적)
# ──────────────────────────────────────────────────────────────
class ColumnLog:
    def __init__(self, term: Term):
        self.term = term
        self.rows = 0
        self.blank_to_null = 0
        self.changed = 0
        self.failed = 0
        self.example_before = ""
        self.example_after = ""
        self.fail_example = ""

    def add(self, raw: pd.Series, result: pd.Series, failed: pd.Series) -> None:
        is_blank = raw.str.strip() == ""
        has_result = result.notna()
        result_text = result.astype(str).where(has_result, "")
        is_changed = has_result & (result_text != raw)

        self.rows += len(raw)
        self.blank_to_null += int(is_blank.sum())
        self.changed += int(is_changed.sum())
        self.failed += int(failed.sum())

        if not self.example_before and is_changed.any():
            first = is_changed.to_numpy().argmax()
            self.example_before = raw.iat[first]
            self.example_after = result_text.iat[first]
        if not self.fail_example and failed.any():
            self.fail_example = raw.iat[failed.to_numpy().argmax()]

    def record(self, dataset: str, bronze: Path, silver: Path) -> dict:
        t = self.term
        return {
            "dataset": dataset, "bronze_file": bronze.name, "silver_file": silver.name,
            "source_column": "+".join(t.sources), "standard_column": t.target, "korean_name": t.korean_name,
            "type": t.dtype, "rule": t.rule.text, "rows": self.rows, "blank_to_null": self.blank_to_null,
            "changed": self.changed, "failed": self.failed, "example_before": self.example_before,
            "example_after": self.example_after, "fail_example": self.fail_example,
        }


# ──────────────────────────────────────────────────────────────
# 변환
# ──────────────────────────────────────────────────────────────
def to_arrow(values: pd.Series, dtype: str) -> pa.Array:
    """규칙 결과 Series → 사전 타입의 Arrow 배열."""
    arrow_type = ARROW_TYPES[dtype]
    if dtype in ("DATE", "DATETIME"):
        timestamps = pa.Array.from_pandas(pd.to_datetime(values))
        return timestamps.cast(arrow_type, safe=False)
    if dtype == "TIME":
        return pa.array(values.tolist(), type=arrow_type)      # datetime.time 객체 / None
    return pa.Array.from_pandas(values, type=arrow_type)       # None·NaN·NA 는 null 이 된다


def transform_batch(bronze_df: pd.DataFrame, terms: list[Term], logs: list[ColumnLog]) -> pa.Table:
    """bronze 한 묶음 → silver 한 묶음 (컬럼 순서 = 사전 순서 + STD_ERR_TXT)."""
    raw_text = {col: bronze_df[col].fillna("").astype(str) for col in bronze_df.columns}
    error_names = np.full(len(bronze_df), "", dtype=object)
    arrays = []

    for term, log in zip(terms, logs):
        source_values = [raw_text[s].reset_index(drop=True) for s in term.sources]
        result, failed = apply_rule(term.rule, source_values)

        raw_for_log = source_values[0]
        for extra in source_values[1:]:
            raw_for_log = raw_for_log + "|" + extra
        log.add(raw_for_log, result, failed)

        failed_mask = failed.to_numpy(dtype=bool)
        if failed_mask.any():
            add_name = np.where(error_names == "", term.target, error_names + "," + term.target)
            error_names = np.where(failed_mask, add_name, error_names)

        arrays.append(to_arrow(result, term.dtype))

    error_values = [name if name else None for name in error_names]
    arrays.append(pa.array(error_values, type=pa.string()))
    names = [t.target for t in terms] + [ERR_COL]
    return pa.Table.from_arrays(arrays, names=names)


def write_silver(dataset: str, bronze: Path, terms: list[Term]) -> tuple[dict, list[dict]]:
    """bronze 파일 하나를 silver 파일 하나로. 내용이 같으면 기존 파일을 그대로 둔다."""
    out = silver_path(dataset, bronze)
    out.parent.mkdir(parents=True, exist_ok=True)
    temp = out.with_name(out.name + ".tmp")
    logs = [ColumnLog(t) for t in terms]

    fields = [pa.field(t.target, ARROW_TYPES[t.dtype]) for t in terms]
    schema = pa.schema(fields + [pa.field(ERR_COL, pa.string())])
    source_columns = sorted({s for t in terms for s in t.sources})

    written_rows = 0
    bronze_reader = pq.ParquetFile(bronze)
    with pq.ParquetWriter(temp, schema, compression=COMPRESSION) as writer:
        for batch in bronze_reader.iter_batches(batch_size=BATCH_SIZE, columns=source_columns):
            table = transform_batch(batch.to_pandas(), terms, logs)
            writer.write_table(table.cast(schema))
            written_rows += table.num_rows

    status, new_sha = replace_if_changed(temp, out)

    bronze_rows = bronze_reader.metadata.num_rows
    silver_rows = pq.ParquetFile(out).metadata.num_rows
    record = {
        "dataset": dataset, "bronze_file": relative(bronze), "silver_file": relative(out),
        "bronze_rows": bronze_rows, "silver_rows_written": written_rows, "silver_rows_parquet": silver_rows,
        "row_match": bronze_rows == written_rows == silver_rows, "columns_count": len(schema),
        "failed_cells": sum(log.failed for log in logs), "silver_size": out.stat().st_size,
        "file_sha256": new_sha, "status": status,
    }
    match_text = "OK" if record["row_match"] else "불일치"
    print(f"[02] {dataset} | {bronze.name} → {out.name}: bronze {bronze_rows:,} / silver {silver_rows:,} "
          f"({match_text}, 변환 실패 {record['failed_cells']:,}칸, {status})")
    return record, [log.record(dataset, bronze, out) for log in logs]


# ──────────────────────────────────────────────────────────────
# 결과 기록
# ──────────────────────────────────────────────────────────────
def write_readme(manifest: pd.DataFrame, change_log: pd.DataFrame, bronze_ok: bool, started: str) -> None:
    manifest = manifest.copy()
    for col in ("bronze_rows", "silver_rows_parquet", "failed_cells", "silver_size", "columns_count"):
        manifest[col] = manifest[col].astype(int)
    row_match = manifest["row_match"].astype(str) == "True"
    passed = bool(row_match.all()) and bronze_ok

    files = pd.DataFrame({
        "데이터셋": manifest["dataset"],
        "파일 (silver/ 기준)": manifest["silver_file"].str.replace("data/silver/", "", regex=False),
        "bronze 행": manifest["bronze_rows"].map("{:,}".format),
        "silver 행": manifest["silver_rows_parquet"].map("{:,}".format),
        "행 수": row_match.map({True: "OK", False: "불일치"}),
        "열 수": manifest["columns_count"],
        "변환 실패 칸": manifest["failed_cells"].map("{:,}".format),
        "크기": manifest["silver_size"].map(human_size),
        "재실행": manifest["status"],
    })

    change_log = change_log.copy()
    change_log["failed"] = change_log["failed"].astype(int)
    fails = (change_log[change_log["failed"] > 0]
             .groupby(["dataset", "standard_column", "rule"], as_index=False)
             .agg(failed=("failed", "sum"), example=("fail_example", "first"))
             .sort_values("failed", ascending=False)
             .head(20))
    fails.columns = ["데이터셋", "표준 컬럼", "규칙", "실패 칸", "실패 예시"]

    lines = [
        "# silver — 2차 표준화 (parquet)", "",
        f"- 실행: `python pipeline/silver/02_normalize.py` (시작 {started}, 종료 {now_kst()})",
        "- 입력: `data/bronze/` (읽기만 함) · 기준: `metadata/std_*.csv`",
        "- 상세 기록: `report/silver/02_silver__manifest.csv`, `report/silver/02_silver__change_log.csv`",
        f"- **완료 조건 결과: {'통과' if passed else '실패'}**",
        f"  - silver 행 수 = bronze 행 수: {int(row_match.sum())}/{len(manifest)} 파일",
        f"  - bronze 불변 (실행 전후 SHA-256 동일): {'예' if bronze_ok else '아니오'}",
        "  - 재실행 동일성: `재실행` 이 `unchanged` 면 기존 파일과 바이트까지 같음 (처음 실행은 `created`)", "",
        "## 파일", "", *md_table(files), "",
        "## 변환 실패가 많은 컬럼 (상위 20)", "",
        *(md_table(fails) if len(fails) else ["(없음)"]), "",
        "실패한 칸은 NULL 이고, 그 행의 `STD_ERR_TXT` 에 표준 컬럼명이 남는다. "
        "원래 값은 `SRC_FILE_NM` + `SRC_ROW_NUM` 으로 bronze 에서 찾는다.",
    ]
    write_markdown(SILVER_DIR / "README.md", lines)


# ──────────────────────────────────────────────────────────────
# 실행
# ──────────────────────────────────────────────────────────────
def snapshot_bronze() -> dict[str, str]:
    return snapshot_files(BRONZE_DIR.rglob("*.parquet"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dataset", nargs="*", help="처리할 데이터셋 (기본: bronze 의 모든 데이터셋)")
    parser.add_argument("--check", action="store_true", help="사전 검증만 하고 파일은 쓰지 않음")
    args = parser.parse_args()
    started = now_kst()

    # 1. 사전 검증 (쓰기 전에 전부)
    try:
        terms = load_terms(METADATA_DIR)
    except (ValueError, FileNotFoundError) as exc:
        print(f"[02] {exc}")
        return 1

    files = bronze_files(args.dataset)
    if not files:
        print("[02] bronze 파일이 없습니다. 01 단계를 먼저 실행하세요")
        return 1

    plan, problems = [], []
    for dataset, bronze in files:
        columns = pq.ParquetFile(bronze).schema_arrow.names
        try:
            plan.append((dataset, bronze, terms_for_file(terms, dataset, bronze.name, columns)))
        except (KeyError, ValueError) as exc:
            problems.append(str(exc))
    if problems:
        print("[02] 사전 검증 실패 — 아무 파일도 쓰지 않았습니다:\n  " + "\n  ".join(problems))
        return 1

    datasets = sorted({dataset for dataset, _ in files})
    print(f"[02] 사전 검증 통과: 사전 {len(terms)}줄, 데이터셋 {len(datasets)}개, bronze {len(plan)}개 파일")
    if args.check:
        return 0

    # 2. 변환
    before = snapshot_bronze()
    records, column_logs = [], []
    for dataset, bronze, file_terms in plan:
        record, logs = write_silver(dataset, bronze, file_terms)
        records.append(record)
        column_logs += logs
    bronze_ok = snapshot_bronze() == before

    # 3. 결과 기록
    manifest_path = REPORT_SILVER_DIR / stage_file_name(IDX, "manifest", ext="csv")
    change_log_path = REPORT_SILVER_DIR / stage_file_name(IDX, "change_log", ext="csv")
    run_manifest = pd.DataFrame(records)
    run_change_log = pd.DataFrame(column_logs)
    if args.dataset:
        manifest = merge_dataset_rows(manifest_path, run_manifest, datasets)
        change_log = merge_dataset_rows(change_log_path, run_change_log, datasets)
    else:
        manifest, change_log = run_manifest, run_change_log
    write_csv(manifest_path, manifest)
    write_csv(change_log_path, change_log)
    write_readme(manifest, change_log, bronze_ok, started)

    # 4. 완료 조건 (이번 실행에서 처리한 파일로 판단)
    row_ok = bool(run_manifest["row_match"].all())
    unchanged = int((run_manifest["status"] == "unchanged").sum())
    passed = row_ok and bronze_ok
    print(f"\n[02] 완료 조건: {'통과' if passed else '실패'} | 행 수 일치 {int(run_manifest['row_match'].sum())}/{len(run_manifest)} "
          f"| bronze 불변 {'예' if bronze_ok else '아니오'} | 재실행 동일 {unchanged}/{len(run_manifest)}")
    print(f"[02] 결과: {relative(SILVER_DIR / 'README.md')}, {relative(manifest_path)}, {relative(change_log_path)}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
