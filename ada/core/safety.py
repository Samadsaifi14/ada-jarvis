from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class Risk(StrEnum):
    SAFE = "SAFE"
    ASK = "ASK"
    BLOCK = "BLOCK"


DEFAULT_POLICY: dict[str, Risk] = {
    "tasks.list": Risk.SAFE,
    "tasks.create": Risk.SAFE,
    "memory.remember": Risk.SAFE,
    "filesystem.read_text": Risk.SAFE,
    "system.open_app": Risk.SAFE,
    "system.open_url": Risk.SAFE,
    "system.safe_command": Risk.ASK,
    "google.today": Risk.SAFE,
    "google.search_email": Risk.SAFE,
    "github.repo_status": Risk.SAFE,
    "home_assistant.service": Risk.ASK,
    "telephony.call": Risk.ASK,
    "email.send": Risk.ASK,
    "github.push": Risk.ASK,
    "filesystem.delete": Risk.ASK,
    "system.shell": Risk.BLOCK,
    "purchase": Risk.BLOCK,
    "financial.transfer": Risk.BLOCK,
    "security.modify": Risk.BLOCK,
    "secrets.read": Risk.BLOCK,
}


@dataclass(frozen=True)
class Decision:
    risk: Risk
    allowed: bool
    needs_approval: bool
    reason: str


class SafetyEngine:
    def __init__(self, policy: dict[str, Risk] | None = None):
        self.policy = {**DEFAULT_POLICY, **(policy or {})}

    def classify(self, action: str) -> Risk:
        return self.policy.get(action, Risk.ASK)

    def decide(self, action: str) -> Decision:
        risk = self.classify(action)
        if risk == Risk.SAFE:
            return Decision(risk, True, False, "allow-listed safe action")
        if risk == Risk.ASK:
            return Decision(risk, False, True, "explicit approval required")
        return Decision(risk, False, False, "blocked by policy")
