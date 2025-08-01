from datetime import datetime
from app.app import db

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(64), default='pending') # 'pending', 'processing', 'completed', 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    total_amount = db.Column(db.Float, nullable=False, default=0.0)

    documents = db.relationship('Document', backref='order', lazy='dynamic')
    analysis = db.relationship('Analysis', backref='order', uselist=False)
    payment = db.relationship('Payment', backref='order', uselist=False)

    def __repr__(self):
        return f'<Order {self.id} by User {self.user_id}>'