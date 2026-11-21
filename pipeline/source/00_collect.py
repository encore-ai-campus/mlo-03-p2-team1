"""[00] 원천 데이터 수집 → data/source/

사용법
  python pipeline/source/00_collect.py import        # Downloads 의 원천 파일을 data/source/files/{데이터셋}/ 로 '복사' (이동 안 함)
  python pipeline/source/00_collect.py api --plan    # 호출 없이 수집 계획만 확인 (새로 받을 조합 수)
  python pipeline/source/00_collect.py api           # 공공데이터포털 API → data/source/api/{데이터셋}/{계약년월}/
                                                     # metadata/src_collect_plan.csv 중 아직 안 받은 (시군구 × 계약년월) 만 받는다
  python pipeline/source/00_collect.py seoul --plan  # 서울 열린데이터광장: 전체 건수와 필요한 호출 수 확인
  python pipeline/source/00_collect.py seoul         # 서울 인허가 전체를 1,000건씩 받아 data/source/api/{데이터셋}/{수집일}/ 에 저장
                                                     # (같은 날 재실행 시 이어받기, 이번 달 완료본이 있으면 호출 없이 끝남, --force 로 추가 수집)
  python pipeline/source/00_collect.py inventory     # 원천 전체 목록·체크섬·행 수 → data/source/SOURCE_README.md, _source_manifest.csv

설정
- 출처(제목·페이지·API 주소·서비스명·내려받은 파일 이름 패턴): metadata/src_source.csv
- 실거래 수집 계획(시군구 × 계약년월): metadata/src_collect_plan.csv
- 인증키: 프로젝트 루트 .env 의 DATA_GO_KR_KEY, DATA_SEOUL_GO_KR_KEY (.env.example 참고, 코드·로그에 쓰지 않음)

원칙
- 원천은 받은 그대로 저장한다. 이미 있는 원천 파일은 절대 덮어쓰지 않는다.
- 저장이 끝난 원천 파일은 읽기 전용 속성으로 바꾼다.
- API 인증키는 로그·파일·오류 메시지 어디에도 남기지 않는다.
자세한 출처와 호출 방법은 docs/archive/data_collecting.md 참고.
"""
from __future__ import annotations

import argparse
import csv
import os
import shutil
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from xml.etree import ElementTree

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # pipeline/ → from common import ...

from common.files import protect_read_only, sha256_file
from common.paths import METADATA_DIR, PROJECT_ROOT, SOURCE_DIR, SOURCE_LABEL
from common.report import human_size, md_table, now_kst, write_markdown
from common.source_reader import (SOURCE_META_FILES, count_source_rows, labeled_path, list_units, load_datasets,
                                  read_chunks)

SOURCE_FILES_DIR = SOURCE_DIR / "files"       # 내려받은 파일 원천
SOURCE_API_DIR = SOURCE_DIR / "api"           # API 응답 원천
SOURCE_LOG_DIR = SOURCE_DIR / "logs"          # 수집 로그 (원천 데이터가 아니므로 잠그지 않음)
SOURCE_FILE = METADATA_DIR / "src_source.csv"
PLAN_FILE = METADATA_DIR / "src_collect_plan.csv"
DATASET_FILE = METADATA_DIR / "ds_dataset.csv"
DOWNLOAD_DIR = Path.home() / "Downloads"      # import 가 원천 파일을 찾는 곳

# ──────────────────────────────────────────────────────────────
# 호출 옵션 (서비스 제한에 맞춘 값)
# ──────────────────────────────────────────────────────────────
API_REQUEST_INTERVAL_SEC = 0.3     # 공공데이터포털 호출 간격
API_RETRIES = 3
API_NUM_OF_ROWS = 1000             # 한 페이지 최대 행 수
API_OK_CODES = {"00", "000"}
API_QUOTA_CODES = {"22"}           # 일일 호출 한도 초과 → 재시도하지 않고 즉시 멈춤
API_DAILY_LIMIT = 10_000           # 개발계정: API(서비스) 하나당 하루 호출 한도. 매매·전월세는 따로 계산
API_DAILY_MARGIN = 100             # 실패·재시도로 소모될 수 있는 여유분
API_LOG = SOURCE_LOG_DIR / "_collect_log.csv"

