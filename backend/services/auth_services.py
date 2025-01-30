from models.auth_model import User
from database import db

def register_user(username: str, password: str, confirmPassword: str, email: str):
    if password != confirmPassword:
        return {"message": "密碼不一致"}, 400
    if User.query.filter_by(username=username).first():
        return {"message": "此名稱已存在"}, 400
    if User.query.filter_by(email=email).first():
        return {"message": "email已存在"}, 400
    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    user.email = email
    db.session.commit()
    return {"message": "註冊成功"}, 200

def authenticate_user(username, password):
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        return user
    return None

# 新增/更新使用者圖片路徑
def update_user_photo(user_id: int, base64_string: str, file_name: str):
    try:
        user = User.query.get(user_id)
        if not user:
            return {
                "status": "error",
                "message": "找不到使用者"
            }, 404

        if not base64_string:
            return {
                "status": "error",
                "message": "未提供圖片"
            }, 400

        success, result = user.save_photo(base64_string, file_name)
        
        if success:
            return {
                "status": "success",
                "message": "圖片上傳成功",
                "photo_path": result
            }, 200
        else:
            return {
                "status": "error",
                "message": f"圖片儲存失敗: {result}"
            }, 500

    except Exception as e:
        return {
            "status": "error",
            "message": f"處理失敗: {str(e)}"
        }, 500
        
# 新增/更新使用者資料、密碼、名稱、檔案路徑
def update_user_data(user_id: int, data: dict):
    try:
        user = User.query.get(user_id)
        if not user:
            return {
                "status": "error",
                "message": "找不到使用者"
            }, 404

        new_password = data.get("newPassword")
        confirm_password = data.get("confirmPassword")  # 使用 .get() 避免 KeyError

        if new_password:
            if new_password != confirm_password:
                return {
                    "status": "failure",
                    "message": "密碼不一致"
                }, 400
            user.change_password(new_password)

        if "username" in data:
            user.change_username(data["username"])
        if "savePath" in data:
            user.save_file_path(data["savePath"])

        db.session.commit()
        return {
            "status": "success",
            "message": "更新成功"
        }, 200
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"處理失敗: {str(e)}"
        }, 500
