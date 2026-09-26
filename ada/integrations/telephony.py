from __future__ import annotations

from typing import Any


class TwilioTelephony:
    def __init__(self, account_sid: str, auth_token: str, from_number: str, voice_webhook_url: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number
        self.voice_webhook_url = voice_webhook_url

    def call(self, to: str) -> dict[str, Any]:
        if not all((self.account_sid, self.auth_token, self.from_number, self.voice_webhook_url)):
            raise RuntimeError("Twilio calling is not fully configured")
        from twilio.rest import Client

        client = Client(self.account_sid, self.auth_token)
        call = client.calls.create(to=to, from_=self.from_number, url=self.voice_webhook_url)
        return {"sid": call.sid, "status": call.status, "to": to}
