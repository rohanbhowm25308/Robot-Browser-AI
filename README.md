# Robot Browser AI
AI-native browser workspace (HTML/CSS/JS + Flask + Groq). Built with AdaL by Sylph (development tool, not a runtime dependency).

## Run
```
python -m venv venv && venv\Scripts\activate      # Windows (Linux/Mac: source venv/bin/activate)
pip install -r requirements.txt
playwright install chromium
# open .env and paste your key:  GROQ_API_KEY=gsk_...
python app.py
```
Open http://127.0.0.1:5000

## Features (all wired to real backend code)
- Research-to-Excel mission: plan -> Ghost Twin preview -> approve -> web search -> open real pages -> extract -> Excel -> read-back verification
- Proof-of-Work timeline (sources, timestamps, results), pause / manual takeover / cancel, Phoenix recovery (retry, then switch source), mission fork
- AI Council: Researcher (extraction), Critic (flags Unknown/partial rows), Verifier (re-reads the Excel file)
- Voice (Whisper via Groq), Screenshot to Action (Groq vision; suggestions only), AI chat
- Code Surgeon (LLM review + diff + real Python syntax check), GTM Architect, Website X-Ray
- BUSTED AI: CSV/Excel arithmetic, duplicate, missing, outlier checks; PDF/DOCX/TXT/image claim checking with web evidence; correct + recheck; report download

## Test the failure path
Unset the key -> chat returns a clear error; missions still run but mark fields Unknown. Use a bad topic or offline network -> mission ends "failed" with the reason logged.

## AdaL evidence
Record your AdaL sessions (screen recording) while you modify/debug this code, and keep the screenshots in /docs.

## Real browser automation (Playwright)
BROWSER_MODE=playwright (default) launches a visible Chromium window during research missions and saves a screenshot of every page (shown in the mission timeline). Set HEADLESS=true to hide it, or BROWSER_MODE=requests for plain HTTP. If Chromium is missing, the mission logs a warning and falls back automatically.

## Desktop app (Electron)
```
cd electron && npm install && npm start
```
It starts the Flask backend itself and opens Robot Browser AI in a desktop window.

## Also included
Trust Radar (prompt-injection / HTTPS / look-alike / hype scan on every page the agent opens, plus a Browser-view button), Agent Memory (Settings; local, opt-in, deletable), AI Council modes (full / critic / off) with a grounding check, mission fork with assumptions, microphone on every chat input.

## Security model
- App binds to 127.0.0.1 only; requests need a session cookie (set when you open the app) and a localhost Host header; cross-origin POSTs are rejected. Set APP_PASSWORD in .env to also require a password.
- Every untrusted fetch (reader proxy, research pages, agent navigation) goes through `netguard.py`: URL validation, manual redirect checking, connection pinned to the validated IP (blocks DNS rebinding), private/loopback/link-local addresses blocked, 5-8 MB response cap. Chromium requests are checked one by one (including redirects and sub-resources).
- Reader proxy: scripts/iframes removed, strict CSP, only HTML, images, PDF and plain text pass through.
- Residual risk: Chromium resolves DNS itself, so the per-request check there is not IP-pinned. Run on a trusted network.

## Agents
- Research missions run as a LangGraph graph: collect -> critic -> (revise loop) -> grounding -> verify (with rewrite retry).
- Browser Agent (Research view): general Playwright agent (observe -> decide -> act -> check). Sensitive clicks need your approval; it refuses password/payment fields; it finishes only with a quote that is found on the real page.
- Code Surgeon: tick "Run tests" to execute tests on the original and fixed code. "VERIFIED" appears only if tests fail before and pass after. This runs code on your computer (not a hardened sandbox).
- BUSTED AI: statuses stay separate (verified / confirmed error / suspicious / cannot verify). It never claims authenticity.

