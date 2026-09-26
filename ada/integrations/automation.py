from __future__ import annotations

from typing import Any

import httpx


class AutomationClient:
    def __init__(self, n8n_base_url: str, n8n_secret: str, home_assistant_url: str, home_assistant_token: str):
        self.n8n_base_url = n8n_base_url.rstrip("/")
        self.n8n_secret = n8n_secret
        self.home_assistant_url = home_assistant_url.rstrip("/")
        self.home_assistant_token = home_assistant_token

    async def n8n_webhook(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        if not path.startswith("/"):
            path = "/" + path
        headers = {"X-ADA-Secret": self.n8n_secret} if self.n8n_secret else {}
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(f"{self.n8n_base_url}{path}", json=payload, headers=headers)
            r.raise_for_status()
            if "application/json" in r.headers.get("content-type", ""):
                return r.json()
            return {"text": r.text}

    async def home_assistant_service(self, domain: str, service: str, data: dict[str, Any]) -> dict[str, Any]:
        if not self.home_assistant_token:
            raise RuntimeError("Home Assistant token is not configured")
        headers = {"Authorization": f"Bearer {self.home_assistant_token}", "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                f"{self.home_assistant_url}/api/services/{domain}/{service}", json=data, headers=headers
            )
            r.raise_for_status()
            return {"status_code": r.status_code, "result": r.json() if r.content else None}
