from __future__ import annotations


class FasterWhisperSTT:
    def __init__(
        self,
        model: str = "small",
        device: str = "cuda",
        compute_type: str = "float16",
        fallback_cpu: bool = True,
    ):
        self.model_name = model
        self.device = device
        self.compute_type = compute_type
        self.fallback_cpu = fallback_cpu
        self._model = None
        self._active_device = device

    def _build_model(self, device: str, compute_type: str):
        from faster_whisper import WhisperModel

        return WhisperModel(self.model_name, device=device, compute_type=compute_type)

    def _load(self):
        if self._model is not None:
            return self._model

        try:
            self._model = self._build_model(self.device, self.compute_type)
            self._active_device = self.device
            return self._model
        except Exception as exc:
            message = str(exc).lower()
            cuda_runtime_problem = any(
                marker in message
                for marker in (
                    "cublas64_12.dll",
                    "cudnn",
                    "cuda",
                )
            )
            if self.device == "cuda" and self.fallback_cpu and cuda_runtime_problem:
                self._model = self._build_model("cpu", "int8")
                self._active_device = "cpu"
                return self._model
            raise

    @property
    def active_device(self) -> str:
        return self._active_device

    def transcribe_wav(self, path: str) -> str:
        model = self._load()
        segments, _ = model.transcribe(path, vad_filter=True)
        return " ".join(segment.text.strip() for segment in segments).strip()
