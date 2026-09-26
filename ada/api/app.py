from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from ada.core.briefing import BriefingService
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


app = FastAPI(title="ADA Personal Operating Agent", version="0.1.0", lifespan=lifespan)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=20000)


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    due_at: str | None = None
    notes: str = ""


class ApprovalDecision(BaseModel):
    approved: bool


@app.get("/health")
async def health():
    return {"ok": True, "ollama": await runtime.llm.health(), "version": "0.1.0"}


@app.post("/v1/chat")
async def chat(req: ChatRequest):
    return await runtime.orchestrator.chat(req.message)


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
