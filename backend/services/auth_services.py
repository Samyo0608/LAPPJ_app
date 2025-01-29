from models.auth_model import User
from database import db

def register_user(username, password, confirmPassword, email):
    if password != confirmPassword:
        return {"message": "密碼不一致"}, 400
    if User.query.filter_by(username=username).first():
        return {"message": "用戶名已存在"}, 400
    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    user.email = email
    db.session.commit()
    return {"message": "註冊成功"}, 201

def authenticate_user(username, password):
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        return user  # 直接返回 user 對象，而不是元組
    return None