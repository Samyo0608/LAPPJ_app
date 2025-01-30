from flask_bcrypt import generate_password_hash, check_password_hash
from database import db
from werkzeug.utils import secure_filename
import os
import base64

class User(db.Model):
    __tablename__ = 'users'  # 明確指定表名

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, name='uq_user_username')
    password_hash = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, name='uq_user_email')  # 命名約束
    photo_path = db.Column(db.String(255))
    save_path = db.Column(db.String(255))
    photo_base64 = db.Column(db.Text)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    # 儲存圖片路徑
    def save_photo(self, base64_string, file_name):
        try:
            if not base64_string:
                return False, "圖片數據為空"

            if "data:image" in base64_string:
                base64_string = base64_string.split(',')[1]

            upload_dir = os.path.join('../frontend', 'public', 'userPhotos')
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)

            # **使用相同名稱時，避免刪除檔案**
            file_path = os.path.join(upload_dir, f"user_{self.id}_{file_name}")
            
            # **直接覆蓋，不刪除**
            with open(file_path, 'wb') as f:
                f.write(base64.b64decode(base64_string))

            self.photo_path = file_path
            db.session.commit()
            return True, file_path

        except Exception as e:
            return False, f"圖片儲存失敗: {str(e)}"
            
    # 儲存檔案路徑
    def save_file_path(self, save_path):
        self.save_path = save_path
        db.session.commit()
    
    # 修改密碼
    def change_password(self, new_password):
        self.set_password(new_password)
        db.session.commit()
        
    # 修改名稱
    def change_username(self, new_username):
        self.username = new_username
        db.session.commit()
