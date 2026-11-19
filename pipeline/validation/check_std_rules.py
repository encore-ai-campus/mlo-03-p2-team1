"""표준 변환 규칙(pipeline/common/std_rules.py) 단위 검사.

사용법
  python pipeline/validation/check_std_rules.py

규칙을 고치면 이 파일을 실행해서 예시가 모두 맞는지 확인한다. 하나라도 틀리면 종료 코드 1.
"""
from __future__ import annotations

import sys
from datetime import date, time
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # pipeline/ → from common import ...

from common.std_rules import apply_rule, parse_rule


def run(rule_text: str, *columns: list[str]) -> tuple[list, list]:
    series = [pd.Series(values, dtype=object) for values in columns]
    result, failed = apply_rule(parse_rule(rule_text), series)
    values = [None if pd.isna(v) else v for v in result]
    return values, list(failed)


def as_dates(values: list) -> list:
    return [None if v is None else v.date() for v in values]


# (설명, 규칙, 입력 컬럼들, 기대 결과, 기대 실패 여부)
CASES = [
    ("TRIM 공백 정리", "TRIM", [[" a ", "  ", ""]], ["a", None, None], [False, False, False]),
    ("TEXT 연속 공백", "TEXT", [["서울  중구 "]], ["서울 중구"], [False]),
    ("NAME 전각 → 반각", "NAME", [["세븐１４호점（본점）"]], ["세븐14호점(본점)"], [False]),
    ("CODE 대문자", "CODE", [[" i2 "]], ["I2"], [False]),
    ("CODE(5) 0 채움", "CODE(5)", [["6035", "06035", "123456"]], ["06035", "06035", "123456"], [False] * 3),
    ("CONCAT", "CONCAT", [["11680", "11680", ""], ["10300", "", ""]],
     ["1168010300", None, None], [False, True, False]),
    ("TEL", "TEL", [["0212345678", "031 123 4567", "15881234", "-"]],
     ["02-1234-5678", "031-123-4567", "1588-1234", None], [False, False, False, False]),
    ("INT", "INT", [["0004", "1,200", "1.5", "abc", ""]], [4, 1200, None, None, None],
     [False, False, True, True, False]),
    ("MANWON 만원 → 원", "MANWON", [["82,000"]], [820_000_000], [False]),
    ("FLOOR", "FLOOR", [["12", "-1", "B2", "지"]], [12, -1, -2, None], [False, False, False, True]),
    ("FLOAT(2)", "FLOAT(2)", [["1,234.567", "0E-9", "x"]], [1234.57, 0.0, None], [False, False, True]),
    ("YN 기본", "YN(Y;N)", [["Y", "N", "", "?"]], [True, False, None, None], [False, False, False, True]),
    ("YN BLANK", "YN(O;BLANK)", [["O", ""]], [True, False], [False, False]),
    ("HHMM", "HHMM", [["900", "1830", "0", "2400", "2410"]],
     [time(9, 0), time(18, 30), None, time(23, 59, 59), None], [False, False, False, False, True]),
]

DATE_CASES = [
    ("DATE 끝 공백", "DATE(%Y-%m-%d)", [["2015-06-29   ", "2006-02-29", ""]],
     [date(2015, 6, 29), None, None], [False, True, False]),
    ("DATE yy.mm.dd", "DATE(%y.%m.%d)", [["25.06.02"]], [date(2025, 6, 2)], [False]),
    ("YMD", "YMD", [["2011", "2011"], ["1", "2"], ["3", "30"]], [date(2011, 1, 3), None], [False, True]),
    ("TERM_BGN", "TERM_BGN(%y.%m)", [["25.02~27.02", "~26.05"]], [date(2025, 2, 1), None], [False, True]),
    ("TERM_END", "TERM_END(%y.%m)", [["25.02~27.02", "~26.05"]], [date(2027, 2, 1), date(2026, 5, 1)], [False, False]),
]


def main() -> int:
    wrong = 0
    for title, rule_text, columns, expected, expected_failed in CASES + DATE_CASES:
        values, failed = run(rule_text, *columns)
        if (title, rule_text, columns, expected, expected_failed) in DATE_CASES:
            values = as_dates(values)
        ok = values == expected and failed == expected_failed
        if not ok:
            wrong += 1
            print(f"✗ {title} ({rule_text})\n    결과 {values} / 실패 {failed}\n    기대 {expected} / 실패 {expected_failed}")
    total = len(CASES) + len(DATE_CASES)
    print(f"규칙 검사: {total - wrong}/{total} 통과")
    return 0 if wrong == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