SEOUL_API_BASE = "http://openapi.seoul.go.kr:8088"   # 서울 열린데이터광장은 http 만 제공
SEOUL_API_PAGE_SIZE = 1000                            # 1회 호출 최대 건수 (서비스 제한, 늘리지 말 것)
SEOUL_API_REQUEST_INTERVAL_SEC = 0.1
SEOUL_API_RETRIES = 3
SEOUL_API_OK_CODE = "INFO-000"                        # 정상
SEOUL_API_EMPTY_CODE = "INFO-200"                     # 해당 범위에 데이터 없음 → 끝으로 본다
SEOUL_API_RETRY_CODES = {"ERROR-500", "ERROR-600", "ERROR-601"}   # 서버·DB 오류 → 재시도
SEOUL_SNAPSHOT_EVERY = "month"     # month: 한 달에 완료 스냅샷 1개 / day: 하루에 1개
SEOUL_DONE = "_done_snapshot"
SEOUL_LOG = SOURCE_LOG_DIR / "_seoul_collect_log.csv"


# ──────────────────────────────────────────────────────────────
# 설정 읽기 (.env, metadata/src_*.csv)
# ──────────────────────────────────────────────────────────────
def load_env() -> None:
    """프로젝트 루트 .env 를 환경 변수로 읽는다. python-dotenv 가 없으면 직접 읽는다."""
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


load_env()
API_KEY = os.getenv("DATA_GO_KR_KEY", "")
SEOUL_API_KEY = os.getenv("DATA_SEOUL_GO_KR_KEY", "")


@dataclass(frozen=True)
class Source:
    dataset: str
    title: str
    page: str
    method: str            # data_go_kr | seoul_api | file
    endpoint: str          # data_go_kr 요청 주소
    service: str           # seoul_api 서비스명
    download_pattern: str  # file: Downloads 에서 찾을 파일 이름 glob


def load_sources() -> dict[str, Source]:
    table = pd.read_csv(SOURCE_FILE, dtype=str, keep_default_na=False, encoding="utf-8-sig")
    sources, errors = {}, []
    for line_no, row in enumerate(table.itertuples(index=False), start=2):
        need = {"data_go_kr": row.endpoint, "seoul_api": row.service, "file": row.download_pattern}
        if row.method not in need:
            errors.append(f"{SOURCE_FILE.name} {line_no}행: method 는 {sorted(need)} 중 하나")
        elif not need[row.method]:
            errors.append(f"{SOURCE_FILE.name} {line_no}행 ({row.dataset}): {row.method} 에 필요한 값이 비어 있음")
        sources[row.dataset] = Source(**row._asdict())
    if errors:
        sys.exit("원천 정의 오류:\n  " + "\n  ".join(errors))
    return sources


SOURCES = load_sources()
API_SOURCES = {name: s for name, s in SOURCES.items() if s.method == "data_go_kr"}
SEOUL_SOURCES = {name: s for name, s in SOURCES.items() if s.method == "seoul_api"}
FILE_SOURCES = {name: s for name, s in SOURCES.items() if s.method == "file"}


def mask(text: str) -> str:
    """오류 메시지에 섞인 인증키(요청 주소의 쿼리·경로)를 가린다."""
    for key in (API_KEY, SEOUL_API_KEY):
        if key:
            text = text.replace(key, "***")
    return text


def month_range(start: str, end: str) -> list[str]:
    year, month = int(start[:4]), int(start[4:])
    months = []
    while (year, month) <= (int(end[:4]), int(end[4:])):
        months.append(f"{year:04d}{month:02d}")
        year, month = (year + 1, 1) if month == 12 else (year, month + 1)
    return months


# ──────────────────────────────────────────────────────────────
# import: 내려받은 파일 → data/source/files
# ──────────────────────────────────────────────────────────────
def import_files(download_dir: Path) -> None:
    for ds, info in FILE_SOURCES.items():
        found = [p for p in sorted(download_dir.glob(info.download_pattern))
                 if p.is_file() and not p.name.endswith((".crdownload", ".tmp", ".part"))]
        if not found:
            print(f"[import] {ds}: '{info.download_pattern}' 파일 없음 → {info.page} 에서 내려받으세요")
            continue
        dest_dir = SOURCE_FILES_DIR / ds
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
            print(f"[import] {ds}: {src.name} → {labeled_path(dest)} ({human_size(dest.stat().st_size)})")


# ──────────────────────────────────────────────────────────────
# api: 공공데이터포털 실거래가 → data/source/api/{데이터셋}/{계약년월}/
# ──────────────────────────────────────────────────────────────
class QuotaExceeded(RuntimeError):
    """일일 호출 한도 초과: 재시도하지 않고 수집을 멈춘다."""


