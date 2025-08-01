from datetime import datetime
from app.app import db

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False) # Local path or S3 URL
    file_type = db.Column(db.String(128))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(64), default='uploaded') # 'uploaded', 'processing', 'analyzed', 'failed'

    def __repr__(self):
        return f'<Document {self.filename} for Order {self.order_id}>'