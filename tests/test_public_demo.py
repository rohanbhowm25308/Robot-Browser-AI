import os, pytest
from conftest import H_
HOST = "demo.onrender.com"; URL = "https://" + HOST

@pytest.fixture
def public(appm, monkeypatch):
    monkeypatch.setattr(appm, "HOSTED", True); monkeypatch.setattr(appm, "PUBLIC", True); monkeypatch.setattr(appm, "APP_PASSWORD", ""); monkeypatch.setattr(appm, "ALLOWED_HOSTS", {HOST})
    appm.RL.clear(); appm.OWNED.clear()
    def visitor():
        c = appm.app.test_client(); r = c.get("/", base_url=URL); assert r.status_code == 200; return c
    return visitor
def g(c, p, **kw): return c.get(p, base_url=URL, **kw)
def p(c, path, **kw): return c.post(path, base_url=URL, headers=H_, **kw)

def test_opens_without_password_and_issues_private_session(public):
    c = public(); r = c.get("/", base_url=URL); h = " ".join(r.headers.getlist("Set-Cookie")) + " " + " ".join(c.get("/", base_url=URL).headers.getlist("Set-Cookie"))
    assert b"Welcome to Robot Browser" in r.data and b"type=password" not in r.data and g(c, "/api/health").status_code == 200
    assert g(c, "/api/health").json["public_demo"] is True
def test_password_env_is_ignored_in_public_mode(public, appm, monkeypatch):
    monkeypatch.setattr(appm, "APP_PASSWORD", "pw"); c = public(); assert g(c, "/api/health").status_code == 200 and c.post("/login", base_url=URL, data={"password": "x"}).status_code == 302
def test_api_still_needs_a_session_cookie_and_header(public, appm):
    assert appm.app.test_client().get("/api/health", base_url=URL).status_code == 401
    c = public(); assert c.post("/api/memory", base_url=URL, json={"text": "x"}).status_code == 403
def test_missions_are_private_per_visitor(public):
    a, b = public(), public(); mid = p(a, "/api/missions", json={"prompt": "Research 2 payroll tools please"}).json["id"]
    assert any(m["id"] == mid for m in g(a, "/api/missions").json) and g(b, "/api/missions").json == []
    assert g(b, f"/api/missions/{mid}").status_code == 404 and p(b, f"/api/missions/{mid}/cancel").status_code == 404 and g(a, f"/api/missions/{mid}").status_code == 200
    assert "owner" not in g(a, f"/api/missions/{mid}").json
def test_files_are_private_per_visitor(public, appm):
    a, b = public(), public(); mid = p(a, "/api/missions", json={"prompt": "Research 2 payroll tools please"}).json["id"]
    open(os.path.join(appm.OUT, f"research_{mid}.xlsx"), "wb").write(b"x"); open(os.path.join(appm.OUT, "other_secret.txt"), "wb").write(b"y")
    assert [f["name"] for f in g(a, "/api/files").json] == [f"research_{mid}.xlsx"] and g(b, "/api/files").json == []
    assert g(a, f"/api/files/research_{mid}.xlsx").status_code == 200 and g(b, f"/api/files/research_{mid}.xlsx").status_code == 404 and g(a, "/api/files/other_secret.txt").status_code == 404
def test_busted_results_are_private(public):
    a, b = public(), public(); rid = p(a, "/api/busted/demo").json["id"]
    assert g(a, f"/api/busted/report/{rid}").status_code == 200 and g(b, f"/api/busted/report/{rid}").status_code == 404 and p(b, "/api/busted/correct", json={"id": rid, "ids": [1]}).status_code == 400
def test_memory_and_selftest_disabled(public):
    c = public(); assert g(c, "/api/memory").status_code == 403 and g(c, "/api/selftest").status_code == 403
def test_rate_limit_on_expensive_endpoints(public, appm, monkeypatch):
    monkeypatch.setitem(appm.LIMITS, "llm", 2); c = public(); codes = [p(c, "/api/gtm", json={"product": ""}).status_code for _ in range(3)]
    assert codes == [400, 400, 429]
def test_rate_limit_is_per_ip_and_per_bucket(public, appm, monkeypatch):
    monkeypatch.setitem(appm.LIMITS, "llm", 1); c = public(); p(c, "/api/gtm", json={"product": ""})
    assert p(c, "/api/gtm", json={"product": ""}).status_code == 429 and g(c, "/api/files").status_code == 200
def test_running_missions_capped(public, appm):
    c = public(); ids = [p(c, "/api/missions", json={"prompt": "Research 2 payroll tools please"}).json["id"] for _ in range(3)]
    appm.save_m(ids[0], status="running"); appm.save_m(ids[1], status="running")
    assert p(c, f"/api/missions/{ids[2]}/approve").status_code == 429
def test_chat_ignores_memory_flag_in_public_mode(public, appm, monkeypatch):
    seen = {}; monkeypatch.setattr(appm, "KEY", "k"); monkeypatch.setattr(appm, "llm", lambda m, **k: seen.setdefault("sys", m[0]["content"]) and "ok")
    with appm.db() as cx: cx.execute("insert into mem(text,created) values('SECRET NOTE','t')")
    c = public(); p(c, "/api/chat", json={"use_memory": True, "messages": [{"role": "user", "content": "hi"}]}); assert "SECRET NOTE" not in seen["sys"]
def test_local_mode_unchanged(appm): assert appm.PUBLIC is False and appm.uid() == "owner"
