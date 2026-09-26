from __future__ import annotations

import asyncio
import typer
import uvicorn
from rich import print
from rich.table import Table

from ada.api.app import runtime
from ada.core.briefing import BriefingService

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
