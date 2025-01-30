from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, create_refresh_token
from services.auth_services import register_user, authenticate_user, update_user_photo, update_user_data

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    confirmPassword = data.get('confirmPassword')
    email = data.get('email')
    
    if not username or not password:
        return jsonify({"message": "尚未輸入完整資料"}), 400
    
    user = register_user(username, password, confirmPassword, email)
    
    if not user:
        return jsonify({"message": "此名稱已經存在"}), 400

    return user

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"message": "尚未輸入帳號或密碼"}), 400
        
        user = authenticate_user(username, password)
        if user is None:  # 檢查是否為 None
            return jsonify({"message": "名稱或密碼錯誤"}), 401
        
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        access_token = create_access_token(identity=user.id)
        return jsonify({
            "token": access_token,
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "photo_path": user.photo_path,
            "photo_base64": user.photo_base64,
            "save_path": user.save_path,
            "refresh_token": refresh_token
        }), 200
    
    except Exception as e:
        return jsonify({
            "message": "An message occurred during login",
            "details": str(e)
        }), 500
        
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)  # 只有 Refresh Token 可以存取
def refresh_token():
    user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=user_id)
    return jsonify({"access_token": new_access_token}), 200

@auth_bp.route('/photo', methods=['POST'])
@jwt_required()
def upload_photo():
    try:
        data = request.get_json()

        base64_string = data.get('photo_base64')
        file_name = data.get('file_name')

        if not isinstance(base64_string, str) or not isinstance(file_name, str):
            return jsonify({"status": "error", "message": "photo_base64 和 file_name 必須是字串"}), 422

        # 如果 Base64 以 'data:image' 開頭，則移除前綴
        if base64_string.startswith("data:image"):
            base64_string = base64_string.split(',')[1]

        user_id = get_jwt_identity()
        response, status_code = update_user_photo(user_id, base64_string, file_name)

        return jsonify(response), status_code

    except Exception as e:
        return jsonify({"status": "error", "message": f"請求處理失敗: {str(e)}"}), 500

# 新增/修改使用者資料
@auth_bp.route('/setting', methods=['PUT'])
@jwt_required()
def update_data():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        response = update_user_data(user_id, data)
        return response

    except Exception as e:
        return {
            "status": "error",
            "message": f"請求處理失敗: {str(e)}"
        }, 500