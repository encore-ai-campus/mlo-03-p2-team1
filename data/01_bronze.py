"""[01] Bronze: Source/ 원천 → bronze/*.parquet

사용법
  python 01_bronze.py                       # config.DATASETS 의 활성 데이터셋 전부
  python 01_bronze.py --dataset store_info  # 특정 데이터셋만 (manifest·README 의 다른 데이터셋 행은 이전 결과를 유지)

하는 일
1. Source 전체 파일의 SHA-256 을 기록하고 읽기 전용 속성을 건다.
2. config.DATASETS 설정(경로·zip 안쪽 파일·시트 이름·읽을 열·구분자·인코딩·헤더)대로 원천을 읽는다.
   값은 전부 문자열 그대로 두고, 이름·형식·공백 등 어떤 정제도 하지 않는다 (정제는 02 단계부터).
3. parquet 로 bronze/{데이터셋}/01_bronze__{데이터셋}__{원천이름}.parquet 에 저장한다.
   추적 컬럼: _source_file(원천 경로[!/zip안쪽][#시트]), _source_row(원천 데이터 행 번호, 1부터)
4. 완료 조건 검사
   - 원천 행 수(독립적으로 센 값) == parquet 에 쓴 행 수 == parquet 메타데이터 행 수
   - 실행 전후 Source 체크섬이 같아야 함 (원천 불변)
   - 같은 입력으로 다시 실행하면 같은 파일 (status=unchanged)
5. bronze/01_bronze__manifest.csv 와 bronze/README.md 를 만든다.
조건을 하나라도 어기면 종료 코드 1.
"""
from __future__ import annotations

import argparse
import itertools
import re
import sys
from pathlib import Path

import pandas as pd

import config
from common import parquet_io as pqio
from common.report import human_size, md_table, merge_dataset_rows, now_kst, write_markdown
from common.source_io import (list_units, protect_read_only, read_chunks, sha256_file, snapshot_sources,
                              count_source_rows)

IDX = "01"
CFG = config.BRONZE


def _with_lineage(frames, unit, start_row: int = 0):
    """청크마다 원천 추적 컬럼을 붙인다. _source_row 는 원천 데이터 행 번호(1부터)."""
    n = start_row
    for df in frames:
        df = df.copy()
        if CFG["lineage_columns"]:
            df[pqio.LINEAGE_FILE] = unit.source_id
            df[pqio.LINEAGE_ROW] = range(n + 1, n + 1 + len(df))
        n += len(df)
        yield df


def _peek(gen):
    first = next(gen, None)
    if first is None:
        return None, iter(())
    return first, itertools.chain([first], gen)


def _unique_details(units) -> list[str]:
    """출력 파일 세부 이름: 원천 파일(또는 zip 안쪽 파일)·시트 이름. 겹치면 zip 파일 이름을 앞에 붙인다."""
    base = [u.detail for u in units]
    dup = {d for d in base if base.count(d) > 1}
    return [f"{_safe(Path(u.path).stem)}_{d}" if d in dup else d for u, d in zip(units, base)]


def _safe(text: str) -> str:
    return re.sub(r'[\\/:*?"<>|\s]+', "_", text).strip("_")


def _record(ds, units, out_path, src_rows, res, columns, note=""):
    pq_rows = pqio.parquet_num_rows(out_path)
    return {
        "dataset": ds["name"], "kind": ds["kind"],
        "source": "; ".join(u.source_id for u in units) if len(units) <= 3 else f"{units[0].source_id} 외 {len(units) - 1}개",
        "source_units": len(units),
        "source_sha256": "; ".join(sorted({sha256_file(u.path)[:16] for u in units})) if len(units) <= 3 else "-",
        "encoding": "; ".join(sorted({u.info.get("encoding", "-") for u in units})),
        "source_rows": src_rows, "bronze_rows_written": res["rows"], "bronze_rows_parquet": pq_rows,
        "row_match": src_rows == res["rows"] == pq_rows,
        "bronze_file": out_path.relative_to(config.PROJECT_ROOT).as_posix(),
        "bronze_size": out_path.stat().st_size,
        "columns_count": len(columns), "columns": ", ".join(columns),
        "file_sha256": res["file_sha256"], "content_sha256": res["content_sha256"],
        "status": res["status"], "note": note,
    }


