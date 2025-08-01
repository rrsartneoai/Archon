import stripe
from app.app import db
from app.models.payment import Payment
from app.models.order import Order
from app.config import Config

stripe.api_key = Config.STRIPE_SECRET_KEY

class PaymentService:
    @staticmethod
    def create_payment_intent(order_id, amount, currency='usd'):
        order = Order.query.get(order_id)
        if not order:
            return None, "Order not found"

        try:
            # Amount in cents
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),
                currency=currency,
                metadata={'order_id': order_id}
            )
            payment = Payment(
                order_id=order_id,
                stripe_payment_intent_id=intent.id,
                amount=amount,
                currency=currency,
                status='pending'
            )
            db.session.add(payment)
            db.session.commit()
            return intent, None
        except stripe.error.StripeError as e:
            return None, str(e)

    @staticmethod
    def confirm_payment(payment_intent_id):
        payment = Payment.query.filter_by(stripe_payment_intent_id=payment_intent_id).first()
        if not payment:
            return None, "Payment not found"

        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            if intent.status == 'succeeded':
                payment.status = 'succeeded'
                # Update order status as well
                order = Order.query.get(payment.order_id)
                if order:
                    order.status = 'paid'
                db.session.commit()
                return payment, None
            else:
                payment.status = intent.status # Update status based on Stripe's status
                db.session.commit()
                return None, f"Payment not succeeded. Current status: {intent.status}"
        except stripe.error.StripeError as e:
            return None, str(e)