"""로컬 Docker Compose 환경에서 테스트 샘플로 전체 E2E 흐름을 실행·검증한다.

실행 순서:
  1. stage-sample : samples/local_e2e/gold/*.parquet → data/gold/ 배치
  2. feature      : python pipeline/ai_ready/05_feature_set.py (피처셋 생성)
  3. load-gold    : python scripts/load_postgres.py --stage gold (Gold DB 적재)
  4. train        : python pipeline/ai_ready/05_train.py (LightGBM 롤링 학습·예측)
  5. load-ai      : python scripts/load_postgres.py --stage ai_ready (학습 결과 DB 적재)
  6. verify       : FastAPI(/api/health, bootstrap?refresh=true, quarters) + Frontend(5173) 응답 확인

사용법:
  python scripts/run_local_e2e.py --force               # 테스트 샘플로 전체 실행
  python scripts/run_local_e2e.py --use-existing-gold   # 이미 data/gold/에 만든 전체 실데이터로 실행
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
SAMPLE_GOLD_DIR = ROOT_DIR / "samples" / "local_e2e" / "gold"
DATA_GOLD_DIR = ROOT_DIR / "data" / "gold"


def run_cmd(label: str, cmd: list[str]) -> None:
    print(f"\n=== [{label}] {' '.join(cmd)} ===")
    t0 = time.perf_counter()
    result = subprocess.run(cmd, cwd=ROOT_DIR)
    if result.returncode != 0:
        raise RuntimeError(f"[{label}] 명령이 실패했습니다 (exit={result.returncode}).")
    print(f"=== [{label}] 완료 ({time.perf_counter() - t0:.2f}s) ===")


def stage_sample(force: bool) -> None:
    print("\n=== [1/6 stage-sample] 테스트 샘플 Gold 배치 ===")
    sample_files = sorted(SAMPLE_GOLD_DIR.glob("*.parquet"))
    if not sample_files:
        raise FileNotFoundError(f"샘플 Parquet 파일이 없습니다: {SAMPLE_GOLD_DIR}")

    DATA_GOLD_DIR.mkdir(parents=True, exist_ok=True)
    existing = list(DATA_GOLD_DIR.glob("*.parquet"))
    if existing and not force:
        raise RuntimeError(
            "data/gold/ 에 이미 Parquet 파일이 존재합니다. "
            "테스트 샘플로 덮어쓰려면 --force 를, 기존 data/gold/ 를 그대로 쓰려면 --use-existing-gold 를 지정하세요."
        )

    for src in sample_files:
        dst = DATA_GOLD_DIR / src.name
        shutil.copy2(src, dst)
        print(f"  - copied {src.name} ({src.stat().st_size / 1024:.1f} KB)")


def fetch_json(url: str, timeout: int = 30) -> dict:
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        if resp.status != 200:
            raise RuntimeError(f"HTTP {resp.status} from {url}")
        return json.loads(resp.read().decode("utf-8"))


def fetch_status(url: str, timeout: int = 15) -> int:
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return resp.status


def verify_serving(api_url: str, web_url: str) -> None:
    print("\n=== [6/6 verify] FastAPI & Frontend 서빙 검증 ===")
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
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--force", action="store_true", help="기존 data/gold/ 파일을 테스트 샘플로 덮어쓰기")
    parser.add_argument("--use-existing-gold", action="store_true", help="샘플 복사 생략 후 기존 data/gold/ 사용")
    parser.add_argument("--skip-verify", action="store_true", help="API/프론트 서빙 검증 생략")
    parser.add_argument("--api-url", default="http://localhost:8000", help="FastAPI 기본 URL")
    parser.add_argument("--web-url", default="http://localhost:5173", help="Frontend 기본 URL")
    args = parser.parse_args()

    py = sys.executable
    started = time.perf_counter()

    try:
        if not args.use_existing_gold:
            stage_sample(force=args.force)
        else:
            print("\n=== [1/6 stage-sample] 기존 data/gold/ 사용 (--use-existing-gold) ===")

        run_cmd("2/6 feature", [py, "pipeline/ai_ready/05_feature_set.py"])
        run_cmd("3/6 load-gold", [py, "scripts/load_postgres.py", "--stage", "gold"])
        run_cmd("4/6 train", [py, "pipeline/ai_ready/05_train.py"])
        run_cmd("5/6 load-ai", [py, "scripts/load_postgres.py", "--stage", "ai_ready"])

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

    print(f"\n[SUCCESS] 전체 로컬 E2E 파이프라인·학습·DB 적재·서빙 검증 완료 ({time.perf_counter() - started:.1f}s)")
    print(f"브라우저에서 대시보드 확인: {args.web_url}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
