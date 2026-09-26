from __future__ import annotations

from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

from ada.config import get_settings
from ada.integrations.google_workspace import READ_SCOPES, WRITE_SCOPES


def main() -> None:
    settings = get_settings()
    secret = settings.google_client_secret
    token = settings.google_token
    scopes = WRITE_SCOPES if settings.google_write_enabled else READ_SCOPES
    if not Path(secret).exists():
        raise SystemExit(f"Missing {secret}. Download an OAuth Desktop client JSON from Google Cloud Console first.")
    token.parent.mkdir(parents=True, exist_ok=True)
    flow = InstalledAppFlow.from_client_secrets_file(str(secret), scopes=scopes)
    creds = flow.run_local_server(port=0)
    token.write_text(creds.to_json(), encoding="utf-8")
    print(f"Saved OAuth token to {token}")


if __name__ == "__main__":
    main()
