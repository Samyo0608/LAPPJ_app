# backup_data.py
from app import create_app
from models.auth_model import User
import json

def backup_data():
    app = create_app()
    with app.app_context():
        users = User.query.all()
        backup = []
        for user in users:
            backup.append({
                'username': user.username,
                'password_hash': user.password_hash,
                'email': user.email,
                'photo_path': user.photo_path,
                'photo_base64': user.photo_base64,
                'save_path': user.save_path
            })
        
        with open('data_backup.json', 'w') as f:
            json.dump(backup, f)
        print("✅ 資料備份完成")

if __name__ == "__main__":
    backup_data()