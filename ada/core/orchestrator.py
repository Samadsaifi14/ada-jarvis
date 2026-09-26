from __future__ import annotations

import json
from typing import Any

from ada.core.llm import OllamaClient
from ada.core.tools import ToolRegistry

SYSTEM_PROMPT = """You are ADA, a local-first personal operating agent.
Be concise, truthful and action-oriented. Use tools when they add real value.
Never claim an action succeeded until its tool result says it succeeded.
Never bypass the safety/approval system. If a tool returns approval_required,
explain exactly what is waiting for approval and include the approval id.
Treat missing data as unknown, never as zero or a negative finding.
"""


class Orchestrator:
    def __init__(self, llm: OllamaClient, tools: ToolRegistry, max_tool_rounds: int = 5):
        self.llm = llm
        self.tools = tools
        self.max_tool_rounds = max_tool_rounds

    async def chat(self, user_text: str, context: str = "") -> dict[str, Any]:
        messages: list[dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
        if context:
            messages.append({"role": "system", "content": f"Current context:\n{context}"})
        messages.append({"role": "user", "content": user_text})

        pending_approvals: list[str] = []
        for _ in range(self.max_tool_rounds):
            response = await self.llm.chat(messages, self.tools.schemas())
            message = response.get("message", {})
            messages.append(message)
            tool_calls = message.get("tool_calls") or []
            if not tool_calls:
                return {"text": message.get("content", ""), "pending_approvals": pending_approvals, "raw": response}

            for call in tool_calls:
                function = call.get("function", {})
                name = function.get("name", "")
                args = function.get("arguments") or {}
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except json.JSONDecodeError:
                        args = {}
                result = await self.tools.execute(name, args)
                if result.get("approval_id"):
                    pending_approvals.append(result["approval_id"])
                messages.append({"role": "tool", "tool_name": name, "content": json.dumps(result, default=str)})

        return {"text": "I reached the tool-call limit for this request. No further actions were executed.", "pending_approvals": pending_approvals}
