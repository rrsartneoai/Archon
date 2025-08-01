from app.app import db
from app.models.order import Order
from app.models.document import Document

class OrderService:
    @staticmethod
    def create_order(user_id, total_amount=0.0):
        order = Order(user_id=user_id, total_amount=total_amount)
        db.session.add(order)
        db.session.commit()
        return order

    @staticmethod
    def get_order(order_id):
        return Order.query.get(order_id)

    @staticmethod
    def get_user_orders(user_id):
        return Order.query.filter_by(user_id=user_id).all()

    @staticmethod
    def update_order_status(order_id, status):
        order = Order.query.get(order_id)
        if order:
            order.status = status
            db.session.commit()
            return order
        return None

    @staticmethod
    def add_document_to_order(order_id, filename, file_path, file_type):
        order = Order.query.get(order_id)
        if order:
            document = Document(order_id=order_id, filename=filename, file_path=file_path, file_type=file_type)
            db.session.add(document)
            db.session.commit()
            return document
        return None