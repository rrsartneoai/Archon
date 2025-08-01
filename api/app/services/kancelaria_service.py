from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from typing import List, Optional
from uuid import UUID

from app.models.kancelaria import LawFirm, Profile, Client, Case, Document, CaseNote
from app.api.v1.schemas.kancelaria import (
    LawFirmCreate, LawFirmUpdate,
    ProfileCreate, ProfileUpdate,
    ClientCreate, ClientUpdate,
    CaseCreate, CaseUpdate,
    DocumentCreate,
    CaseNoteCreate,
    CaseStatus, CasePriority
)


class LawFirmService:
    def __init__(self, db: Session):
        self.db = db

    def create_law_firm(self, law_firm_data: LawFirmCreate) -> LawFirm:
        """Tworzy nową kancelarię"""
        db_law_firm = LawFirm(**law_firm_data.model_dump())
        self.db.add(db_law_firm)
        self.db.commit()
        self.db.refresh(db_law_firm)
        return db_law_firm

    def get_law_firm(self, law_firm_id: UUID) -> Optional[LawFirm]:
        """Pobiera kancelarię po ID"""
        return self.db.query(LawFirm).filter(LawFirm.id == law_firm_id).first()

    def get_law_firms(self, skip: int = 0, limit: int = 100) -> List[LawFirm]:
        """Pobiera listę kancelarii z paginacją"""
        return self.db.query(LawFirm).offset(skip).limit(limit).all()

    def update_law_firm(self, law_firm_id: UUID, law_firm_data: LawFirmUpdate) -> Optional[LawFirm]:
        """Aktualizuje dane kancelarii"""
        db_law_firm = self.get_law_firm(law_firm_id)
        if not db_law_firm:
            return None
        
        update_data = law_firm_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_law_firm, field, value)
        
        self.db.commit()
        self.db.refresh(db_law_firm)
        return db_law_firm

    def delete_law_firm(self, law_firm_id: UUID) -> bool:
        """Usuwa kancelarię"""
        db_law_firm = self.get_law_firm(law_firm_id)
        if not db_law_firm:
            return False
        
        self.db.delete(db_law_firm)
        self.db.commit()
        return True

    def get_law_firm_stats(self, law_firm_id: UUID) -> dict:
        """Pobiera statystyki kancelarii"""
        stats = self.db.query(
            func.count(Client.id).label('clients_count'),
            func.count(Case.id).label('cases_count'),
            func.count(Case.id).filter(Case.status == 'active').label('active_cases_count')
        ).select_from(LawFirm).outerjoin(Client).outerjoin(Case).filter(
            LawFirm.id == law_firm_id
        ).first()
        
        return {
            'clients_count': stats.clients_count or 0,
            'cases_count': stats.cases_count or 0,
            'active_cases_count': stats.active_cases_count or 0
        }


class ClientService:
    def __init__(self, db: Session):
        self.db = db

    def create_client(self, client_data: ClientCreate) -> Client:
        """Tworzy nowego klienta"""
        db_client = Client(**client_data.model_dump())
        self.db.add(db_client)
        self.db.commit()
        self.db.refresh(db_client)
        return db_client

    def get_client(self, client_id: UUID) -> Optional[Client]:
        """Pobiera klienta po ID"""
        return self.db.query(Client).filter(Client.id == client_id).first()

    def get_clients(self, law_firm_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> List[Client]:
        """Pobiera listę klientów z opcjonalnym filtrowaniem po kancelarii"""
        query = self.db.query(Client)
        if law_firm_id:
            query = query.filter(Client.law_firm_id == law_firm_id)
        return query.offset(skip).limit(limit).all()

    def update_client(self, client_id: UUID, client_data: ClientUpdate) -> Optional[Client]:
        """Aktualizuje dane klienta"""
        db_client = self.get_client(client_id)
        if not db_client:
            return None
        
        update_data = client_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_client, field, value)
        
        self.db.commit()
        self.db.refresh(db_client)
        return db_client

    def delete_client(self, client_id: UUID) -> bool:
        """Usuwa klienta"""
        db_client = self.get_client(client_id)
        if not db_client:
            return False
        
        self.db.delete(db_client)
        self.db.commit()
        return True

    def search_clients(self, law_firm_id: UUID, search_term: str, skip: int = 0, limit: int = 100) -> List[Client]:
        """Wyszukuje klientów po imieniu, nazwisku lub emailu"""
        return self.db.query(Client).filter(
            and_(
                Client.law_firm_id == law_firm_id,
                func.concat(Client.first_name, ' ', Client.last_name, ' ', Client.email).ilike(f'%{search_term}%')
            )
        ).offset(skip).limit(limit).all()


