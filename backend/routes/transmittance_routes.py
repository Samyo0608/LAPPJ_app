from flask import Blueprint, request, send_file, jsonify
from services.transmittance_services import TransmittanceService

transmittance_bp = Blueprint('transmittance', __name__)

@transmittance_bp.route('/transmittanceData', methods=['POST'])
def get_transmittance():
    try:
        data = request.get_json()
        file_path = data.get('filePath')
        group_number = data.get('groupNumber')
        file_number = data.get('fileNumber')
        max_spectrum = data.get('maxSpectrum')
        min_spectrum = data.get('minSpectrum')
        
        print(f"開始處理: {file_path}")
        print(f"指定範圍: {min_spectrum} - {max_spectrum}")
        print(f"group_number: {group_number}, file_number: {file_number}")

        if not all([file_path, group_number, file_number, max_spectrum, min_spectrum]):
            return jsonify({'error': '缺少必要參數'}), 400

        averages_list = TransmittanceService.calculate_transmittance(
            file_path=file_path,
            group_number=group_number,
            file_number=file_number,
            max_spectrum=max_spectrum,
            min_spectrum=min_spectrum
        )

        return jsonify(averages_list)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transmittance_bp.route('/transmittancePlot', methods=['POST'])
def plot():
    try:
        data = request.get_json()
        file_data = data.get('fileData', [])
        selected_files = data.get('selectedFiles', [])
        x_label = data.get('xLabel', 'File Name')
        y_label = data.get('yLabel', 'Transmittance %')
        
        img = TransmittanceService.generate_plot(
            file_data=file_data,
            selected_files=selected_files,
            x_label=x_label,
            y_label=y_label
        )
        
        return send_file(img, mimetype='image/png')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transmittance_bp.route('/transmittancePlotFilter', methods=['POST'])
def plot_filter():
    try:
        data = request.get_json()
        file_data = data.get('fileData', [])
        plot_flag = data.get('plotFlag', [])
        
        img = TransmittanceService.generate_filter_plot(file_data, plot_flag)
        
        return send_file(img, mimetype='image/png')
    except Exception as e:
        return jsonify({'error': str(e)}), 500