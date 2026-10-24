import pytest
from conftest import H_
HOST = "demo.onrender.com"; URL = "https://" + HOST

@pytest.fixture
def hosted(appm, monkeypatch):
    monkeypatch.setattr(appm, "HOSTED", True); monkeypatch.setattr(appm, "APP_PASSWORD", "s3cret!"); monkeypatch.setattr(appm, "ALLOWED_HOSTS", {HOST}); appm.FAILS.clear()
    return appm.app.test_client()
def login(c, pw="s3cret!"): return c.post("/login", base_url=URL, data={"password": pw})

def test_healthz_is_open_for_render_probes(hosted): assert hosted.get("/healthz", headers={"Host": "10.1.2.3:10000"}).status_code == 200
def test_unknown_host_rejected_render_host_accepted(hosted): assert hosted.get("/", base_url="https://evil.com").status_code == 403 and hosted.get("/", base_url=URL).status_code == 200
def test_password_login_required_and_token_path_disabled(hosted, appm):
    r = hosted.get("/", base_url=URL); assert b"Password" in r.data and hosted.get("/api/health", base_url=URL).status_code == 401
    assert b"Password" in hosted.get("/?token=" + appm.LAUNCH_TOKEN, base_url=URL).data and hosted.get("/api/health", base_url=URL).status_code == 401
def test_login_sets_secure_httponly_cookie_and_unlocks(hosted):
    r = login(hosted); assert r.status_code == 302 and "Secure" in r.headers["Set-Cookie"] and "HttpOnly" in r.headers["Set-Cookie"]
    assert hosted.get("/api/health", base_url=URL).status_code == 200 and hosted.get("/api/health", base_url=URL).json["hosted"] is True
def test_wrong_password_rejected_then_rate_limited(hosted):
    assert all(login(hosted, "bad").status_code == 401 for _ in range(8)); assert login(hosted).status_code == 429
def test_missing_password_config_is_reported_not_open(appm, monkeypatch):
    monkeypatch.setattr(appm, "HOSTED", True); monkeypatch.setattr(appm, "APP_PASSWORD", ""); monkeypatch.setattr(appm, "ALLOWED_HOSTS", {HOST})
    assert appm.app.test_client().get("/", base_url=URL).status_code == 503
def test_security_headers_present(hosted):
    h = hosted.get("/healthz", base_url=URL).headers; assert "max-age" in h["Strict-Transport-Security"] and h["X-Content-Type-Options"] == "nosniff" and h["X-Frame-Options"] == "SAMEORIGIN"
def test_state_changing_calls_still_need_header(hosted):
    login(hosted); assert hosted.post("/api/memory", base_url=URL, json={"text": "x"}).status_code == 403 and hosted.post("/api/memory", base_url=URL, json={"text": "x"}, headers=H_).status_code == 200
def test_browser_agent_and_snapshot_refused_when_chromium_disabled(hosted):
    login(hosted); r = hosted.post("/api/agent", base_url=URL, headers=H_, json={"goal": "open the page and read the heading"}); assert r.status_code == 400 and "Chromium" in r.json["error"]
    assert hosted.get("/api/snapshot?url=https://example.com", base_url=URL).status_code == 400

def test_health_reports_all_model_fields(hosted):
    login(hosted); h = hosted.get("/api/health", base_url=URL).json
    assert {"model", "vision_model", "stt_model", "browser_mode", "groq_key_set", "hosted"} <= set(h) and "vision_kind" not in h
