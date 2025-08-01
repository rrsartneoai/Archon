from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required
from app.services.document_service import DocumentService
from app.utils.decorators import user_required, operator_required
from app.utils.exceptions import DocumentNotFound, APIError

documents_ns = Namespace('documents', description='Document related operations')

document_model = documents_ns.model('Document', {
    'id': fields.Integer(readOnly=True, description='The document unique identifier'),
    'order_id': fields.Integer(required=True, description='The ID of the order this document belongs to'),
    'filename': fields.String(required=True, description='The name of the uploaded file'),
    'file_path': fields.String(required=True, description='The path or URL to the stored file'),
    'file_type': fields.String(description='The MIME type of the file'),
    'uploaded_at': fields.DateTime(readOnly=True, description='The document upload timestamp'),
    'status': fields.String(description='The current status of the document')
})

@documents_ns.route('/<int:document_id>')
@documents_ns.param('document_id', 'The document identifier')
class DocumentResource(Resource):
    @user_required()
    @documents_ns.marshal_with(document_model)
    @documents_ns.doc(description='Get a specific document by ID')
    def get(self, document_id):
        """Retrieve a document by its ID"""
        document = DocumentService.get_document(document_id)
        if not document:
            raise DocumentNotFound()
        # Add logic to ensure user can only access their own documents or if they are admin/operator
        return document, 200

    @user_required() # Or operator_required if only operators can delete
    @documents_ns.doc(description='Delete a document by ID')
    def delete(self, document_id):
        """Delete a document by its ID"""
        success = DocumentService.delete_document(document_id)
        if not success:
            raise DocumentNotFound()
        return {'message': 'Document deleted successfully'}, 204