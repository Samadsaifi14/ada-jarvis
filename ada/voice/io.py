from __future__ import annotations

import tempfile
from pathlib import Path

import numpy as np


class AudioIO:
    def __init__(self, sample_rate: int = 16000, channels: int = 1):
        self.sample_rate = sample_rate
        self.channels = channels

    def record_wav(self, seconds: float = 6.0, output_path: str | None = None) -> str:
        try:
            import sounddevice as sd
            from scipy.io.wavfile import write
        except ImportError as exc:
            raise RuntimeError(
                "Voice dependencies are missing. Run: pip install -e .[voice]"
            ) from exc

        if seconds <= 0:
            raise ValueError("seconds must be greater than 0")

        frames = int(seconds * self.sample_rate)
        audio = sd.rec(
            frames,
            samplerate=self.sample_rate,
            channels=self.channels,
            dtype="float32",
        )
        sd.wait()

        if output_path is None:
            fd = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            output_path = fd.name
            fd.close()

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        pcm16 = np.clip(audio, -1.0, 1.0)
        pcm16 = (pcm16 * 32767).astype(np.int16)
        write(output_path, self.sample_rate, pcm16)
        return output_path

    def play_wav(self, path: str) -> None:
        try:
            import sounddevice as sd
            from scipy.io.wavfile import read
        except ImportError as exc:
            raise RuntimeError(
                "Voice dependencies are missing. Run: pip install -e .[voice]"
            ) from exc

        sample_rate, audio = read(path)
        sd.play(audio, sample_rate)
        sd.wait()

    @staticmethod
    def devices() -> list[dict]:
        try:
            import sounddevice as sd
        except ImportError as exc:
            raise RuntimeError(
                "Voice dependencies are missing. Run: pip install -e .[voice]"
            ) from exc
        result = []
        for index, device in enumerate(sd.query_devices()):
            result.append(
                {
                    "index": index,
                    "name": device["name"],
                    "inputs": int(device["max_input_channels"]),
                    "outputs": int(device["max_output_channels"]),
                }
            )
        return result
