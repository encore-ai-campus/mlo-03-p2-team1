"""표준 사전(metadata/std_*.csv) 읽기와 검증.

- std_suffix.csv : 접미사 → 허용 타입      (예: _NUM → INT64 / FLOAT64)
- std_word.csv   : 표준 단어 목록           (예: DEAL = 거래)
- std_domain.csv : 변환 규칙 → 결과 타입    (예: MANWON → INT64)
- std_term.csv   : 원천 컬럼 → 표준 컬럼 + 규칙 (한 줄 = 변환 하나)

사전에 형식 오류가 하나라도 있으면 아무것도 변환하지 않고 멈춘다.
"""
from __future__ import annotations

import fnmatch
import re
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from common.std_rules import MULTI_SOURCE_RULES, Rule, parse_rule

TERM_COLUMNS = ["dataset", "file_glob", "source_column", "standard_column",
                "korean_name", "type", "rule", "description"]
STD_NAME = re.compile(r"^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$")
COMMON_DATASET = "*"       # 모든 데이터셋에 붙는 줄 (원천 추적 컬럼)


@dataclass(frozen=True)
class Term:
    """std_term.csv 한 줄."""
    line_no: int
    dataset: str
    file_glob: str
    sources: tuple[str, ...]
    target: str
    korean_name: str
    dtype: str
    rule: Rule

    def applies_to(self, file_name: str, columns: set[str]) -> bool:
        glob_ok = fnmatch.fnmatch(file_name, self.file_glob)
        has_sources = all(source in columns for source in self.sources)
        return glob_ok and has_sources


def _read_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"표준 사전 파일이 없습니다: {path}")
    return pd.read_csv(path, dtype=str, keep_default_na=False, encoding="utf-8-sig")


def load_terms(metadata_dir: Path) -> list[Term]:
    """std_*.csv 4개를 읽고 검증한 뒤 Term 목록을 돌려준다."""
    suffix_df = _read_csv(metadata_dir / "std_suffix.csv")
    word_df = _read_csv(metadata_dir / "std_word.csv")
    domain_df = _read_csv(metadata_dir / "std_domain.csv")
    term_df = _read_csv(metadata_dir / "std_term.csv")

    suffix_types = {
        row.suffix: {t.strip() for t in row.storage_type.split("/")}
        for row in suffix_df.itertuples()
    }
    words = set(word_df["word"]) | {s.lstrip("_") for s in suffix_types}
    domain_types = dict(zip(domain_df["rule"], domain_df["result_type"]))

    if list(term_df.columns) != TERM_COLUMNS:
        raise ValueError(f"std_term.csv 머리글은 {TERM_COLUMNS} 이어야 합니다 (현재 {list(term_df.columns)})")

    terms: list[Term] = []
    errors: list[str] = []
    for i, row in enumerate(term_df.itertuples(index=False), start=2):   # 1행은 머리글
        where = f"std_term.csv {i}행 ({row.dataset}.{row.standard_column})"
        target = row.standard_column

        try:
            rule = parse_rule(row.rule)
        except ValueError as exc:
            errors.append(f"{where}: {exc}")
            continue

        if not STD_NAME.match(target):
            errors.append(f"{where}: 표준 컬럼명은 영문 대문자·숫자를 _ 로 이은 형식이어야 합니다")

        suffix = next((s for s in suffix_types if target.endswith(s)), None)
        if suffix is None:
            errors.append(f"{where}: 접미사가 std_suffix.csv 에 없습니다")
        elif row.type not in suffix_types[suffix]:
            errors.append(f"{where}: {suffix} 의 타입은 {sorted(suffix_types[suffix])} 중 하나 (현재 {row.type})")

        unknown_words = [w for w in target.split("_") if w not in words]
        if unknown_words:
            errors.append(f"{where}: std_word.csv 에 없는 단어 {unknown_words}")

        if rule.name not in domain_types:
            errors.append(f"{where}: 규칙 {rule.name} 이 std_domain.csv 에 없습니다")
        elif domain_types[rule.name] != row.type:
            errors.append(f"{where}: 규칙 {rule.text} 의 결과 타입은 {domain_types[rule.name]} (사전 타입 {row.type})")

        sources = tuple(s.strip() for s in row.source_column.split("+"))
        if len(sources) > 1 and rule.name not in MULTI_SOURCE_RULES:
            errors.append(f"{where}: 원천 컬럼 여러 개(a+b)는 {sorted(MULTI_SOURCE_RULES)} 규칙에서만 쓸 수 있습니다")
        if rule.name == "YMD" and len(sources) != 3:
            errors.append(f"{where}: YMD 규칙은 원천 컬럼 3개(년+월+일)가 필요합니다")

        terms.append(Term(i, row.dataset, row.file_glob or "*", sources, target,
                          row.korean_name, row.type, rule))

    if errors:
        raise ValueError("표준 사전 형식 오류:\n  " + "\n  ".join(errors))
    return terms


def terms_for_file(terms: list[Term], dataset: str, file_name: str, columns: list[str]) -> list[Term]:
    """bronze 파일 하나에 적용할 사전 줄 (데이터셋 줄 → 공통 줄 순서).

    bronze 컬럼 중 사전에 없는 것이 있거나, 같은 표준 컬럼이 두 번 나오면 오류.
    """
    column_set = set(columns)
    dataset_terms = [t for t in terms if t.dataset == dataset]
    if not dataset_terms:
        raise KeyError(f"std_term.csv 에 데이터셋 '{dataset}' 줄이 없습니다")

    common_terms = [t for t in terms if t.dataset == COMMON_DATASET]
    picked = [t for t in dataset_terms + common_terms if t.applies_to(file_name, column_set)]

    used_sources = {source for t in picked for source in t.sources}
    missing = [c for c in columns if c not in used_sources]
    if missing:
        raise ValueError(f"{dataset}/{file_name}: 사전에 없는 원천 컬럼 {missing}")

    seen: dict[str, Term] = {}
    for t in picked:
        if t.target in seen:
            raise ValueError(f"{dataset}/{file_name}: 표준 컬럼 '{t.target}' 이 두 번 정의됨 "
                             f"(std_term.csv {seen[t.target].line_no}행, {t.line_no}행)")
        seen[t.target] = t
    return picked
