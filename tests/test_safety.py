from ada.core.safety import Risk, SafetyEngine


def test_safe_read_action():
    decision = SafetyEngine().decide("tasks.list")
    assert decision.risk == Risk.SAFE
    assert decision.allowed is True
    assert decision.needs_approval is False


def test_sensitive_action_requires_approval():
    decision = SafetyEngine().decide("telephony.call")
    assert decision.risk == Risk.ASK
    assert decision.needs_approval is True


def test_shell_is_blocked():
    decision = SafetyEngine().decide("system.shell")
    assert decision.risk == Risk.BLOCK
    assert decision.allowed is False


def test_unknown_action_defaults_to_ask():
    assert SafetyEngine().decide("future.tool").risk == Risk.ASK
