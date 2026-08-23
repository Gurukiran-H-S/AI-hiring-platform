"""Deep smoke test: all GET endpoints + authed recruiter/candidate flows."""
import sys
import logging

logging.disable(logging.INFO)
sys.path.insert(0, ".")

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.middleware.auth_middleware import get_current_recruiter, get_current_user

db = SessionLocal()
recruiter = db.query(User).filter(User.role == UserRole.RECRUITER).first()
candidate = db.query(User).filter(User.role == UserRole.CANDIDATE).first()
admin = db.query(User).filter(User.role == UserRole.ADMIN).first()

# Override auth for role-specific checks
app.dependency_overrides[get_current_recruiter] = lambda: recruiter
if candidate:
    app.dependency_overrides[get_current_user] = lambda: candidate

client = TestClient(app, raise_server_exceptions=False)
failures = []

def hit(method, path, expect_lt=500, label=""):
    try:
        r = client.request(method, path)
        flag = "  <<< ERROR" if r.status_code >= expect_lt else ""
        if r.status_code >= expect_lt:
            failures.append((method, path, r.status_code, r.text[:300]))
        print(f"  {r.status_code}  {method:5} {path} {label}{flag}")
        return r
    except Exception as e:
        print(f"  EXC  {method:5} {path}: {str(e)[:150]}")
        failures.append((method, path, "EXC", str(e)[:300]))
        return None

print("== PUBLIC ==")
hit("GET", "/health")
hit("GET", "/api/trends")
hit("GET", "/api/jobs/search")

print("== CANDIDATE (authed) ==")
hit("GET", "/api/resumes/")
hit("GET", "/api/candidate/profile")
hit("GET", "/api/applications/")
hit("GET", "/api/coding/problems")
hit("GET", "/api/coding/profile")
hit("GET", "/api/notifications")

print("== RECRUITER (authed) ==")
jobs = db.query(Job := __import__("app.models.job", fromlist=["Job"]).Job).filter(
    __import__("app.models.job", fromlist=["Job"]).Job.recruiter_id == recruiter.id
).all()
for j in jobs[:2]:
    hit("GET", f"/api/recruiter/jobs/{j.id}/rankings", label=f"({j.title})")
    hit("GET", f"/api/recruiter/jobs/{j.id}/weights")
    hit("GET", f"/api/recruiter/jobs/{j.id}/analytics")
    hit("POST", f"/api/recruiter/jobs/{j.id}/recalculate")
    hit("GET", f"/api/recruiter/jobs/{j.id}/candidates")
hit("GET", "/api/recruiter/jobs")
hit("GET", "/api/recruiter/interviews")

db.close()
print("=" * 50)
if failures:
    print(f"FAILURES ({len(failures)}):")
    for m, p, s, t in failures:
        print(f"  {m} {p} -> {s}\n    {t}")
    sys.exit(1)
print("ALL PASSED")