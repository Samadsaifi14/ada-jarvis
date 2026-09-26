from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class Database:
    def __init__(self, path: Path | str):
        self.path = str(path)
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self.init()

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def init(self) -> None:
        with self.connection() as con:
            con.executescript(
                """
                CREATE TABLE IF NOT EXISTS memories (
                    id TEXT PRIMARY KEY,
                    kind TEXT NOT NULL,
                    content TEXT NOT NULL,
                    metadata_json TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    due_at TEXT,
                    status TEXT NOT NULL DEFAULT 'open',
                    source TEXT NOT NULL DEFAULT 'user',
                    notes TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS approvals (
                    id TEXT PRIMARY KEY,
                    action TEXT NOT NULL,
                    args_json TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    created_at TEXT NOT NULL,
                    resolved_at TEXT
                );
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts TEXT NOT NULL,
                    actor TEXT NOT NULL,
                    action TEXT NOT NULL,
                    risk TEXT NOT NULL,
                    status TEXT NOT NULL,
                    detail_json TEXT NOT NULL DEFAULT '{}'
                );
                """
            )

    def add_task(self, title: str, due_at: str | None = None, notes: str = "", source: str = "user") -> dict[str, Any]:
        task_id = str(uuid.uuid4())
        now = utcnow()
        with self.connection() as con:
            con.execute(
                "INSERT INTO tasks(id,title,due_at,status,source,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)",
                (task_id, title, due_at, "open", source, notes, now, now),
            )
        return self.get_task(task_id)

    def get_task(self, task_id: str) -> dict[str, Any]:
        with self.connection() as con:
            row = con.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone()
        if not row:
            raise KeyError(task_id)
        return dict(row)

    def list_tasks(self, status: str = "open", limit: int = 100) -> list[dict[str, Any]]:
        with self.connection() as con:
            rows = con.execute(
                "SELECT * FROM tasks WHERE status=? ORDER BY CASE WHEN due_at IS NULL THEN 1 ELSE 0 END, due_at, created_at LIMIT ?",
                (status, limit),
            ).fetchall()
        return [dict(r) for r in rows]

    def complete_task(self, task_id: str) -> dict[str, Any]:
        with self.connection() as con:
            con.execute("UPDATE tasks SET status='done', updated_at=? WHERE id=?", (utcnow(), task_id))
        return self.get_task(task_id)

    def remember(self, content: str, kind: str = "note", metadata: dict[str, Any] | None = None) -> str:
        memory_id = str(uuid.uuid4())
        with self.connection() as con:
            con.execute(
                "INSERT INTO memories(id,kind,content,metadata_json,created_at) VALUES(?,?,?,?,?)",
                (memory_id, kind, content, json.dumps(metadata or {}), utcnow()),
            )
        return memory_id

    def recent_memories(self, limit: int = 20) -> list[dict[str, Any]]:
        with self.connection() as con:
            rows = con.execute("SELECT * FROM memories ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
        return [dict(r) for r in rows]

    def create_approval(self, action: str, args: dict[str, Any]) -> str:
        approval_id = str(uuid.uuid4())
        with self.connection() as con:
            con.execute(
                "INSERT INTO approvals(id,action,args_json,status,created_at) VALUES(?,?,?,?,?)",
                (approval_id, action, json.dumps(args), "pending", utcnow()),
            )
        return approval_id

    def resolve_approval(self, approval_id: str, approved: bool) -> dict[str, Any]:
        status = "approved" if approved else "rejected"
        with self.connection() as con:
            con.execute(
                "UPDATE approvals SET status=?, resolved_at=? WHERE id=? AND status='pending'",
                (status, utcnow(), approval_id),
            )
            row = con.execute("SELECT * FROM approvals WHERE id=?", (approval_id,)).fetchone()
        if not row:
            raise KeyError(approval_id)
        result = dict(row)
        result["args"] = json.loads(result.pop("args_json"))
        return result

    def get_approval(self, approval_id: str) -> dict[str, Any]:
        with self.connection() as con:
            row = con.execute("SELECT * FROM approvals WHERE id=?", (approval_id,)).fetchone()
        if not row:
            raise KeyError(approval_id)
        result = dict(row)
        result["args"] = json.loads(result.pop("args_json"))
        return result

    def audit(self, actor: str, action: str, risk: str, status: str, detail: dict[str, Any] | None = None) -> None:
        with self.connection() as con:
            con.execute(
                "INSERT INTO audit_log(ts,actor,action,risk,status,detail_json) VALUES(?,?,?,?,?,?)",
                (utcnow(), actor, action, risk, status, json.dumps(detail or {}, default=str)),
            )
