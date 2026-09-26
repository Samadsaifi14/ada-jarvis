from __future__ import annotations

import asyncio
from pathlib import Path

from ada.core.runtime import Runtime
from ada.voice.io import AudioIO
from ada.voice.stt import FasterWhisperSTT
from ada.voice.tts import PiperTTS


class VoiceLoop:
    def __init__(self, runtime: Runtime):
        self.runtime = runtime
        settings = runtime.settings
        self.audio = AudioIO(input_device=settings.audio_input_device)
        self.stt = FasterWhisperSTT(
            settings.whisper_model,
            settings.whisper_device,
            settings.whisper_compute_type,
            settings.whisper_fallback_cpu,
        )
        self.tts = PiperTTS(settings.piper_exe, settings.piper_model)

    async def once(self, seconds: float = 6.0, speak: bool = True) -> dict:
        input_path = self.audio.record_wav(seconds=seconds)
        try:
            transcript = self.stt.transcribe_wav(input_path)
            stats = self.audio.last_stats
            if not transcript:
                return {
                    "transcript": "",
                    "text": (
                        "I did not hear any speech. "
                        f"Microphone peak={stats.get('peak', 0.0):.4f}, "
                        f"rms={stats.get('rms', 0.0):.4f}."
                    ),
                    "audio": stats,
                    "pending_approvals": [],
                }

            result = await self.runtime.orchestrator.chat(transcript)
            result["transcript"] = transcript
            result["audio"] = stats

            if speak and result.get("text") and self.runtime.settings.piper_model:
                output_path = self.tts.synthesize(result["text"])
                try:
                    self.audio.play_wav(output_path)
                finally:
                    Path(output_path).unlink(missing_ok=True)
            return result
        finally:
            Path(input_path).unlink(missing_ok=True)

    def run(self, seconds: float = 6.0, speak: bool = True) -> None:
        print("ADA voice mode. Press Enter to speak, or type q then Enter to quit.")
        while True:
            command = input("\n[Enter=speak | q=quit] ").strip().lower()
            if command in {"q", "quit", "exit"}:
                return
            result = asyncio.run(self.once(seconds=seconds, speak=speak))
            transcript = result.get("transcript", "")
            if transcript:
                print(f"You: {transcript}")
            print(f"ADA: {result.get('text', '')}")
            approvals = result.get("pending_approvals") or []
            if approvals:
                print(f"Pending approvals: {approvals}")
