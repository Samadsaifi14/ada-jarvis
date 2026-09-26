from __future__ import annotations

from typing import Any

import httpx


class GitHubMonitor:
    def __init__(self, token: str = ""):
        self.token = token

    async def repo_status(self, repo: str) -> dict[str, Any]:
        headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        async with httpx.AsyncClient(headers=headers, timeout=20) as client:
            repo_resp = await client.get(f"https://api.github.com/repos/{repo}")
            repo_resp.raise_for_status()
            commits_resp = await client.get(f"https://api.github.com/repos/{repo}/commits", params={"per_page": 1})
            commits_resp.raise_for_status()
            runs_resp = await client.get(f"https://api.github.com/repos/{repo}/actions/runs", params={"per_page": 3})
            runs = runs_resp.json().get("workflow_runs", []) if runs_resp.is_success else []
        meta = repo_resp.json()
        commits = commits_resp.json()
        return {
            "repo": repo,
            "default_branch": meta.get("default_branch"),
            "open_issues": meta.get("open_issues_count"),
            "updated_at": meta.get("updated_at"),
            "latest_commit": commits[0].get("sha") if commits else None,
            "latest_commit_message": commits[0].get("commit", {}).get("message") if commits else None,
            "workflow_runs": [
                {
                    "name": r.get("name"),
                    "status": r.get("status"),
                    "conclusion": r.get("conclusion"),
                    "head_sha": r.get("head_sha"),
                    "html_url": r.get("html_url"),
                }
                for r in runs
            ],
        }
