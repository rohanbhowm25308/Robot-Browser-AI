"""Outbound-request protection used for every untrusted fetch (reader proxy, page fetch, agent navigation)."""
import os, socket, ipaddress, threading
from urllib.parse import urlparse, urljoin
import requests
import urllib3.util.connection as _uc

ALLOW_PRIVATE = os.getenv("ALLOW_PRIVATE_FETCH", "0") == "1"   # for automated tests only; leave off
_tl = threading.local()

def _bad(ip):
    a = ipaddress.ip_address(ip.split("%")[0])
    return a.is_private or a.is_loopback or a.is_link_local or a.is_reserved or a.is_multicast or a.is_unspecified

def resolve_checked(host, port):
    infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM); ips = []
    for i in infos:
        ip = i[4][0]
        if _bad(ip) and not ALLOW_PRIVATE: raise ValueError("Blocked: address resolves to a private/internal network")
        ips.append(ip)
    if not ips: raise ValueError("Host did not resolve")
    return ips

def safe_url(u):
    p = urlparse(u if "://" in u else "https://" + u)
    if p.scheme not in ("http", "https") or not p.hostname: raise ValueError("Only http(s) URLs are allowed")
    if p.username or p.password: raise ValueError("URLs with embedded credentials are not allowed")
    resolve_checked(p.hostname, p.port or (443 if p.scheme == "https" else 80))
    return p.geturl()

_orig = _uc.create_connection
def _guarded(address, *a, **k):
    # Only enforced for untrusted fetches (flag set by http_get). Connects to the IP we validated, so DNS cannot change between check and connect.
    if not getattr(_tl, "on", False): return _orig(address, *a, **k)
    host, port = address; last = None
    for ip in resolve_checked(host, port):
        try: return _orig((ip, port), *a, **k)
        except OSError as e: last = e
    raise last or OSError("connection failed")
_uc.create_connection = _guarded

def http_get(url, max_bytes=5 * 1024 * 1024, timeout=15, headers=None, max_redirects=5):
    """GET with manual redirect validation, IP pinning and a hard response-size cap. Returns (final_url, headers, body_bytes, encoding)."""
    s = requests.Session(); s.trust_env = False; cur = safe_url(url); _tl.on = True
    try:
        for _ in range(max_redirects + 1):
            r = s.get(cur, headers=headers, timeout=timeout, stream=True, allow_redirects=False)
            if r.status_code in (301, 302, 303, 307, 308):
                loc = r.headers.get("location"); r.close()
                if not loc: raise ValueError("Redirect without a location")
                cur = safe_url(urljoin(cur, loc)); continue
            r.raise_for_status(); cl = r.headers.get("content-length")
            if cl and cl.isdigit() and int(cl) > max_bytes: r.close(); raise ValueError("Response too large")
            buf = bytearray()
            for ch in r.iter_content(65536):
                buf += ch
                if len(buf) > max_bytes: r.close(); raise ValueError("Response exceeds the size limit")
            return cur, r.headers, bytes(buf), r.encoding
        raise ValueError("Too many redirects")
    finally: _tl.on = False

# ---------------------------------------------------------------------------
# Connection-level enforcement for Chromium: a local forward proxy that Chromium is forced to use.
# DNS is resolved HERE, once, validated, and the connection is made to the validated IP, so Chromium
# cannot be tricked by DNS rebinding or by redirects to internal hosts (loopback is NOT bypassed).
# ---------------------------------------------------------------------------
import select, socketserver

class _ProxyHandler(socketserver.StreamRequestHandler):
    timeout = 60
    def _deny(self, code, msg):
        try: self.wfile.write(f"HTTP/1.1 {code} {msg}\r\nContent-Length: 0\r\nConnection: close\r\n\r\n".encode()); self.wfile.flush()
        except OSError: pass
    def handle(self):
        up = None
        try:
            line = self.rfile.readline(65536).decode("latin1").strip()
            method, target, _ = line.split(" ", 2); headers = []
            while True:
                l = self.rfile.readline(65536)
                if l in (b"\r\n", b"\n", b""): break
                headers.append(l)
            if method == "CONNECT": host, port = target.rsplit(":", 1); host = host.strip("[]"); port = int(port); u = None
            else:
                u = urlparse(target)
                if u.scheme != "http" or not u.hostname: return self._deny(400, "Bad request")
                host = u.hostname; port = u.port or 80
            try: ips = resolve_checked(host, port)
            except Exception: return self._deny(403, "Blocked by Robot Browser network policy")
            last = None
            for ip in ips:
                try: up = socket.create_connection((ip, port), timeout=10); break
                except OSError as e: last = e
            if up is None: return self._deny(502, "Upstream connection failed")
            if method == "CONNECT": self.wfile.write(b"HTTP/1.1 200 Connection established\r\n\r\n"); self.wfile.flush()
            else:
                path = (u.path or "/") + ("?" + u.query if u.query else ""); clen = 0
                hs = []
                for h in headers:
                    low = h.lower()
                    if low.startswith((b"proxy-connection", b"connection", b"proxy-authorization")): continue
                    if low.startswith(b"content-length"): clen = int(h.split(b":", 1)[1].strip() or 0)
                    hs.append(h)
                up.sendall(f"{method} {path} HTTP/1.1\r\n".encode() + b"".join(hs) + b"Connection: close\r\n\r\n")
                if clen: up.sendall(self.rfile.read(min(clen, 50 * 1024 * 1024)))
            a, b = self.connection, up
            while True:
                r, _, _ = select.select([a, b], [], [], 60)
                if not r: break
                done = False
                for s in r:
                    d = s.recv(65536)
                    if not d: done = True; break
                    (b if s is a else a).sendall(d)
                if done: break
        except Exception: pass
        finally:
            try:
                if up: up.close()
            except Exception: pass

class _ProxyServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True; daemon_threads = True

_proxy = None; _proxy_lock = threading.Lock()
def start_guard_proxy():
    global _proxy
    with _proxy_lock:
        if _proxy is None:
            _proxy = _ProxyServer(("127.0.0.1", 0), _ProxyHandler); threading.Thread(target=_proxy.serve_forever, daemon=True).start()
        return _proxy.server_address[1]
