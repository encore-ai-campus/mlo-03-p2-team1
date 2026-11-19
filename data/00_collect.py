"""[00] 원천 데이터 수집 → Source/

사용법
  python 00_collect.py import      # Downloads 의 원천 파일을 Source/files/{데이터셋}/ 로 '복사' (이동 안 함)
  python 00_collect.py api --plan  # 호출 없이 수집 계획만 확인 (새로 받을 조합 수)
  python 00_collect.py api         # 공공데이터포털 API 호출 → Source/api/{데이터셋}/ (.env 에 인증키 필요)
                                   # config.COLLECT_PLANS 중 아직 안 받은 (시군구 × 계약년월) 만 받는다
  python 00_collect.py seoul --plan  # 서울 열린데이터광장: 전체 건수와 필요한 호출 수 확인
  python 00_collect.py seoul         # 서울 음식점 인허가 전체를 1,000건씩 받아 Source/api/{데이터셋}/{수집일}/ 에 저장
                                     # (.env 에 DATA_SEOUL_GO_KR_KEY 필요, 같은 날 재실행 시 이어받기)
                                     # 월 1회 스냅샷: 이번 달 완료본이 있으면 호출 없이 끝남 (--force 로 추가 수집)
  python 00_collect.py inventory   # Source 전체 목록·체크섬을 Source/README.md, Source/_source_manifest.csv 로 기록

원칙
- 원천은 받은 그대로 저장한다. 이미 있는 원천 파일은 절대 덮어쓰지 않는다.
- 저장이 끝난 원천 파일은 읽기 전용 속성으로 바꾼다.
- API 인증키는 로그·파일 어디에도 남기지 않는다.
자세한 출처와 호출 방법은 data_collecting.md 참고.
"""
from __future__ import annotations

import argparse
import csv
import fnmatch
import shutil
import sys
import time
from pathlib import Path

import pandas as pd

import config
from common.report import human_size, md_table, now_kst, write_markdown
from common.source_io import protect_read_only, sha256_file


def _month_range(start: str, end: str) -> list[str]:
    y, m = int(start[:4]), int(start[4:])
    out = []
    while (y, m) <= (int(end[:4]), int(end[4:])):
        out.append(f"{y:04d}{m:02d}")
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    return out


# ──────────────────────────────────────────────────────────────
# import: 내려받은 파일 → Source/files
# ──────────────────────────────────────────────────────────────
def import_files(download_dir: Path) -> None:
    for ds, info in config.FILE_SOURCES.items():
        found = [p for p in sorted(download_dir.glob(info["download_pattern"]))
                 if p.is_file() and not p.name.endswith((".crdownload", ".tmp", ".part"))]
        if not found:
            print(f"[import] {ds}: '{info['download_pattern']}' 파일 없음 → {info['page']} 에서 내려받으세요")
            continue
        dest_dir = config.SOURCE_FILES_DIR / ds
        dest_dir.mkdir(parents=True, exist_ok=True)
        for src in found:
            dest = dest_dir / src.name
            if dest.exists():
                if sha256_file(dest) == sha256_file(src):
                    print(f"[import] {ds}: {src.name} 이미 있음 (동일) → 건너뜀")
                else:
                    print(f"[import] {ds}: {src.name} 같은 이름의 다른 원천이 이미 있음 → 덮어쓰지 않음. "
                          f"새 파일 이름을 바꿔서 다시 실행하세요")
                continue
            shutil.copy2(src, dest)              # 복사 (Downloads 원본은 그대로 둔다)
            if sha256_file(dest) != sha256_file(src):
                raise RuntimeError(f"복사 검증 실패: {src}")
            protect_read_only([dest])
            print(f"[import] {ds}: {src.name} → {dest.relative_to(config.PROJECT_ROOT)} ({human_size(dest.stat().st_size)})")


# ──────────────────────────────────────────────────────────────
# api: 공공데이터포털 호출 → Source/api
# ──────────────────────────────────────────────────────────────
class QuotaExceeded(RuntimeError):
    """일일 호출 한도 초과: 재시도하지 않고 수집을 멈춘다."""