def process_dataset(ds: dict) -> list[dict]:
    units = list_units(ds)
    if not units:
        print(f"[01] {ds['name']}: 원천 없음 ({ds['source']}) → 건너뜀")
        return [{"dataset": ds["name"], "kind": ds["kind"], "source": f"(없음) {ds['source']}", "row_match": None,
                 "status": "no_source", "note": "원천 파일이 아직 없음"}]
    out_dir = config.BRONZE_DIR / ds["name"]
    records = []
    if ds.get("output", "per_file") == "per_file":
        details = _unique_details(units)
        for u, detail in zip(units, details):
            src_rows = count_source_rows(u)
            first, frames = _peek(read_chunks(u, CFG["chunksize"]))
            columns = list(first.columns) if first is not None else []
            out = out_dir / config.stage_file_name(IDX, ds["name"], detail)
            res = pqio.write_parquet(_with_lineage(frames, u), columns, out, CFG["compression"], CFG["lineage_columns"])
            rec = _record(ds, [u], out, src_rows, res, columns,
                          note=f"sheet={u.sheet}" if u.sheet else "")
            records.append(rec)
            print(f"[01] {ds['name']} | {u.source_id} → {out.name}: 원천 {src_rows:,} / bronze {res['rows']:,} "
                  f"({'OK' if rec['row_match'] else '불일치'}, {res['status']})")
    elif ds["output"] == "per_dir":  # 원천 폴더(스냅샷) 1개 → parquet 1개. 완료 표시가 있는 폴더만
        groups: dict[Path, list] = {}
        for u in units:                       # units 는 경로순 정렬 → 폴더 순서도 고정
            groups.setdefault(u.path.parent, []).append(u)
        marker = ds.get("done_marker")
        for folder, group in groups.items():
            if marker and not (folder / marker).exists():
                print(f"[01] {ds['name']} | {folder.name}: 완료 표시({marker}) 없음 → 끊긴 스냅샷으로 보고 건너뜀")
                continue
            note = f"{folder.name} 폴더 원천 {len(group)}개 파일 결합"
            expect = _marker_rows(folder / marker) if marker else None
            out = out_dir / config.stage_file_name(IDX, ds["name"], _safe(folder.name))
            rec = _write_group(ds, group, out, note, rebatch=True)
            if expect is not None and expect != rec["source_rows"]:
                rec["row_match"] = False
                rec["note"] += f" | 완료 표시 rows={expect:,} 와 원천 행 수 불일치"
            records.append(rec)
    else:  # combined: 데이터셋 전체를 하나로 (API 페이지 파일처럼 작은 파일이 많을 때)
        records.append(_write_group(ds, units, out_dir / config.stage_file_name(IDX, ds["name"]),
                                    f"원천 {len(units)}개 파일 결합"))
    return records


def _marker_rows(path: Path) -> int | None:
    """00_collect.py 가 남긴 완료 표시의 rows= 값."""
    m = re.search(r"^rows=(\d+)$", path.read_text(encoding="utf-8"), re.M)
    return int(m.group(1)) if m else None


def _rebatch(frames, columns: list[str], size: int):
    """작은 청크(API 페이지 1,000행)를 고정 크기(chunksize) 묶음으로 → row group 크기 고정, 파일 크기 감소."""
    buf, n = [], 0
    for df in frames:
        buf.append(df.reindex(columns=columns + [c for c in df.columns if c not in columns]))
        n += len(df)
        while n >= size:
            whole = pd.concat(buf, ignore_index=True)
            yield whole.iloc[:size]
            rest = whole.iloc[size:]
            buf, n = ([rest] if len(rest) else []), len(rest)
    if n:
        yield pd.concat(buf, ignore_index=True)


