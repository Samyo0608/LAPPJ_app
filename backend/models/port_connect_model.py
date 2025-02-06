import serial.tools.list_ports

class PortScanner:
    @staticmethod
    def list_available_ports():
        """列出所有可用的串口"""
        try:
            available_ports = []
            ports = list(serial.tools.list_ports.comports())
            
            for port in ports:
                port_info = {
                    "port": port.device,
                    "name": port.name,
                    "description": port.description,
                    "hwid": port.hwid,
                    "manufacturer": port.manufacturer if hasattr(port, 'manufacturer') else None
                }
                available_ports.append(port_info)
                
            return available_ports
        except Exception as e:
            print(f"Error scanning ports: {str(e)}")
            return []
    
    @staticmethod
    def check_port_availability(port_name):
        """檢查特定串口是否可用"""
        try:
            # 嘗試打開串口
            ser = serial.Serial(port_name, timeout=1)
            ser.close()
            return True
        except serial.SerialException:
            return False