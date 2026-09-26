from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

READ_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
]
WRITE_SCOPES = READ_SCOPES + [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/drive.file",
]


class GoogleWorkspace:
    def __init__(self, token_path: Path, write_enabled: bool = False):
        self.token_path = token_path
        self.scopes = WRITE_SCOPES if write_enabled else READ_SCOPES

    def _credentials(self) -> Credentials:
        if not self.token_path.exists():
            raise FileNotFoundError("Google OAuth token not found. Run scripts/google_auth.py first.")
        creds = Credentials.from_authorized_user_file(str(self.token_path), self.scopes)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            self.token_path.write_text(creds.to_json(), encoding="utf-8")
        return creds

    def today(self) -> dict[str, Any]:
        creds = self._credentials()
        now = datetime.now(timezone.utc)
        end = now + timedelta(hours=24)

        calendar = build("calendar", "v3", credentials=creds, cache_discovery=False)
        events = calendar.events().list(
            calendarId="primary",
            timeMin=now.isoformat(),
            timeMax=end.isoformat(),
            singleEvents=True,
            orderBy="startTime",
            maxResults=20,
        ).execute().get("items", [])

        gmail = build("gmail", "v1", credentials=creds, cache_discovery=False)
        messages = gmail.users().messages().list(
            userId="me", q="is:unread newer_than:2d", maxResults=20
        ).execute().get("messages", [])

        return {
            "events": [
                {
                    "summary": e.get("summary", "(no title)"),
                    "start": e.get("start", {}).get("dateTime") or e.get("start", {}).get("date"),
                    "end": e.get("end", {}).get("dateTime") or e.get("end", {}).get("date"),
                    "location": e.get("location"),
                }
                for e in events
            ],
            "unread_recent_email_count": len(messages),
        }

    def search_email(self, query: str, max_results: int = 10) -> list[dict[str, str]]:
        creds = self._credentials()
        gmail = build("gmail", "v1", credentials=creds, cache_discovery=False)
        refs = gmail.users().messages().list(userId="me", q=query, maxResults=max_results).execute().get("messages", [])
        result = []
        for ref in refs:
            msg = gmail.users().messages().get(
                userId="me", id=ref["id"], format="metadata", metadataHeaders=["From", "Subject", "Date"]
            ).execute()
            headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}
            result.append({
                "id": ref["id"],
                "from": headers.get("from", ""),
                "subject": headers.get("subject", ""),
                "date": headers.get("date", ""),
                "snippet": msg.get("snippet", ""),
            })
        return result
