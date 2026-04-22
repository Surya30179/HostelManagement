from flask import Blueprint, request, jsonify
from models import db, User, ROLES
from auth import role_required

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/api/admin/users", methods=["GET"])
@role_required("ADMIN")
def get_all_users():
    users = User.query.all()
    # Safely get telegram ID and role
    return jsonify([{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "telegram_chat_id": u.telegram_chat_id
    } for u in users]), 200

@admin_bp.route("/api/admin/user/<int:user_id>/role", methods=["PUT"])
@role_required("ADMIN")
def update_user_role(user_id):
    data = request.json
    new_role = data.get("role")
    new_chat_id = data.get("telegram_chat_id")
    new_department = data.get("department")

    if new_role and new_role not in ROLES:
        return jsonify({"error": "Invalid role"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if new_role:
        user.role = new_role
    
    if new_chat_id is not None:
        user.telegram_chat_id = new_chat_id
        
    if new_department is not None:
        from models import BRANCHES
        if new_department and new_department not in BRANCHES:
            return jsonify({"error": "Invalid department"}), 400
        user.department = new_department

    db.session.commit()
    return jsonify({"message": "User updated successfully"}), 200
