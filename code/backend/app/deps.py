from fastapi import Depends
from .auth import get_current_user, role_required, User

# =========================
# DB SESSION (stub for now)
# =========================
def get_db():
    db = None
    try:
        yield db
    finally:
        if db:
            db.close()

# =========================
# ROLE SHORTCUTS
# =========================
AdminOnly = Depends(role_required(["admin"]))
AnalystOrAbove = Depends(role_required(["admin", "analyst"]))
AnyUser = Depends(role_required(["admin", "analyst", "viewer"]))