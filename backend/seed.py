"""
Seed demo users for testing — one per role.
Run:  python seed.py
"""

from werkzeug.security import generate_password_hash
from app import create_app
from models import db, User

DEMO_USERS = [
    ("Alice Student",     "student@demo.com",     "password", "STUDENT"),
    ("Bob Coordinator",   "coordinator@demo.com", "password", "COORDINATOR"),
    ("Carol HOD",         "hod@demo.com",         "password", "HOD"),
    ("Dave Principal",    "principal@demo.com",    "password", "PRINCIPAL"),
    ("Eve Warden",        "warden@demo.com",      "password", "WARDEN"),
    ("Frank Guard",       "guard@demo.com",        "password", "SECURITY_GUARD"),
]


def seed():
    app = create_app()
    with app.app_context():
        for name, email, pwd, role in DEMO_USERS:
            if not User.query.filter_by(email=email).first():
                user = User(
                    name=name,
                    email=email,
                    password_hash=generate_password_hash(pwd),
                    role=role,
                )
                db.session.add(user)
                print(f"  ✓ Created {role}: {email}")
            else:
                print(f"  – {email} already exists, skipped")
        db.session.commit()
        print("\nDone! All demo users seeded.")


if __name__ == "__main__":
    seed()
