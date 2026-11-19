"""[01] Bronze: data/source 원천 → data/bronze/*.parquet

사용법
  python pipeline/bronze/01_bronze.py                        # metadata/ds_dataset.csv 의 활성 데이터셋 전부
  python pipeline/bronze/01_bronze.py --dataset store_info   # 특정 데이터셋만 (결과 기록의 다른 데이터셋 행은 유지)

하는 일
1. 원천 데이터 파일(data/source/files, data/source/api) 전체의 SHA-256 을 기록하고 읽기 전용 속성을 건다.
2. metadata/ds_dataset.csv 정의(경로·zip 안쪽 파일·구분자·인코딩·XML 행 경로)대로 원천을 읽는다.
   값은 전부 문자열 그대로 두고, 이름·형식·공백 등 어떤 정제도 하지 않는다 (정제는 02 단계부터).
3. data/bronze/{데이터셋}/01_bronze__{데이터셋}[__{원천이름}].parquet 로 저장한다.
   추적 컬럼: _source_file(원천 경로[!/zip 안쪽 파일]), _source_row(원천 데이터 행 번호, 1부터)
4. 결과 기록
   - report/bronze/01_bronze__manifest.csv : 파일별 원천 행 수 · bronze 행 수 · 열 목록 · 재실행 상태
   - data/bronze/README.md                 : 위 내용을 사람이 읽기 좋게 요약
완료 조건: 원천 행 수(따로 센 값) = bronze 행 수 (모든 파일), 원천 불변, 다시 실행하면 같은 파일 (status=unchanged).
하나라도 어기면 종료 코드 1.
"""
from __future__ import annotations

import argparse
import itertools
import re
import sys
from collections.abc import Iterable, Iterator
from pathlib import Path

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # pipeline/ → from common import ...

from common.files import protect_read_only, replace_if_changed, snapshot_files
from common.paths import BRONZE_DIR, METADATA_DIR, REPORT_DIR, SOURCE_DIR, relative, stage_file_name
from common.report import human_size, md_table, merge_dataset_rows, now_kst, write_csv, write_markdown
from common.source_reader import (Dataset, SourceUnit, count_source_rows, list_units, load_datasets, read_chunks,
                                  safe_name, source_data_files)

IDX = "01"
REPORT_BRONZE_DIR = REPORT_DIR / "bronze"
DATASET_FILE = METADATA_DIR / "ds_dataset.csv"

# ──────────────────────────────────────────────────────────────
# 실행 옵션 (바꾸면 결과 파일이 달라지므로 고정한다)
# ──────────────────────────────────────────────────────────────
CHUNK_SIZE = 100_000       # CSV 를 나눠 읽는 행 수 = parquet row group 크기
COMPRESSION = "snappy"
LINEAGE_FILE = "_source_file"
LINEAGE_ROW = "_source_row"


# ──────────────────────────────────────────────────────────────
# parquet 쓰기
# ──────────────────────────────────────────────────────────────
def with_lineage(frames: Iterable[pd.DataFrame], unit: SourceUnit) -> Iterator[pd.DataFrame]:
    """묶음마다 추적 컬럼을 붙인다. _source_row 는 원천 단위 안의 데이터 행 번호(1부터)."""
    row_no = 0
    for df in frames:
        df = df.copy()
        df[LINEAGE_FILE] = unit.source_id
        df[LINEAGE_ROW] = range(row_no + 1, row_no + 1 + len(df))
        row_no += len(df)
        yield df


def rebatch(frames: Iterable[pd.DataFrame], size: int) -> Iterator[pd.DataFrame]:
    """작은 묶음(API 1,000행)을 고정 크기 묶음으로 → row group 크기 고정."""
    buffer, buffered = [], 0
    for df in frames:
        buffer.append(df)
        buffered += len(df)
        while buffered >= size:
            whole = pd.concat(buffer, ignore_index=True)
            yield whole.iloc[:size]
            rest = whole.iloc[size:]
            buffer, buffered = ([rest] if len(rest) else []), len(rest)
    if buffered:
        yield pd.concat(buffer, ignore_index=True)


