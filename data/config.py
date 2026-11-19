"""프로젝트 전체 설정 파일.

모든 단계 스크립트(00_collect.py, 01_bronze.py, 이후 02~04)는 이 파일만 보고 동작한다.
새 데이터를 추가할 때는 코드를 고치지 않고 아래 DATASETS 에 항목 하나만 추가하면 된다.
"""
from __future__ import annotations

import os
from pathlib import Path

# ──────────────────────────────────────────────────────────────
# 1. 경로
# ──────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent
SOURCE_DIR = PROJECT_ROOT / "Source"          # 원천 (읽기 전용, 수정·이동·덮어쓰기 금지)
SOURCE_FILES_DIR = SOURCE_DIR / "files"       # 내려받은 파일 원천
SOURCE_API_DIR = SOURCE_DIR / "api"           # API 응답 원천
BRONZE_DIR = PROJECT_ROOT / "bronze"          # 1차 Bronze (parquet)
SILVER_DIR = PROJECT_ROOT / "silver"          # 2차 Silver 표준화 (parquet)
DICTIONARY_PATH = PROJECT_ROOT / "Dictionary.md"   # 데이터 사전 (02_normalize.py 가 이 문서의 표를 읽어 그대로 적용)
DOWNLOAD_DIR = Path.home() / "Downloads"      # 00_collect.py import 가 원천 파일을 찾는 곳

# ──────────────────────────────────────────────────────────────
# 2. 단계 정의 (인덱스 = 실행 순서 = 파일명 접두어)
# ──────────────────────────────────────────────────────────────
STAGES = {
    "00": {"name": "source", "dir": SOURCE_DIR, "script": "00_collect.py"},
    "01": {"name": "bronze", "dir": BRONZE_DIR, "script": "01_bronze.py"},
    "02": {"name": "silver", "dir": SILVER_DIR, "script": "02_normalize.py"},
    # "03": silver(정규화·통합), "04": gold 는 다음 단계에서 추가
}


def stage_file_name(idx: str, dataset: str, detail: str | None = None, ext: str = "parquet") -> str:
    """파일명 규칙: {단계인덱스}_{단계명}__{데이터셋}[__{세부}].{확장자}
    예) 01_bronze__store_info__서울_202609.parquet
    """
    name = f"{idx}_{STAGES[idx]['name']}__{dataset}"
    if detail:
        name += f"__{detail}"
    return f"{name}.{ext}"


# ──────────────────────────────────────────────────────────────
# 3. API 설정 (00_collect.py)
#    인증키는 코드에 쓰지 않는다. 프로젝트 폴더의 .env 파일에 DATA_GO_KR_KEY=... 로 넣는다.
# ──────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv

    load_dotenv(PROJECT_ROOT / ".env")
except ImportError:
    pass

API_KEY = os.getenv("DATA_GO_KR_KEY", "")
API_REQUEST_INTERVAL_SEC = 0.3     # 호출 간격
API_RETRIES = 3
API_NUM_OF_ROWS = 1000             # 한 페이지 최대 행 수
API_OK_CODES = {"00", "000"}

API_SOURCES = {
    "apt_trade": {
        "title": "국토교통부_아파트 매매 실거래가 상세 자료",
        "page": "https://www.data.go.kr/data/15126468/openapi.do",
        "endpoint": "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev",
        "params": ["LAWD_CD", "DEAL_YMD"],
    },
    "apt_rent": {
        "title": "국토교통부_아파트 전월세 실거래가 자료",
        "page": "https://www.data.go.kr/data/15126474/openapi.do",
        "endpoint": "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent",
        "params": ["LAWD_CD", "DEAL_YMD"],
    },
}

# 일일 호출 한도: 공공데이터포털 개발계정은 API(서비스)마다 하루 10,000회. 매매·전월세는 서로 다른 API 라 한도도 따로 계산한다.
API_DAILY_LIMIT = 10_000          # API 하나당 하루 호출 한도
API_DAILY_MARGIN = 100            # 실패·재시도로 소모될 수 있는 여유분
API_MAX_CALLS_PER_RUN = None      # 한 번 실행할 때 API 하나당 호출 상한 (None = 오늘 남은 한도까지 전부 사용)
API_QUOTA_CODES = {"22"}          # 일일 호출 한도 초과 코드 → 재시도하지 않고 즉시 멈춤

