from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.payment_service import PaymentService
from app.services.order_service import OrderService
from app.utils.validators import PaymentIntentSchema, PaymentConfirmSchema
from app.utils.decorators import user_required
from app.utils.exceptions import OrderNotFound, PaymentNotFound, PaymentProcessingError, APIError

payments_ns = Namespace('payments', description='Payment related operations')

payment_model = payments_ns.model('Payment', {
    'id': fields.Integer(readOnly=True, description='The payment unique identifier'),
    'order_id': fields.Integer(required=True, description='The ID of the order this payment belongs to'),
    'stripe_payment_intent_id': fields.String(required=True, description='Stripe Payment Intent ID'),
    'amount': fields.Float(required=True, description='Payment amount'),
    'currency': fields.String(description='Currency of the payment'),
    'status': fields.String(description='Current status of the payment'),
    'created_at': fields.DateTime(readOnly=True, description='The payment creation timestamp'),
    'updated_at': fields.DateTime(readOnly=True, description='The payment last update timestamp')
})

payment_intent_parser = payments_ns.parser()
payment_intent_parser.add_argument('amount', type=float, required=True, help='Amount for the payment')
payment_intent_parser.add_argument('currency', type=str, required=False, help='Currency (default: usd)', default='usd')

payment_confirm_parser = payments_ns.parser()
payment_confirm_parser.add_argument('payment_intent_id', type=str, required=True, help='Stripe Payment Intent ID to confirm')

@payments_ns.route('/orders/<int:order_id>/payment-intent')
@payments_ns.param('order_id', 'The order identifier')
class PaymentIntentResource(Resource):
    @user_required()
    @payments_ns.expect(payment_intent_parser)
    @payments_ns.doc(description='Create a Stripe Payment Intent for an order')
    def post(self, order_id):
        """Create a Payment Intent"""
        data = payment_intent_parser.parse_args()
        order = OrderService.get_order(order_id)
        if not order:
            raise OrderNotFound()

        # Ensure the user owns the order or is an admin/operator
        current_user_id = get_jwt_identity()
        if order.user_id != current_user_id:
            payments_ns.abort(403, message="Access denied: You do not own this order.")

        try:
            intent, error = PaymentService.create_payment_intent(order_id, data['amount'], data.get('currency'))
            if error:
                raise PaymentProcessingError(error)
            return {'client_secret': intent.client_secret, 'payment_intent_id': intent.id}, 201
        except PaymentProcessingError as e:
            payments_ns.abort(e.status_code, message=e.message)
        except Exception as e:
            payments_ns.abort(500, message=f"An error occurred: {str(e)}")

@payments_ns.route('/orders/<int:order_id>/payment-confirm')
@payments_ns.param('order_id', 'The order identifier')
class PaymentConfirmResource(Resource):
    @user_required()
    @payments_ns.expect(payment_confirm_parser)
    @payments_ns.marshal_with(payment_model)
    @payments_ns.doc(description='Confirm a Stripe Payment Intent for an order')
    def post(self, order_id):
        """Confirm a Payment Intent"""
        data = payment_confirm_parser.parse_args()
        order = OrderService.get_order(order_id)
        if not order:
            raise OrderNotFound()

        # Ensure the user owns the order or is an admin/operator
        current_user_id = get_jwt_identity()
        if order.user_id != current_user_id:
            payments_ns.abort(403, message="Access denied: You do not own this order.")

        try:
            payment, error = PaymentService.confirm_payment(data['payment_intent_id'])
            if error:
                raise PaymentProcessingError(error)
            return payment, 200
        except PaymentProcessingError as e:
            payments_ns.abort(e.status_code, message=e.message)
        except Exception as e:
            payments_ns.abort(500, message=f"An error occurred: {str(e)}")