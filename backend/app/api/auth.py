from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies
from app.services.auth_service import AuthService
from app.utils.validators import UserRegisterSchema, UserLoginSchema
from app.utils.exceptions import InvalidCredentials, UserNotFound, APIError

auth_ns = Namespace('auth', description='Authentication related operations')

user_model = auth_ns.model('User', {
    'id': fields.Integer(readOnly=True, description='The user unique identifier'),
    'username': fields.String(required=True, description='The user username'),
    'email': fields.String(required=True, description='The user email address'),
    'role': fields.String(description='The user role (user, admin, operator)'),
    'created_at': fields.DateTime(readOnly=True, description='The user creation timestamp'),
    'updated_at': fields.DateTime(readOnly=True, description='The user last update timestamp')
})

login_parser = auth_ns.parser()
login_parser.add_argument('username', type=str, required=True, help='Username for login')
login_parser.add_argument('password', type=str, required=True, help='Password for login')

register_parser = auth_ns.parser()
register_parser.add_argument('username', type=str, required=True, help='Username for registration')
register_parser.add_argument('email', type=str, required=True, help='Email for registration')
register_parser.add_argument('password', type=str, required=True, help='Password for registration')
register_parser.add_argument('role', type=str, required=False, help='Role for registration (default: user)')

@auth_ns.route('/register')
class UserRegister(Resource):
    @auth_ns.expect(register_parser)
    @auth_ns.marshal_with(user_model, code=201)
    @auth_ns.doc(description='Register a new user')
    def post(self):
        """Registers a new user"""
        data = register_parser.parse_args()
        try:
            UserRegisterSchema(**data) # Validate input with Pydantic
            user, error = AuthService.register_user(
                data['username'], data['email'], data['password'], data.get('role', 'user')
            )
            if error:
                auth_ns.abort(400, message=error)
            return user, 201
        except Exception as e:
            auth_ns.abort(400, message=str(e))

@auth_ns.route('/login')
class UserLogin(Resource):
    @auth_ns.expect(login_parser)
    @auth_ns.doc(description='Logs in an existing user and returns JWT token')
    def post(self):
        """Logs in a user"""
        data = login_parser.parse_args()
        try:
            UserLoginSchema(**data) # Validate input with Pydantic
            user = AuthService.authenticate_user(data['username'], data['password'])
            if not user:
                raise InvalidCredentials()
            access_token = create_access_token(identity=user.id)
            return {'access_token': access_token}, 200
        except InvalidCredentials as e:
            auth_ns.abort(e.status_code, message=e.message)
        except Exception as e:
            auth_ns.abort(400, message=str(e))

@auth_ns.route('/logout')
class UserLogout(Resource):
    @jwt_required()
    @auth_ns.doc(description='Logs out the current user by revoking JWT token (client-side)')
    def post(self):
        """Logs out a user"""
        response = {'message': 'Successfully logged out'}
        unset_jwt_cookies(response) # This removes the JWT cookie if it was set
        return response, 200

@auth_ns.route('/me')
class UserMe(Resource):
    @jwt_required()
    @auth_ns.marshal_with(user_model)
    @auth_ns.doc(description='Returns information about the current authenticated user')
    def get(self):
        """Returns current user info"""
        current_user_id = get_jwt_identity()
        user = AuthService.get_user_by_id(current_user_id) # Assuming AuthService has this method
        if not user:
            raise UserNotFound()
        return user, 200