def call_data_go_kr(url: str, params: dict) -> bytes:
    import requests

    last_error = None
    for attempt in range(1, API_RETRIES + 1):
        try:
            response = requests.get(url, params={"serviceKey": API_KEY, **params}, timeout=30)
            if response.status_code == 429:
                raise QuotaExceeded("HTTP 429 (호출 한도 초과)")
            response.raise_for_status()
            try:
                root = ElementTree.fromstring(response.content)
            except ElementTree.ParseError:
                text = response.content[:200].decode("utf-8", "replace")
                if "LIMITED" in text.upper():
                    raise QuotaExceeded(text) from None
                raise RuntimeError(f"XML 이 아닌 응답: {text}") from None
            code = (root.findtext(".//resultCode") or root.findtext(".//returnReasonCode") or "").strip()
            if code in API_QUOTA_CODES:
                raise QuotaExceeded(f"resultCode={code} {root.findtext('.//resultMsg') or ''}")
            if code and code not in API_OK_CODES:
                raise RuntimeError(f"resultCode={code} {root.findtext('.//resultMsg') or root.findtext('.//returnAuthMsg')}")
            time.sleep(API_REQUEST_INTERVAL_SEC)
            return response.content
        except QuotaExceeded:
            raise
        except Exception as exc:  # noqa: BLE001 - 네트워크·응답 오류는 재시도
            last_error = mask(str(exc))
            time.sleep(2 ** attempt)
    raise RuntimeError(f"{API_RETRIES}회 재시도 실패: {last_error}")


SGG_NAMES: dict[str, str] = {}


def ldong_master() -> pd.DataFrame:
    """법정동코드 원천(data/source/files/ldong_code)을 읽기만 한다 (압축 해제 없음). 열: cd, nm, st"""
    ds = next(d for d in load_datasets(DATASET_FILE) if d.name == "ldong_code")
    units = list_units(ds)
    if not units:
        sys.exit("법정동코드 원천이 없습니다. data/source/files/ldong_code 에 '법정동코드 전체자료' 를 먼저 넣으세요 "
                 "(python pipeline/source/00_collect.py import)")
    master = pd.concat(read_chunks(units[0], 1_000_000), ignore_index=True)
    master.columns = ["cd", "nm", "st"][: len(master.columns)] + list(master.columns[3:])
    return master


def resolve_sgg(spec: str, extra: str) -> list[str]:
    """계획의 sgg 지정 → 시군구 코드 목록.
      11440;11680        : 코드 목록 그대로
      sido:11 / sido:28;41: 법정동코드 원천에서 그 시도의 '현존' 시군구 코드 전부 (구가 있는 시는 시 코드도 포함)
      extra_sgg          : 위 목록에 더할 코드 (폐지된 옛 코드 등)
    """
    extra_codes = [c for c in extra.split(";") if c]
    if not spec.startswith("sido:"):
        return list(dict.fromkeys([c for c in spec.split(";") if c] + extra_codes))
    sido = spec[len("sido:"):].split(";")
    master = ldong_master()
    sgg = master[(master["cd"].str[5:] == "00000") & (master["cd"].str[2:] != "00000000")]
    live = sgg[(sgg["st"] == "존재") & sgg["cd"].str[:2].isin(sido)]
    codes = list(live["cd"].str[:5]) + extra_codes
    names = dict(zip(sgg["cd"].str[:5], sgg["nm"].str.strip()))
    SGG_NAMES.update({c: names.get(c, "") for c in codes})
    return sorted(dict.fromkeys(codes))


def plan_targets(datasets: list[str]) -> pd.DataFrame:
    """수집 계획의 (데이터셋 × 계약년월 × 시군구) 합집합과 수집 여부. 계획 순서 → 최근 달 순서로 정렬."""
    plans = pd.read_csv(PLAN_FILE, dtype=str, keep_default_na=False, encoding="utf-8-sig")
    rows = []
    for order, plan in enumerate(plans.itertuples(index=False)):
        if plan.enabled != "Y":
            continue
        plan_datasets = [d for d in plan.datasets.split(";") if d]
        sggs = resolve_sgg(plan.sgg, plan.extra_sgg)
        for ds in datasets:
            if plan_datasets and ds not in plan_datasets:
                continue
            for ym in month_range(plan.start, plan.end):
                for sgg in sggs:
                    rows.append({"order": order, "plan": plan.plan, "dataset": ds, "ym": ym, "sgg": sgg})
    targets = pd.DataFrame(rows, columns=["order", "plan", "dataset", "ym", "sgg"])
    targets = targets.drop_duplicates(["dataset", "ym", "sgg"], keep="first")   # 여러 계획에 겹치면 앞 계획에 귀속
    targets["done"] = [(SOURCE_API_DIR / t.dataset / t.ym / f"_done_{t.sgg}").exists() for t in targets.itertuples()]
    return targets.sort_values(["order", "ym", "sgg"], ascending=[True, False, True]).reset_index(drop=True)


