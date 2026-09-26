from __future__ import annotations

from ada.config import Settings, get_settings
from ada.core.db import Database
from ada.core.llm import OllamaClient
from ada.core.orchestrator import Orchestrator
from ada.core.safety import SafetyEngine
from ada.core.tools import Tool, ToolRegistry
from ada.integrations.automation import AutomationClient
from ada.integrations.github import GitHubMonitor
from ada.integrations.google_workspace import GoogleWorkspace
from ada.integrations.telephony import TwilioTelephony
from ada.tools.system import SystemTools


def object_schema(properties: dict, required: list[str] | None = None) -> dict:
    return {"type": "object", "properties": properties, "required": required or []}


class Runtime:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings or get_settings()
        self.db = Database(self.settings.db_path)
        self.safety = SafetyEngine()
        self.tools = ToolRegistry(self.db, self.safety)
        self.llm = OllamaClient(self.settings.llm_base_url, self.settings.llm_model, self.settings.llm_timeout_seconds)
        self.system = SystemTools(self.settings)
        self.google = GoogleWorkspace(self.settings.google_token, self.settings.google_write_enabled)
        self.github = GitHubMonitor(self.settings.github_token)
        self.automation = AutomationClient(
            self.settings.n8n_base_url,
            self.settings.n8n_webhook_secret,
            self.settings.home_assistant_url,
            self.settings.home_assistant_token,
        )
        self.telephony = TwilioTelephony(
            self.settings.twilio_account_sid,
            self.settings.twilio_auth_token,
            self.settings.twilio_from_number,
            self.settings.twilio_voice_webhook_url,
        )
        self._register_tools()
        self.orchestrator = Orchestrator(self.llm, self.tools)

    def _register_tools(self) -> None:
        self.tools.register(Tool("tasks.list", "List open ADA tasks.", object_schema({}), lambda: self.db.list_tasks()))
        self.tools.register(Tool(
            "tasks.create",
            "Create a personal task.",
            object_schema({"title": {"type": "string"}, "due_at": {"type": ["string", "null"]}}, ["title"]),
            lambda title, due_at=None: self.db.add_task(title, due_at),
        ))
        self.tools.register(Tool(
            "memory.remember",
            "Store a durable user-approved fact or project note.",
            object_schema({"content": {"type": "string"}, "kind": {"type": "string"}}, ["content"]),
            lambda content, kind="note": {"id": self.db.remember(content, kind)},
        ))
        self.tools.register(Tool(
            "filesystem.read_text",
            "Read a UTF-8 text file only inside ADA_ALLOWED_ROOTS.",
            object_schema({"path": {"type": "string"}}, ["path"]),
            self.system.read_text,
        ))
        self.tools.register(Tool(
            "system.open_app",
            "Open an allow-listed desktop application.",
            object_schema({"app": {"type": "string"}}, ["app"]),
            self.system.open_app,
        ))
        self.tools.register(Tool(
            "system.open_url",
            "Open an http(s) URL in the default browser.",
            object_schema({"url": {"type": "string"}}, ["url"]),
            self.system.open_url,
        ))
        self.tools.register(Tool(
            "system.safe_command",
            "Run an allow-listed diagnostic command; requires approval.",
            object_schema({"command": {"type": "string"}, "cwd": {"type": ["string", "null"]}}, ["command"]),
            self.system.safe_command,
        ))
        self.tools.register(Tool("google.today", "Read the next 24 hours of Calendar and recent unread email count.", object_schema({}), self.google.today))
        self.tools.register(Tool(
            "google.search_email",
            "Search Gmail with a Gmail query and return metadata/snippets.",
            object_schema({"query": {"type": "string"}, "max_results": {"type": "integer"}}, ["query"]),
            self.google.search_email,
        ))
        self.tools.register(Tool(
            "github.repo_status",
            "Inspect repository metadata, latest commit and recent GitHub Actions runs.",
            object_schema({"repo": {"type": "string"}}, ["repo"]),
            self.github.repo_status,
        ))
        self.tools.register(Tool(
            "home_assistant.service",
            "Call a Home Assistant service; requires approval.",
            object_schema({"domain": {"type": "string"}, "service": {"type": "string"}, "data": {"type": "object"}}, ["domain", "service"]),
            self.automation.home_assistant_service,
        ))
        self.tools.register(Tool(
            "telephony.call",
            "Place an outbound phone call using the configured provider; requires approval.",
            object_schema({"to": {"type": "string"}}, ["to"]),
            self.telephony.call,
        ))
