import os, re, shutil, subprocess, pytest
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def read(p): return open(os.path.join(ROOT, p), encoding="utf-8").read()

def test_every_selector_id_used_by_js_exists():
    js, html = read("static/app.js"), read("static/index.html")
    used = set(re.findall(r'\$\("#([A-Za-z0-9_-]+)"\)', js)); defined = set(re.findall(r'id="([A-Za-z0-9_-]+)"', html + js))
    assert not (used - defined), f"JS references missing ids: {sorted(used - defined)}"

def test_every_nav_view_has_a_section():
    js, html = read("static/app.js"), read("static/index.html"); views = re.findall(r'\["([a-z]+)","[^"]+","[a-z0-9-]+"\]', js.split("const NAV=")[1].split("];")[0])
    assert all(f'id="v-{v}"' in html for v in views if v != "-")

@pytest.mark.skipif(not shutil.which("node"), reason="node not installed")
def test_javascript_syntax_and_electron_url_policy():
    assert subprocess.run(["node", "--check", os.path.join(ROOT, "static/app.js")]).returncode == 0
    assert subprocess.run(["node", os.path.join(ROOT, "tests/electron_policy.test.js")], capture_output=True, text=True, cwd=ROOT).returncode == 0

def test_env_example_has_no_real_secrets_and_requirements_complete():
    env = read(".env.example"); assert "gsk_" not in env and "GROQ_API_KEY=" in env
    req = read("requirements.txt").lower()
    for pkg in ("flask", "playwright", "langgraph", "pandas", "openpyxl", "beautifulsoup4", "requests"): assert pkg in req
