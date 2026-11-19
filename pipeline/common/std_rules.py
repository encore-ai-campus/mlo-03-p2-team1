"""표준 변환 규칙 (metadata/std_domain.csv 의 rule 하나 = 함수 하나).

모든 규칙은 같은 약속을 지킨다.
- 입력: 원천 값 문자열 Series 목록 (bronze 는 모든 값이 문자열. 결측은 빈 문자열 "")
- 출력: (변환 결과 Series, 변환 실패 여부 Series)
- 공백만 있는 값은 실패가 아니라 결측(NULL)이다.
- 원천에 값이 있었는데 규칙대로 바꾸지 못하면 결측 + 실패(True) 로 표시한다.
- 행 수는 절대 바꾸지 않는다.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import time

import pandas as pd

# 규칙 이름 → 결과 타입 (metadata/std_domain.csv 의 result_type 과 같아야 한다)
RULE_TYPES = {
    "TRIM": "STRING",
    "TEXT": "STRING",
    "NAME": "STRING",
    "CODE": "STRING",
    "CONCAT": "STRING",
    "TEL": "STRING",
    "INT": "INT64",
    "MANWON": "INT64",
    "FLOOR": "INT64",
    "FLOAT": "FLOAT64",
    "DATE": "DATE",
    "DATETIME": "DATETIME",
    "YMD": "DATE",
    "TERM_BGN": "DATE",
    "TERM_END": "DATE",
    "HHMM": "TIME",
    "YN": "BOOL",
}

# 여러 원천 컬럼을 받는 규칙 (원천 컬럼을 a+b+c 로 적는다)
MULTI_SOURCE_RULES = {"CONCAT", "YMD"}

BLANK_WORD = "BLANK"   # YN 규칙에서 '빈 값' 을 뜻하는 예약어


@dataclass(frozen=True)
class Rule:
    """파싱한 규칙. 예) 'FLOAT(2)' → Rule('FLOAT', ('2',))"""
    name: str
    args: tuple[str, ...] = ()
    text: str = ""

    @property
    def result_type(self) -> str:
        return RULE_TYPES[self.name]


def parse_rule(text: str) -> Rule:
    """'CODE(5)', 'DATE(%Y-%m-%d)', 'YN(Y;N)' 같은 규칙 문자열을 Rule 로 바꾼다."""
    match = re.fullmatch(r"([A-Z_]+)(?:\((.*)\))?", text.strip())
    if match is None:
        raise ValueError(f"규칙 형식이 아닙니다: '{text}'")

    name = match.group(1)
    arg_text = match.group(2)
    if name not in RULE_TYPES:
        raise ValueError(f"모르는 규칙입니다: '{name}' (std_domain.csv 에 있는 규칙만 쓸 수 있음)")

    if arg_text is None:
        args: tuple[str, ...] = ()
    elif name == "YN":
        args = tuple(arg_text.split(";"))     # 참 목록 ; 거짓 목록
    else:
        args = (arg_text,)

    needs_arg = {"FLOAT", "DATE", "DATETIME", "TERM_BGN", "TERM_END", "YN"}
    if name in needs_arg and not args:
        raise ValueError(f"'{name}' 규칙은 괄호 안 값이 필요합니다 (예: {name}(...))")
    if name == "YN" and len(args) != 2:
        raise ValueError(f"YN 규칙은 YN(참;거짓) 형식이어야 합니다: '{text}'")
    if name in {"FLOAT", "CODE"} and args and not args[0].isdigit():
        raise ValueError(f"'{name}' 괄호 안에는 숫자를 씁니다: '{text}'")

    return Rule(name, args, text.strip())


# ──────────────────────────────────────────────────────────────
# 공통 도우미
# ──────────────────────────────────────────────────────────────
def _blank_to_none(values: pd.Series) -> pd.Series:
    """빈 문자열을 결측(None)으로."""
    return values.where(values != "", None)


def _failed(raw: pd.Series, result: pd.Series) -> pd.Series:
    """원천에 값이 있었는데 결과가 결측이면 변환 실패."""
    has_value = raw.str.strip() != ""
    return has_value & result.isna()


def _to_number(raw: pd.Series) -> pd.Series:
    """'1,500' · ' 30 ' · '0E-9' → 숫자. 숫자가 아니면 NaN."""
    cleaned = raw.str.replace(",", "", regex=False).str.strip()
    return pd.to_numeric(cleaned.where(cleaned != ""), errors="coerce")


# 전각 영문·숫자·기호(！~～)와 전각 공백을 반각으로 바꾸는 표
_FULL_TO_HALF = {code: code - 0xFEE0 for code in range(0xFF01, 0xFF5F)}
_FULL_TO_HALF[0x3000] = 0x20


# ──────────────────────────────────────────────────────────────
# 문자열 규칙
# ──────────────────────────────────────────────────────────────
def rule_trim(raw: pd.Series) -> pd.Series:
    return _blank_to_none(raw.str.strip())


def rule_text(raw: pd.Series) -> pd.Series:
    one_space = raw.str.replace(r"\s+", " ", regex=True).str.strip()
    return _blank_to_none(one_space)


def rule_name(raw: pd.Series) -> pd.Series:
    half_width = raw.str.translate(_FULL_TO_HALF)
    return rule_text(half_width)


def rule_code(raw: pd.Series, width: int | None) -> pd.Series:
    code = raw.str.strip().str.upper()
    if width:
        is_short_number = code.str.fullmatch(r"\d+") & (code.str.len() < width)
        code = code.where(~is_short_number, code.str.zfill(width))
    return _blank_to_none(code)


def rule_concat(columns: list[pd.Series]) -> pd.Series:
    parts = [col.str.strip() for col in columns]
    joined = parts[0]
    all_filled = parts[0] != ""
    for part in parts[1:]:
        joined = joined + part
        all_filled = all_filled & (part != "")
    return joined.where(all_filled, None)


def _format_tel(digits: str) -> str | None:
    """숫자만 남은 전화번호 → 하이픈 표준형."""
    if digits == "":
        return None
    if digits.startswith("02") and len(digits) in (9, 10):          # 서울 02-123-4567 / 02-1234-5678
        return f"02-{digits[2:-4]}-{digits[-4:]}"
    if len(digits) == 8 and digits[:2] in ("15", "16", "18"):        # 대표번호 1588-1234
        return f"{digits[:4]}-{digits[4:]}"
    if len(digits) in (7, 8):                                       # 지역번호 없음 123-4567
        return f"{digits[:-4]}-{digits[-4:]}"
    if len(digits) in (10, 11):                                     # 031-123-4567 / 010-1234-5678
        return f"{digits[:3]}-{digits[3:-4]}-{digits[-4:]}"
    return digits                                                   # 자릿수가 맞지 않으면 숫자만 남긴다


def rule_tel(raw: pd.Series) -> pd.Series:
    digits = raw.str.replace(r"\D", "", regex=True)
    return digits.map(_format_tel)


# ──────────────────────────────────────────────────────────────
# 숫자 규칙
# ──────────────────────────────────────────────────────────────
def rule_int(raw: pd.Series) -> pd.Series:
    numbers = _to_number(raw)
    is_whole = numbers.notna() & (numbers == numbers.round())
    return numbers.where(is_whole).astype("Int64")


def rule_manwon(raw: pd.Series) -> pd.Series:
    return rule_int(raw) * 10_000


def rule_floor(raw: pd.Series) -> pd.Series:
    """'12' → 12, '-1' → -1, 'B1' → -1. '지', '반지층' 처럼 숫자가 아니면 결측."""
    text = raw.str.strip().str.upper()
    basement = text.str.extract(r"^B(\d+)$")[0]
    floor_text = text.where(~text.str.fullmatch(r"B\d+"), "-" + basement)
    floor_text = floor_text.where(floor_text.str.fullmatch(r"-?\d+"))
    return pd.to_numeric(floor_text, errors="coerce").astype("Int64")


def rule_float(raw: pd.Series, digits: int) -> pd.Series:
    return _to_number(raw).round(digits).astype("Float64")


# ──────────────────────────────────────────────────────────────
# 날짜·시간 규칙
# ──────────────────────────────────────────────────────────────
def rule_date(raw: pd.Series, fmt: str) -> pd.Series:
    text = raw.str.strip()
    dates = pd.to_datetime(text.where(text != ""), format=fmt, errors="coerce")
    return dates.dt.normalize()


def rule_datetime(raw: pd.Series, fmt: str) -> pd.Series:
    text = raw.str.strip()
    return pd.to_datetime(text.where(text != ""), format=fmt, errors="coerce")


def rule_ymd(columns: list[pd.Series]) -> pd.Series:
    year, month, day = (col.str.strip() for col in columns)
    all_filled = (year != "") & (month != "") & (day != "")
    text = year + "-" + month.str.zfill(2) + "-" + day.str.zfill(2)
    return pd.to_datetime(text.where(all_filled), format="%Y-%m-%d", errors="coerce")


def rule_term(raw: pd.Series, fmt: str, part: int) -> pd.Series:
    """'25.02~27.02' 같은 기간에서 시작(part=0) 또는 끝(part=1) 달의 1일."""
    pieces = raw.str.split("~", n=1, expand=True).reindex(columns=[0, 1])
    text = pieces[part].fillna("").str.strip()
    return pd.to_datetime(text.where(text != ""), format=fmt, errors="coerce")


def _to_time(hhmm: float) -> time | None:
    hour = int(hhmm) // 100
    minute = int(hhmm) % 100
    if hour == 24 and minute == 0:
        return time(23, 59, 59)          # 2400 = 하루 끝
    if hour < 24 and minute < 60:
        return time(hour, minute)
    return None


def rule_hhmm(raw: pd.Series) -> tuple[pd.Series, pd.Series]:
    """'900' → 09:00, '1830' → 18:30. '0' 은 진료 없음 → 결측(실패 아님)."""
    numbers = _to_number(raw)
    is_no_treatment = numbers == 0
    usable = numbers.where(numbers.notna() & ~is_no_treatment)
    result = usable.map(lambda v: None if pd.isna(v) else _to_time(v)).astype(object)
    failed = _failed(raw, result) & ~is_no_treatment
    return result, failed


def rule_yn(raw: pd.Series, true_text: str, false_text: str) -> tuple[pd.Series, pd.Series]:
    """YN(참;거짓). 목록은 쉼표로 여러 개. BLANK 는 빈 값을 뜻한다."""
    true_values = set(true_text.split(","))
    false_values = set(false_text.split(","))
    text = raw.str.strip()
    text_or_blank = text.where(text != "", BLANK_WORD)

    result = pd.Series(None, index=raw.index, dtype=object)
    result[text_or_blank.isin(true_values)] = True
    result[text_or_blank.isin(false_values)] = False

    has_value = text != ""
    failed = has_value & result.isna()
    return result, failed


# ──────────────────────────────────────────────────────────────
# 규칙 실행
# ──────────────────────────────────────────────────────────────
def apply_rule(rule: Rule, columns: list[pd.Series]) -> tuple[pd.Series, pd.Series]:
    """규칙 하나를 실행해 (결과, 실패 여부) 를 돌려준다."""
    raw = columns[0]
    name = rule.name
    arg = rule.args[0] if rule.args else None

    if name == "HHMM":
        return rule_hhmm(raw)
    if name == "YN":
        return rule_yn(raw, rule.args[0], rule.args[1])

    if name == "CONCAT":
        result = rule_concat(columns)
        filled = [col.str.strip() != "" for col in columns]
        any_filled = pd.concat(filled, axis=1).any(axis=1)
        return result, any_filled & result.isna()          # 일부만 비어 있으면 실패
    if name == "YMD":
        result = rule_ymd(columns)
        filled = [col.str.strip() != "" for col in columns]
        any_filled = pd.concat(filled, axis=1).any(axis=1)
        return result, any_filled & result.isna()

    if name == "TRIM":
        result = rule_trim(raw)
    elif name == "TEXT":
        result = rule_text(raw)
    elif name == "NAME":
        result = rule_name(raw)
    elif name == "CODE":
        result = rule_code(raw, int(arg) if arg else None)
    elif name == "TEL":
        result = rule_tel(raw)
        no_fail = pd.Series(False, index=raw.index)
        return result, no_fail                             # '-' 처럼 숫자가 없는 값은 실패가 아니라 결측
    elif name == "INT":
        result = rule_int(raw)
    elif name == "MANWON":
        result = rule_manwon(raw)
    elif name == "FLOOR":
        result = rule_floor(raw)
    elif name == "FLOAT":
        result = rule_float(raw, int(arg))
    elif name == "DATE":
        result = rule_date(raw, arg)
    elif name == "DATETIME":
        result = rule_datetime(raw, arg)
    elif name == "TERM_BGN":
        result = rule_term(raw, arg, part=0)
    elif name == "TERM_END":
        result = rule_term(raw, arg, part=1)
    else:
        raise ValueError(f"실행할 수 없는 규칙: {name}")

    return result, _failed(raw, result)
