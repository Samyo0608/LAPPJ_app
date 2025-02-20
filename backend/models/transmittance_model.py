from database import db

class TransmittanceData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    file_path = db.Column(db.String(255), nullable=False)
    group_number = db.Column(db.Integer)
    file_number = db.Column(db.Integer)
    max_spectrum = db.Column(db.Float)
    min_spectrum = db.Column(db.Float)
    averages = db.Column(db.JSON)

    def to_dict(self):
        return {
            'id': self.id,
            'filePath': self.file_path,
            'groupNumber': self.group_number,
            'fileNumber': self.file_number,
            'maxSpectrum': self.max_spectrum,
            'minSpectrum': self.min_spectrum,
            'averages': self.averages
        }