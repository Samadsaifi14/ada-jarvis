from ada.core.db import Database


def test_task_roundtrip(tmp_path):
    db = Database(tmp_path / "ada.db")
    task = db.add_task("Test ADA")
    assert task["title"] == "Test ADA"
    assert db.list_tasks()[0]["id"] == task["id"]
    done = db.complete_task(task["id"])
    assert done["status"] == "done"


def test_approval_roundtrip(tmp_path):
    db = Database(tmp_path / "ada.db")
    approval_id = db.create_approval("telephony.call", {"to": "+910000000000"})
    resolved = db.resolve_approval(approval_id, True)
    assert resolved["status"] == "approved"
    assert resolved["args"]["to"] == "+910000000000"


def test_list_approvals(tmp_path):
    db = Database(tmp_path / "ada.db")
    first = db.create_approval("system.safe_command", {"command": "git status"})
    second = db.create_approval("telephony.call", {"to": "+910000000000"})

    assert {a["id"] for a in db.list_approvals("pending")} == {first, second}
    assert len(db.list_approvals(None)) == 2

    db.resolve_approval(first, False)

    assert [a["id"] for a in db.list_approvals("pending")] == [second]
    assert len(db.list_approvals(None)) == 2
    rejected = db.list_approvals("rejected")
    assert len(rejected) == 1
    assert rejected[0]["id"] == first
    assert rejected[0]["status"] == "rejected"
