from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required
from app.app import db
from app.models.analysis import Analysis
from app.models.order import Order
from app.utils.decorators import user_required, operator_required
from app.utils.exceptions import OrderNotFound, AnalysisNotFound, APIError
from app.services.notification_service import NotificationService

analyses_ns = Namespace('analyses', description='Analysis related operations')

analysis_model = analyses_ns.model('Analysis', {
    'id': fields.Integer(readOnly=True, description='The analysis unique identifier'),
    'order_id': fields.Integer(required=True, description='The ID of the order this analysis belongs to'),
    'result': fields.String(description='The analysis result (e.g., JSON string)'),
    'status': fields.String(description='The current status of the analysis'),
    'started_at': fields.DateTime(readOnly=True, description='The analysis start timestamp'),
    'completed_at': fields.DateTime(description='The analysis completion timestamp')
})

@analyses_ns.route('/orders/<int:order_id>/analysis')
@analyses_ns.param('order_id', 'The order identifier')
class OrderAnalysisResource(Resource):
    @user_required()
    @analyses_ns.marshal_with(analysis_model)
    @analyses_ns.doc(description='Get analysis results for a specific order or trigger a new analysis')
    def get(self, order_id):
        """Retrieve analysis for an order"""
        order = Order.query.get(order_id)
        if not order:
            raise OrderNotFound()

        analysis = Analysis.query.filter_by(order_id=order_id).first()
        if not analysis:
            raise AnalysisNotFound("Analysis not found for this order.")
        return analysis, 200

    @operator_required() # Only operators can trigger analysis
    @analyses_ns.marshal_with(analysis_model, code=201)
    @analyses_ns.doc(description='Trigger a new analysis for a specific order')
    def post(self, order_id):
        """Trigger analysis for an order"""
        order = Order.query.get(order_id)
        if not order:
            raise OrderNotFound()

        # Check if an analysis already exists for this order
        existing_analysis = Analysis.query.filter_by(order_id=order_id).first()
        if existing_analysis:
            # If analysis exists and is not 'failed', return it or update it
            if existing_analysis.status in ['pending', 'in_progress']:
                analyses_ns.abort(409, message="Analysis already in progress for this order.")
            elif existing_analysis.status == 'completed':
                analyses_ns.abort(409, message="Analysis already completed for this order. Retrieve it via GET.")
            # If status is 'failed', we can potentially re-trigger or update
            # For now, let's assume we create a new one if failed, or update existing
            # For simplicity, let's just update the status to 'in_progress' if it was failed
            existing_analysis.status = 'in_progress'
            existing_analysis.started_at = datetime.utcnow()
            existing_analysis.completed_at = None
            db.session.commit()
            return existing_analysis, 200 # Return 200 if updating existing
        else:
            # Create a new analysis entry
            analysis = Analysis(order_id=order_id, status='in_progress')
            db.session.add(analysis)
            db.session.commit()
            # In a real scenario, this would trigger an asynchronous analysis job
            # For now, we'll just simulate completion
            # NotificationService.send_order_status_update(order.user_id, order_id, 'analysis_in_progress')
            return analysis, 201