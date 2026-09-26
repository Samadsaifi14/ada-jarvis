from __future__ import annotations

import json
from typing import Any

from ada.core.runtime import Runtime


class BriefingService:
    def __init__(self, runtime: Runtime):
        self.runtime = runtime

    async def collect(self) -> dict[str, Any]:
        data: dict[str, Any] = {"tasks": self.runtime.db.list_tasks()}
        try:
            data["google"] = self.runtime.google.today()
        except Exception as exc:
            data["google_error"] = str(exc)

        repos = []
        for repo in self.runtime.settings.github_repo_list:
            try:
                repos.append(await self.runtime.github.repo_status(repo))
            except Exception as exc:
                repos.append({"repo": repo, "error": str(exc)})
        data["github"] = repos
        return data

    async def generate(self) -> str:
        data = await self.collect()
        prompt = (
            "Create a concise personal briefing from this structured data. Prioritize today's calendar, "
            "overdue/soon tasks, important unread-email signals, and project failures/warnings. Do not invent "
            "details that are not present.\n\n" + json.dumps(data, indent=2, default=str)
        )
        result = await self.runtime.orchestrator.chat(prompt)
        return result["text"]
