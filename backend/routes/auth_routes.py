from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from services.auth_services import register_user, authenticate_user

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    confirmPassword = data.get('confirmPassword')
    email = data.get('email')
    
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
    
    user = register_user(username, password, confirmPassword, email)
    if not user:
        return jsonify({"error": "Username already exists"}), 400
    
    return jsonify({"message": "User registered successfully"}), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"error": "Missing username or password"}), 400
        
        user = authenticate_user(username, password)
        if user is None:  # 檢查是否為 None
            return jsonify({"error": "Invalid username or password"}), 401
        
        access_token = create_access_token(identity=user.id)
        return jsonify({
            "token": access_token,
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "photo_path": user.photo_path
        }), 200
    
    except Exception as e:
        return jsonify({
            "error": "An error occurred during login",
            "details": str(e)
        }), 500