def api_log() -> pd.DataFrame:
    if not API_LOG.exists():
        return pd.DataFrame(columns=["collected_at", "dataset", "LAWD_CD", "DEAL_YMD", "item_count"])
    return pd.read_csv(API_LOG, dtype=str, encoding="utf-8-sig")


def daily_budget(datasets: list[str], max_calls: int | None) -> dict[str, int]:
    """API 별 오늘 남은 호출 수 = 일일 한도 − 여유분 − 오늘 이미 호출한 수 (수집 로그 기준, KST)."""
    log = api_log()
    today = now_kst()[:10]
    used = log[log["collected_at"].str[:10] == today].groupby("dataset").size().to_dict()
    budget = {}
    for ds in datasets:
        left = max(API_DAILY_LIMIT - API_DAILY_MARGIN - int(used.get(ds, 0)), 0)
        budget[ds] = min(left, max_calls) if max_calls else left
    return budget


def pages_per_combo(ds: str) -> float:
    """지금까지의 수집 기록으로 조합당 평균 페이지 수를 추정 (예상 호출 수 계산용)."""
    log = api_log()
    log = log[log["dataset"] == ds]
    if log.empty:
        return 1.0
    return round(len(log) / max(log.groupby(["LAWD_CD", "DEAL_YMD"]).ngroups, 1), 2)


def show_plan(targets: pd.DataFrame, budget: dict[str, int]) -> None:
    if targets.empty:
        print(f"[plan] 활성화된 수집 계획이 없습니다 ({PLAN_FILE.name})")
        return
    summary = (targets.groupby(["order", "plan", "dataset"])
               .agg(조합=("done", "size"), 수집완료=("done", "sum"))
               .assign(남은조합=lambda d: d["조합"] - d["수집완료"]).reset_index().drop(columns="order"))
    print(summary.to_string(index=False))
    for ds, left_calls in budget.items():
        left = int((~targets["done"] & (targets["dataset"] == ds)).sum())
        ppc = pages_per_combo(ds)
        estimate = int(left * ppc)
        days = estimate / max(API_DAILY_LIMIT - API_DAILY_MARGIN, 1)
        print(f"[plan] {ds}: 남은 조합 {left:,}개 × 조합당 약 {ppc}페이지 ≈ {estimate:,}회 호출 "
              f"| 오늘 남은 한도 {left_calls:,}회 | 하루 한도 기준 약 {days:.1f}일")


def collect_api(datasets: list[str], max_calls: int | None, plan_only: bool) -> None:
    targets = plan_targets(datasets)
    budget = daily_budget(datasets, max_calls)
    show_plan(targets, budget)
    if plan_only:
        return
    if not API_KEY:
        sys.exit("인증키가 없습니다. 프로젝트 루트의 .env 에 DATA_GO_KR_KEY=... 를 넣으세요 (.env.example 참고)")
    todo = targets[~targets["done"]]
    API_LOG.parent.mkdir(parents=True, exist_ok=True)
    new_log = not API_LOG.exists()
    calls = {ds: 0 for ds in datasets}
    stopped: dict[str, str] = {}             # 한도에 걸려 멈춘 API 와 사유
    with open(API_LOG, "a", newline="", encoding="utf-8-sig") as log_fp:
        log = csv.writer(log_fp)
        if new_log:
            log.writerow(["collected_at", "dataset", "endpoint", "LAWD_CD", "DEAL_YMD", "page",
                          "total_count", "item_count", "file", "sha256"])
        for i, t in enumerate(todo.itertuples(), start=1):
            if t.dataset in stopped:
                continue                              # 이 API 는 오늘 한도 소진 → 다른 API 는 계속
            api = API_SOURCES[t.dataset]
            folder = SOURCE_API_DIR / t.dataset / t.ym
            folder.mkdir(parents=True, exist_ok=True)
            page, got = 1, 0
            try:
                while True:
                    out = folder / f"{t.dataset}__{t.sgg}_{t.ym}__p{page:04d}.xml"
                    if out.exists():                  # 중간에 끊긴 조합: 받아 둔 페이지는 다시 부르지 않는다
                        raw = out.read_bytes()
                    else:
                        if calls[t.dataset] >= budget[t.dataset]:
                            raise QuotaExceeded(f"오늘 남은 한도 {budget[t.dataset]:,}회 사용 완료")
                        params = {"LAWD_CD": t.sgg, "DEAL_YMD": t.ym, "pageNo": page, "numOfRows": API_NUM_OF_ROWS}
                        raw = call_data_go_kr(api.endpoint, params)
                        calls[t.dataset] += 1
                        out.write_bytes(raw)
                        protect_read_only([out])
                        root = ElementTree.fromstring(raw)
                        log.writerow([now_kst(), t.dataset, api.endpoint, t.sgg, t.ym, page,
                                      root.findtext(".//totalCount"), len(root.findall(".//items/item")),
                                      labeled_path(out), sha256_file(out)])
                        log_fp.flush()
                    root = ElementTree.fromstring(raw)
                    total = int(root.findtext(".//totalCount") or 0)
                    item_count = len(root.findall(".//items/item"))
                    got += item_count
                    if item_count == 0 or got >= total:
                        break
                    page += 1
            except QuotaExceeded as exc:
                stopped[t.dataset] = str(exc)
                print(f"[api] {t.dataset} 수집 중단: {exc}")
                if len(stopped) == len(datasets):
                    break
                continue
            (folder / f"_done_{t.sgg}").write_text(f"{got}\n", encoding="utf-8")
            print(f"[api] ({i:,}/{len(todo):,}) {t.plan} | {t.dataset} {t.ym} {t.sgg}"
                  f"({SGG_NAMES.get(t.sgg, '')}): {got:,}건")
    left = int((~plan_targets(datasets)["done"]).sum())
    print("[api] 이번 실행 호출: " + ", ".join(f"{k} {v:,}회" for k, v in calls.items()) + f" | 남은 조합 {left:,}개")
    if left:
        print("[api] 한도가 회복되면(다음 날) 같은 명령을 다시 실행하면 남은 조합부터 이어서 받습니다.")


