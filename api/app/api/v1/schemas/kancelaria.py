from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from enum import Enum


# Enums
class CaseStatus(str, Enum):
    active = "active"
    pending = "pending"
    closed = "closed"
    archived = "archived"


class CasePriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class UserRole(str, Enum):
    admin = "admin"
    lawyer = "lawyer"
    client = "client"
    staff = "staff"


# Base schemas
class LawFirmBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    tax_id: Optional[str] = None
    registration_number: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


class LawFirmCreate(LawFirmBase):
    pass


class LawFirmUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    tax_id: Optional[str] = None
    registration_number: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


class LawFirm(LawFirmBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime
    updated_at: datetime


# Profile schemas
class ProfileBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.client
    specialization: Optional[str] = None
    license_number: Optional[str] = None


class ProfileCreate(ProfileBase):
    user_id: UUID
    law_firm_id: Optional[UUID] = None


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    law_firm_id: Optional[UUID] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None


class Profile(ProfileBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    law_firm_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


# Client schemas
class ClientBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    pesel: Optional[str] = Field(None, max_length=11)
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    law_firm_id: UUID
    user_id: Optional[UUID] = None


class ClientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    pesel: Optional[str] = Field(None, max_length=11)
    notes: Optional[str] = None


class Client(ClientBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    law_firm_id: UUID
    user_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


# Case schemas
class CaseBase(BaseModel):
    case_number: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    case_type: Optional[str] = None
    status: CaseStatus = CaseStatus.pending
    priority: CasePriority = CasePriority.medium
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    court_name: Optional[str] = None
    case_value: Optional[float] = None


class CaseCreate(CaseBase):
    law_firm_id: UUID
    client_id: UUID
    assigned_lawyer_id: Optional[UUID] = None


class CaseUpdate(BaseModel):
    case_number: Optional[str] = Field(None, min_length=1, max_length=100)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    case_type: Optional[str] = None
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    court_name: Optional[str] = None
    case_value: Optional[float] = None
    assigned_lawyer_id: Optional[UUID] = None


class Case(CaseBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    law_firm_id: UUID
    client_id: UUID
    assigned_lawyer_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


# Document schemas
class DocumentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    description: Optional[str] = None


class DocumentCreate(DocumentBase):
    case_id: UUID
    uploaded_by: Optional[UUID] = None


class Document(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    case_id: UUID
    uploaded_by: Optional[UUID] = None
    created_at: datetime


# Case Note schemas
class CaseNoteBase(BaseModel):
    content: str = Field(..., min_length=1)
    is_private: bool = False


class CaseNoteCreate(CaseNoteBase):
    case_id: UUID
    author_id: UUID


class CaseNote(CaseNoteBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    case_id: UUID
    author_id: UUID
    created_at: datetime
    updated_at: datetime


# Response schemas with relationships
class LawFirmWithStats(LawFirm):
    clients_count: int = 0
    cases_count: int = 0
    active_cases_count: int = 0


class ClientWithCases(Client):
    cases: List[Case] = []


class CaseWithDetails(Case):
    client: Client
    assigned_lawyer: Optional[Profile] = None
    documents: List[Document] = []
    case_notes: List[CaseNote] = []


# Pagination
class PaginatedResponse(BaseModel):
    items: List[BaseModel]
    total: int
    page: int
    size: int
    pages: int