## Secure local access (no automatic sessions)
Starting `python app.py` prints a ONE-TIME launch link and opens it. Opening http://127.0.0.1:5000 directly shows "Locked". The link works once and then becomes invalid; the browser keeps a session cookie until you stop the server. The desktop app generates its own token. With APP_PASSWORD set you need the link AND the password. All state-changing requests also need a custom header, defeating cross-site requests.

## Chromium network isolation
Chromium is launched through a local guard proxy (`netguard.py`) that resolves DNS itself, validates every address, connects to the validated IP only and does not bypass loopback. Tests cover loopback, localhost and DNS rebinding.

## Agent approval policy, criteria and limits
- Needs your approval: sensitive clicks, any button inside a form, Enter inside a form, and any page-initiated POST/PUT/DELETE (blocked at the network layer until you allow it).
- Success criteria (page contains / URL contains / quote) are checked by the system after the agent finishes. Review them in the plan before approving. A quote criterion proves the quote exists on a visited page, not that the answer is semantically correct.
- Step limit is configurable (3-40). If it is reached (or the agent gets stuck) the mission is INCOMPLETE with a report and can be continued from a checkpoint. Logins and form values are not restored on continue.

## Desktop app link policy
`electron/urlpolicy.js` allows only http(s), no embedded credentials, no localhost/private/internal hosts (DNS-checked), and asks you to confirm before `shell.openExternal`.

## Automated tests
```
pip install -r requirements-dev.txt
playwright install chromium      # browser tests are skipped automatically if Chromium is missing
python -m pytest -q              # about 1 minute
```
71 tests cover: launch-token auth, request guards, SSRF/redirect/size/DNS-rebinding protection (Python and real Chromium), reader proxy rules, Trust Radar, LangGraph council loop, Phoenix recovery, Excel verification, agent approvals (form submit, Enter, page JS writes, downloads, passwords), exactly-once writes, success-criteria verification (HTTP status, element, URL, text, download), step limit and checkpoint continue, BUSTED checks and corrections, Code Surgeon verdicts, Electron URL policy, and frontend id consistency. The suite uses local test servers and a scripted AI, so it needs no internet or API key. The self-test in Settings covers the live parts (Groq, search, real sites).

## What "verified" means for browser actions
The system checks real evidence: the HTTP status of requests the agent sent, page text/DOM elements after the action, the URL, and saved files (size + SHA-256). It cannot see outside the browser (confirmation emails, payment settlement, server-side records). The report says so, and a submission with no outcome criterion is never reported as complete.

## Deploying on Render (hosted mode)
Render is detected automatically (RENDER=true). Hosted mode: password login (APP_PASSWORD is required), no launch-token link, secure cookies, HSTS, rate-limited login, `/healthz` for health checks, only Render's hostname accepted. Chromium is not available on a standard Render Python service, so set BROWSER_MODE=requests: the Browser Agent and Chromium snapshot are disabled (clearly shown in the UI); research, chat, voice, BUSTED, Code Surgeon, GTM, reader browser, Trust Radar and memory all work.
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 8 --timeout 120`   (keep 1 worker: missions run in in-memory threads)
- Environment: APP_PASSWORD, GROQ_API_KEY, SESSION_SECRET (random), BROWSER_MODE=requests, PYTHON_VERSION=3.12.7
- Storage is ephemeral unless you add a Render Disk and set DATA_DIR to its mount path (history and generated files are otherwise lost on every deploy/restart).

## Public demo mode (no password) - PUBLIC_DEMO=1
Set `PUBLIC_DEMO=1` on Render to open the site to everyone with no login (APP_PASSWORD is then ignored). Every visitor gets a private session: missions, history, BUSTED results and downloads are visible only to that visitor. Safeguards: per-IP rate limits on AI calls (25/10 min), page fetching (120/10 min) and mission starts (6/10 min); max 2 missions running at once; Agent Memory and the self-test are disabled. All visitors share YOUR Groq API key, so the limits reduce but do not remove the risk of someone using up your quota. To lock the site again: remove PUBLIC_DEMO and set APP_PASSWORD.