# 서울 25개 구 (법정동코드 앞 5자리)
SEOUL_SGG = {
    "11110": "종로구", "11140": "중구", "11170": "용산구", "11200": "성동구", "11215": "광진구",
    "11230": "동대문구", "11260": "중랑구", "11290": "성북구", "11305": "강북구", "11320": "도봉구",
    "11350": "노원구", "11380": "은평구", "11410": "서대문구", "11440": "마포구", "11470": "양천구",
    "11500": "강서구", "11530": "구로구", "11545": "금천구", "11560": "영등포구", "11590": "동작구",
    "11620": "관악구", "11650": "서초구", "11680": "강남구", "11710": "송파구", "11740": "강동구",
}
FOCUS_SGG = ["11440", "11680", "11710"]   # 1차 집중 지역: 마포·강남·송파

# 수집 계획: (시군구 × 계약년월) 조합의 합집합을 수집한다.
# 이미 받은 조합(_done_ 표시가 있는 것)은 자동으로 건너뛰므로, 계획을 추가해도 기존 수집분은 다시 부르지 않는다.
# 주의: 실거래 신고 기한이 계약 후 30일이라, 끝난 지 한 달이 안 된 달은 건수가 계속 늘어난다.

# 2025~2026 인천 행정구역 개편으로 폐지된 시군구 코드. 개편 전 기간의 거래는 이 코드로 조회된다.
INCHEON_PRE_REFORM_SGG = ["28110", "28140", "28260"]   # 중구, 동구, 서구
# 수도권 과거 이력(4차) 조회 코드: 인천·경기 현존 코드 + 인천 개편 전 코드 + 그 이전 폐지 코드
METRO_HIST_SGG = {"sido": ["28", "41"], "extra": INCHEON_PRE_REFORM_SGG + ["28170", "41195", "41197", "41199", "41730"]}

#   sgg 지정 방법
#     - 코드 목록: ["11440", "11680"]
#     - "SEOUL_ALL": 서울 25개 구
#     - {"sido": ["28", "41"], "extra": [...]}: 법정동코드 원천(Source/files/ldong_code)에서 해당 시도의 '현존' 시군구 코드를
#       모두 뽑고 extra 코드를 더한다. 구가 있는 시(수원시 등)는 시 코드도 포함한다 (구 신설·폐지 전 기간 대비).
#   start/end : 계약년월 범위. API 제공 시작: 매매 2006-01, 전월세 2011-01 (이전 달은 빈 응답)
#   우선순위: 위에 있는 계획부터, 같은 계획 안에서는 최근 달부터 받는다.
COLLECT_PLANS = [
    {"name": "1차 기본 (수집 완료)", "sgg": FOCUS_SGG, "start": "202407", "end": "202609", "enabled": True},
    {"name": "2차-A 기간 확장 (수집 완료)", "sgg": FOCUS_SGG, "start": "202001", "end": "202406", "enabled": True},
    {"name": "2차-B 지역 확장 서울 (수집 완료)", "sgg": "SEOUL_ALL", "start": "202001", "end": "202609", "enabled": True},
    {"name": "3차-A 서울 과거 이력 (매매)", "sgg": "SEOUL_ALL", "start": "200601", "end": "201912", "enabled": True,
     "datasets": ["apt_trade"]},
    {"name": "3차-A 서울 과거 이력 (전월세)", "sgg": "SEOUL_ALL", "start": "201101", "end": "201912", "enabled": True,
     "datasets": ["apt_rent"]},
    {"name": "3차-B 수도권 확장 (인천·경기)", "sgg": {"sido": ["28", "41"], "extra": INCHEON_PRE_REFORM_SGG},
     "start": "202001", "end": "202609", "enabled": True},
    # 수도권 과거 이력: 행정구역 변경으로 시기별 코드가 달라 폐지 코드를 함께 조회한다.
    #   인천 남구 28170(2018 미추홀구), 부천시 옛 구 41195·41197·41199(2016 폐지), 여주군 41730(2013 여주시)
    {"name": "4차 수도권 과거 이력 (매매)", "sgg": METRO_HIST_SGG, "start": "200601", "end": "201912", "enabled": True,
     "datasets": ["apt_trade"]},
    {"name": "4차 수도권 과거 이력 (전월세)", "sgg": METRO_HIST_SGG, "start": "201101", "end": "201912", "enabled": True,
     "datasets": ["apt_rent"]},
    {"name": "최신월 (12월 이후 활성화 권장)", "sgg": "SEOUL_ALL", "start": "202610", "end": "202610", "enabled": False},
]

