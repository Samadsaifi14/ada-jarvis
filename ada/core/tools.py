from __future__ import annotations

import inspect
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from ada.core.db import Database
from ada.core.safety import Risk, SafetyEngine

Handler = Callable[..., Any | Awaitable[Any]]


@dataclass
class Tool:
    name: str
    description: str
    parameters: dict[str, Any]
    handler: Handler

    def ollama_schema(self) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


class ToolRegistry:
    def __init__(self, db: Database, safety: SafetyEngine):
        self.db = db
        self.safety = safety
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        self._tools[tool.name] = tool

    def schemas(self) -> list[dict[str, Any]]:
        return [tool.ollama_schema() for tool in self._tools.values()]

    async def execute(self, name: str, args: dict[str, Any], actor: str = "llm") -> dict[str, Any]:
        tool = self._tools.get(name)
        if not tool:
            self.db.audit(actor, name, Risk.BLOCK, "unknown_tool", {"args": args})
            return {"ok": False, "error": f"Unknown tool: {name}"}

        decision = self.safety.decide(name)
        if decision.risk == Risk.BLOCK:
            self.db.audit(actor, name, decision.risk, "blocked", {"args": args})
            return {"ok": False, "blocked": True, "reason": decision.reason}

        if decision.needs_approval:
            approval_id = self.db.create_approval(name, args)
            self.db.audit(actor, name, decision.risk, "approval_required", {"approval_id": approval_id, "args": args})
            return {
                "ok": False,
                "approval_required": True,
                "approval_id": approval_id,
                "action": name,
                "args": args,
            }

        try:
            result = tool.handler(**args)
            if inspect.isawaitable(result):
                result = await result
            self.db.audit(actor, name, decision.risk, "success", {"args": args})
            return {"ok": True, "result": result}
        except Exception as exc:  # noqa: BLE001 - tool boundary isolates provider failures
            self.db.audit(actor, name, decision.risk, "error", {"args": args, "error": str(exc)})
            return {"ok": False, "error": str(exc)}

    async def execute_approved(self, approval_id: str, actor: str = "user") -> dict[str, Any]:
        approval = self.db.get_approval(approval_id)
        if approval["status"] != "approved":
            return {"ok": False, "error": f"Approval status is {approval['status']}"}
        tool = self._tools.get(approval["action"])
        if not tool:
            return {"ok": False, "error": "Tool no longer exists"}
        args = approval["args"]
        try:
            result = tool.handler(**args)
            if inspect.isawaitable(result):
                result = await result
            self.db.audit(actor, approval["action"], Risk.ASK, "approved_success", {"args": args})
            return {"ok": True, "result": result}
        except Exception as exc:  # noqa: BLE001 - approved tool boundary isolates failures
            self.db.audit(actor, approval["action"], Risk.ASK, "approved_error", {"args": args, "error": str(exc)})
            return {"ok": False, "error": str(exc)}
