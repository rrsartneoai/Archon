import os
import boto3
from werkzeug.utils import secure_filename
from app.app import db
from app.models.document import Document
from app.config import Config

class DocumentService:
    @staticmethod
    def get_document(document_id):
        return Document.query.get(document_id)

    @staticmethod
    def delete_document(document_id):
        document = Document.query.get(document_id)
        if document:
            # Delete from storage
            if Config.AWS_S3_BUCKET_NAME:
                s3 = boto3.client(
                    's3',
                    aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY
                )
                s3.delete_object(Bucket=Config.AWS_S3_BUCKET_NAME, Key=document.file_path)
            else:
                if os.path.exists(document.file_path):
                    os.remove(document.file_path)

            db.session.delete(document)
            db.session.commit()
            return True
        return False

    @staticmethod
    def upload_document(file, order_id):
        filename = secure_filename(file.filename)
        if Config.AWS_S3_BUCKET_NAME:
            s3 = boto3.client(
                's3',
                aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY
            )
            s3_key = f"orders/{order_id}/{filename}"
            s3.upload_fileobj(file, Config.AWS_S3_BUCKET_NAME, s3_key)
            file_path = f"s3://{Config.AWS_S3_BUCKET_NAME}/{s3_key}"
        else:
            upload_folder = os.path.join(Config.UPLOAD_FOLDER, str(order_id))
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)

        document = Document(order_id=order_id, filename=filename, file_path=file_path, file_type=file.mimetype)
        db.session.add(document)
        db.session.commit()
        return document