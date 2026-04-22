"""
Authentication routes — login and register.
"""

from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from models import db, User, ROLES, BRANCHES, YEARS
from auth import generate_token, role_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/user/profile", methods=["PUT"])
@role_required("STUDENT")
def update_student_profile():
    from flask import g
    user_id = g.user_id
    data = request.get_json() or {}
    
    department = data.get("department")
    academic_year = data.get("academic_year")

    if department not in BRANCHES:
        return jsonify({"error": f"Invalid branch. Must be one of {BRANCHES}"}), 400
    if academic_year not in YEARS:
        return jsonify({"error": f"Invalid year. Must be one of {YEARS}"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.department = department
    user.academic_year = academic_year
    db.session.commit()

    # Re-issue token so the frontend context updates
    token = generate_token(user)
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_token(user)
    return jsonify({"token": token, "user": user.to_dict()})


@auth_bp.route("/api/google-login", methods=["POST"])
def google_login():
    data = request.get_json() or {}
    token = data.get("credential")

    if not token:
        return jsonify({"error": "Google credential token missing"}), 400

    client_id = current_app.config.get("GOOGLE_CLIENT_ID")
    if not client_id:
        return jsonify({"error": "Google Auth is not configured on the server. Please set GOOGLE_CLIENT_ID in the .env"}), 500

    try:
        # Verify token
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        email = idinfo.get("email")
        name = idinfo.get("name")

        if not email:
            return jsonify({"error": "No email provided by Google"}), 400

        # Sync with database
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                name=name or email.split("@")[0],
                email=email,
                role="STUDENT"
            )
            db.session.add(user)
            db.session.commit()

        internal_token = generate_token(user)
        return jsonify({"token": internal_token, "user": user.to_dict()})
    except ValueError:
        return jsonify({"error": "Invalid Google login token"}), 401


@auth_bp.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "STUDENT").upper()

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if role not in ROLES:
        return jsonify({"error": f"Invalid role. Must be one of: {ROLES}"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role=role,
    )
    db.session.add(user)
    db.session.commit()

    token = generate_token(user)
    return jsonify({"token": token, "user": user.to_dict()}), 201
