"""원천 읽기 (00 inventory · 01 bronze 가 같이 쓴다). 원천은 열기만 하고 압축도 풀지 않는다.

- load_datasets    : metadata/ds_dataset.csv → 데이터셋 정의 목록 (형식 검증 포함)
- list_units       : 데이터셋 하나의 원천 단위 목록 (파일 1개, 또는 zip 안쪽 파일 1개 = 단위 1개)
- read_chunks      : 원천 단위 → 문자열 DataFrame 묶음 (값은 바꾸지 않음, 결측은 빈 문자열)
- count_source_rows: pandas 와 다른 방법(csv 모듈, XML 태그 개수)으로 센 원천 행 수
"""
from __future__ import annotations

import codecs
import csv
import fnmatch
import io
import re
import sys
import zipfile
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from xml.etree import ElementTree

import pandas as pd

from common.paths import SOURCE_DIR, SOURCE_LABEL

DATASET_COLUMNS = ["dataset", "title", "kind", "source", "zip_member", "encoding", "encoding_errors", "sep",
                   "item_path", "output", "done_marker", "enabled", "description"]
KINDS = {"csv", "xml"}
OUTPUTS = {"per_file", "combined", "per_dir"}

# 수집기(00 단계)가 계속 갱신하는 메타 파일. 원천 데이터가 아니므로 읽지도 잠그지도 않는다.
SOURCE_META_FILES = {".gitkeep", "README.md", "SOURCE_README.md", "_source_manifest.csv",
                     "_collect_log.csv", "_seoul_collect_log.csv"}
SOURCE_DATA_DIRS = ("files", "api")       # 원천 데이터가 있는 하위 폴더 (logs/ 등은 제외)

csv.field_size_limit(sys.maxsize if sys.maxsize < 2**31 else 2**31 - 1)


# ──────────────────────────────────────────────────────────────
# 데이터셋 정의
# ──────────────────────────────────────────────────────────────
@dataclass(frozen=True)
class Dataset:
    name: str
    title: str
    kind: str              # csv | xml
    source: str            # data/source 기준 glob
    zip_member: str        # zip 안쪽 파일 glob (zip 이 아니면 빈 값)
    encoding: str          # auto | utf-8 | cp949 ...
    encoding_errors: str   # strict | replace
    sep: str               # csv 구분자
    item_path: str         # xml 에서 행 하나에 해당하는 요소 경로
    output: str            # per_file | combined | per_dir
    done_marker: str       # per_dir: 이 파일이 있는 폴더만 처리


def load_datasets(path: Path) -> list[Dataset]:
    """ds_dataset.csv 를 읽고 형식을 검사한다. enabled=Y 인 줄만 돌려준다. 틀린 줄이 있으면 ValueError."""
    table = pd.read_csv(path, dtype=str, keep_default_na=False, encoding="utf-8-sig")
    if list(table.columns) != DATASET_COLUMNS:
        raise ValueError(f"{path.name}: 헤더가 다릅니다. 기대: {', '.join(DATASET_COLUMNS)}")

    errors, datasets = [], []
    for line_no, row in enumerate(table.itertuples(index=False), start=2):
        where = f"{path.name} {line_no}행 ({row.dataset})"
        if row.kind not in KINDS:
            errors.append(f"{where}: kind 는 {sorted(KINDS)} 중 하나")
        if row.output not in OUTPUTS:
            errors.append(f"{where}: output 은 {sorted(OUTPUTS)} 중 하나")
        if row.enabled not in ("Y", "N"):
            errors.append(f"{where}: enabled 는 Y / N")
        if row.kind == "csv" and not row.sep:
            errors.append(f"{where}: csv 는 sep 이 필요")
        if row.kind == "xml" and not row.item_path:
            errors.append(f"{where}: xml 은 item_path 가 필요")
        if row.output == "per_dir" and not row.done_marker:
            errors.append(f"{where}: per_dir 은 done_marker 가 필요")
        if row.enabled != "Y":
            continue
        datasets.append(Dataset(
            name=row.dataset, title=row.title, kind=row.kind, source=row.source, zip_member=row.zip_member,
            encoding=row.encoding or "auto", encoding_errors=row.encoding_errors or "strict",
            sep=row.sep.replace("\\t", "\t"), item_path=row.item_path, output=row.output,
            done_marker=row.done_marker,
        ))
    names = [d.name for d in datasets]
    duplicated = sorted({n for n in names if names.count(n) > 1})
    if duplicated:
        errors.append(f"{path.name}: 데이터셋 이름 중복 {duplicated}")
    if errors:
        raise ValueError("데이터셋 정의 오류:\n  " + "\n  ".join(errors))
    return datasets


# ──────────────────────────────────────────────────────────────
# 원천 단위
# ──────────────────────────────────────────────────────────────
@dataclass
class SourceUnit:
    dataset: Dataset
    path: Path                 # 원천 파일 (zip 이면 zip 파일)
    member: str | None = None  # zip 안쪽 파일 이름
    encoding: str = "-"        # csv 를 실제로 읽은 인코딩 (auto 판별 결과)

    @property
    def source_id(self) -> str:
        """_source_file 값. 예) Source/files/ldong_code/법정동코드 전체자료.zip!/법정동코드 전체자료.txt"""
        text = labeled_path(self.path)
        if self.member:
            text += f"!/{self.member}"
        return text

    @property
    def detail(self) -> str:
        """출력 파일 세부 이름: zip 안쪽 파일(또는 원천 파일) 이름에서 확장자를 뺀 것."""
        name = self.member or self.path.name
        return safe_name(Path(name).stem)