class CaseService:
    def __init__(self, db: Session):
        self.db = db

    def create_case(self, case_data: CaseCreate) -> Case:
        """Tworzy nową sprawę"""
        db_case = Case(**case_data.model_dump())
        self.db.add(db_case)
        self.db.commit()
        self.db.refresh(db_case)
        return db_case

    def get_case(self, case_id: UUID) -> Optional[Case]:
        """Pobiera sprawę po ID z powiązanymi danymi"""
        return self.db.query(Case).options(
            joinedload(Case.client),
            joinedload(Case.assigned_lawyer),
            joinedload(Case.documents),
            joinedload(Case.case_notes)
        ).filter(Case.id == case_id).first()

    def get_cases(
        self, 
        law_firm_id: Optional[UUID] = None,
        client_id: Optional[UUID] = None,
        status: Optional[CaseStatus] = None,
        priority: Optional[CasePriority] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Case]:
        """Pobiera listę spraw z filtrowaniem"""
        query = self.db.query(Case).options(joinedload(Case.client))
        
        if law_firm_id:
            query = query.filter(Case.law_firm_id == law_firm_id)
        if client_id:
            query = query.filter(Case.client_id == client_id)
        if status:
            query = query.filter(Case.status == status)
        if priority:
            query = query.filter(Case.priority == priority)
        
        return query.offset(skip).limit(limit).all()

    def update_case(self, case_id: UUID, case_data: CaseUpdate) -> Optional[Case]:
        """Aktualizuje dane sprawy"""
        db_case = self.db.query(Case).filter(Case.id == case_id).first()
        if not db_case:
            return None
        
        update_data = case_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_case, field, value)
        
        self.db.commit()
        self.db.refresh(db_case)
        return db_case

    def delete_case(self, case_id: UUID) -> bool:
        """Usuwa sprawę (archiwizuje)"""
        db_case = self.db.query(Case).filter(Case.id == case_id).first()
        if not db_case:
            return False
        
        # Zamiast usuwać, archiwizujemy
        db_case.status = CaseStatus.archived
        self.db.commit()
        return True

    def get_case_statistics(self, law_firm_id: UUID) -> dict:
        """Pobiera statystyki spraw dla kancelarii"""
        stats = self.db.query(
            func.count(Case.id).label('total_cases'),
            func.count(Case.id).filter(Case.status == 'active').label('active_cases'),
            func.count(Case.id).filter(Case.status == 'pending').label('pending_cases'),
            func.count(Case.id).filter(Case.priority == 'urgent').label('urgent_cases')
        ).filter(Case.law_firm_id == law_firm_id).first()
        
        return {
            'total_cases': stats.total_cases or 0,
            'active_cases': stats.active_cases or 0,
            'pending_cases': stats.pending_cases or 0,
            'urgent_cases': stats.urgent_cases or 0
        }


class DocumentService:
    def __init__(self, db: Session):
        self.db = db

    def create_document(self, document_data: DocumentCreate) -> Document:
        """Dodaje nowy dokument do sprawy"""
        db_document = Document(**document_data.model_dump())
        self.db.add(db_document)
        self.db.commit()
        self.db.refresh(db_document)
        return db_document

    def get_case_documents(self, case_id: UUID) -> List[Document]:
        """Pobiera wszystkie dokumenty dla sprawy"""
        return self.db.query(Document).filter(Document.case_id == case_id).all()

    def delete_document(self, document_id: UUID) -> bool:
        """Usuwa dokument"""
        db_document = self.db.query(Document).filter(Document.id == document_id).first()
        if not db_document:
            return False
        
        self.db.delete(db_document)
        self.db.commit()
        return True


class CaseNoteService:
    def __init__(self, db: Session):
        self.db = db

    def create_case_note(self, note_data: CaseNoteCreate) -> CaseNote:
        """Dodaje nową notatkę do sprawy"""
        db_note = CaseNote(**note_data.model_dump())
        self.db.add(db_note)
        self.db.commit()
        self.db.refresh(db_note)
        return db_note

    def get_case_notes(self, case_id: UUID, include_private: bool = True) -> List[CaseNote]:
        """Pobiera notatki dla sprawy"""
        query = self.db.query(CaseNote).filter(CaseNote.case_id == case_id)
        if not include_private:
            query = query.filter(CaseNote.is_private == False)
        return query.order_by(CaseNote.created_at.desc()).all()

    def delete_case_note(self, note_id: UUID) -> bool:
        """Usuwa notatkę"""
        db_note = self.db.query(CaseNote).filter(CaseNote.id == note_id).first()
        if not db_note:
            return False
        
        self.db.delete(db_note)
        self.db.commit()
        return True