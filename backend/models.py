"""
Database models — User and OutingRequest with state-machine status.
"""

from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# ── Enums ────────────────────────────────────────────────────────────────────

ROLES = ["STUDENT", "COORDINATOR", "HOD", "PRINCIPAL", "WARDEN", "SECURITY_GUARD", "ADMIN"]
BRANCHES = ["CSE", "AIDS", "MECH", "ECE", "CIVIL", "CSBS"]
YEARS = ["1", "2", "3", "4"]

STATUSES = [
    "PENDING_COORD",
    "PENDING_HOD",
    "PENDING_PRINCIPAL",
    "PENDING_WARDEN",
    "APPROVED",
    "REJECTED",
]

# State machine: maps current status → (required role, next status)
STATE_TRANSITIONS = {
    "PENDING_COORD":     ("COORDINATOR", "PENDING_HOD"),
    "PENDING_HOD":       ("HOD",         "PENDING_PRINCIPAL"),
    "PENDING_PRINCIPAL": ("PRINCIPAL",   "PENDING_WARDEN"),
    "PENDING_WARDEN":    ("WARDEN",      "APPROVED"),
}

# Which role sees which status in their pending queue
ROLE_TO_PENDING_STATUS = {
    "COORDINATOR": "PENDING_COORD",
    "HOD":         "PENDING_HOD",
    "PRINCIPAL":   "PENDING_PRINCIPAL",
    "WARDEN":      "PENDING_WARDEN",
}

# Maps status to the audit timestamp field updated on approval
STATUS_TO_TIMESTAMP_FIELD = {
    "PENDING_COORD":     "coord_approved_at",
    "PENDING_HOD":       "hod_approved_at",
    "PENDING_PRINCIPAL": "principal_approved_at",
    "PENDING_WARDEN":    "warden_approved_at",
}


# ── Models ───────────────────────────────────────────────────────────────────

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(256), nullable=False, unique=True)
    password_hash = db.Column(db.String(256), nullable=True)
    role = db.Column(db.String(20), nullable=False, default="STUDENT")
    department = db.Column(db.String(20), nullable=True)
    academic_year = db.Column(db.String(10), nullable=True)
    telegram_chat_id = db.Column(db.String(64), nullable=True)

    requests = db.relationship("OutingRequest", backref="student", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "academic_year": self.academic_year
        }


class OutingRequest(db.Model):
    __tablename__ = "outing_requests"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    destination = db.Column(db.String(256), nullable=False)
    purpose = db.Column(db.String(512), nullable=False)
    exit_time = db.Column(db.DateTime, nullable=False)
    return_time = db.Column(db.DateTime, nullable=False)

    # State machine
    status = db.Column(db.String(20), nullable=False, default="PENDING_COORD")

    # Audit timestamps
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    coord_approved_at = db.Column(db.DateTime, nullable=True)
    hod_approved_at = db.Column(db.DateTime, nullable=True)
    principal_approved_at = db.Column(db.DateTime, nullable=True)
    warden_approved_at = db.Column(db.DateTime, nullable=True)
    rejected_by = db.Column(db.String(20), nullable=True)

    # QR code (generated on final APPROVED)
    qr_code = db.Column(db.String(128), nullable=True, unique=True)

    # Security guard scan times
    actual_exit_time = db.Column(db.DateTime, nullable=True)
    actual_entry_time = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": self.student.name if self.student else None,
            "destination": self.destination,
            "purpose": self.purpose,
            "exit_time": self.exit_time.isoformat() if self.exit_time else None,
            "return_time": self.return_time.isoformat() if self.return_time else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "coord_approved_at": self.coord_approved_at.isoformat() if self.coord_approved_at else None,
            "hod_approved_at": self.hod_approved_at.isoformat() if self.hod_approved_at else None,
            "principal_approved_at": self.principal_approved_at.isoformat() if self.principal_approved_at else None,
            "warden_approved_at": self.warden_approved_at.isoformat() if self.warden_approved_at else None,
            "rejected_by": self.rejected_by,
            "qr_code": self.qr_code,
            "actual_exit_time": self.actual_exit_time.isoformat() if self.actual_exit_time else None,
            "actual_entry_time": self.actual_entry_time.isoformat() if self.actual_entry_time else None,
        }