def labeled_path(path: Path) -> str:
    """원천 경로 표기: 'Source/' + data/source 기준 경로. bronze 의 _source_file, 수집 로그, 원천 목록이 같은 표기를 쓴다.
    예) data/source/api/clinic/20261119/x.xml → Source/api/clinic/20261119/x.xml"""
    return f"{SOURCE_LABEL}/{path.relative_to(SOURCE_DIR).as_posix()}"


def safe_name(text: str) -> str:
    """파일 이름에 쓸 수 없는 문자와 공백을 _ 로."""
    return re.sub(r'[\\/:*?"<>|\s]+', "_", text).strip("_")


def source_data_files() -> list[Path]:
    """원천 데이터 파일 전체 (메타 파일 제외). 실행 전후 비교와 읽기 전용 설정 대상."""
    files = []
    for sub in SOURCE_DATA_DIRS:
        folder = SOURCE_DIR / sub
        if folder.exists():
            files += [p for p in folder.rglob("*") if p.is_file() and p.name not in SOURCE_META_FILES]
    return sorted(files, key=lambda p: p.as_posix())


def list_units(ds: Dataset) -> list[SourceUnit]:
    """원천 단위 목록. 경로 → zip 안쪽 이름 순으로 정렬해서 재실행해도 순서가 같다."""
    paths = sorted((p for p in SOURCE_DIR.glob(ds.source) if p.is_file() and p.name not in SOURCE_META_FILES),
                   key=lambda p: p.as_posix())
    units = []
    for path in paths:
        if path.suffix.lower() != ".zip":
            units.append(SourceUnit(ds, path))
            continue
        with zipfile.ZipFile(path) as archive:
            members = sorted(info.filename for info in archive.infolist() if not info.is_dir())
        pattern = ds.zip_member or "*"
        units += [SourceUnit(ds, path, member) for member in members if fnmatch.fnmatch(member, pattern)]
    return units


@contextmanager
def open_binary(unit: SourceUnit):
    """원천 단위를 바이트 스트림으로 연다. zip 은 풀지 않고 안쪽 파일만 읽는다."""
    if unit.member is None:
        with open(unit.path, "rb") as fp:
            yield fp
    else:
        with zipfile.ZipFile(unit.path) as archive, archive.open(unit.member) as fp:
            yield fp


def resolve_encoding(unit: SourceUnit) -> str:
    """auto: BOM 이 있으면 utf-8-sig, 파일 전체가 UTF-8 로 읽히면 utf-8, 아니면 cp949."""
    ds = unit.dataset
    if ds.encoding != "auto":
        return ds.encoding
    decoder = codecs.getincrementaldecoder("utf-8")()
    with open_binary(unit) as fp:
        first = fp.read(1 << 20)
        if first.startswith(codecs.BOM_UTF8):
            return "utf-8-sig"
        try:
            block = first
            while block:
                decoder.decode(block)
                block = fp.read(1 << 20)
            decoder.decode(b"", final=True)
        except UnicodeDecodeError:
            return "cp949"
    return "utf-8"


@contextmanager
def open_text(unit: SourceUnit):
    with open_binary(unit) as fp:
        text = io.TextIOWrapper(fp, encoding=unit.encoding, errors=unit.dataset.encoding_errors, newline="")
        try:
            yield text
        finally:
            text.detach()


# ──────────────────────────────────────────────────────────────
# 읽기
# ──────────────────────────────────────────────────────────────
def read_chunks(unit: SourceUnit, chunksize: int) -> Iterator[pd.DataFrame]:
    """원천 단위 → DataFrame 묶음. 모든 값은 문자열 그대로, 결측은 빈 문자열."""
    if unit.dataset.kind == "csv":
        yield from _read_csv(unit, chunksize)
    else:
        yield _read_xml(unit)


def _read_csv(unit: SourceUnit, chunksize: int) -> Iterator[pd.DataFrame]:
    if unit.encoding == "-":
        unit.encoding = resolve_encoding(unit)
    with open_text(unit) as text:
        reader = pd.read_csv(text, sep=unit.dataset.sep, header=0, dtype=str, na_filter=False,
                             chunksize=chunksize)
        for chunk in reader:
            yield chunk.reset_index(drop=True)


def _read_xml(unit: SourceUnit) -> pd.DataFrame:
    """item 요소 하나 = 행 하나, 자식 요소 하나 = 열 하나. 열 순서는 파일 안에서 처음 나온 순서."""
    with open_binary(unit) as fp:
        root = ElementTree.parse(fp).getroot()
    records, columns = [], {}
    for item in root.findall(unit.dataset.item_path):
        record = {child.tag: child.text or "" for child in item}
        for tag in record:
            columns.setdefault(tag, None)
        records.append(record)
    # dtype 을 지정하지 않으면 pandas 기본 문자열 타입(str)이 된다. object 로 만들면 값은 같아도
    # 여러 묶음을 이어 붙일 때 parquet 페이지 나뉨이 달라져 기존 bronze 와 바이트가 달라진다.
    return pd.DataFrame(records, columns=list(columns)).fillna("")


def count_source_rows(unit: SourceUnit) -> int:
    """원천 행 수를 pandas 와 다른 방법으로 센다. csv: 헤더·빈 줄 제외 레코드 수, xml: item 태그 개수."""
    if unit.dataset.kind == "csv":
        if unit.encoding == "-":
            unit.encoding = resolve_encoding(unit)
        with open_text(unit) as text:
            records = sum(1 for row in csv.reader(text, delimiter=unit.dataset.sep) if row)
        return max(records - 1, 0)

    item_tag = unit.dataset.item_path.rsplit("/", 1)[-1]
    count = 0
    with open_binary(unit) as fp:
        for _, element in ElementTree.iterparse(fp, events=("end",)):
            if element.tag == item_tag:
                count += 1
    return count
