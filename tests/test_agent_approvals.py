import pytest
from conftest import DONE, H_
pytestmark = pytest.mark.chromium

def test_form_button_needs_approval_denied_sends_nothing(run_agent, hits, base):
    m, asked = run_agent(base + "/form", [{"action": "type", "id": 0, "text": "abc"}, {"action": "click", "id": 1}, DONE("zzz not on page")], answer=lambda q: False)
    assert len(asked) == 1 and "inside a form" in asked[0] and hits["post"] == 0

def test_form_submission_approved_is_sent_exactly_once_and_verified(run_agent, hits, base):
    crit = [{"type": "write_succeeded", "value": "/book", "description": "server accepted"}, {"type": "element_text", "value": "#conf => Booking confirmed", "description": "confirmation shown"}, {"type": "url_contains", "value": "/book", "description": "url"}]
    m, asked = run_agent(base + "/book", [{"action": "type", "id": 0, "text": "Rohan"}, {"action": "click", "id": 1}, DONE("Booking confirmed #123")], crit=crit)
    assert hits["post"] == 1 and m["status"] == "completed", m["log"][-4:]

def test_page_js_write_is_held_then_released_once_and_click_not_repeated(run_agent, hits, base):
    """Regression for the retry risk: the click must run once; the held request is released once."""
    crit = [{"type": "page_contains", "value": "clicks:1", "description": "exactly one click happened"}, {"type": "write_succeeded", "value": "/post", "description": "post accepted"}]
    m, asked = run_agent(base + "/counter", [{"action": "click", "id": 0}, DONE("clicks:1")], crit=crit)
    assert any("wants to send data" in a for a in asked) and hits["post"] == 1 and m["status"] == "completed", (asked, m["log"][-5:])

def test_page_js_write_denied_never_reaches_server(run_agent, hits, base):
    m, asked = run_agent(base + "/counter", [{"action": "click", "id": 0}, DONE("clicks:1")], answer=lambda q: False)
    assert any("wants to send data" in a for a in asked) and hits["post"] == 0

def test_double_submit_is_suppressed_even_when_approved(run_agent, hits, base):
    m, asked = run_agent(base + "/double", [{"action": "click", "id": 0}, DONE("nothing relevant here")])
    assert hits["post"] == 1 and "duplicate suppressed" in open(__import__("os").path.join(__import__("app").OUT, m["artifact"])).read()

def test_enter_inside_form_requires_approval(run_agent, base):
    m, asked = run_agent(base + "/enter", [{"action": "click", "id": 0}, {"action": "type", "id": 0, "text": "hi"}, {"action": "press", "text": "Enter"}, DONE("Result page reached")])
    assert any("Enter inside a form" in a for a in asked) and m["status"] == "completed"

def test_never_types_into_password_fields(run_agent, base):
    m, asked = run_agent(base + "/login", [{"action": "type", "id": 1, "text": "secret"}, DONE("nothing relevant here")])
    assert any("REFUSED" in l["msg"] for l in m["log"])

def test_cancel_while_waiting_aborts_and_sends_nothing(appm, client, llm, private_ok, hits, base):
    import threading, time
    llm.q[:] = [{"action": "type", "id": 0, "text": "abc"}, {"action": "click", "id": 1}, DONE("x")]
    mid = appm.new_agent_mission("Fill the form and send it", base + "/form", 8, None)
    t = threading.Thread(target=appm.run_agent, args=(mid,)); t.start(); t0 = time.time()
    while time.time() - t0 < 60 and appm.get_m(mid)["status"] != "awaiting_user": time.sleep(0.2)
    assert appm.get_m(mid)["status"] == "awaiting_user"
    assert client.post(f"/api/missions/{mid}/cancel", headers=H_).status_code == 200
    t.join(30); assert appm.get_m(mid)["status"] == "cancelled" and hits["post"] == 0
