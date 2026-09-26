from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="ADA_", extra="ignore")

    host: str = "127.0.0.1"
    port: int = 47821
    db_path: Path = Path("data/ada.db")
    data_dir: Path = Path("data")

    llm_base_url: str = "http://127.0.0.1:11434"
    llm_model: str = "qwen3:8b"
    llm_timeout_seconds: int = 120

    allowed_roots: str = "%USERPROFILE%\\Documents;%USERPROFILE%\\Desktop"
    allowed_apps: str = "notepad;code;chrome;msedge;explorer"
    allow_safe_commands: bool = True

    google_client_secret: Path = Path("secrets/google_client_secret.json")
    google_token: Path = Path("secrets/google_token.json")
    google_write_enabled: bool = False

    github_token: str = ""
    github_repos: str = ""

    timezone: str = "Asia/Kolkata"
    briefing_hour: int = 7
    briefing_minute: int = 0
    briefing_call_enabled: bool = False
    briefing_phone_number: str = ""

    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""
    twilio_voice_webhook_url: str = ""

    n8n_base_url: str = "http://127.0.0.1:5678"
    n8n_webhook_secret: str = ""
    home_assistant_url: str = "http://homeassistant.local:8123"
    home_assistant_token: str = ""

    piper_exe: str = "piper"
    piper_model: str = ""
    whisper_model: str = "small"
    whisper_device: str = "cuda"
    whisper_compute_type: str = "float16"
    whisper_fallback_cpu: bool = True
    audio_input_device: int | None = None

    @property
    def root_paths(self) -> list[Path]:
        roots = []
        for raw in self.allowed_roots.split(";"):
            raw = raw.strip()
            if raw:
                roots.append(Path(os.path.expandvars(raw)).expanduser().resolve())
        return roots

    @property
    def app_allowlist(self) -> set[str]:
        return {x.strip().lower() for x in self.allowed_apps.split(";") if x.strip()}

    @property
    def github_repo_list(self) -> list[str]:
        return [x.strip() for x in self.github_repos.split(",") if x.strip()]


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.db_path.parent.mkdir(parents=True, exist_ok=True)
    return settings
