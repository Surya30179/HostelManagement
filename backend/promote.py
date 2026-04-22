from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    user = User.query.filter_by(email="231093.cs@rmkec.ac.in").first()
    if user:
        user.role = "ADMIN"
        db.session.commit()
        print("Successfully promoted 231093.cs@rmkec.ac.in to ADMIN!")
    else:
        print("Error: User 231093.cs@rmkec.ac.in not found in the database. Did you log in first?")
