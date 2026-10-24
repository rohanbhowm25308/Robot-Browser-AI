import io, pandas as pd, pytest
from conftest import H_

def test_demo_finds_error_and_correction_rechecks(client):
    r = client.post("/api/busted/demo", headers=H_).json; red = [i for i in r["issues"] if i["status"] == "red"]
    assert len(red) == 1 and red[0]["fix"]["value"] == 1000.0 and "not an authenticity" in r["score_label"]
    r2 = client.post("/api/busted/correct", headers=H_, json={"id": r["id"], "ids": [red[0]["id"]]}).json
    assert r2["score"] > r["score"] and not [i for i in r2["issues"] if i["status"] == "red"] and r2["corrected"] and len(r2["history"]) >= 3

def test_total_row_hidden_sheet_formula_checks(client):
    df = pd.DataFrame({"Item": ["a", "b", "Total"], "Amount": [10, 20, 99]}); b = io.BytesIO()
    with pd.ExcelWriter(b, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="S"); w.book.create_sheet("secret").sheet_state = "hidden"; w.book["S"]["D2"] = "=SUM(B2:B3)"
    b.seek(0); r = client.post("/api/busted/analyze", headers=H_, data={"file": (b, "t.xlsx")}).json; names = {c["name"]: c["status"] for c in r["checks"]}
    assert names["Total row equals column sums"] == "red" and names["Hidden sheets / rows / columns"] == "yellow" and names["Formulas"] == "yellow" and names["Authenticity"] == "gray"

def test_four_statuses_are_kept_separate_and_unsupported_claims_are_gray(client, appm, llm, monkeypatch):
    monkeypatch.setattr(appm, "ddg", lambda q, n=4: [{"title": "E", "url": "https://x.test", "snippet": "The Eiffel Tower is 330 metres tall"}])
    seq = [{"claims": ["The Eiffel Tower is 330 m tall"]}, {"status": "verified", "explanation": "ok", "suggestion": "", "quote": "totally invented words not in evidence"}]
    monkeypatch.setattr(appm, "llm_json", lambda m: seq.pop(0))
    r = client.post("/api/busted/analyze", headers=H_, data={"file": (io.BytesIO(b"The Eiffel Tower is 330 m tall."), "a.txt")}).json
    assert any(c["status"] == "gray" and c["name"].startswith("Claim") for c in r["checks"]) and not any(c["status"] == "green" and c["name"].startswith("Claim") for c in r["checks"])

def test_unsupported_file_rejected(client): assert client.post("/api/busted/analyze", headers=H_, data={"file": (io.BytesIO(b"x"), "a.exe")}).status_code == 400

BUG = "def add(a,b):\n    return a-b\n"; FIXED = "def add(a,b):\n    return a+b\n"
def stub(appm, monkeypatch, fixed, tests): monkeypatch.setattr(appm, "llm_json", lambda m: {"summary": "s", "issues": [], "fixed_code": fixed, "tests": tests}); monkeypatch.setattr(appm, "KEY", "k")

def test_verified_only_when_tests_fail_before_and_pass_after(client, appm, monkeypatch):
    stub(appm, monkeypatch, FIXED, "from solution import *\nassert add(2,3)==5\n"); r = client.post("/api/code", headers=H_, json={"code": BUG, "lang": "python", "run": True}).json
    assert r["verdict_ok"] and r["test_original"]["status"] == "fail" and r["test_fixed"]["status"] == "pass"

def test_weak_tests_are_not_proof(client, appm, monkeypatch):
    stub(appm, monkeypatch, BUG, "from solution import *\nassert add(2,0)==2\n"); assert client.post("/api/code", headers=H_, json={"code": BUG, "lang": "python", "run": True}).json["verdict"].startswith("NOT PROVEN")

def test_failed_fix_detected_and_not_run_unless_requested(client, appm, monkeypatch):
    stub(appm, monkeypatch, "def add(a,b):\n    return a*b\n", "from solution import *\nassert add(2,3)==5\n")
    assert client.post("/api/code", headers=H_, json={"code": BUG, "lang": "python", "run": True}).json["verdict"].startswith("FIX FAILED")
    assert "verdict" not in client.post("/api/code", headers=H_, json={"code": BUG, "lang": "python"}).json

def test_user_tests_override_ai_tests_and_timeout_is_enforced(client, appm, monkeypatch):
    stub(appm, monkeypatch, FIXED, "assert False"); r = client.post("/api/code", headers=H_, json={"code": BUG, "lang": "python", "run": True, "tests": "from solution import *\nassert add(1,1)==2\n"}).json
    assert r["tests_source"] == "yours" and r["verdict_ok"]
    assert "Timed out" in appm.run_tests("python", "import time\ntime.sleep(30)\n", "import solution\n", timeout=2)["output"]

def test_unsupported_language_is_reported(client, appm, monkeypatch):
    stub(appm, monkeypatch, "x", "t"); assert "supports Python" in client.post("/api/code", headers=H_, json={"code": "int x;", "lang": "c++", "run": True}).json["verdict"]