def _call(url: str, params: dict) -> bytes:
    import requests
    import xml.etree.ElementTree as ET

    last = None
    for attempt in range(1, config.API_RETRIES + 1):
        try:
            r = requests.get(url, params={"serviceKey": config.API_KEY, **params}, timeout=30)
            if r.status_code == 429:
                raise QuotaExceeded("HTTP 429 (호출 한도 초과)")
            r.raise_for_status()
            try:
                root = ET.fromstring(r.content)
            except ET.ParseError:
                text = r.content[:200].decode("utf-8", "replace")
                if "LIMITED" in text.upper():
                    raise QuotaExceeded(text) from None
                raise RuntimeError(f"XML 이 아닌 응답: {text}") from None
            code = (root.findtext(".//resultCode") or root.findtext(".//returnReasonCode") or "").strip()
            if code in config.API_QUOTA_CODES:
                raise QuotaExceeded(f"resultCode={code} {root.findtext('.//resultMsg') or ''}")
            if code and code not in config.API_OK_CODES:
                raise RuntimeError(f"resultCode={code} {root.findtext('.//resultMsg') or root.findtext('.//returnAuthMsg')}")
            time.sleep(config.API_REQUEST_INTERVAL_SEC)
            return r.content
        except QuotaExceeded:
            raise
        except Exception as exc:  # noqa: BLE001 - 네트워크·응답 오류는 재시도
            last = exc
            time.sleep(2 ** attempt)
    raise RuntimeError(f"{config.API_RETRIES}회 재시도 실패: {last}")


_SGG_NAMES: dict[str, str] = {}


def _ldong_master() -> pd.DataFrame:
    """법정동코드 원천(Source/files/ldong_code)을 읽기 전용으로 읽는다 (압축 해제 없음)."""
    from common.source_io import list_units, read_chunks

    ds = next(d for d in config.DATASETS if d["name"] == "ldong_code")
    units = list_units(ds)
    if not units:
        sys.exit("법정동코드 원천이 없습니다. Source/files/ldong_code 에 '법정동코드 전체자료' 를 먼저 넣으세요")
    df = pd.concat(read_chunks(units[0], 1_000_000), ignore_index=True)
    df.columns = ["cd", "nm", "st"][: len(df.columns)] + list(df.columns[3:])
    return df


def resolve_sgg(spec) -> list[str]:
    """계획의 sgg 지정을 시군구 코드 목록으로 바꾼다."""
    if spec == "SEOUL_ALL":
        _SGG_NAMES.update(config.SEOUL_SGG)
        return list(config.SEOUL_SGG)
    if isinstance(spec, dict):
        m = _ldong_master()
        sgg = m[(m["cd"].str[5:] == "00000") & (m["cd"].str[2:] != "00000000")]
        live = sgg[(sgg["st"] == "존재") & sgg["cd"].str[:2].isin(spec["sido"])]
        codes = list(live["cd"].str[:5]) + list(spec.get("extra", []))
        names = dict(zip(sgg["cd"].str[:5], sgg["nm"].str.strip()))
        _SGG_NAMES.update({c: names.get(c, "") for c in codes})
        return sorted(dict.fromkeys(codes))
    return list(spec)


def plan_targets(datasets: list[str]) -> pd.DataFrame:
    """COLLECT_PLANS 의 (데이터셋 × 계약년월 × 시군구) 합집합과 수집 여부. 계획 순서 → 최근 달 순서로 정렬."""
    rows = []
    for pi, plan in enumerate(config.COLLECT_PLANS):
        if not plan.get("enabled", True):
            continue
        sggs = resolve_sgg(plan["sgg"])
        for ds in datasets:
            if plan.get("datasets") and ds not in plan["datasets"]:
                continue
            for ym in _month_range(plan["start"], plan["end"]):
                for sgg in sggs:
                    rows.append({"order": pi, "plan": plan["name"], "dataset": ds, "ym": ym, "sgg": sgg})
    df = pd.DataFrame(rows, columns=["order", "plan", "dataset", "ym", "sgg"])
    df = df.drop_duplicates(["dataset", "ym", "sgg"], keep="first")   # 여러 계획에 겹치면 앞 계획에 귀속
    df["done"] = [(config.SOURCE_API_DIR / r.dataset / r.ym / f"_done_{r.sgg}").exists() for r in df.itertuples()]
    return df.sort_values(["order", "ym", "sgg"], ascending=[True, False, True]).reset_index(drop=True)


