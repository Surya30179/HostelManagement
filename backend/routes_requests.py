"""
Outing request routes — create, list pending, approve, reject.
"""

import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g

from models import (
    db,
    OutingRequest,
    STATE_TRANSITIONS,
    ROLE_TO_PENDING_STATUS,
    STATUS_TO_TIMESTAMP_FIELD,
)
from auth import role_required, login_required
from notifier import send_notification

requests_bp = Blueprint("requests", __name__)


# ── Student: create a new outing request ─────────────────────────────────────

@requests_bp.route("/api/request", methods=["POST"])
@role_required("STUDENT")
def create_request():
    data = request.get_json() or {}
    destination = data.get("destination", "").strip()
    purpose = data.get("purpose", "").strip()
    exit_time = data.get("exit_time")
    return_time = data.get("return_time")

    if not all([destination, purpose, exit_time, return_time]):
        return jsonify({"error": "All fields are required"}), 400

    try:
        exit_dt = datetime.fromisoformat(exit_time)
        return_dt = datetime.fromisoformat(return_time)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid date format. Use ISO 8601."}), 400

    outing = OutingRequest(
        student_id=g.user_id,
        destination=destination,
        purpose=purpose,
        exit_time=exit_dt,
        return_time=return_dt,
        status="PENDING_COORD",
    )
    db.session.add(outing)
    db.session.commit()

    # Notify coordinator
    send_notification(
        "COORDINATOR",
        f"<b>New request #{outing.id}</b> from <b>{g.user_name}</b>\n"
        f"📍 {destination}\n📝 {purpose}",
    )

    return jsonify(outing.to_dict()), 201


# ── Student: view own requests ───────────────────────────────────────────────

@requests_bp.route("/api/requests/my", methods=["GET"])
@role_required("STUDENT")
def my_requests():
    reqs = (
        OutingRequest.query
        .filter_by(student_id=g.user_id)
        .order_by(OutingRequest.created_at.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in reqs])


# ── Approver: view pending requests ─────────────────────────────────────────

@requests_bp.route("/api/requests/pending", methods=["GET"])
@role_required("COORDINATOR", "HOD", "PRINCIPAL", "WARDEN")
def pending_requests():
    needed_status = ROLE_TO_PENDING_STATUS.get(g.role)
    if not needed_status:
        return jsonify([])

    from models import User
    viewer = User.query.get(g.user_id)

    if g.role in ["COORDINATOR", "HOD", "WARDEN"]:
        if not viewer.department:
            return jsonify({"error": "You must be assigned a department by the Admin to view branch requests"}), 403
            
        reqs = (
            OutingRequest.query
            .join(User, OutingRequest.student_id == User.id)
            .filter(OutingRequest.status == needed_status)
            .filter(User.department == viewer.department)
            .order_by(OutingRequest.created_at.asc())
            .all()
        )
    else:
        reqs = (
            OutingRequest.query
            .filter_by(status=needed_status)
            .order_by(OutingRequest.created_at.asc())
            .all()
        )
        
    return jsonify([r.to_dict() for r in reqs])


# ── Approver: approve a request ─────────────────────────────────────────────

@requests_bp.route("/api/request/<int:req_id>/approve", methods=["POST"])
@role_required("COORDINATOR", "HOD", "PRINCIPAL", "WARDEN")
def approve_request(req_id):
    outing = OutingRequest.query.get_or_404(req_id)

    # Check this role can approve this status
    transition = STATE_TRANSITIONS.get(outing.status)
    if not transition:
        return jsonify({"error": "Request cannot be approved in its current state"}), 400

    required_role, next_status = transition
    if g.role != required_role:
        return jsonify({"error": f"Only {required_role} can approve at this stage"}), 403

    # Set audit timestamp
    ts_field = STATUS_TO_TIMESTAMP_FIELD.get(outing.status)
    if ts_field:
        setattr(outing, ts_field, datetime.now(timezone.utc))

    # Advance state
    outing.status = next_status

    # If final approval by Warden → generate QR code
    if next_status == "APPROVED":
        outing.qr_code = f"OUTING-{outing.id}-{uuid.uuid4().hex[:12].upper()}"

    db.session.commit()

    # Notify next approver (if there is one)
    next_transition = STATE_TRANSITIONS.get(next_status)
    if next_transition:
        next_role = next_transition[0]
        send_notification(
            next_role,
            f"<b>Request #{outing.id}</b> needs your approval.\n"
            f"👤 {outing.student.name}\n"
            f"📍 {outing.destination}\n"
            f"Approved by: {g.role}",
        )

    return jsonify({"message": f"Approved. Status → {next_status}", "request": outing.to_dict()})


# ── Approver: reject a request ───────────────────────────────────────────────

@requests_bp.route("/api/request/<int:req_id>/reject", methods=["POST"])
@role_required("COORDINATOR", "HOD", "PRINCIPAL", "WARDEN")
def reject_request(req_id):
    outing = OutingRequest.query.get_or_404(req_id)

    transition = STATE_TRANSITIONS.get(outing.status)
    if not transition:
        return jsonify({"error": "Request cannot be acted on in its current state"}), 400

    required_role, _ = transition
    if g.role != required_role:
        return jsonify({"error": f"Only {required_role} can act at this stage"}), 403

    outing.status = "REJECTED"
    outing.rejected_by = g.role
    db.session.commit()

    return jsonify({"message": "Request rejected", "request": outing.to_dict()})


# ── All requests (admin/debug view) ─────────────────────────────────────────

@requests_bp.route("/api/requests/all", methods=["GET"])
@login_required
def all_requests():
    reqs = OutingRequest.query.order_by(OutingRequest.created_at.desc()).all()
    return jsonify([r.to_dict() for r in reqs])
