from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserRegisterSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = 'user'

class UserLoginSchema(BaseModel):
    username: str
    password: str

class OrderCreateSchema(BaseModel):
    total_amount: float = Field(0.0, ge=0)

class OrderUpdateStatusSchema(BaseModel):
    status: str = Field(..., pattern="^(pending|processing|completed|cancelled|paid)$")

class DocumentUploadSchema(BaseModel):
    # For file uploads, Flask-RESTX handles file input directly,
    # but Pydantic can validate other fields if needed.
    # This schema is more for conceptual validation or if additional metadata is sent with the file.
    filename: str
    file_type: str

class AnalysisCreateSchema(BaseModel):
    # No specific fields for analysis creation, as it's triggered by order/document
    pass

class PaymentIntentSchema(BaseModel):
    amount: float = Field(..., gt=0)
    currency: str = 'usd'

class PaymentConfirmSchema(BaseModel):
    payment_intent_id: str