def _log_rows() -> pd.DataFrame:
    path = config.SOURCE_API_DIR / "_collect_log.csv"
    if not path.exists():
        return pd.DataFrame(columns=["collected_at", "dataset", "LAWD_CD", "DEAL_YMD", "item_count"])
    return pd.read_csv(path, dtype=str, encoding="utf-8-sig")


def daily_budget(datasets: list[str], max_calls: int | None) -> dict[str, int]:
    """API 별 오늘 남은 호출 수 = 일일 한도 − 여유분 − 오늘 이미 호출한 수 (_collect_log.csv 기준, KST)."""
    log = _log_rows()
    today = now_kst()[:10]
    used = log[log["collected_at"].str[:10] == today].groupby("dataset").size().to_dict()
    budget = {}
    for ds in datasets:
        left = max(config.API_DAILY_LIMIT - config.API_DAILY_MARGIN - int(used.get(ds, 0)), 0)
        budget[ds] = min(left, max_calls) if max_calls else left
    return budget


def _pages_per_combo(ds: str) -> float:
    """지금까지의 수집 기록으로 조합당 평균 페이지 수를 추정 (예상 호출 수 계산용)."""
    log = _log_rows()
    log = log[log["dataset"] == ds]
    if log.empty:
        return 1.0
    return round(len(log) / max(log.groupby(["LAWD_CD", "DEAL_YMD"]).ngroups, 1), 2)


def show_plan(targets: pd.DataFrame, budget: dict[str, int]) -> None:
    if targets.empty:
        print("[plan] 활성화된 수집 계획이 없습니다 (config.COLLECT_PLANS)")
        return
    summary = (targets.groupby(["order", "plan", "dataset"])
               .agg(조합=("done", "size"), 수집완료=("done", "sum"))
               .assign(남은조합=lambda d: d["조합"] - d["수집완료"]).reset_index().drop(columns="order"))
    print(summary.to_string(index=False))
    for ds, b in budget.items():
        left = int((~targets["done"] & (targets["dataset"] == ds)).sum())
        ppc = _pages_per_combo(ds)
        est = int(left * ppc)
        days = est / max(config.API_DAILY_LIMIT - config.API_DAILY_MARGIN, 1)
        print(f"[plan] {ds}: 남은 조합 {left:,}개 × 조합당 약 {ppc}페이지 ≈ {est:,}회 호출 "
              f"| 오늘 남은 한도 {b:,}회 | 하루 한도 기준 약 {days:.1f}일")


