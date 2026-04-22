"""
Flask application factory with blueprint registration.
"""

import logging
from flask import Flask
from flask_cors import CORS

from config import Config
from models import db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS — allow React dev server
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)

    # Register blueprints
    from routes_auth import auth_bp
    from routes_requests import requests_bp
    from routes_scan import scan_bp
    from routes_admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(requests_bp)
    app.register_blueprint(scan_bp)
    app.register_blueprint(admin_bp)

    with app.app_context():
        db.create_all()

    return app


# ── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
