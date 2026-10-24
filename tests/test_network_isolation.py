import socket, pytest, netguard
pytestmark = pytest.mark.chromium

def goto(appm, url, timeout=9000):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = appm.launch_guarded(p, True); pg = b.new_page()
        try: pg.goto(url, timeout=timeout, wait_until="domcontentloaded"); out = pg.content()
        except Exception as e: out = "ERR " + str(e)[:80]
        b.close(); return out

@pytest.mark.parametrize("u", ["http://127.0.0.1:8771/plain", "http://localhost:8771/plain", "http://[::1]:8771/plain"])
def test_chromium_cannot_reach_loopback(appm, hits, u):
    goto(appm, u); assert hits["get"] == 0

def test_chromium_dns_rebinding_pinned_single_lookup(appm, hits, monkeypatch):
    real = socket.getaddrinfo; n = {"c": 0}
    def rebind(host, port, *a, **k):
        if host == "rebind.test": n["c"] += 1; return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34" if n["c"] == 1 else "127.0.0.1", port))]
        return real(host, port, *a, **k)
    monkeypatch.setattr(socket, "getaddrinfo", rebind); goto(appm, "http://rebind.test:8771/plain", 8000)
    assert hits["get"] == 0 and n["c"] == 1

def test_guard_is_the_reason_for_the_block(appm, hits, private_ok):
    assert "Hello world" in goto(appm, "http://127.0.0.1:8771/plain") and hits["get"] == 1

def test_snapshot_endpoint_blocks_internal_and_works_when_allowed(client, hits, appm, monkeypatch):
    monkeypatch.setattr(appm, 'BROWSER_MODE', 'playwright')
    assert client.get("/api/snapshot?url=http://127.0.0.1:8771/plain").status_code == 400 and hits["get"] == 0
    netguard.ALLOW_PRIVATE = True; r = client.get("/api/snapshot?url=http://127.0.0.1:8771/plain"); assert r.status_code == 200 and r.mimetype == "image/png"
