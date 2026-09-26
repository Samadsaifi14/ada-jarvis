from __future__ import annotations

import os
import shlex
import subprocess
import webbrowser
from pathlib import Path
from typing import Any

from ada.config import Settings

SAFE_COMMAND_PREFIXES = (
    ("git", "status"),
    ("git", "log"),
    ("git", "diff"),
    ("pytest",),
    ("python", "-m", "pytest"),
    ("npm", "test"),
    ("npm", "run", "test"),
)


class SystemTools:
    def __init__(self, settings: Settings):
        self.settings = settings

    def open_app(self, app: str) -> str:
        normalized = app.strip().lower()
        if normalized not in self.settings.app_allowlist:
            raise PermissionError(f"Application is not allow-listed: {app}")
        if os.name == "nt":
            subprocess.Popen(["cmd", "/c", "start", "", app], shell=False)
        else:
            subprocess.Popen([app])
        return f"Opened {app}"

    def open_url(self, url: str) -> str:
        if not url.startswith(("https://", "http://")):
            raise ValueError("Only http(s) URLs are allowed")
        webbrowser.open(url)
        return url

    def read_text(self, path: str, max_chars: int = 20000) -> str:
        target = Path(os.path.expandvars(path)).expanduser().resolve()
        if not any(target == root or root in target.parents for root in self.settings.root_paths):
            raise PermissionError("Path is outside ADA_ALLOWED_ROOTS")
        if target.stat().st_size > 2_000_000:
            raise ValueError("File too large for direct read")
        return target.read_text(encoding="utf-8", errors="replace")[:max_chars]

    def safe_command(self, command: str, cwd: str | None = None) -> dict[str, Any]:
        if not self.settings.allow_safe_commands:
            raise PermissionError("Safe command execution is disabled")
        parts = shlex.split(command, posix=os.name != "nt")
        lowered = tuple(x.lower() for x in parts)
        if not any(lowered[: len(prefix)] == prefix for prefix in SAFE_COMMAND_PREFIXES):
            raise PermissionError("Command is not in ADA's diagnostic allow-list")
        workdir = None
        if cwd:
            candidate = Path(os.path.expandvars(cwd)).expanduser().resolve()
            if not any(candidate == root or root in candidate.parents for root in self.settings.root_paths):
                raise PermissionError("cwd is outside ADA_ALLOWED_ROOTS")
            workdir = str(candidate)
        proc = subprocess.run(parts, cwd=workdir, capture_output=True, text=True, timeout=120, shell=False, check=False)
        return {
            "returncode": proc.returncode,
            "stdout": proc.stdout[-12000:],
            "stderr": proc.stderr[-12000:],
        }