def _write_group(ds: dict, units: list, out: Path, note: str, rebatch: bool = False) -> dict:
    """여러 원천 단위를 parquet 하나로. 컬럼은 전체 원천의 합집합(처음 나온 순서, 정렬된 파일 순서라 재실행해도 같음).
    rebatch=True 면 row group 을 chunksize 로 고정한다 (per_dir). combined 는 기존 파일과 같게 유지하려고 그대로 둔다."""
    src_rows = sum(count_source_rows(u) for u in units)
    columns: list[str] = []
    for u in units:
        for df in read_chunks(u, CFG["chunksize"]):
            columns += [c for c in df.columns if c not in columns]
    frames = itertools.chain.from_iterable(_with_lineage(read_chunks(u, CFG["chunksize"]), u) for u in units)
    if rebatch:
        lineage = [pqio.LINEAGE_FILE, pqio.LINEAGE_ROW] if CFG["lineage_columns"] else []
        frames = _rebatch(frames, columns + lineage, CFG["chunksize"])
    res = pqio.write_parquet(frames, columns, out, CFG["compression"], CFG["lineage_columns"])
    rec = _record(ds, units, out, src_rows, res, columns, note=note)
    print(f"[01] {ds['name']} | 원천 {len(units)}개 → {out.name}: 원천 {src_rows:,} / bronze {res['rows']:,} "
          f"({'OK' if rec['row_match'] else '불일치'}, {res['status']})")
    return rec


