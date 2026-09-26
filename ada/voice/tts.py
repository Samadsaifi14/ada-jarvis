from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path


class PiperTTS:
    def __init__(self, executable: str = "piper", model: str = ""):
        self.executable = executable
        self.model = model

    def synthesize(self, text: str, output_path: str | None = None) -> str:
        if not self.model:
            raise RuntimeError("ADA_PIPER_MODEL is not configured")
        if output_path is None:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as fd:
                output_path = fd.name
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        proc = subprocess.run(
            [self.executable, "--model", self.model, "--output_file", output_path],
            input=text,
            text=True,
            capture_output=True,
            timeout=120,
            shell=False,
            check=False,
        )
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or "Piper failed")
        return output_path
