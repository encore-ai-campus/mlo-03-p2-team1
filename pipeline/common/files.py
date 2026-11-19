"""파일 안전 장치. 입력은 읽기만 하고, 결과는 내용이 바뀔 때만 교체한다.

- sha256_file      : 파일 SHA-256
- snapshot_files   : 폴더 안 파일들의 SHA-256 목록 (실행 전후 비교 → 입력 불변 확인)
- protect_read_only: 읽기 전용 속성 걸기
- replace_if_changed: 임시 파일과 기존 파일이 같으면 기존 파일을 그대로 둔다 (재실행 동일성)
"""
from __future__ import annotations

import hashlib
import os
import stat
from collections.abc import Iterable
from pathlib import Path

from common.paths import relative


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fp:
        for block in iter(lambda: fp.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def snapshot_files(paths: Iterable[Path]) -> dict[str, str]:
    """{프로젝트 기준 경로: SHA-256}. 실행 전후 두 번 만들어 같은지 비교한다."""
    return {relative(p): sha256_file(p) for p in sorted(paths, key=lambda p: p.as_posix())}


def protect_read_only(paths: Iterable[Path]) -> int:
    """쓰기 권한을 없앤다 (Windows 에서는 '읽기 전용' 속성). 이번에 바꾼 파일 수를 돌려준다."""
    changed = 0
    for path in paths:
        mode = path.stat().st_mode
        if mode & stat.S_IWRITE:
            os.chmod(path, mode & ~(stat.S_IWRITE | stat.S_IWGRP | stat.S_IWOTH))
            changed += 1
    return changed


def replace_if_changed(temp: Path, out: Path) -> tuple[str, str]:
    """temp 를 out 으로 옮긴다. 내용이 같으면 temp 를 지우고 out 을 그대로 둔다.

    돌려주는 값: (status, sha256)  status = created | updated | unchanged
    """
    new_sha = sha256_file(temp)
    if out.exists() and sha256_file(out) == new_sha:
        temp.unlink()
        return "unchanged", new_sha
    status = "updated" if out.exists() else "created"
    os.replace(temp, out)
    return status, new_sha
