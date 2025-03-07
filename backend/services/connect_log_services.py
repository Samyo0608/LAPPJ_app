# services/connection_log_service.py
from models.connect_log_model import ConnectionLog
from database import db

class ConnectionLogService:
    @staticmethod
    def create_log(device_id, device_name, port, address, status, created_by=None):
        print(f"正在創建連線日誌... 設備: {device_id}")  # 添加除錯訊息
        try:
            log = ConnectionLog(
                device_id=device_id,
                device_name=device_name,
                port=port,
                address=address,
                status=status,
                created_by=created_by
            )
            db.session.add(log)
            db.session.commit()
            print(f"日誌創建成功，ID: {log.id}")  # 添加除錯訊息
            return log, None
        except Exception as e:
            db.session.rollback()
            print(f"日誌創建失敗: {str(e)}")  # 添加除錯訊息
            return None, str(e)

    @staticmethod
    def get_logs(device_id=None, status=None):
        """查詢連線日誌，可以根據設備ID和狀態篩選"""
        try:
            query = ConnectionLog.query
            
            if device_id:
                query = query.filter(ConnectionLog.device_id == device_id)
            if status:
                query = query.filter(ConnectionLog.status == status)
                
            logs = query.order_by(ConnectionLog.connected_time.desc()).all()
            return [log.to_dict() for log in logs], None
            
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_device_logs(device_id, limit=10):
        """獲取特定設備的最近連線記錄"""
        try:
            logs = ConnectionLog.query\
                .filter_by(device_id=device_id)\
                .order_by(ConnectionLog.connected_time.desc())\
                .limit(limit)\
                .all()
            return [log.to_dict() for log in logs], None
        except Exception as e:
            return None, str(e)
