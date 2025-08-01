from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_restx import Api
from flask_migrate import Migrate
from flask_cors import CORS
from app.config import DevelopmentConfig

db = SQLAlchemy()
jwt = JWTManager()
from app.api import api_v1

migrate = Migrate()

def create_app(config_class=DevelopmentConfig):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)
    api_v1.init_app(app) # Use api_v1 from app.api
    migrate.init_app(app, db)
    CORS(app)

    app.register_blueprint(api_v1.blueprint, url_prefix='/api/v1')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0')