# ──────────────────────────────────────────────────────────────
# 3-2. 서울 열린데이터광장 API (00_collect.py seoul)
#    인증키는 .env 의 DATA_SEOUL_GO_KR_KEY. 요청 주소 경로에 키가 들어가므로 로그·오류 메시지에서는 가린다.
#    제한: 1회 호출 최대 1,000건, 호출 횟수 제한 없음 → 1,000건씩 끝까지 받아 '수집일 스냅샷' 으로 저장한다.
#    매일 갱신되는 전체 목록을 월 1회(SEOUL_SNAPSHOT_EVERY) 수집일(KST) 폴더에 쌓고, 이미 받은 주기는 다시 받지 않는다.
# ──────────────────────────────────────────────────────────────
SEOUL_API_KEY = os.getenv("DATA_SEOUL_GO_KR_KEY", "")
SEOUL_API_BASE = "http://openapi.seoul.go.kr:8088"   # 서울 열린데이터광장은 http 만 제공
SEOUL_API_PAGE_SIZE = 1000                            # 1회 호출 최대 건수 (서비스 제한, 늘리지 말 것)
SEOUL_API_REQUEST_INTERVAL_SEC = 0.1
SEOUL_API_RETRIES = 3
SEOUL_API_OK_CODE = "INFO-000"                        # 정상
SEOUL_API_EMPTY_CODE = "INFO-200"                     # 해당 범위에 데이터 없음 → 끝으로 본다
SEOUL_API_RETRY_CODES = {"ERROR-500", "ERROR-600", "ERROR-601"}   # 서버·DB 오류 → 재시도
# 스냅샷 주기: "month" = 한 달에 완료 스냅샷 1개 (매월 1일 기준, 그날 못 받으면 그 달 처음 실행한 날)
#             "day"   = 하루에 1개. 주기 안에 완료 스냅샷이 있으면 수집하지 않는다 (--force 로 추가 수집)
SEOUL_SNAPSHOT_EVERY = "month"

SEOUL_API_SOURCES = {
    "food_general": {
        "title": "서울시 일반음식점 인허가 정보",
        "page": "https://data.seoul.go.kr/dataList/OA-23056/S/1/datasetView.do",
        "service": "LOCALDATA_072404",
    },
    "food_rest": {
        "title": "서울시 휴게음식점 인허가 정보",
        "page": "https://data.seoul.go.kr/dataList/OA-16095/S/1/datasetView.do",
        "service": "LOCALDATA_072405",
    },
    # 분석범위_제안.md 의 의원·약국·미용업. 서비스명은 개방서비스ID 규칙으로 찾아 전체 건수로 확인 (2026-11-19)
    "clinic": {
        "title": "서울시 의원 인허가 정보",
        "page": "https://data.seoul.go.kr/dataList/OA-16480/S/1/datasetView.do",
        "service": "LOCALDATA_010102",
    },
    "pharmacy": {
        "title": "서울시 약국 인허가 정보",
        "page": "https://data.seoul.go.kr/dataList/OA-16484/S/1/datasetView.do",
        "service": "LOCALDATA_010106",
    },
    "beauty": {
        "title": "서울시 미용업 인허가 정보",
        "page": "https://data.seoul.go.kr/dataList/OA-16063/S/1/datasetView.do",
        "service": "LOCALDATA_051801",
    },
}