def collect_api(datasets: list[str], max_calls: int | None, plan_only: bool) -> None:
    import xml.etree.ElementTree as ET

    targets = plan_targets(datasets)
    budget = daily_budget(datasets, max_calls)
    show_plan(targets, budget)
    if plan_only:
        return
    if not config.API_KEY:
        sys.exit("인증키가 없습니다. 프로젝트 폴더의 .env 에 DATA_GO_KR_KEY=... 를 넣으세요 (data_collecting.md 2장)")
    todo = targets[~targets["done"]]
    log_path = config.SOURCE_API_DIR / "_collect_log.csv"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    new_log = not log_path.exists()
    calls = {ds: 0 for ds in datasets}
    stopped: dict[str, str] = {}             # 한도에 걸려 멈춘 API 와 사유
    with open(log_path, "a", newline="", encoding="utf-8-sig") as lf:
        log = csv.writer(lf)
        if new_log:
            log.writerow(["collected_at", "dataset", "endpoint", "LAWD_CD", "DEAL_YMD", "page",
                          "total_count", "item_count", "file", "sha256"])
        for i, t in enumerate(todo.itertuples(), start=1):
            if t.dataset in stopped:
                continue                              # 이 API 는 오늘 한도 소진 → 다른 API 는 계속
            api = config.API_SOURCES[t.dataset]
            part = config.SOURCE_API_DIR / t.dataset / t.ym
            part.mkdir(parents=True, exist_ok=True)
            page, got = 1, 0
            try:
                while True:
                    out = part / f"{t.dataset}__{t.sgg}_{t.ym}__p{page:04d}.xml"
                    if out.exists():                  # 중간에 끊긴 조합: 받아 둔 페이지는 다시 부르지 않는다
                        raw = out.read_bytes()
                    else:
                        if calls[t.dataset] >= budget[t.dataset]:
                            raise QuotaExceeded(f"오늘 남은 한도 {budget[t.dataset]:,}회 사용 완료")
                        params = {"LAWD_CD": t.sgg, "DEAL_YMD": t.ym, "pageNo": page,
                                  "numOfRows": config.API_NUM_OF_ROWS}
                        raw = _call(api["endpoint"], params)
                        calls[t.dataset] += 1
                        out.write_bytes(raw)
                        protect_read_only([out])
                        root = ET.fromstring(raw)
                        log.writerow([now_kst(), t.dataset, api["endpoint"], t.sgg, t.ym, page,
                                      root.findtext(".//totalCount"), len(root.findall(".//items/item")),
                                      out.relative_to(config.PROJECT_ROOT).as_posix(), sha256_file(out)])
                        lf.flush()
                    root = ET.fromstring(raw)
                    total = int(root.findtext(".//totalCount") or 0)
                    n = len(root.findall(".//items/item"))
                    got += n
                    if n == 0 or got >= total:
                        break
                    page += 1
            except QuotaExceeded as exc:
                stopped[t.dataset] = str(exc)
                print(f"[api] {t.dataset} 수집 중단: {exc}")
                if len(stopped) == len(datasets):
                    break
                continue
            (part / f"_done_{t.sgg}").write_text(f"{got}\n", encoding="utf-8")
            print(f"[api] ({i:,}/{len(todo):,}) {t.plan} | {t.dataset} {t.ym} {t.sgg}"
                  f"({_SGG_NAMES.get(t.sgg, '')}): {got:,}건")
    remaining = plan_targets(datasets)
    left = int((~remaining["done"]).sum())
    print(f"[api] 이번 실행 호출: " + ", ".join(f"{k} {v:,}회" for k, v in calls.items())
          + f" | 남은 조합 {left:,}개")
    if left:
        print("[api] 한도가 회복되면(다음 날) 같은 명령을 다시 실행하면 남은 조합부터 이어서 받습니다.")


# ──────────────────────────────────────────────────────────────
# seoul: 서울 열린데이터광장 API → Source/api/{데이터셋}/{수집일}/
#   - 1회 호출 최대 1,000건(SEOUL_API_PAGE_SIZE) 을 유지하며 1번 행부터 마지막 행까지 전부 받는다.
#   - 호출 횟수 제한이 없으므로 일일 한도 계산 없이 끝까지 받는다.
#   - 같은 날 다시 실행하면 받아 둔 구간은 건너뛰고 이어서 받는다. 완료된 날짜는 다시 받지 않는다.
# ──────────────────────────────────────────────────────────────
SEOUL_DONE = "_done_snapshot"
SEOUL_LOG = "_seoul_collect_log.csv"


def _mask(text: str) -> str:
    """오류 메시지에 섞인 인증키(요청 주소 경로)를 가린다."""
    return text.replace(config.SEOUL_API_KEY, "***") if config.SEOUL_API_KEY else text


