from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ada.core.briefing import BriefingService
from ada.core.doctor import run_doctor
from ada.core.runtime import Runtime
from ada.core.scheduler import AdaScheduler

runtime = Runtime()
scheduler = AdaScheduler(runtime)
briefing_service = BriefingService(runtime)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    yield
    scheduler.stop()


app = FastAPI(title="ADA Personal Operating Agent", version="0.2.0", lifespan=lifespan)

API_TOKEN = runtime.settings.api_token


@app.middleware("http")
async def require_api_token(request: Request, call_next):
    if API_TOKEN and request.url.path.startswith("/v1/"):
        auth = request.headers.get("authorization", "")
        if auth != f"Bearer {API_TOKEN}":
            return JSONResponse({"detail": "Unauthorized"}, status_code=401)
    return await call_next(request)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=20000)


class ToolExecute(BaseModel):
    tool: str = Field(min_length=1, max_length=100)
    args: dict[str, Any] = Field(default_factory=dict)


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    due_at: str | None = None
    notes: str = ""


class ApprovalDecision(BaseModel):
    approved: bool


class AudioTranscribe(BaseModel):
    audio_base64: str = Field(min_length=16, max_length=70_000_000)
    mime: str = Field(default="audio/webm", max_length=50)


@app.get("/health")
async def health():
    return {"ok": True, "ollama": await runtime.llm.health(), "version": "0.2.0"}


@app.get("/v1/doctor")
async def doctor():
    return await run_doctor(runtime)


@app.post("/v1/chat")
async def chat(req: ChatRequest):
    return await runtime.orchestrator.chat(req.message)


@app.post("/v1/tools/execute")
async def execute_tool(req: ToolExecute):
    return await runtime.tools.execute(req.tool, req.args, actor="api")


@app.get("/v1/approvals")
def list_approvals(status: str = "pending", limit: int = 100):
    return runtime.db.list_approvals(None if status == "all" else status, limit)


@app.get("/v1/tasks")
def tasks():
    return runtime.db.list_tasks()


@app.post("/v1/tasks")
def create_task(req: TaskCreate):
    return runtime.db.add_task(req.title, req.due_at, req.notes)


@app.post("/v1/tasks/{task_id}/complete")
def complete_task(task_id: str):
    try:
        return runtime.db.complete_task(task_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Task not found")


@app.get("/v1/briefing")
async def briefing():
    return {"text": await briefing_service.generate(), "sources": await briefing_service.collect()}


@app.post("/v1/speech/transcribe")
async def speech_transcribe(req: AudioTranscribe):
    import base64
    import tempfile

    try:
        audio_bytes = base64.b64decode(req.audio_base64, validate=True)
    except Exception as exc:  # noqa: BLE001 - malformed client payload is not a server failure
        return {"ok": False, "error": f"Invalid audio payload: {exc}"}
    if len(audio_bytes) > 50_000_000:
        return {"ok": False, "error": "Audio too large (max 50 MB)."}
    if not audio_bytes:
        return {"ok": False, "error": "Empty audio payload."}

    ext = "webm" if "webm" in req.mime else "ogg" if "ogg" in req.mime else "wav"
    try:
        from ada.voice.stt import FasterWhisperSTT

        settings = runtime.settings
        service = FasterWhisperSTT(
            settings.whisper_model,
            settings.whisper_device,
            settings.whisper_compute_type,
            settings.whisper_fallback_cpu,
        )
        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as fd:
            fd.write(audio_bytes)
            fd.flush()
            temp_path = Path(fd.name)
        try:
            text = service.transcribe_wav(str(temp_path))
        finally:
            temp_path.unlink(missing_ok=True)
        return {"ok": True, "text": text}
    except ModuleNotFoundError as exc:
        name = str(exc).lower()
        if "faster_whisper" in name or "ctranslate2" in name:
            return {"ok": False, "error": "Voice dependencies missing. Run: pip install -e .[voice]"}
        raise
    except ImportError:
        return {"ok": False, "error": "Voice dependencies missing. Run: pip install -e .[voice]"}
    except Exception as exc:  # noqa: BLE001 - transcription failure is reported to the caller
        return {"ok": False, "error": f"Transcription failed: {exc}"}


@app.post("/v1/approvals/{approval_id}")
async def approval(approval_id: str, req: ApprovalDecision):
    try:
        record = runtime.db.resolve_approval(approval_id, req.approved)
    except KeyError:
        raise HTTPException(status_code=404, detail="Approval not found")
    if not req.approved:
        return record
    execution = await runtime.tools.execute_approved(approval_id)
    return {"approval": record, "execution": execution}
