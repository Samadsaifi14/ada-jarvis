from __future__ import annotations

import asyncio

import typer
import uvicorn
from rich import print
from rich.table import Table

from ada.api.app import runtime
from ada.core.briefing import BriefingService
from ada.core.doctor import run_doctor
from ada.voice.io import AudioIO
from ada.voice.loop import VoiceLoop

app = typer.Typer(help="ADA personal operating agent")


@app.command()
def serve(host: str | None = None, port: int | None = None):
    """Run the local ADA API and scheduler."""
    settings = runtime.settings
    uvicorn.run("ada.api.app:app", host=host or settings.host, port=port or settings.port, reload=False)


@app.command()
def chat(message: str):
    """Talk to ADA from the terminal."""
    result = asyncio.run(runtime.orchestrator.chat(message))
    print(result["text"])
    if result.get("pending_approvals"):
        print({"pending_approvals": result["pending_approvals"]})


@app.command()
def voice(
    seconds: float = typer.Option(6.0, min=1.0, max=30.0, help="Recording duration per turn."),
    no_speak: bool = typer.Option(False, help="Do not synthesize/play ADA's response."),
):
    """Run the interactive microphone -> Whisper -> ADA -> Piper loop."""
    VoiceLoop(runtime).run(seconds=seconds, speak=not no_speak)


@app.command("voice-once")
def voice_once(
    seconds: float = typer.Option(6.0, min=1.0, max=30.0),
    no_speak: bool = typer.Option(False),
):
    """Record one microphone turn, transcribe it and ask ADA."""
    result = asyncio.run(VoiceLoop(runtime).once(seconds=seconds, speak=not no_speak))
    if result.get("transcript"):
        print(f"[bold]You:[/bold] {result['transcript']}")
    print(f"[bold]ADA:[/bold] {result.get('text', '')}")
    if result.get("pending_approvals"):
        print({"pending_approvals": result["pending_approvals"]})


@app.command("audio-devices")
def audio_devices():
    """List microphone/speaker devices visible to ADA."""
    table = Table("Index", "Device", "Inputs", "Outputs")
    for item in AudioIO.devices():
        table.add_row(str(item["index"]), item["name"], str(item["inputs"]), str(item["outputs"]))
    print(table)


@app.command()
def doctor():
    """Check Ollama, audio, Piper and optional integrations."""
    checks = asyncio.run(run_doctor(runtime))
    table = Table("Layer", "Ready", "Details")
    for name, value in checks.items():
        if name == "overall":
            continue
        ok = bool(value.get("ok"))
        details = {k: v for k, v in value.items() if k != "ok"}
        table.add_row(name, "YES" if ok else "NO", str(details))
    print(table)
    print({"overall": checks["overall"]})


@app.command("task-add")
def task_add(title: str, due: str | None = None, notes: str = ""):
    print(runtime.db.add_task(title, due, notes))


@app.command("task-list")
def task_list():
    table = Table("ID", "Title", "Due", "Status")
    for item in runtime.db.list_tasks():
        table.add_row(item["id"][:8], item["title"], item["due_at"] or "-", item["status"])
    print(table)


@app.command()
def briefing():
    print(asyncio.run(BriefingService(runtime).generate()))


if __name__ == "__main__":
    app()
