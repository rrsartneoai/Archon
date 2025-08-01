from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, Numeric, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.session import Base

# Enums matching Supabase schema
case_status_enum = ENUM('active', 'pending', 'closed', 'archived', name='case_status')
case_priority_enum = ENUM('low', 'medium', 'high', 'urgent', name='case_priority')
user_role_enum = ENUM('admin', 'lawyer', 'client', 'staff', name='user_role')


class LawFirm(Base):
    __tablename__ = "law_firms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    address = Column(Text)
    phone = Column(String(50))
    email = Column(String(255))
    tax_id = Column(String(50))  # NIP
    registration_number = Column(String(50))  # KRS
    website = Column(String(255))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    profiles = relationship("Profile", back_populates="law_firm")
    clients = relationship("Client", back_populates="law_firm")
    cases = relationship("Case", back_populates="law_firm")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(50))
    role = Column(user_role_enum, nullable=False, default='client')
    law_firm_id = Column(UUID(as_uuid=True), ForeignKey('law_firms.id'))
    specialization = Column(String(255))
    license_number = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    law_firm = relationship("LawFirm", back_populates="profiles")
    assigned_cases = relationship("Case", back_populates="assigned_lawyer")
    case_notes = relationship("CaseNote", back_populates="author")
    uploaded_documents = relationship("Document", back_populates="uploaded_by")


class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True))
    law_firm_id = Column(UUID(as_uuid=True), ForeignKey('law_firms.id'), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    date_of_birth = Column(Date)
    pesel = Column(String(11))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    law_firm = relationship("LawFirm", back_populates="clients")
    cases = relationship("Case", back_populates="client")


class Case(Base):
    __tablename__ = "cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    law_firm_id = Column(UUID(as_uuid=True), ForeignKey('law_firms.id'), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey('clients.id'), nullable=False)
    assigned_lawyer_id = Column(UUID(as_uuid=True), ForeignKey('profiles.id'))
    case_number = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    case_type = Column(String(100))
    status = Column(case_status_enum, nullable=False, default='pending')
    priority = Column(case_priority_enum, nullable=False, default='medium')
    start_date = Column(Date)
    end_date = Column(Date)
    court_name = Column(String(255))
    case_value = Column(Numeric(15, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    law_firm = relationship("LawFirm", back_populates="cases")
    client = relationship("Client", back_populates="cases")
    assigned_lawyer = relationship("Profile", back_populates="assigned_cases")
    documents = relationship("Document", back_populates="case")
    case_notes = relationship("CaseNote", back_populates="case")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey('cases.id'), nullable=False)
    name = Column(String(255), nullable=False)
    file_path = Column(String(500))
    file_size = Column(Integer)
    mime_type = Column(String(100))
    description = Column(Text)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey('profiles.id'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    case = relationship("Case", back_populates="documents")
    uploaded_by = relationship("Profile", back_populates="uploaded_documents")


class CaseNote(Base):
    __tablename__ = "case_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey('cases.id'), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey('profiles.id'), nullable=False)
    content = Column(Text, nullable=False)
    is_private = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    case = relationship("Case", back_populates="case_notes")
    author = relationship("Profile", back_populates="case_notes")