# ──────────────────────────────────────────────────────────────
# seoul: 서울 열린데이터광장 → data/source/api/{데이터셋}/{수집일}/
#   - 1회 호출 최대 1,000건을 유지하며 1번 행부터 마지막 행까지 전부 받는다 (호출 횟수 제한 없음).
#   - 같은 날 다시 실행하면 받아 둔 구간은 건너뛰고 이어서 받는다. 완료된 주기는 다시 받지 않는다.
# ──────────────────────────────────────────────────────────────
def seoul_parse(raw: bytes) -> tuple[str, str, int | None, int]:
    """응답 XML → (결과코드, 메시지, list_total_count, row 개수)."""
    root = ElementTree.fromstring(raw)
    result = root if root.tag == "RESULT" else root.find("RESULT")
    code = (result.findtext("CODE") if result is not None else "") or ""
    message = (result.findtext("MESSAGE") if result is not None else "") or ""
    total = root.findtext("list_total_count")
    total_count = int(total) if total and total.strip().isdigit() else None
    return code.strip(), message.strip(), total_count, len(root.findall("row"))


def call_seoul(service: str, start: int, end: int) -> bytes:
    import requests

    url = f"{SEOUL_API_BASE}/{SEOUL_API_KEY}/xml/{service}/{start}/{end}/"
    last_error = None
    for attempt in range(1, SEOUL_API_RETRIES + 1):
        try:
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            try:
                code, message, _, _ = seoul_parse(response.content)
            except Exception:  # noqa: BLE001
                raise RuntimeError(f"XML 이 아닌 응답: {response.content[:200].decode('utf-8', 'replace')}") from None
            if code in SEOUL_API_RETRY_CODES:
                raise RuntimeError(f"{code} {message}")
            if code not in (SEOUL_API_OK_CODE, SEOUL_API_EMPTY_CODE):
                raise PermissionError(f"{code} {message}")      # 인증키·요청 형식 오류 → 재시도하지 않음
            time.sleep(SEOUL_API_REQUEST_INTERVAL_SEC)
            return response.content
        except PermissionError:
            raise
        except Exception as exc:  # noqa: BLE001 - 네트워크·서버 오류는 재시도
            last_error = mask(str(exc))
            time.sleep(2 ** attempt)
    raise RuntimeError(f"{SEOUL_API_RETRIES}회 재시도 실패: {last_error}")


def seoul_snapshots(ds: str) -> list[tuple[str, bool]]:
    """(수집일, 완료 여부) 목록."""
    base = SOURCE_API_DIR / ds
    if not base.exists():
        return []
    return [(p.name, (p / SEOUL_DONE).exists()) for p in sorted(base.iterdir()) if p.is_dir()]


def seoul_page_name(ds: str, snap: str, start: int, end: int) -> str:
    return f"{ds}__{snap}__r{start:07d}-{end:07d}.xml"


