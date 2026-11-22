"""로컬 Docker Compose 환경에서 비식별 테스트 원천(source)으로 전체 E2E 흐름을 실행·검증한다.

실행 순서 (원천 → Bronze → Silver → Gold → AI Ready → DB 적재 → 학습 → 서빙 검증):
  1. stage-source : samples/local_e2e/source/ → data/source/ 배치
  2. bronze       : python pipeline/bronze/01_bronze.py
  3. normalize    : python pipeline/silver/02_normalize.py
  4. clean        : python pipeline/silver/03_clean.py
  5. gold         : python pipeline/gold/04_gold.py
  6. feature      : python pipeline/ai_ready/05_feature_set.py
  7. load-gold    : python scripts/load_postgres.py --stage gold
  8. train        : python pipeline/ai_ready/05_train.py (LightGBM 롤링 CV + 차기 분기 예측)
  9. load-ai      : python scripts/load_postgres.py --stage ai_ready
 10. verify       : FastAPI(/api/health, bootstrap?refresh=true, quarters) + Frontend 응답 확인

사용법:
  python scripts/run_local_e2e.py --force                 # 비식별 테스트 원천으로 전체 10단계 실행
  python scripts/run_local_e2e.py --use-existing-source   # 이미 data/source/에 있는 전체 원천으로 실행
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import stat
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
SAMPLE_SOURCE_DIR = ROOT_DIR / "samples" / "local_e2e" / "source"
DATA_SOURCE_DIR = ROOT_DIR / "data" / "source"


def _handle_remove_readonly(func, path, _exc_info) -> None:
    os.chmod(path, stat.S_IWRITE | stat.S_IREAD)
    func(path)


def run_cmd(label: str, cmd: list[str]) -> None:
    print(f"\n=== [{label}] {' '.join(cmd)} ===")
    t0 = time.perf_counter()
    result = subprocess.run(cmd, cwd=ROOT_DIR)
    if result.returncode != 0:
        raise RuntimeError(f"[{label}] 명령이 실패했습니다 (exit={result.returncode}).")
    print(f"=== [{label}] 완료 ({time.perf_counter() - t0:.2f}s) ===")


def stage_source(force: bool) -> None:
    print("\n=== [1/10 stage-source] 비식별 테스트 원천(source) 배치 ===")
    if not SAMPLE_SOURCE_DIR.is_dir():
        raise FileNotFoundError(f"샘플 원천 폴더가 없습니다: {SAMPLE_SOURCE_DIR}")

    existing = [
        p for p in (DATA_SOURCE_DIR / "api", DATA_SOURCE_DIR / "files")
        if p.exists() and any(p.rglob("*"))
    ]
    if existing and not force:
        raise RuntimeError(
            "data/source/ 에 이미 원천 데이터가 존재합니다. "
            "테스트 원천으로 덮어쓰려면 --force 를, 기존 data/source/ 를 그대로 쓰려면 --use-existing-source 를 지정하세요."
        )

    for sub in ("api", "files"):
        dst_sub = DATA_SOURCE_DIR / sub
        if dst_sub.exists():
            shutil.rmtree(dst_sub, onerror=_handle_remove_readonly)
        src_sub = SAMPLE_SOURCE_DIR / sub
        if src_sub.exists():
            shutil.copytree(src_sub, dst_sub)

    # 이전 단계 산출물(bronze/silver)에 다른 파일이 섞이지 않도록 정리
    for stage_dir in (ROOT_DIR / "data" / "bronze", ROOT_DIR / "data" / "silver"):
        if stage_dir.exists():
            for parquet in stage_dir.rglob("*.parquet"):
                parquet.unlink()

    files = [p for p in DATA_SOURCE_DIR.rglob("*") if p.is_file() and p.parent.name != "source"]
    total_mb = sum(p.stat().st_size for p in files) / (1024 * 1024)
    print(f"  - staged {len(files)} sample source files ({total_mb:.2f} MB) -> {DATA_SOURCE_DIR}")


def fetch_json(url: str, timeout: int = 30) -> dict:
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        if resp.status != 200:
            raise RuntimeError(f"HTTP {resp.status} from {url}")
        return json.loads(resp.read().decode("utf-8"))


def fetch_status(url: str, timeout: int = 15) -> int:
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return resp.status


def verify_serving(api_url: str, web_url: str) -> None:
    print("\n=== [10/10 verify] FastAPI & Frontend 서빙 검증 ===")
    health = fetch_json(f"{api_url}/api/health")
    if health.get("status") != "ok":
        raise RuntimeError(f"API health check 실패: {health}")
    print(f"  - API health: {health}")

    boot = fetch_json(f"{api_url}/api/dashboard/bootstrap?refresh=true", timeout=60)
    source = boot.get("source")
    model_ver = boot.get("modelVersion")
    quarters = len(boot.get("quarters", []))
    records_by_qtr = boot.get("recordsByQuarter", {})
    sample_region_cnt = len(next(iter(records_by_qtr.values()), {})) if records_by_qtr else 0
    print(
        f"  - API bootstrap (cache refreshed): source={source}, "
        f"modelVersion={model_ver}, quarters={quarters}, regions={sample_region_cnt}"
    )
    if source != "postgres" or quarters == 0 or sample_region_cnt == 0:
        raise RuntimeError("API bootstrap 응답이 비어 있거나 PostgreSQL 연결이 아닙니다.")

    q26q3 = fetch_json(f"{api_url}/api/dashboard/quarters/2026Q3")
    q26q4 = fetch_json(f"{api_url}/api/dashboard/quarters/2026Q4")
    q3_raw = q26q3.get("records", [])
    q4_raw = q26q4.get("records", [])
    q3_rows = list(q3_raw.values()) if isinstance(q3_raw, dict) else q3_raw
    q4_rows = list(q4_raw.values()) if isinstance(q4_raw, dict) else q4_raw
    q3_pred_cnt = sum(1 for r in q3_rows if r.get("predictedGrowth") is not None)
    q4_pred_cnt = sum(1 for r in q4_rows if r.get("predictedGrowth") is not None)
    print(f"  - 2026Q3: total={len(q3_rows)}, predicted={q3_pred_cnt}")
    print(f"  - 2026Q4: total={len(q4_rows)}, predicted={q4_pred_cnt}")
    if q3_pred_cnt == 0 or q4_pred_cnt == 0:
        raise RuntimeError("AI 예측값이 서빙되지 않았습니다.")

    web_status = fetch_status(f"{web_url}/")
    proxy_health = fetch_json(f"{web_url}/api/health")
    print(f"  - Frontend ({web_url}/): HTTP {web_status}, proxy /api/health={proxy_health}")


def main() -> int:
    in_docker = Path("/.dockerenv").exists()
    default_api = "http://backend:8000" if in_docker else "http://localhost:8000"
    default_web = "http://frontend" if in_docker else "http://localhost:5173"

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--force", action="store_true", help="기존 data/source/ 를 비식별 테스트 원천으로 덮어쓰기")
    parser.add_argument("--use-existing-source", action="store_true", help="샘플 복사 생략 후 기존 data/source/ 사용")
    parser.add_argument("--skip-verify", action="store_true", help="API/프론트 서빙 검증 생략")
    parser.add_argument("--api-url", default=default_api, help="FastAPI 기본 URL")
    parser.add_argument("--web-url", default=default_web, help="Frontend 기본 URL")
    args = parser.parse_args()

    py = sys.executable
    started = time.perf_counter()

    try:
        if not args.use_existing_source:
            stage_source(force=args.force)
        else:
            print("\n=== [1/10 stage-source] 기존 data/source/ 사용 (--use-existing-source) ===")

        run_cmd("2/10 bronze", [py, "pipeline/bronze/01_bronze.py"])
        run_cmd("3/10 normalize", [py, "pipeline/silver/02_normalize.py"])
        run_cmd("4/10 clean", [py, "pipeline/silver/03_clean.py"])
        run_cmd("5/10 gold", [py, "pipeline/gold/04_gold.py"])
        run_cmd("6/10 feature", [py, "pipeline/ai_ready/05_feature_set.py"])
        run_cmd("7/10 load-gold", [py, "scripts/load_postgres.py", "--stage", "gold"])
        run_cmd("8/10 train", [py, "pipeline/ai_ready/05_train.py"])
        run_cmd("9/10 load-ai", [py, "scripts/load_postgres.py", "--stage", "ai_ready"])

        if not args.skip_verify:
            verify_serving(args.api_url.rstrip("/"), args.web_url.rstrip("/"))
    except urllib.error.URLError as exc:
        print(
            f"\n[ERROR] 서버 연결 실패: {exc}\n"
            "Docker Compose 가 실행 중인지 확인하세요:\n"
            "  docker compose --profile local-db up --build -d",
            file=sys.stderr,
        )
        return 1
    except Exception as exc:
        print(f"\n[ERROR] {exc}", file=sys.stderr)
        return 1

    browser_url = "http://localhost:5173" if in_docker and args.web_url == "http://frontend" else args.web_url
    print(f"\n[SUCCESS] 원천→Bronze→Silver→Gold→학습→DB 적재→서빙 전체 E2E 완료 ({time.perf_counter() - started:.1f}s)")
    print(f"브라우저에서 대시보드 확인: {browser_url}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