# ──────────────────────────────────────────────────────────────
# 4. 내려받은 파일 원천 (00_collect.py import)
#    Downloads 에서 pattern 에 맞는 파일을 Source/files/{dataset}/ 로 '복사'한다 (이동하지 않음).
# ──────────────────────────────────────────────────────────────
FILE_SOURCES = {
    "store_info": {
        "title": "소상공인시장진흥공단_상가(상권)정보",
        "page": "https://www.data.go.kr/data/15083033/fileData.do",
        "download_pattern": "*상가*상권*정보*.zip",
    },
    "hira_inst": {
        "title": "건강보험심사평가원_전국 병의원 및 약국 현황",
        "page": "https://www.data.go.kr/data/15051059/fileData.do",
        "download_pattern": "*병의원*약국*",
    },
    "ldong_code": {
        "title": "행정표준코드관리시스템_법정동코드 전체자료",
        "page": "https://www.code.go.kr",
        "download_pattern": "*법정동*",
    },
    # 일반음식점 보조 원천: API(OA-23056)에 없는 법정동코드·X좌표·Y좌표(EPSG:5179 추정) 3개 컬럼이 있는 42개 컬럼 CSV (2026-11-19 추가)
    "food_general_file": {
        "title": "서울시 일반음식점 인허가 정보 (CSV, 42개 컬럼)",
        "page": "https://data.seoul.go.kr/dataList/OA-16094/S/1/datasetView.do",
        "download_pattern": "*일반음식점*인허가*.csv",
    },
}

# ──────────────────────────────────────────────────────────────
# 5. Bronze 데이터셋 정의 (01_bronze.py)
#    kind     : "csv"(구분자 텍스트) | "excel" | "xml"(공공데이터 API 응답)
#    source   : SOURCE_DIR 기준 glob. zip 이면 zip_member 로 안쪽 파일을 고른다 (압축은 풀지 않고 읽기만 함)
#    encoding : "auto"(UTF-8 → CP949 순서로 판별) 또는 "utf-8", "cp949" 등
#    encoding_errors : csv 디코딩 오류 처리 ("strict" 기본, "replace" 면 깨진 바이트를 U+FFFD 로 두고 계속 읽음)
#    sep      : csv 구분자 ("," / "\t" / "|")
#    header   : 헤더 행 번호 (0부터). None 이면 헤더 없음 → col_1, col_2 ... 로 이름 붙임
#    skiprows : 헤더 위에서 건너뛸 행 수
#    sheet_name : excel 시트 이름 또는 번호. 리스트면 여러 시트, "*" 면 전체 시트
#    usecols  : 읽을 열 목록 (None = 전체). 원천 열 이름으로 적는다
#    output   : "per_file"(원천 파일 1개 → parquet 1개) | "combined"(데이터셋 전체 → parquet 1개)
#               | "per_dir"(원천 폴더 1개 → parquet 1개. 서울 API 스냅샷처럼 날짜 폴더 단위로 쌓이는 원천)
#    done_marker : per_dir 에서 이 파일이 있는 폴더만 처리 (끊긴 스냅샷 제외), 파일 안 rows= 값과 행 수도 비교
#    enabled  : False 면 건너뜀
# ──────────────────────────────────────────────────────────────
DATASETS = [
    {
        "name": "store_info",
        "kind": "csv",
        "source": "files/store_info/*.zip",
        "zip_member": "*.csv",
        "encoding": "auto",
        "sep": ",",
        "header": 0,
        "skiprows": None,
        "usecols": None,
        "output": "per_file",
        "enabled": True,
    },
    {
        "name": "hira_inst",
        "kind": "csv",
        "source": "files/hira_inst/*.zip",
        "zip_member": "*.csv",
        "sheet_name": "*",
        "header": 0,
        "skiprows": None,
        "usecols": None,
        "output": "per_file",
        "enabled": True,
    },
    {
        "name": "ldong_code",
        "kind": "csv",
        "source": "files/ldong_code/*",
        "zip_member": "*.txt",
        "encoding": "auto",
        "sep": "\t",
        "header": 0,
        "skiprows": None,
        "usecols": None,
        "output": "per_file",
        "enabled": True,
    },
    {
        "name": "apt_trade",
        "kind": "xml",
        "source": "api/apt_trade/**/*.xml",
        "item_path": ".//items/item",
        "usecols": None,
        "output": "combined",
        "enabled": True,
    },
    {
        "name": "apt_rent",
        "kind": "xml",
        "source": "api/apt_rent/**/*.xml",
        "item_path": ".//items/item",
        "usecols": None,
        "output": "combined",
        "enabled": True,
    },
    # 서울 음식점 인허가 (00_collect.py seoul). Source/api/{데이터셋}/{수집일 YYYYMMDD}/ 월 1회 스냅샷 단위로 쌓인다.
    # 스냅샷 폴더마다 parquet 1개 (per_dir). 사전 정의: Dictionary.md 4장 food_general / food_rest
    {
        "name": "food_general",
        "kind": "xml",
        "source": "api/food_general/**/*.xml",
        "item_path": "./row",
        "usecols": None,
        "output": "per_dir",
        "done_marker": "_done_snapshot",
        "enabled": True,
    },
    {
        # 일반음식점 보조 원천 (CSV). 원천 자체에 깨진 바이트 4건(1978~2000년 레코드) → replace 로 읽고 U+FFFD 그대로 보존
        "name": "food_general_file",
        "kind": "csv",
        "source": "files/food_general_file/*.csv",
        "encoding": "cp949",
        "encoding_errors": "replace",
        "sep": ",",
        "header": 0,
        "skiprows": None,
        "usecols": None,
        "output": "per_file",
        "enabled": True,
    },
    {
        "name": "food_rest",
        "kind": "xml",
        "source": "api/food_rest/**/*.xml",
        "item_path": "./row",
        "usecols": None,
        "output": "per_dir",
        "done_marker": "_done_snapshot",
        "enabled": True,
    },
    # 서울 의원·약국·미용업 인허가 (00_collect.py seoul). 구조는 음식점과 같다.
    # 사전 정의: Dictionary.md 4장 clinic / pharmacy / beauty
    *({
        "name": name,
        "kind": "xml",
        "source": f"api/{name}/**/*.xml",
        "item_path": "./row",
        "usecols": None,
        "output": "per_dir",
        "done_marker": "_done_snapshot",
        "enabled": True,
    } for name in ("clinic", "pharmacy", "beauty")),
]

