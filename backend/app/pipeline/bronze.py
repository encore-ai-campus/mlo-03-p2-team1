import hashlib
import re
from pathlib import Path
from shutil import copyfile
from xml.etree import ElementTree

from .runner import run_stage


def markers(source: Path) -> dict[str, int]:
    trade = source / "api" / "apt_trade"
    completed = {
        path.relative_to(trade).as_posix(): int(path.read_text(encoding="utf-8"))
        for path in sorted(trade.glob("*/_done_*"))
        if path.is_file() and re.fullmatch(r"\d{6}", path.parent.name)
        and re.fullmatch(r"_done_\d{5}", path.name)
    }
    if any(rows < 0 for rows in completed.values()):
        raise ValueError("완료 표시의 행 수는 음수일 수 없습니다")
    return completed


def copy_input(source: Path, destination: Path) -> None:
    if destination.exists():
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".part")
    try:
        copyfile(source, temporary)
        with source.open("rb") as original, temporary.open("rb") as copied:
            if hashlib.file_digest(original, "sha256").digest() != hashlib.file_digest(copied, "sha256").digest():
                raise ValueError(f"{source.name}: 원천과 복사본 SHA-256 불일치")
        temporary.replace(destination)
    finally:
        temporary.unlink(missing_ok=True)


def run(workspace: Path, source: Path, completed: dict[str, int], datasets: list[str]) -> None:
    trade = source / "api" / "apt_trade"
    staged = workspace / "data" / "source" / "api" / "apt_trade"
    selected: list[Path] = []
    for marker, expected in completed.items():
        month, done = marker.split("/")
        prefix = f"apt_trade__{done.removeprefix('_done_')}_{month}__p"
        pages = sorted((trade / month).glob(f"{prefix}*.xml"))
        numbers = sorted(int(path.stem.removeprefix(prefix)) for path in pages)
        if not pages or numbers != list(range(1, len(pages) + 1)):
            raise ValueError(f"{marker}: XML 페이지 누락 또는 중복")
        rows = 0
        for path in pages:
            try:
                page = ElementTree.parse(path).getroot()
            except ElementTree.ParseError as exc:
                raise ValueError(f"{path.name}: XML 파싱 실패") from exc
            if int(page.findtext(".//totalCount", "-1")) != expected:
                raise ValueError(f"{marker}: API 총건수와 완료 표시 불일치")
            rows += len(page.findall(".//items/item"))
        if rows != expected:
            raise ValueError(f"{marker}: XML 행 수와 완료 표시 불일치")
        selected.extend(pages)

    candidates = {staged / path.relative_to(trade) for path in selected}
    if set(staged.rglob("*.xml")) - candidates:
        raise ValueError("이전에 복사한 XML의 수집 완료 표시가 누락됐습니다")
    for path in selected:
        copy_input(path, staged / path.relative_to(trade))

    ldong = source / "files" / "ldong_code"
    for path in ldong.glob("*"):
        if path.is_file():
            copy_input(path, workspace / "data" / "source" / "files" / "ldong_code" / path.name)
    run_stage(workspace, "pipeline/bronze/01_bronze.py", "--dataset", *datasets)
