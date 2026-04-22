"""
QR code scanning route for the Security Guard.
"""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify

from models import db, OutingRequest
from auth import role_required

scan_bp = Blueprint("scan", __name__)


@scan_bp.route("/api/scan", methods=["POST"])
@role_required("SECURITY_GUARD")
def scan_qr():
    """
    Security guard scans the QR code:
      - First scan  → records actual_exit_time
      - Second scan → records actual_entry_time
    """
    data = request.get_json() or {}
    qr_code = data.get("qr_code", "").strip()

    if not qr_code:
        return jsonify({"error": "QR code is required"}), 400

    outing = OutingRequest.query.filter_by(qr_code=qr_code).first()
    if not outing:
        return jsonify({"error": "Invalid QR code — no matching pass found"}), 404

    if outing.status != "APPROVED":
        return jsonify({"error": f"Pass is not approved (status: {outing.status})"}), 400

    now = datetime.now(timezone.utc)

    if outing.actual_exit_time is None:
        outing.actual_exit_time = now
        db.session.commit()
        return jsonify({
            "message": "Exit recorded",
            "action": "EXIT",
            "time": now.isoformat(),
            "student_name": outing.student.name,
            "destination": outing.destination,
            "expected_return": outing.return_time.isoformat() if outing.return_time else None,
        })

    if outing.actual_entry_time is None:
        outing.actual_entry_time = now
        db.session.commit()
        return jsonify({
            "message": "Entry recorded — pass completed",
            "action": "ENTRY",
            "time": now.isoformat(),
            "student_name": outing.student.name,
        })

    return jsonify({"error": "This pass has already been fully used (exit + entry recorded)"}), 400
