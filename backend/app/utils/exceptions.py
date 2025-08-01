class APIError(Exception):
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class UserNotFound(APIError):
    def __init__(self, message="User not found"):
        super().__init__(message, 404)

class InvalidCredentials(APIError):
    def __init__(self, message="Invalid credentials"):
        super().__init__(message, 401)

class OrderNotFound(APIError):
    def __init__(self, message="Order not found"):
        super().__init__(message, 404)

class DocumentNotFound(APIError):
    def __init__(self, message="Document not found"):
        super().__init__(message, 404)

class AnalysisNotFound(APIError):
    def __init__(self, message="Analysis not found"):
        super().__init__(message, 404)

class PaymentNotFound(APIError):
    def __init__(self, message="Payment not found"):
        super().__init__(message, 404)

class FileUploadError(APIError):
    def __init__(self, message="File upload failed"):
        super().__init__(message, 500)

class PaymentProcessingError(APIError):
    def __init__(self, message="Payment processing failed"):
        super().__init__(message, 500)