def _seoul_parse(raw: bytes) -> tuple[str, str, int | None, int]:
    """응답 XML → (결과코드, 메시지, list_total_count, row 개수)."""
    import xml.etree.ElementTree as ET

    root = ET.fromstring(raw)
    res = root if root.tag == "RESULT" else root.find("RESULT")
    code = (res.findtext("CODE") if res is not None else "") or ""
    msg = (res.findtext("MESSAGE") if res is not None else "") or ""
    total = root.findtext("list_total_count")
    return code.strip(), msg.strip(), int(total) if total and total.strip().isdigit() else None, len(root.findall("row"))


def _seoul_call(service: str, start: int, end: int) -> bytes:
    import requests

    url = f"{config.SEOUL_API_BASE}/{config.SEOUL_API_KEY}/xml/{service}/{start}/{end}/"
    last = None
    for attempt in range(1, config.SEOUL_API_RETRIES + 1):
        try:
            r = requests.get(url, timeout=60)
            r.raise_for_status()
            try:
                code, msg, _, _ = _seoul_parse(r.content)
            except Exception:  # noqa: BLE001
                raise RuntimeError(f"XML 이 아닌 응답: {r.content[:200].decode('utf-8', 'replace')}") from None
            if code in config.SEOUL_API_RETRY_CODES:
                raise RuntimeError(f"{code} {msg}")
            if code not in (config.SEOUL_API_OK_CODE, config.SEOUL_API_EMPTY_CODE):
                raise PermissionError(f"{code} {msg}")      # 인증키·요청 형식 오류 → 재시도하지 않음
            time.sleep(config.SEOUL_API_REQUEST_INTERVAL_SEC)
            return r.content
        except PermissionError:
            raise
        except Exception as exc:  # noqa: BLE001 - 네트워크·서버 오류는 재시도
            last = _mask(str(exc))
            time.sleep(2 ** attempt)
    raise RuntimeError(f"{config.SEOUL_API_RETRIES}회 재시도 실패: {last}")


def _seoul_snapshots(ds: str) -> list[tuple[str, bool]]:
    """(수집일, 완료 여부) 목록."""
    base = config.SOURCE_API_DIR / ds
    if not base.exists():
        return []
    return [(p.name, (p / SEOUL_DONE).exists()) for p in sorted(base.iterdir()) if p.is_dir()]


def _seoul_page_name(ds: str, snap: str, start: int, end: int) -> str:
    return f"{ds}__{snap}__r{start:07d}-{end:07d}.xml"


def _period(snap: str) -> str:
    """스냅샷 주기 키: month → YYYYMM, day → YYYYMMDD."""
    return snap[:6] if config.SEOUL_SNAPSHOT_EVERY == "month" else snap


