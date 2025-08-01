from datetime import datetime
from app.app import db

class Analysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), unique=True, nullable=False)
    result = db.Column(db.Text) # Store analysis results (e.g., JSON, text)
    status = db.Column(db.String(64), default='pending') # 'pending', 'in_progress', 'completed', 'failed'
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

    def __repr__(self):
        return f'<Analysis for Order {self.order_id} - Status: {self.status}>'