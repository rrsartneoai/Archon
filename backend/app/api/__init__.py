from flask_restx import Api

api_v1 = Api(
    version='1.0',
    title='Document Analysis Platform API',
    description='API for managing documents, analyses, orders, and payments.',
    doc='/api/v1/docs'
)

from .auth import auth_ns
from .orders import orders_ns
from .documents import documents_ns
from .analyses import analyses_ns
from .payments import payments_ns

api_v1.add_namespace(auth_ns, path='/auth')
api_v1.add_namespace(orders_ns, path='/orders')
api_v1.add_namespace(documents_ns, path='/documents')
api_v1.add_namespace(analyses_ns, path='/analyses')
api_v1.add_namespace(payments_ns, path='/payments')