# ──────────────────────────────────────────────────────────────
# 6. Bronze 공통 옵션
# ──────────────────────────────────────────────────────────────
BRONZE = {
    "chunksize": 100_000,          # CSV 를 나눠 읽는 행 수 = parquet row group 크기 (고정해야 재실행 결과가 같다)
    "compression": "snappy",
    "lineage_columns": True,       # _source_file, _source_row 컬럼 추가 (원천 행 추적용)
    "protect_source": True,        # 실행 시 Source 파일을 읽기 전용 속성으로 설정 (SOURCE_META_FILES 제외)
}
# 읽기 전용으로 잠그지 않는 Source 메타 파일 (00_collect.py 가 계속 갱신). 원천 데이터가 아니다.
SOURCE_META_FILES = {"README.md", "_source_manifest.csv", "_collect_log.csv", "_seoul_collect_log.csv"}

# ──────────────────────────────────────────────────────────────
# 7. Silver 표준화 옵션 (02_normalize.py)
# ──────────────────────────────────────────────────────────────
SILVER = {
    "batch_size": 100_000,         # bronze 를 나눠 읽는 행 수 = silver row group 크기 (고정해야 재실행 결과가 같다)
    "compression": "snappy",
    "protect_bronze": True,        # 실행 시 bronze parquet 를 읽기 전용 속성으로 설정
    "protect_silver": True,        # 만든 silver parquet 도 읽기 전용으로 (다음 단계는 읽기만)
    "change_examples": 1,          # 변경 내역에 남길 '변경 전 → 후' 예시 수 (컬럼별)
}
