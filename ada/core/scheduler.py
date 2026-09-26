from __future__ import annotations

import asyncio
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from ada.core.briefing import BriefingService
from ada.core.runtime import Runtime

log = logging.getLogger(__name__)


class AdaScheduler:
    def __init__(self, runtime: Runtime):
        self.runtime = runtime
        self.scheduler = BackgroundScheduler(timezone=runtime.settings.timezone)
        self.briefing = BriefingService(runtime)

    def start(self) -> None:
        self.scheduler.add_job(
            self._briefing_job,
            CronTrigger(
                hour=self.runtime.settings.briefing_hour,
                minute=self.runtime.settings.briefing_minute,
                timezone=self.runtime.settings.timezone,
            ),
            id="morning_briefing",
            replace_existing=True,
            coalesce=True,
            max_instances=1,
        )
        self.scheduler.start()

    def stop(self) -> None:
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)

    def _briefing_job(self) -> None:
        try:
            text = asyncio.run(self.briefing.generate())
            self.runtime.db.remember(text, kind="briefing")
            log.info("Morning briefing: %s", text)
            if self.runtime.settings.briefing_call_enabled and self.runtime.settings.briefing_phone_number:
                self.runtime.telephony.call(self.runtime.settings.briefing_phone_number)
        except Exception:
            log.exception("Scheduled briefing failed")
