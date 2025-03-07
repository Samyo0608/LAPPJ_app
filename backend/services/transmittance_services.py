from models.transmittance_model import TransmittanceData
from transmittance_to_figure import plot_data, plot_data_filter
from txt_to_transmittance_data import txt_to_transmittance

class TransmittanceService:
    @staticmethod
    def calculate_transmittance(file_path, group_number, file_number, max_spectrum, min_spectrum):
        """計算透射率數據"""
        
        try:
            averages_list = txt_to_transmittance(
                initial_file_path=file_path,
                group_number=group_number,
                file_number=file_number,
                max_spectrum=max_spectrum,
                min_spectrum=min_spectrum
            )
            return averages_list
        except Exception as e:
            raise Exception(f"計算透射率時發生錯誤: {str(e)}")

    @staticmethod
    def generate_plot(file_data, selected_files=None, x_label='File Name', y_label='Transmittance %'):
        """生成透射率圖表"""
        if not selected_files:
            selected_files = [file['fileName'] for file in file_data]
            
        print('selected_files:', selected_files)
        return plot_data(file_data, selected_files, x_label, y_label)

    @staticmethod
    def generate_filter_plot(file_data, plot_flag):
        """生成過濾後的透射率圖表"""
        return plot_data_filter(file_data, plot_flag)