def snapshot_period(snap: str) -> str:
    """스냅샷 주기 키: month → YYYYMM, day → YYYYMMDD."""
    return snap[:6] if SEOUL_SNAPSHOT_EVERY == "month" else snap


def collect_seoul(datasets: list[str], max_calls: int | None, plan_only: bool, force: bool = False) -> bool:
    """서울 API 스냅샷 수집. 새로 받은 구간이 하나라도 있으면 True."""
    if not SEOUL_API_KEY:
        sys.exit("인증키가 없습니다. 프로젝트 루트의 .env 에 DATA_SEOUL_GO_KR_KEY=... 를 넣으세요 (.env.example 참고)")
    snap = now_kst()[:10].replace("-", "")                  # 수집일 스냅샷 (KST, YYYYMMDD)
    collected = False
    size = SEOUL_API_PAGE_SIZE
    SEOUL_LOG.parent.mkdir(parents=True, exist_ok=True)
    new_log = not SEOUL_LOG.exists()
    with open(SEOUL_LOG, "a", newline="", encoding="utf-8-sig") as log_fp:
        log = csv.writer(log_fp)
        if new_log:
            log.writerow(["collected_at", "dataset", "service", "snapshot", "start", "end",
                          "result_code", "total_count", "row_count", "file", "sha256"])
        for ds in datasets:
            api = SEOUL_SOURCES[ds]
            snaps = seoul_snapshots(ds)
            old_partial = [s for s, done in snaps if not done and s != snap]
            if old_partial:
                print(f"[seoul] {ds}: 완료되지 않은 이전 스냅샷 {', '.join(old_partial)} 은 그대로 둡니다 "
                      f"(완료 표시가 없어 bronze 대상에서 제외)")
            if (snap, True) in snaps:
                print(f"[seoul] {ds}: 오늘({snap}) 스냅샷은 이미 완료 → 건너뜀")
                continue
            same_period = [s for s, done in snaps if done and snapshot_period(s) == snapshot_period(snap)]
            if same_period and not force:
                print(f"[seoul] {ds}: 이번 주기({snapshot_period(snap)}) 스냅샷 {', '.join(same_period)} 이미 완료 → 건너뜀 "
                      f"(주기 {SEOUL_SNAPSHOT_EVERY}, 추가로 받으려면 --force)")
                continue
            # 전체 건수 확인 (1건만 요청, 저장하지 않음)
            _, _, total, _ = seoul_parse(call_seoul(api.service, 1, 1))
            total = total or 0
            pages = -(-total // size)
            folder = SOURCE_API_DIR / ds / snap
            have = sum(1 for k in range(pages)
                       if (folder / seoul_page_name(ds, snap, k * size + 1, (k + 1) * size)).exists())
            print(f"[seoul] {ds} ({api.service}): 전체 {total:,}건 → {size:,}건씩 {pages:,}회 "
                  f"| 오늘 받아 둔 구간 {have:,}개 | 남은 호출 약 {pages - have:,}회")
            if plan_only:
                continue
            folder.mkdir(parents=True, exist_ok=True)
            first_total, calls, got, start, short, stopped = total, 0, 0, 1, [], False
            while start <= total:
                end = start + size - 1
                out = folder / seoul_page_name(ds, snap, start, end)
                if out.exists():                             # 끊긴 뒤 이어받기: 받은 구간은 다시 부르지 않음
                    raw = out.read_bytes()
                else:
                    if max_calls is not None and calls >= max_calls:
                        print(f"[seoul] {ds}: 이번 실행 호출 상한 {max_calls:,}회 도달 → 다시 실행하면 이어서 받습니다")
                        stopped = True
                        break
                    raw = call_seoul(api.service, start, end)
                    calls += 1
                    collected = True
                    code, _, page_total, row_count = seoul_parse(raw)
                    if code == SEOUL_API_EMPTY_CODE:         # 수집 중 건수가 줄어 범위를 벗어남
                        total = start - 1
                        break
                    out.write_bytes(raw)
                    protect_read_only([out])
                    log.writerow([now_kst(), ds, api.service, snap, start, end, code, page_total, row_count,
                                  labeled_path(out), sha256_file(out)])
                    log_fp.flush()
                _, _, page_total, row_count = seoul_parse(raw)
                if page_total:
                    total = page_total                       # 수집 중 건수가 늘면 끝까지 따라간다
                expected = min(size, total - start + 1)
                if row_count != expected:
                    short.append(f"{start}-{end}:{row_count}/{expected}")
                got += row_count
                if calls and calls % 50 == 0:
                    print(f"[seoul] {ds}: {got:,}/{total:,}건 ({calls:,}회 호출)")
                start = end + 1
            if not stopped:
                (folder / SEOUL_DONE).write_text(
                    f"rows={got}\ntotal_first={first_total}\ntotal_last={total}\npage_size={size}\n"
                    f"short_pages={';'.join(short) or '-'}\n", encoding="utf-8")
                note = f" | 건수 불일치 구간 {len(short)}개" if short else ""
                drift = f" | 수집 중 전체 건수 변동 {first_total:,} → {total:,}" if first_total != total else ""
                print(f"[seoul] {ds} {snap} 완료: {got:,}건 / 이번 호출 {calls:,}회{note}{drift}")
    return collected


# ──────────────────────────────────────────────────────────────
# inventory: 원천 목록 문서화
# ──────────────────────────────────────────────────────────────
INVENTORY_SKIP = SOURCE_META_FILES - {"_collect_log.csv", "_seoul_collect_log.csv"}   # 수집 로그는 목록에 남긴다


def origin(label: str) -> tuple[str, str]:
    """Source/files/{데이터셋}/... 또는 Source/api/{데이터셋}/... → (제목, 출처 페이지)."""
    parts = label.split("/")
    if len(parts) > 2 and parts[1] in ("files", "api") and parts[2] in SOURCES:
        info = SOURCES[parts[2]]
        return info.title, info.page
    return "-", "-"


def count_rows() -> tuple[pd.DataFrame, pd.DataFrame]:
    """ds_dataset.csv 기준 원천 행 수 (헤더 제외, zip 은 풀지 않고 읽기만 함). 01 단계 검증과 같은 함수로 센다."""
    per_dataset, per_file = [], []
    for ds in load_datasets(DATASET_FILE):
        units = list_units(ds)
        total = 0
        for unit in units:
            rows = count_source_rows(unit)
            total += rows
            if ds.kind != "xml":
                per_file.append({"dataset": ds.name, "file": unit.member or unit.path.name, "rows": f"{rows:,}"})
        title = SOURCES[ds.name].title if ds.name in SOURCES else ds.title
        per_dataset.append({"dataset": ds.name, "title": title, "kind": ds.kind,
                            "source_units": len(units), "rows": total})
    return pd.DataFrame(per_dataset), pd.DataFrame(per_file)


def inventory() -> None:
    rows = []
    for path in sorted(SOURCE_DIR.rglob("*"), key=lambda p: p.as_posix()):
        if not path.is_file() or path.name in INVENTORY_SKIP or path.name.startswith("_done_"):
            continue
        label = labeled_path(path)
        title, page = origin(label)
        rows.append({"file": label, "size": path.stat().st_size, "sha256": sha256_file(path),
                     "read_only": not (path.stat().st_mode & 0o222), "dataset": title, "source_page": page})
    files = pd.DataFrame(rows, columns=["file", "size", "sha256", "read_only", "dataset", "source_page"])
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    files.to_csv(SOURCE_DIR / "_source_manifest.csv", index=False, encoding="utf-8-sig")

    downloaded = files[files["file"].str.startswith(f"{SOURCE_LABEL}/files/")]
    api_files = files[files["file"].str.startswith(f"{SOURCE_LABEL}/api/") & files["file"].str.endswith(".xml")]
    api_summary = (api_files.assign(ds=api_files["file"].str.split("/").str[2])
                   .groupby("ds").agg(files=("file", "size"), bytes=("size", "sum")).reset_index()
                   if not api_files.empty else pd.DataFrame())
    downloaded_view = downloaded.assign(size=downloaded["size"].map(human_size), sha256=downloaded["sha256"].str[:16])
    row_ds, row_files = count_rows()
    total_rows = int(row_ds["rows"].sum()) if not row_ds.empty else 0
    total_units = int(row_ds["source_units"].sum()) if not row_ds.empty else 0
    row_view = pd.concat([row_ds, pd.DataFrame([{"dataset": "**합계**", "title": "", "kind": "",
                                                  "source_units": total_units, "rows": total_rows}])],
                         ignore_index=True)
    row_view["rows"] = row_view["rows"].map(lambda n: f"{n:,}")
    total_size = human_size(int(files["size"].sum())) if len(files) else "0 B"

    write_markdown(SOURCE_DIR / "SOURCE_README.md", [
        "# Source — 원천 데이터 (읽기 전용)", "",
        f"- 갱신 시각: {now_kst()} (`python pipeline/source/00_collect.py inventory`)",
        "- 이 폴더의 원천 파일은 수정·이동·덮어쓰기 하지 않는다. 모든 파일은 읽기 전용 속성이다.",
        "- 출처와 수집 방법: `docs/archive/data_collecting.md` · 출처 정의: `metadata/src_source.csv`",
        f"- 전체 파일 수: {len(files)} / 전체 크기: {total_size}",
        f"- 전체 데이터 행 수(ROW): {total_rows:,}",
        "- 전체 목록과 SHA-256 전체 값: `data/source/_source_manifest.csv`", "",
        "## 데이터 행 수 (ROW)", "",
        "- 헤더 행 제외, 빈 줄 제외. zip 은 압축을 풀지 않고 안쪽 파일을 읽어서 센다.",
        "- csv: `csv` 모듈로 센 레코드 수 / xml(API 응답): `<item>`·`<row>` 개수 "
        "(`pipeline/common/source_reader.count_source_rows`, 01 단계 검증과 동일 기준)",
        "- `source_units`: csv 는 zip 안쪽 파일 수, xml 은 응답 페이지 파일 수", "",
        *md_table(row_view), "",
        "### 파일별 행 수 (files)", "",
        *(md_table(row_files) if not row_files.empty else ["(없음)"]), "",
        "## 내려받은 파일 (files)", "",
        *(md_table(downloaded_view[["file", "size", "sha256", "read_only", "dataset", "source_page"]])
          if not downloaded_view.empty else ["(없음 — `python pipeline/source/00_collect.py import`)"]), "",
        "## API 응답 (api)", "",
        *(md_table(api_summary.assign(bytes=api_summary["bytes"].map(human_size))) if not api_summary.empty
          else ["(아직 수집 전 — 인증키를 .env 에 넣고 `python pipeline/source/00_collect.py api`)"]), "",
        "## 폴더 구조", "",
        "```text",
        "data/source/",
        "├── files/{데이터셋}/            내려받은 원본 파일 (zip 은 압축을 풀지 않고 그대로 보관)",
        "├── api/{데이터셋}/{계약년월}/   실거래 API 응답 XML (데이터셋__시군구_년월__p페이지.xml)",
        "├── api/{데이터셋}/{수집일}/     서울 API 응답 XML (데이터셋__수집일__r시작-끝.xml, 1,000건 단위 스냅샷)",
        "├── logs/_collect_log.csv        실거래 API 호출 기록 (인증키 제외)",
        "├── logs/_seoul_collect_log.csv  서울 API 호출 기록 (인증키 제외)",
        "├── _source_manifest.csv         전체 파일 목록·크기·SHA-256",
        "└── SOURCE_README.md",
        "```",
    ])
    print(f"[inventory] {len(files)}개 파일 → data/source/SOURCE_README.md, data/source/_source_manifest.csv")


# ──────────────────────────────────────────────────────────────
# 실행
# ──────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    p_import = sub.add_parser("import")
    p_import.add_argument("--from", dest="src", default=str(DOWNLOAD_DIR), help="내려받은 파일이 있는 폴더")
    p_api = sub.add_parser("api")
    p_api.add_argument("--dataset", nargs="*", default=list(API_SOURCES), choices=list(API_SOURCES))
    p_api.add_argument("--plan", action="store_true", help="호출하지 않고 수집 계획(남은 조합 수)만 보여줌")
    p_api.add_argument("--max-calls", type=int, default=None,
                       help="이번 실행에서 API 하나당 최대 호출 수 (기본: 오늘 남은 한도 전부)")
    p_seoul = sub.add_parser("seoul")
    p_seoul.add_argument("--dataset", nargs="*", default=list(SEOUL_SOURCES), choices=list(SEOUL_SOURCES))
    p_seoul.add_argument("--plan", action="store_true", help="전체 건수·필요 호출 수만 확인 (1건 조회만 함, 저장 안 함)")
    p_seoul.add_argument("--max-calls", type=int, default=None, help="이번 실행에서 데이터셋 하나당 최대 호출 수 (기본: 끝까지)")
    p_seoul.add_argument("--force", action="store_true",
                         help="이번 주기(월)에 완료 스냅샷이 있어도 오늘 스냅샷을 추가로 받음 (기존 스냅샷은 그대로)")
    sub.add_parser("inventory")
    args = parser.parse_args()

    if args.cmd == "import":
        import_files(Path(args.src))
    elif args.cmd == "api":
        collect_api(args.dataset, args.max_calls, args.plan)
        if args.plan:
            return
    elif args.cmd == "seoul":
        if not collect_seoul(args.dataset, args.max_calls, args.plan, args.force):
            return                      # 새로 받은 것이 없으면 inventory 생략 (매일 예약 실행해도 가볍게 끝남)
    inventory()


if __name__ == "__main__":
    main()
