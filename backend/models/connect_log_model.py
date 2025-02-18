# models/connection_log_model.py
from database import db
from datetime import datetime, timezone, timedelta

class ConnectionLog(db.Model):
    __tablename__ = 'connection_logs'
    
    @staticmethod
    def get_tw_time():
        """獲取當前台灣時間"""
        tw_timezone = timezone(timedelta(hours=8))
        return datetime.now(tw_timezone)
    
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(50), nullable=False)
    device_name = db.Column(db.String(100), nullable=False)
    port = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(20))
    # 修改這裡，使用 get_tw_time 作為預設值
    connected_time = db.Column(db.DateTime, default=get_tw_time)
    status = db.Column(db.String(20), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    user = db.relationship('User', backref=db.backref('connection_logs', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'device_id': self.device_id,
            'device_name': self.device_name,
            'port': self.port,
            'address': self.address,
            'connected_time': self.connected_time.strftime('%Y-%m-%d %H:%M:%S'),  # 直接格式化，因為已經是台灣時間
            'status': self.status,
            'created_by': self.created_by,
            'username': self.user.username if self.user else None
        }

    @staticmethod
    def create_log(device_id, device_name, port, address, status, created_by=None):
        from models.auth_model import User
        user = None if created_by is None else User.query.get(created_by)
        
        log = ConnectionLog(
            device_id=device_id,
            device_name=device_name,
            port=port,
            address=address,
            status=status,
            created_by=created_by,
            connected_time=ConnectionLog.get_tw_time()  # 明確設置台灣時間
        )
        try:
            db.session.add(log)
            db.session.commit()
            return log, None
        except Exception as e:
            db.session.rollback()
            return None, str(e)