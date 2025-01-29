from flask_bcrypt import generate_password_hash, check_password_hash
from database import db

class User(db.Model):
    __tablename__ = 'users'  # 明確指定表名

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, name='uq_user_username')  # 命名約束
    password_hash = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, name='uq_user_email')  # 命名約束
    photo_path = db.Column(db.String(255))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
