import pytest

from ada.config import Settings
from ada.tools.system import SystemTools


def test_read_text_restricted_to_allowed_root(tmp_path):
    allowed = tmp_path / "allowed"
    allowed.mkdir()
    f = allowed / "x.txt"
    f.write_text("hello", encoding="utf-8")
    tools = SystemTools(Settings(allowed_roots=str(allowed)))
    assert tools.read_text(str(f)) == "hello"


def test_read_text_blocks_outside_root(tmp_path):
    allowed = tmp_path / "allowed"
    allowed.mkdir()
    outside = tmp_path / "outside.txt"
    outside.write_text("secret", encoding="utf-8")
    tools = SystemTools(Settings(allowed_roots=str(allowed)))
    with pytest.raises(PermissionError):
        tools.read_text(str(outside))
