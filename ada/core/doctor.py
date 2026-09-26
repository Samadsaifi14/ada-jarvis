from __future__ import annotations

import shutil
from pathlib import Path

import httpx

from ada.core.runtime import Runtime
from ada.voice.io import AudioIO


async def run_doctor(runtime: Runtime) -> dict:
    s = runtime.settings
    checks: dict[str, dict] = {}

    checks["ollama"] = {
        "ok": await runtime.llm.health(),
        "url": s.llm_base_url,
        "model": s.llm_model,
    }

    piper_path = shutil.which(s.piper_exe) if s.piper_exe else None
    if not piper_path and s.piper_exe:
        candidate = Path(s.piper_exe)
        if candidate.exists():
            piper_path = str(candidate.resolve())
    checks["piper"] = {
        "ok": bool(piper_path and s.piper_model and Path(s.piper_model).exists()),
        "executable": piper_path,
        "model": s.piper_model or None,
    }

    try:
        devices = AudioIO.devices()
        inputs = [x for x in devices if x["inputs"] > 0]
        outputs = [x for x in devices if x["outputs"] > 0]
        checks["audio"] = {
            "ok": bool(inputs and outputs),
            "input_devices": inputs,
            "output_devices": outputs,
        }
    except Exception as exc:
        checks["audio"] = {"ok": False, "error": str(exc)}

    checks["google"] = {
        "ok": s.google_token.exists(),
        "token": str(s.google_token),
        "write_enabled": s.google_write_enabled,
    }
    checks["github"] = {
        "ok": bool(s.github_token),
        "repos": s.github_repo_list,
    }

    async def ping(name: str, url: str) -> None:
        try:
            async with httpx.AsyncClient(timeout=3) as client:
                response = await client.get(url)
            checks[name] = {"ok": response.status_code < 500, "status": response.status_code}
        except Exception as exc:
            checks[name] = {"ok": False, "error": str(exc)}

    await ping("n8n", s.n8n_base_url)
    await ping("home_assistant", s.home_assistant_url)

    checks["overall"] = {
        "core_ready": checks["ollama"]["ok"],
        "voice_ready": checks.get("audio", {}).get("ok", False) and checks["piper"]["ok"],
    }
    return checks
