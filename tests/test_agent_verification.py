import os, pytest
from conftest import DONE
pytestmark = pytest.mark.chromium
C = lambda t, v="", d="": {"type": t, "value": v, "description": d or f"{t} {v}"}

def report(m, appm): return open(os.path.join(appm.OUT, m["artifact"])).read()

def test_write_succeeded_fails_when_server_returns_500(run_agent, base, appm):
    m, _ = run_agent(base + "/failform", [{"action": "type", "id": 0, "text": "x"}, {"action": "click", "id": 1}, DONE("Server error")], crit=[C("write_succeeded", "/fail"), C("page_contains", "server error")])
    assert m["status"] == "completed_with_warnings" and "HTTP 500" in report(m, appm)

def test_submission_without_outcome_criterion_is_not_reported_complete(run_agent, base):
    m, _ = run_agent(base + "/book", [{"action": "type", "id": 0, "text": "x"}, {"action": "click", "id": 1}, DONE("Booking confirmed #123")], crit=[C("quote_on_visited_page")])
    assert m["status"] == "completed_with_warnings" and any("outcome criterion" in l["msg"] for l in m["log"])

def test_element_exists_and_missing(run_agent, base):
    m, _ = run_agent(base + "/book", [{"action": "type", "id": 0, "text": "x"}, {"action": "click", "id": 1}, DONE("Booking confirmed #123")], crit=[C("element_exists", "#conf"), C("write_succeeded", "/book")]); assert m["status"] == "completed"
    m, _ = run_agent(base + "/plain", [DONE("Hello world price is 42 dollars")], crit=[C("element_exists", "#nope")]); assert m["status"] == "completed_with_warnings"

def test_download_saved_requires_approval_and_real_file(run_agent, base, appm):
    m, asked = run_agent(base + "/dl", [{"action": "click", "id": 0}, DONE("nothing relevant")], crit=[C("download_saved", ".pdf")])
    assert any("Keep downloaded file report.pdf" in a for a in asked) and m["status"] == "completed", m["log"][-4:]
    assert any(f.startswith("dl_") and f.endswith("report.pdf") for f in os.listdir(appm.OUT))

def test_download_declined_is_deleted_and_criterion_fails(run_agent, base, appm):
    before = set(os.listdir(appm.OUT)); m, asked = run_agent(base + "/dl", [{"action": "click", "id": 0}, DONE("nothing relevant")], answer=lambda q: "Keep downloaded" not in q, crit=[C("download_saved", ".pdf")])
    assert m["status"] == "completed_with_warnings" and not [f for f in set(os.listdir(appm.OUT)) - before if f.endswith("report.pdf")]

def test_dangerous_download_type_is_blocked(run_agent, base, appm):
    m, asked = run_agent(base + "/dl", [{"action": "click", "id": 1}, DONE("nothing relevant")], crit=[C("download_saved", ".exe")])
    assert any("Blocked download of risky file type .exe" in l["msg"] for l in m["log"]) and m["status"] == "completed_with_warnings"

def test_invented_quote_rejected_real_quote_accepted(run_agent, base):
    assert run_agent(base + "/plain", [DONE("this was invented by the model")])[0]["status"] == "completed_with_warnings"
    assert run_agent(base + "/plain", [DONE("Hello world price is 42 dollars")])[0]["status"] == "completed"

def test_failed_page_criterion_overrides_agent_claim(run_agent, base):
    assert run_agent(base + "/plain", [DONE("Hello world price is 42 dollars")], crit=[C("page_contains", "price is 99")])[0]["status"] == "completed_with_warnings"

def test_step_limit_incomplete_then_continue_from_checkpoint(run_agent, base, appm, client, llm):
    from conftest import H_
    m, _ = run_agent(base + "/plain", [{"action": "scroll"}] * 3, steps=3)
    assert m["status"] == "incomplete" and m["plan"]["checkpoint"]["step"] == 3 and os.path.exists(os.path.join(appm.OUT, m["artifact"]))
    llm.q[:] = [DONE("Hello world price is 42 dollars")]
    assert client.post(f"/api/missions/{m['id']}/continue", headers=H_, json={"extra": 5}).status_code == 200
    import time; t0 = time.time()
    while appm.get_m(m["id"])["status"] == "running" and time.time() - t0 < 60: time.sleep(0.5)
    m2 = appm.get_m(m["id"]); assert m2["status"] == "completed" and m2["plan"]["max_steps"] == 8

def test_stuck_agent_stops_as_incomplete(run_agent, base):
    m, _ = run_agent(base + "/plain", [{"action": "click", "id": 99}] * 5)
    assert m["status"] == "incomplete" and "stuck" in m["log"][-1]["msg"]

def test_continue_refused_without_checkpoint(client, appm):
    from conftest import H_
    mid = appm.new_agent_mission("do something useful", "", 5, None); assert client.post(f"/api/missions/{mid}/continue", headers=H_).status_code == 400

def test_user_written_criteria_are_parsed(appm):
    c = appm.parse_criteria("page contains: Booked\nwrite succeeded: /book\nelement text: #s => OK\ndownload saved: .pdf\nurl contains: /done\nquote\nnonsense")
    assert [x["type"] for x in c] == ["page_contains", "write_succeeded", "element_text", "download_saved", "url_contains", "quote_on_visited_page"]
