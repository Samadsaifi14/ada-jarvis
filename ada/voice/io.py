from __future__ import annotations

import tempfile
from pathlib import Path

import numpy as np


class AudioIO:
    def __init__(self, sample_rate: int = 16000, channels: int = 1, input_device: int | None = None):
        self.sample_rate = sample_rate
        self.channels = channels
        self.input_device = input_device
        self.last_stats: dict[str, float | int | str] = {}

    def _select_input_format(self, sd) -> tuple[int | None, int, int, str]:
        device_index = self.input_device
        if device_index is None:
            device_index = sd.default.device[0]
            if device_index is not None and device_index < 0:
                device_index = None

        if device_index is None:
            raise RuntimeError(
                "No default input microphone is available. Run 'ada audio-devices' and set "
                "ADA_AUDIO_INPUT_DEVICE to the INDEX of a device with Inputs > 0."
            )

        info = sd.query_devices(device_index)
        max_inputs = int(info["max_input_channels"])
        if max_inputs < 1:
            raise RuntimeError(
                f"ADA_AUDIO_INPUT_DEVICE={device_index} is not an input device "
                f"({info['name']!s}, Inputs={max_inputs}). Run 'ada audio-devices' and use "
                "the leftmost Index value for your microphone — not the Inputs count."
            )

        default_rate = int(round(float(info["default_samplerate"])))
        channel_candidates = []
        for channels in (1, min(2, max_inputs), max_inputs):
            if channels > 0 and channels not in channel_candidates:
                channel_candidates.append(channels)

        rate_candidates = []
        for rate in (self.sample_rate, default_rate, 48000, 44100):
            if rate > 0 and rate not in rate_candidates:
                rate_candidates.append(rate)

        errors: list[str] = []
        for rate in rate_candidates:
            for channels in channel_candidates:
                try:
                    sd.check_input_settings(
                        device=device_index,
                        channels=channels,
                        dtype="float32",
                        samplerate=rate,
                    )
                    return device_index, rate, channels, str(info["name"])
                except Exception as exc:
                    errors.append(f"{rate}Hz/{channels}ch: {exc}")

        details = "; ".join(errors[-4:])
        raise RuntimeError(
            f"Windows rejected every tested recording format for microphone "
            f"{device_index} ({info['name']}). Tried mono/stereo/native channels at "
            f"16/44.1/48 kHz and device default. Last errors: {details}"
        )

    def record_wav(self, seconds: float = 6.0, output_path: str | None = None) -> str:
        try:
            import sounddevice as sd
            from scipy.io.wavfile import write
            from scipy.signal import resample_poly
        except ImportError as exc:
            raise RuntimeError(
                "Voice dependencies are missing. Run: pip install -e .[voice]"
            ) from exc

        if seconds <= 0:
            raise ValueError("seconds must be greater than 0")

        device_index, capture_rate, capture_channels, device_name = self._select_input_format(sd)
        frames = int(seconds * capture_rate)
        audio = sd.rec(
            frames,
            samplerate=capture_rate,
            channels=capture_channels,
            dtype="float32",
            device=device_index,
        )
        sd.wait()

        if audio.ndim == 2 and audio.shape[1] > 1:
            audio = np.mean(audio, axis=1, keepdims=True)

        peak = float(np.max(np.abs(audio))) if audio.size else 0.0
        rms = float(np.sqrt(np.mean(np.square(audio)))) if audio.size else 0.0

        if capture_rate != self.sample_rate:
            from math import gcd

            divisor = gcd(capture_rate, self.sample_rate)
            up = self.sample_rate // divisor
            down = capture_rate // divisor
            audio = resample_poly(audio, up, down, axis=0).astype(np.float32)

        self.last_stats = {
            "peak": peak,
            "rms": rms,
            "device_index": int(device_index),
            "device_name": device_name,
            "capture_rate": capture_rate,
            "capture_channels": capture_channels,
            "whisper_rate": self.sample_rate,
        }

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
        default_input, default_output = sd.default.device
        result = []
        for index, device in enumerate(sd.query_devices()):
            result.append(
                {
                    "index": index,
                    "name": device["name"],
                    "inputs": int(device["max_input_channels"]),
                    "outputs": int(device["max_output_channels"]),
                    "default_input": index == default_input,
                    "default_output": index == default_output,
                    "default_samplerate": int(round(float(device["default_samplerate"]))),
                }
            )
        return result