def write_parquet(frames: Iterable[pd.DataFrame], columns: list[str], out: Path) -> dict:
    """묶음 하나 = row group 하나로 쓴다. 원천 열은 모두 string, _source_row 만 int64.
    결과가 기존 파일과 같으면 기존 파일을 그대로 둔다."""
    schema = pa.schema([pa.field(c, pa.string()) for c in columns]
                       + [pa.field(LINEAGE_FILE, pa.string()), pa.field(LINEAGE_ROW, pa.int64())])
    out.parent.mkdir(parents=True, exist_ok=True)
    temp = out.with_name(out.name + ".tmp")

    written_rows = 0
    with pq.ParquetWriter(temp, schema, compression=COMPRESSION) as writer:
        for df in frames:
            df = df.reindex(columns=schema.names, fill_value="")   # 이 묶음에 없는 열은 빈 문자열
            arrays = [pa.Array.from_pandas(df[field.name], type=field.type) for field in schema]
            writer.write_table(pa.Table.from_arrays(arrays, schema=schema))
            written_rows += len(df)

    status, file_sha = replace_if_changed(temp, out)
    return {"rows": written_rows, "status": status, "file_sha256": file_sha}


# ──────────────────────────────────────────────────────────────
# 데이터셋 처리
# ──────────────────────────────────────────────────────────────
def unique_details(units: list[SourceUnit]) -> list[str]:
    """세부 이름이 겹치면 zip 파일 이름을 앞에 붙인다."""
    base = [u.detail for u in units]
    duplicated = {d for d in base if base.count(d) > 1}
    return [f"{safe_name(u.path.stem)}_{d}" if d in duplicated else d for u, d in zip(units, base)]


def first_columns(units: list[SourceUnit]) -> list[str]:
    """여러 원천 단위의 열 합집합 (정렬된 원천 순서로 처음 나온 순서).
    csv 는 헤더가 하나라 첫 묶음만 보고, xml 은 파일마다 열이 다를 수 있어 전부 본다."""
    columns: list[str] = []
    for unit in units:
        chunks = read_chunks(unit, CHUNK_SIZE)
        if unit.dataset.kind == "csv":
            chunks = itertools.islice(chunks, 1)
        for df in chunks:
            columns += [c for c in df.columns if c not in columns]
    return columns


def marker_rows(path: Path) -> int | None:
    """00 단계가 남긴 스냅샷 완료 표시의 rows= 값."""
    match = re.search(r"^rows=(\d+)$", path.read_text(encoding="utf-8"), re.M)
    return int(match.group(1)) if match else None


def make_record(ds: Dataset, units: list[SourceUnit], out: Path, source_rows: int, result: dict,
                columns: list[str], source_sha: dict[str, str], note: str = "") -> dict:
    parquet_rows = pq.ParquetFile(out).metadata.num_rows
    if len(units) <= 3:
        source_text = "; ".join(u.source_id for u in units)
        sha_text = "; ".join(sorted({source_sha[relative(u.path)][:16] for u in units}))
    else:
        source_text = f"{units[0].source_id} 외 {len(units) - 1}개"
        sha_text = "-"
    return {
        "dataset": ds.name, "kind": ds.kind, "source": source_text, "source_units": len(units),
        "source_sha256": sha_text, "encoding": "; ".join(sorted({u.encoding for u in units})),
        "source_rows": source_rows, "bronze_rows_written": result["rows"], "bronze_rows_parquet": parquet_rows,
        "row_match": source_rows == result["rows"] == parquet_rows,
        "bronze_file": relative(out), "bronze_size": out.stat().st_size,
        "columns_count": len(columns), "columns": ", ".join(columns),
        "file_sha256": result["file_sha256"], "status": result["status"], "note": note,
    }


def print_result(ds: Dataset, label: str, out: Path, record: dict) -> None:
    match_text = "OK" if record["row_match"] else "불일치"
    print(f"[01] {ds.name} | {label} → {out.name}: 원천 {record['source_rows']:,} / "
          f"bronze {record['bronze_rows_written']:,} ({match_text}, {record['status']})")


def write_one(ds: Dataset, unit: SourceUnit, out: Path, source_sha: dict[str, str]) -> dict:
    """per_file: 원천 단위 1개 → parquet 1개."""
    source_rows = count_source_rows(unit)
    columns = first_columns([unit])
    result = write_parquet(with_lineage(read_chunks(unit, CHUNK_SIZE), unit), columns, out)
    record = make_record(ds, [unit], out, source_rows, result, columns, source_sha)
    print_result(ds, unit.source_id, out, record)
    return record


def write_group(ds: Dataset, units: list[SourceUnit], out: Path, source_sha: dict[str, str], note: str,
                fixed_batches: bool) -> dict:
    """combined / per_dir: 원천 단위 여러 개 → parquet 1개.
    fixed_batches=True(per_dir) 면 row group 을 CHUNK_SIZE 로 맞추고, False(combined) 면 원천 파일 1개 = row group 1개."""
    source_rows = sum(count_source_rows(u) for u in units)
    columns = first_columns(units)
    frames = itertools.chain.from_iterable(with_lineage(read_chunks(u, CHUNK_SIZE), u) for u in units)
    if fixed_batches:
        frames = rebatch(frames, CHUNK_SIZE)
    result = write_parquet(frames, columns, out)
    record = make_record(ds, units, out, source_rows, result, columns, source_sha, note)
    print_result(ds, f"원천 {len(units)}개", out, record)
    return record