def collect_seoul(datasets: list[str], max_calls: int | None, plan_only: bool, force: bool = False) -> bool:
    """서울 API 스냅샷 수집. 새로 받은 구간이 하나라도 있으면 True."""
    if not config.SEOUL_API_KEY:
        sys.exit("인증키가 없습니다. 프로젝트 폴더의 .env 에 DATA_SEOUL_GO_KR_KEY=... 를 넣으세요 (data_collecting.md)")
    snap = now_kst()[:10].replace("-", "")                  # 수집일 스냅샷 (KST, YYYYMMDD)
    collected = False
    size = config.SEOUL_API_PAGE_SIZE
    log_path = config.SOURCE_API_DIR / SEOUL_LOG
    log_path.parent.mkdir(parents=True, exist_ok=True)
    new_log = not log_path.exists()
    with open(log_path, "a", newline="", encoding="utf-8-sig") as lf:
        log = csv.writer(lf)
        if new_log:
            log.writerow(["collected_at", "dataset", "service", "snapshot", "start", "end",
                          "result_code", "total_count", "row_count", "file", "sha256"])
        for ds in datasets:
            api = config.SEOUL_API_SOURCES[ds]
            snaps = _seoul_snapshots(ds)
            old_partial = [s for s, done in snaps if not done and s != snap]
            if old_partial:
                print(f"[seoul] {ds}: 완료되지 않은 이전 스냅샷 {', '.join(old_partial)} 은 그대로 둡니다 "
                      f"(완료 표시가 없어 bronze 대상에서 제외)")
            if (snap, True) in snaps:
                print(f"[seoul] {ds}: 오늘({snap}) 스냅샷은 이미 완료 → 건너뜀")
                continue
            same_period = [s for s, done in snaps if done and _period(s) == _period(snap)]
            if same_period and not force:
                print(f"[seoul] {ds}: 이번 주기({_period(snap)}) 스냅샷 {', '.join(same_period)} 이미 완료 → 건너뜀 "
                      f"(주기 {config.SEOUL_SNAPSHOT_EVERY}, 추가로 받으려면 --force)")
                continue
            # 전체 건수 확인 (1건만 요청, 저장하지 않음)
            _, _, total, _ = _seoul_parse(_seoul_call(api["service"], 1, 1))
            total = total or 0
            pages = -(-total // size)
            part = config.SOURCE_API_DIR / ds / snap
            have = sum(1 for k in range(pages)
                       if (part / _seoul_page_name(ds, snap, k * size + 1, (k + 1) * size)).exists())
            print(f"[seoul] {ds} ({api['service']}): 전체 {total:,}건 → {size:,}건씩 {pages:,}회 "
                  f"| 오늘 받아 둔 구간 {have:,}개 | 남은 호출 약 {pages - have:,}회")
            if plan_only:
                continue
            part.mkdir(parents=True, exist_ok=True)
            first_total, calls, got, start, short, stopped = total, 0, 0, 1, [], False
            while start <= total:
                end = start + size - 1
                out = part / _seoul_page_name(ds, snap, start, end)
                if out.exists():                             # 끊긴 뒤 이어받기: 받은 구간은 다시 부르지 않음
                    raw = out.read_bytes()
                else:
                    if max_calls is not None and calls >= max_calls:
                        print(f"[seoul] {ds}: 이번 실행 호출 상한 {max_calls:,}회 도달 → 다시 실행하면 이어서 받습니다")
                        stopped = True
                        break
                    raw = _seoul_call(api["service"], start, end)
                    calls += 1
                    collected = True
                    code, _, t, n = _seoul_parse(raw)
                    if code == config.SEOUL_API_EMPTY_CODE:  # 수집 중 건수가 줄어 범위를 벗어남
                        total = start - 1
                        break
                    out.write_bytes(raw)
                    protect_read_only([out])
                    log.writerow([now_kst(), ds, api["service"], snap, start, end, code, t, n,
                                  out.relative_to(config.PROJECT_ROOT).as_posix(), sha256_file(out)])
                    lf.flush()
                code, _, t, n = _seoul_parse(raw)
                if t:
                    total = t                                # 수집 중 건수가 늘면 끝까지 따라간다
                expect = min(size, total - start + 1)
                if n != expect:
                    short.append(f"{start}-{end}:{n}/{expect}")
                got += n
                if calls and calls % 50 == 0:
                    print(f"[seoul] {ds}: {got:,}/{total:,}건 ({calls:,}회 호출)")
                start = end + 1
            if not stopped:
                (part / SEOUL_DONE).write_text(
                    f"rows={got}\ntotal_first={first_total}\ntotal_last={total}\npage_size={size}\n"
                    f"short_pages={';'.join(short) or '-'}\n", encoding="utf-8")
                note = f" | 건수 불일치 구간 {len(short)}개" if short else ""
                drift = f" | 수집 중 전체 건수 변동 {first_total:,} → {total:,}" if first_total != total else ""
                print(f"[seoul] {ds} {snap} 완료: {got:,}건 / 이번 호출 {calls:,}회{note}{drift}")
    return collected


# ──────────────────────────────────────────────────────────────
# inventory: Source 목록 문서화
# ──────────────────────────────────────────────────────────────
def _origin(rel: str) -> tuple[str, str]:
    parts = rel.split("/")
    if len(parts) > 2 and parts[1] == "files":
        info = config.FILE_SOURCES.get(parts[2], {})
        return info.get("title", "-"), info.get("page", "-")
    if len(parts) > 2 and parts[1] == "api":
        info = config.API_SOURCES.get(parts[2]) or config.SEOUL_API_SOURCES.get(parts[2], {})
        return info.get("title", "-"), info.get("page", "-")
    return "-", "-"


def count_rows() -> tuple[pd.DataFrame, pd.DataFrame]:
    """config.DATASETS 기준 원천 행 수 (헤더 제외, zip 은 풀지 않고 읽기만 함).
    csv 는 csv 모듈, xml 은 <item> 개수로 센다 (01_bronze.py 의 검증과 같은 함수)."""
    from common.source_io import count_source_rows, list_units

    per_ds, per_file = [], []
    for ds in config.DATASETS:
        if not ds.get("enabled", True):
            continue
        units = list_units(ds)
        total = 0
        for u in units:
            n = count_source_rows(u)
            total += n
            if ds["kind"] != "xml":
                per_file.append({"dataset": ds["name"], "file": u.info.get("member_display") or u.member or u.path.name,
                                 "rows": f"{n:,}"})
        info = (config.FILE_SOURCES.get(ds["name"]) or config.API_SOURCES.get(ds["name"])
                or config.SEOUL_API_SOURCES.get(ds["name"], {}))
        per_ds.append({"dataset": ds["name"], "title": info.get("title", "-"), "kind": ds["kind"],
                       "source_units": len(units), "rows": total})
    return pd.DataFrame(per_ds), pd.DataFrame(per_file)


def inventory() -> None:
    rows = []
    for p in sorted(config.SOURCE_DIR.rglob("*")):
        if not p.is_file() or p.name in ("README.md", "_source_manifest.csv") or p.name.startswith("_done_"):
            continue
        rel = p.relative_to(config.PROJECT_ROOT).as_posix()
        title, page = _origin(rel)
        rows.append({"file": rel, "size": p.stat().st_size, "sha256": sha256_file(p),
                     "read_only": not (p.stat().st_mode & 0o222), "dataset": title, "source_page": page})
    df = pd.DataFrame(rows, columns=["file", "size", "sha256", "read_only", "dataset", "source_page"])
    config.SOURCE_DIR.mkdir(exist_ok=True)
    df.to_csv(config.SOURCE_DIR / "_source_manifest.csv", index=False, encoding="utf-8-sig")

    files_part = df[df["file"].str.startswith("Source/files/")]
    api_part = df[df["file"].str.startswith("Source/api/") & df["file"].str.endswith(".xml")]
    api_summary = (api_part.assign(ds=api_part["file"].str.split("/").str[2])
                   .groupby("ds").agg(files=("file", "size"), bytes=("size", "sum")).reset_index()
                   if not api_part.empty else pd.DataFrame())
    show = files_part.assign(size=files_part["size"].map(human_size), sha256=files_part["sha256"].str[:16])
    row_ds, row_files = count_rows()
    total_rows = int(row_ds["rows"].sum()) if not row_ds.empty else 0
    row_show = pd.concat([row_ds, pd.DataFrame([{"dataset": "**합계**", "title": "", "kind": "",
                                                  "source_units": int(row_ds["source_units"].sum()) if not row_ds.empty else 0,
                                                  "rows": total_rows}])], ignore_index=True)
    row_show["rows"] = row_show["rows"].map(lambda n: f"{n:,}")
    write_markdown(config.SOURCE_DIR / "README.md", [
        "# Source — 원천 데이터 (읽기 전용)", "",
        f"- 갱신 시각: {now_kst()} (`python 00_collect.py inventory`)",
        "- 이 폴더의 원천 파일은 수정·이동·덮어쓰기 하지 않는다. 모든 파일은 읽기 전용 속성이다.",
        "- 출처와 수집 방법: 프로젝트 루트의 `data_collecting.md`",
        f"- 전체 파일 수: {len(df)} / 전체 크기: {human_size(int(df['size'].sum())) if len(df) else '0 B'}",
        f"- 전체 데이터 행 수(ROW): {total_rows:,}",
        "- 전체 목록과 SHA-256 전체 값: `Source/_source_manifest.csv`", "",
        "## 데이터 행 수 (ROW)", "",
        "- 헤더 행 제외, 빈 줄 제외. zip 은 압축을 풀지 않고 안쪽 파일을 읽어서 센다.",
        "- csv: `csv` 모듈로 센 레코드 수 / xml(API 응답): `<item>` 개수 (`common/source_io.count_source_rows`, 01_bronze.py 검증과 동일 기준)",
        "- `source_units`: csv 는 zip 안쪽 파일 수, xml 은 응답 페이지 파일 수", "",
        *md_table(row_show), "",
        "### 파일별 행 수 (Source/files)", "",
        *(md_table(row_files) if not row_files.empty else ["(없음)"]), "",
        "## 내려받은 파일 (Source/files)", "",
        *md_table(show[["file", "size", "sha256", "read_only", "dataset", "source_page"]]), "",
        "## API 응답 (Source/api)", "",
        *(md_table(api_summary.assign(bytes=api_summary["bytes"].map(human_size))) if not api_summary.empty
          else ["(아직 수집 전 — 인증키 발급 후 `python 00_collect.py api`)"]), "",
        "## 폴더 구조", "",
        "```text",
        "Source/",
        "├── files/{데이터셋}/   내려받은 원본 파일 (zip 은 압축을 풀지 않고 그대로 보관)",
        "├── api/{데이터셋}/{계약년월}/   API 응답 XML (데이터셋__시군구_년월__p페이지.xml)",
        "├── api/{데이터셋}/{수집일}/     서울 API 응답 XML (데이터셋__수집일__r시작-끝.xml, 1,000건 단위 스냅샷)",
        "├── api/_collect_log.csv   API 호출 기록 (인증키 제외)",
        "├── api/_seoul_collect_log.csv   서울 API 호출 기록 (인증키 제외)",
        "├── _source_manifest.csv   전체 파일 목록·크기·SHA-256",
        "└── README.md",
        "```",
    ])
    print(f"[inventory] {len(df)}개 파일 → Source/README.md, Source/_source_manifest.csv")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    pi = sub.add_parser("import")
    pi.add_argument("--from", dest="src", default=str(config.DOWNLOAD_DIR), help="내려받은 파일이 있는 폴더")
    pa = sub.add_parser("api")
    pa.add_argument("--dataset", nargs="*", default=list(config.API_SOURCES), choices=list(config.API_SOURCES))
    pa.add_argument("--plan", action="store_true", help="호출하지 않고 수집 계획(남은 조합 수)만 보여줌")
    pa.add_argument("--max-calls", type=int, default=config.API_MAX_CALLS_PER_RUN,
                    help="이번 실행에서 API 하나당 최대 호출 수 (기본: 오늘 남은 한도 전부)")
    ps = sub.add_parser("seoul")
    ps.add_argument("--dataset", nargs="*", default=list(config.SEOUL_API_SOURCES),
                    choices=list(config.SEOUL_API_SOURCES))
    ps.add_argument("--plan", action="store_true", help="전체 건수·필요 호출 수만 확인 (1건 조회만 함, 저장 안 함)")
    ps.add_argument("--max-calls", type=int, default=None,
                    help="이번 실행에서 데이터셋 하나당 최대 호출 수 (기본: 끝까지)")
    ps.add_argument("--force", action="store_true",
                    help="이번 주기(월)에 완료 스냅샷이 있어도 오늘 스냅샷을 추가로 받음 (기존 스냅샷은 그대로)")
    sub.add_parser("inventory")
    a = p.parse_args()
    if a.cmd == "import":
        import_files(Path(a.src))
    elif a.cmd == "api":
        collect_api(a.dataset, a.max_calls, a.plan)
        if a.plan:
            return
    elif a.cmd == "seoul":
        if not collect_seoul(a.dataset, a.max_calls, a.plan, a.force):
            return                      # 새로 받은 것이 없으면 inventory 생략 (매일 예약 실행해도 가볍게 끝남)
    inventory()


if __name__ == "__main__":
    main()
