# models/connection_log_model.py
from database import db
from datetime import datetime, timezone, timedelta

class ConnectionLog(db.Model):
    __tablename__ = 'connection_logs'
    
    @staticmethod
    def format_tw_time(utc_time):
        if not utc_time:
            return None
        tw_timezone = timezone(timedelta(hours=8))
        return utc_time.astimezone(tw_timezone).strftime('%Y-%m-%d %H:%M:%S')
    
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(50), nullable=False)
    device_name = db.Column(db.String(100), nullable=False)
    port = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(20))
    connected_time = db.Column(db.DateTime, default=format_tw_time(datetime.now()))
    status = db.Column(db.String(20), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # 添加使用者關聯
    user = db.relationship('User', backref=db.backref('connection_logs', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'device_id': self.device_id,
            'device_name': self.device_name,
            'port': self.port,
            'address': self.address,
            'connected_time': self.format_tw_time(self.connected_time),
            'status': self.status,
            'created_by': self.created_by,
            'username': self.user.username if self.user else None  # 添加使用者名稱
        }

    @staticmethod
    def create_log(device_id, device_name, port, address, status, created_by=None):
        # 可以檢查使用者是否存在
        from models.auth_model import User
        user = None if created_by is None else User.query.get(created_by)
        
        log = ConnectionLog(
            device_id=device_id,
            device_name=device_name,
            port=port,
            address=address,
            status=status,
            created_by=created_by
        )
        try:
            db.session.add(log)
            db.session.commit()
            return log, None
        except Exception as e:
            db.session.rollback()
            return None, str(e)