def process_dataset(ds: Dataset, source_sha: dict[str, str]) -> list[dict]:
    units = list_units(ds)
    if not units:
        print(f"[01] {ds.name}: 원천 없음 (data/source/{ds.source}) → 건너뜀")
        return [{"dataset": ds.name, "kind": ds.kind, "source": f"(없음) {ds.source}", "row_match": None,
                 "status": "no_source", "note": "원천 파일이 아직 없음"}]

    out_dir = BRONZE_DIR / ds.name
    if ds.output == "per_file":
        return [write_one(ds, unit, out_dir / stage_file_name(IDX, ds.name, detail), source_sha)
                for unit, detail in zip(units, unique_details(units))]

    if ds.output == "combined":   # API 페이지 파일처럼 작은 파일이 많을 때 데이터셋 전체를 하나로
        out = out_dir / stage_file_name(IDX, ds.name)
        return [write_group(ds, units, out, source_sha, f"원천 {len(units)}개 파일 결합", fixed_batches=False)]

    # per_dir: 수집일 스냅샷 폴더 1개 → parquet 1개. 완료 표시가 있는 폴더만
    groups: dict[Path, list[SourceUnit]] = {}
    for unit in units:
        groups.setdefault(unit.path.parent, []).append(unit)
    records = []
    for folder, group in groups.items():
        marker = folder / ds.done_marker
        if not marker.exists():
            print(f"[01] {ds.name} | {folder.name}: 완료 표시({ds.done_marker}) 없음 → 끊긴 스냅샷으로 보고 건너뜀")
            continue
        out = out_dir / stage_file_name(IDX, ds.name, safe_name(folder.name))
        record = write_group(ds, group, out, source_sha, f"{folder.name} 폴더 원천 {len(group)}개 파일 결합",
                             fixed_batches=True)
        expected = marker_rows(marker)
        if expected is not None and expected != record["source_rows"]:
            record["row_match"] = False
            record["note"] += f" | 완료 표시 rows={expected:,} 와 원천 행 수 불일치"
        records.append(record)
    return records


# ──────────────────────────────────────────────────────────────
# 결과 기록
# ──────────────────────────────────────────────────────────────
def write_readme(manifest: pd.DataFrame, datasets: list[Dataset], source_ok: bool, protected: int,
                 started: str) -> None:
    done = manifest[manifest["status"] != "no_source"].copy()
    row_match = done["row_match"].astype(str) == "True"
    passed = bool(row_match.all()) and len(done) > 0 and source_ok

    files = pd.DataFrame({
        "데이터셋": done["dataset"],
        "파일 (bronze/ 기준)": done["bronze_file"].str.replace("data/bronze/", "", regex=False),
        "원천 행": done["source_rows"].map(lambda v: f"{int(v):,}"),
        "bronze 행": done["bronze_rows_parquet"].map(lambda v: f"{int(v):,}"),
        "행 수": row_match.map({True: "OK", False: "불일치"}),
        "열 수": done["columns_count"],
        "크기": done["bronze_size"].map(lambda v: human_size(int(v))),
        "재실행": done["status"],
        "SHA-256(앞12)": done["file_sha256"].str[:12],
    })
    sources = done[["dataset", "source", "encoding", "note"]].rename(columns={
        "dataset": "데이터셋", "source": "원천 (Source 기준 경로 !/zip 안쪽)", "encoding": "인코딩", "note": "비고"})
    missing = manifest[manifest["status"] == "no_source"][["dataset", "source"]]
    settings = pd.DataFrame([{
        "데이터셋": d.name, "종류": d.kind, "원천": d.source, "zip 안쪽": d.zip_member or "-",
        "인코딩": d.encoding if d.kind == "csv" else "-", "구분자": repr(d.sep) if d.kind == "csv" else "-",
        "XML 행 경로": d.item_path or "-", "출력": d.output,
    } for d in datasets])

    write_markdown(BRONZE_DIR / "README.md", [
        "# bronze — 1차 Bronze (parquet)", "",
        f"- 실행: `python pipeline/bronze/01_bronze.py` (시작 {started}, 종료 {now_kst()})",
        "- 입력: `data/source/` (읽기 전용) · 설정: `metadata/ds_dataset.csv`",
        "- 상세 기록: `report/bronze/01_bronze__manifest.csv`",
        f"- **완료 조건 결과: {'통과' if passed else '실패'}**",
        f"  - 원천 행 수 = bronze 행 수: {int(row_match.sum())}/{len(done)} 파일",
        f"  - 원천 불변 (실행 전후 SHA-256 동일): {'예' if source_ok else '아니오'}",
        f"  - 이번 실행에서 읽기 전용으로 바꾼 원천 파일: {protected}개",
        "  - 재실행 동일성: `재실행` 이 `unchanged` 면 기존 파일과 바이트까지 같음 (처음 실행은 `created`)", "",
        "## 파일", "", *md_table(files), "",
        "## 원천 대응", "", *md_table(sources), "",
        *(["## 원천이 아직 없는 데이터셋", "", *md_table(missing), ""] if len(missing) else []),
        "## Bronze 규칙", "",
        "- 원천 값을 바꾸지 않는다: 모든 열을 문자열로 저장하고 공백·형식·단위·열 이름을 그대로 둔다. 결측은 빈 문자열.",
        "- 추가하는 열은 두 개뿐이다: `_source_file`(원천 경로, zip 안쪽 파일은 `!/`), `_source_row`(원천 데이터 행 번호, 1부터).",
        "- 원천 행 수는 pandas 와 다른 방법(csv 모듈, XML 태그 개수)으로 따로 세어 비교한다. 빈 줄은 행으로 세지 않는다.",
        "- 파일명: `01_bronze__{데이터셋}__{원천이름}.parquet`. API 처럼 작은 파일이 많은 원천은 `01_bronze__{데이터셋}.parquet` "
        "하나로 결합하고, 스냅샷 원천은 `01_bronze__{데이터셋}__{스냅샷폴더}.parquet` 로 폴더마다 하나 (완료 표시가 없는 폴더는 건너뜀).",
        "- 재현성: 원천 정렬 순서·row group 크기·압축 방식을 고정하고 실행 시각 같은 값을 파일에 넣지 않는다. "
        "결과가 기존 파일과 같으면 기존 파일을 그대로 둔다.", "",
        "## 데이터셋 설정 (metadata/ds_dataset.csv)", "", *md_table(settings),
    ])


