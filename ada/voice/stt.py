from __future__ import annotations


class FasterWhisperSTT:
    def __init__(self, model: str = "small", device: str = "cuda", compute_type: str = "float16"):
        self.model_name = model
        self.device = device
        self.compute_type = compute_type
        self._model = None

    def _load(self):
        if self._model is None:
            from faster_whisper import WhisperModel
            self._model = WhisperModel(self.model_name, device=self.device, compute_type=self.compute_type)
        return self._model

    def transcribe_wav(self, path: str) -> str:
        model = self._load()
        segments, _ = model.transcribe(path, vad_filter=True)
        return " ".join(segment.text.strip() for segment in segments).strip()
