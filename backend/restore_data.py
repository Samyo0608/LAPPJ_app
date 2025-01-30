# migrate_db.py
from app import create_app, db
import json

def migrate_database():
    app = create_app()
    with app.app_context():
        # 創建新的資料庫和表格
        db.create_all()
        
        # 從備份檔恢復資料
        try:
            with open('data_backup.json', 'r') as f:
                users = json.load(f)
            
            from models.auth_model import User
            for user_data in users:
                user = User(
                    username=user_data['username'],
                    password_hash=user_data['password_hash'],
                    email=user_data['email'],
                    photo_path=user_data['photo_path'],
                    photo_base64=user_data['photo_base64'],
                    save_path=user_data['save_path']
                )
                db.session.add(user)
            
            db.session.commit()
            print("✅ 資料遷移完成")
            
        except Exception as e:
            print(f"❌ 遷移失敗: {str(e)}")

if __name__ == "__main__":
    migrate_database()