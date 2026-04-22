"""
JWT authentication helpers and RBAC decorator.
"""

import jwt
import functools
from datetime import datetime, timedelta, timezone
from flask import request, jsonify, g, current_app


def generate_token(user):
    """Create a JWT token containing user_id and role."""
    payload = {
        "user_id": user.id,
        "role": user.role,
        "name": user.name,
        "exp": datetime.now(timezone.utc)
        + timedelta(hours=current_app.config["JWT_EXPIRY_HOURS"]),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def decode_token(token):
    """Decode and validate a JWT token. Returns the payload dict."""
    return jwt.decode(
        token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"]
    )


def get_current_user():
    """
    Extract user info from the Authorization header.
    Sets g.user_id, g.role, g.user_name on success.
    Returns (payload, None) on success or (None, error_response) on failure.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, (jsonify({"error": "Missing or invalid token"}), 401)

    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_token(token)
        g.user_id = payload["user_id"]
        g.role = payload["role"]
        g.user_name = payload.get("name", "")
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, (jsonify({"error": "Token expired"}), 401)
    except jwt.InvalidTokenError:
        return None, (jsonify({"error": "Invalid token"}), 401)


def role_required(*allowed_roles):
    """
    Decorator that enforces RBAC on an endpoint.
    Usage: @role_required("COORDINATOR", "HOD")
    """

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            payload, err = get_current_user()
            if err:
                return err
            if g.role not in allowed_roles:
                return jsonify({"error": "Forbidden — insufficient role"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def login_required(fn):
    """Decorator — any authenticated user can access."""

    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        _, err = get_current_user()
        if err:
            return err
        return fn(*args, **kwargs)

    return wrapper