def write_readme(man: pd.DataFrame, source_ok: bool, protected: int, started: str) -> None:
    done = man[man["status"] != "no_source"]
    ok = bool(done["row_match"].all()) if len(done) else False
    view = done.assign(
        file=done["bronze_file"].str.replace("bronze/", "", regex=False),
        size=done["bronze_size"].map(lambda v: human_size(int(v))),
        rows=done["bronze_rows_parquet"].map(lambda v: f"{int(v):,}"),
        src=done["source_rows"].map(lambda v: f"{int(v):,}"),
        match=done["row_match"].map({True: "OK", False: "불일치"}),
        sha=done["file_sha256"].str[:12],
    )[["dataset", "file", "src", "rows", "match", "columns_count", "size", "status", "sha"]].rename(columns={
        "dataset": "데이터셋", "file": "파일 (bronze/ 기준)", "src": "원천 행", "rows": "bronze 행", "match": "행 수",
        "columns_count": "열 수", "size": "크기", "status": "재실행", "sha": "SHA-256(앞12)"})
    sources = done[["dataset", "source", "encoding", "note"]].rename(columns={
        "dataset": "데이터셋", "source": "원천 (Source 기준 경로 !/zip 안쪽 #시트)", "encoding": "인코딩", "note": "비고"})
    missing = man[man["status"] == "no_source"][["dataset", "source"]]
    keys = ("name", "kind", "source", "zip_member", "sheet_name", "encoding", "sep", "header", "usecols", "output",
            "done_marker", "enabled")
    # object 타입으로 만들어 header 0 이 0.0 으로 바뀌지 않게 하고, 빈 값은 '-' 로 직접 채운다 (float 열 fillna 경고 방지)
    ds_cfg = pd.DataFrame([{k: "-" if d.get(k) is None else d.get(k) for k in keys} for d in config.DATASETS],
                          dtype=object).replace({"\t": "\\t"})
    write_markdown(config.BRONZE_DIR / "README.md", [
        "# bronze — 1차 Bronze (parquet)", "",
        f"- 실행 스크립트: `python 01_bronze.py` (시작 {started}, 종료 {now_kst()})",
        "- 입력: `Source/` (읽기 전용) · 설정: `config.py` 의 `DATASETS`, `BRONZE`",
        f"- **완료 조건 결과: {'통과' if ok and source_ok else '실패'}**",
        f"  - 원천 행 수 = bronze 행 수: {int(done['row_match'].sum()) if len(done) else 0}/{len(done)} 파일 일치",
        f"  - 원천 불변(실행 전후 SHA-256 동일): {'예' if source_ok else '아니오'}",
        f"  - 이번 실행에서 읽기 전용으로 바꾼 원천 파일: {protected}개",
        "  - 재실행 동일성: '재실행' 열이 `unchanged` 면 기존 파일과 바이트까지 같음 (처음 실행은 `created`)", "",
        "## 파일", "", *md_table(view), "",
        "## 원천 대응", "", *md_table(sources), "",
        *(["## 원천이 아직 없는 데이터셋", "", *md_table(missing), ""] if len(missing) else []),
        "## Bronze 규칙", "",
        "- 원천 값을 바꾸지 않는다: 모든 열을 문자열로 저장하고 공백·형식·단위·열 이름을 그대로 둔다.",
        "- 추가하는 열은 두 개뿐이다: `_source_file`(원천 경로, zip 안쪽 파일은 `!/`, 시트는 `#`), `_source_row`(원천 데이터 행 번호, 1부터).",
        "- 원천 행 수는 pandas 와 다른 방법(csv 모듈, openpyxl, XML item 개수)으로 따로 세어 비교한다. 빈 줄은 행으로 세지 않는다.",
        "- 파일명: `01_bronze__{데이터셋}__{원천이름}.parquet` (API 처럼 작은 파일이 많은 원천은 `01_bronze__{데이터셋}.parquet` 하나로 결합, "
        "스냅샷 원천은 `01_bronze__{데이터셋}__{스냅샷폴더}.parquet` 로 폴더마다 하나. 완료 표시가 없는 스냅샷은 만들지 않음).",
        "- 재현성: 원천 정렬 순서·row group 크기·압축 방식을 고정하고, 실행 시각 같은 값을 파일에 넣지 않는다. "
        "결과가 기존 파일과 같으면 기존 파일을 그대로 둔다. `content_sha256` 은 라이브러리 버전과 무관한 데이터 내용 해시다.",
        "- Excel 은 셀 값을 문자열로 바꿔 저장하므로 숫자 `1` 은 `1`, 실수는 `37.5`, 날짜는 `2026-01-01 00:00:00` 처럼 보인다.", "",
        "## 데이터셋 설정 (config.DATASETS)", "", *md_table(ds_cfg), "",
        "전체 값(원천 SHA-256, 열 목록, content_sha256)은 `bronze/01_bronze__manifest.csv` 에 있다.",
    ])


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--dataset", nargs="*", help="처리할 데이터셋 이름 (기본: 활성 전체)")
    a = p.parse_args()
    started = now_kst()
    config.BRONZE_DIR.mkdir(exist_ok=True)

    before = snapshot_sources()
    # 원천 데이터만 잠근다. 매니페스트·수집 로그는 00_collect.py 가 계속 갱신하는 메타 파일이라 제외
    protected = (protect_read_only(config.PROJECT_ROOT / f for f in before
                                   if f.rsplit("/", 1)[-1] not in config.SOURCE_META_FILES)
                 if CFG["protect_source"] else 0)
    targets = [d for d in config.DATASETS if d.get("enabled", True) and (not a.dataset or d["name"] in a.dataset)]
    records = []
    for ds in targets:
        records += process_dataset(ds)
    after = snapshot_sources()
    source_ok = before == after

    run = pd.DataFrame(records)
    man_path = config.BRONZE_DIR / config.stage_file_name(IDX, "manifest", ext="csv")
    active = [d["name"] for d in config.DATASETS if d.get("enabled", True)]
    man = merge_dataset_rows(man_path, run, [d["name"] for d in targets], active) if a.dataset else run
    man.to_csv(man_path, index=False, encoding="utf-8-sig")
    write_readme(man, source_ok, protected, started)

    done = run[run["status"] != "no_source"]                # 완료 조건은 이번 실행에서 처리한 것만으로 판단
    ok = source_ok and len(done) > 0 and bool(done["row_match"].all())
    print(f"\n[01] 완료 조건: {'통과' if ok else '실패'} | 행 수 일치 {int(done['row_match'].sum()) if len(done) else 0}/{len(done)} "
          f"| 원천 불변 {'예' if source_ok else '아니오'} | 재실행 동일 {int((done['status'] == 'unchanged').sum())}/{len(done)}")
    print("[01] 결과: bronze/README.md, bronze/01_bronze__manifest.csv")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