# ──────────────────────────────────────────────────────────────
# 실행
# ──────────────────────────────────────────────────────────────
def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dataset", nargs="*", help="처리할 데이터셋 (기본: 활성 데이터셋 전부)")
    args = parser.parse_args()
    started = now_kst()

    try:
        datasets = load_datasets(DATASET_FILE)
    except (ValueError, FileNotFoundError) as exc:
        print(f"[01] {exc}")
        return 1
    targets = [d for d in datasets if not args.dataset or d.name in args.dataset]
    unknown = sorted(set(args.dataset or []) - {d.name for d in datasets})
    if unknown:
        print(f"[01] {DATASET_FILE.name} 에 없는 데이터셋: {unknown}")
        return 1

    # 1. 원천 잠그기 + 실행 전 체크섬
    source_files = source_data_files()
    if not source_files:
        print(f"[01] 원천 데이터가 없습니다: {relative(SOURCE_DIR)}/files, {relative(SOURCE_DIR)}/api "
              "(00 단계로 수집하거나 원천 폴더를 복사하세요). 아무 파일도 쓰지 않았습니다")
        return 1
    protected = protect_read_only(source_files)
    before = snapshot_files(source_files)

    # 2. 변환
    records = []
    for ds in targets:
        records += process_dataset(ds, before)
    source_ok = snapshot_files(source_data_files()) == before

    # 3. 결과 기록
    run_manifest = pd.DataFrame(records)
    manifest_path = REPORT_BRONZE_DIR / stage_file_name(IDX, "manifest", ext="csv")
    if args.dataset:
        manifest = merge_dataset_rows(manifest_path, run_manifest, [d.name for d in targets])
    else:
        manifest = run_manifest
    write_csv(manifest_path, manifest)
    write_readme(manifest, datasets, source_ok, protected, started)

    # 4. 완료 조건 (이번 실행에서 처리한 파일로 판단)
    done = run_manifest[run_manifest["status"] != "no_source"]
    matched = int(done["row_match"].astype(bool).sum()) if len(done) else 0
    unchanged = int((done["status"] == "unchanged").sum()) if len(done) else 0
    passed = source_ok and len(done) > 0 and matched == len(done)
    print(f"\n[01] 완료 조건: {'통과' if passed else '실패'} | 행 수 일치 {matched}/{len(done)} "
          f"| 원천 불변 {'예' if source_ok else '아니오'} | 재실행 동일 {unchanged}/{len(done)}")
    print(f"[01] 결과: {relative(BRONZE_DIR / 'README.md')}, {relative(manifest_path)}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
