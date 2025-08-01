from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.db.session import get_db
from app.services.kancelaria_service import CaseService, DocumentService, CaseNoteService
from app.api.v1.schemas.kancelaria import (
    Case, CaseCreate, CaseUpdate, CaseWithDetails,
    Document, DocumentCreate,
    CaseNote, CaseNoteCreate,
    CaseStatus, CasePriority
)

router = APIRouter()


@router.post("/", response_model=Case, status_code=201)
def create_case(
    case_data: CaseCreate,
    db: Session = Depends(get_db)
):
    """
    Rejestruje nową sprawę w systemie.
    
    - **case_number**: Numer sprawy (wymagany, unikalny w ramach kancelarii)
    - **title**: Tytuł sprawy (wymagany)
    - **law_firm_id**: ID kancelarii (wymagane)
    - **client_id**: ID klienta (wymagane)
    - **assigned_lawyer_id**: ID przypisanego prawnika
    - **description**: Opis sprawy
    - **case_type**: Typ sprawy (np. "Prawo rodzinne")
    - **status**: Status sprawy (pending, active, closed, archived)
    - **priority**: Priorytet (low, medium, high, urgent)
    - **start_date**: Data rozpoczęcia
    - **end_date**: Data zakończenia
    - **court_name**: Nazwa sądu
    - **case_value**: Wartość sprawy
    """
    service = CaseService(db)
    return service.create_case(case_data)


@router.get("/", response_model=List[Case])
def get_cases(
    law_firm_id: Optional[UUID] = Query(None, description="Filtruj po ID kancelarii"),
    client_id: Optional[UUID] = Query(None, description="Filtruj po ID klienta"),
    status: Optional[CaseStatus] = Query(None, description="Filtruj po statusie"),
    priority: Optional[CasePriority] = Query(None, description="Filtruj po priorytecie"),
    skip: int = Query(0, ge=0, description="Liczba rekordów do pominięcia"),
    limit: int = Query(100, ge=1, le=1000, description="Maksymalna liczba rekordów"),
    db: Session = Depends(get_db)
):
    """
    Pobiera listę spraw z opcjonalnym filtrowaniem.
    
    Można filtrować po kancelarii, kliencie, statusie i priorytecie.
    """
    service = CaseService(db)
    return service.get_cases(
        law_firm_id=law_firm_id,
        client_id=client_id,
        status=status,
        priority=priority,
        skip=skip,
        limit=limit
    )


@router.get("/statistics")
def get_case_statistics(
    law_firm_id: UUID = Query(..., description="ID kancelarii"),
    db: Session = Depends(get_db)
):
    """
    Pobiera statystyki spraw dla kancelarii.
    
    Zwraca:
    - Łączną liczbę spraw
    - Liczbę aktywnych spraw
    - Liczbę oczekujących spraw
    - Liczbę pilnych spraw
    """
    service = CaseService(db)
    return service.get_case_statistics(law_firm_id)


@router.get("/{sprawa_id}", response_model=CaseWithDetails)
def get_case(
    sprawa_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Pobiera szczegóły sprawy wraz z powiązanymi danymi.
    
    Zwraca sprawę wraz z:
    - Danymi klienta
    - Informacjami o przypisanym prawniku
    - Listą dokumentów
    - Notatkami do sprawy
    """
    service = CaseService(db)
    case = service.get_case(sprawa_id)
    
    if not case:
        raise HTTPException(status_code=404, detail="Sprawa nie została znaleziona")
    
    return case


@router.put("/{sprawa_id}", response_model=Case)
def update_case(
    sprawa_id: UUID,
    case_data: CaseUpdate,
    db: Session = Depends(get_db)
):
    """
    Aktualizuje dane sprawy.
    
    Można aktualizować wybrane pola - pola nie podane w żądaniu pozostaną bez zmian.
    """
    service = CaseService(db)
    updated_case = service.update_case(sprawa_id, case_data)
    
    if not updated_case:
        raise HTTPException(status_code=404, detail="Sprawa nie została znaleziona")
    
    return updated_case


@router.delete("/{sprawa_id}", status_code=204)
def delete_case(
    sprawa_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Usuwa sprawę (archiwizuje).
    
    Sprawa nie jest fizycznie usuwana, ale jej status zmienia się na 'archived'.
    """
    service = CaseService(db)
    success = service.delete_case(sprawa_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Sprawa nie została znaleziona")
    
    return None


# Endpointy dla dokumentów
@router.post("/{sprawa_id}/documents", response_model=Document, status_code=201)
def add_document_to_case(
    sprawa_id: UUID,
    document_data: DocumentCreate,
    db: Session = Depends(get_db)
):
    """
    Dodaje dokument do sprawy.
    """
    # Sprawdź czy sprawa istnieje
    case_service = CaseService(db)
    case = case_service.get_case(sprawa_id)
    if not case:
        raise HTTPException(status_code=404, detail="Sprawa nie została znaleziona")
    
    # Ustaw case_id
    document_data.case_id = sprawa_id
    
    service = DocumentService(db)
    return service.create_document(document_data)


@router.get("/{sprawa_id}/documents", response_model=List[Document])
def get_case_documents(
    sprawa_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Pobiera wszystkie dokumenty powiązane ze sprawą.
    """
    service = DocumentService(db)
    return service.get_case_documents(sprawa_id)


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(
    document_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Usuwa dokument.
    """
    service = DocumentService(db)
    success = service.delete_document(document_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Dokument nie został znaleziony")
    
    return None


# Endpointy dla notatek
@router.post("/{sprawa_id}/notes", response_model=CaseNote, status_code=201)
def add_note_to_case(
    sprawa_id: UUID,
    note_data: CaseNoteCreate,
    db: Session = Depends(get_db)
):
    """
    Dodaje notatkę do sprawy.
    """
    # Sprawdź czy sprawa istnieje
    case_service = CaseService(db)
    case = case_service.get_case(sprawa_id)
    if not case:
        raise HTTPException(status_code=404, detail="Sprawa nie została znaleziona")
    
    # Ustaw case_id
    note_data.case_id = sprawa_id
    
    service = CaseNoteService(db)
    return service.create_case_note(note_data)


@router.get("/{sprawa_id}/notes", response_model=List[CaseNote])
def get_case_notes(
    sprawa_id: UUID,
    include_private: bool = Query(True, description="Czy uwzględnić prywatne notatki"),
    db: Session = Depends(get_db)
):
    """
    Pobiera wszystkie notatki powiązane ze sprawą.
    """
    service = CaseNoteService(db)
    return service.get_case_notes(sprawa_id, include_private=include_private)


@router.delete("/notes/{note_id}", status_code=204)
def delete_case_note(
    note_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Usuwa notatkę.
    """
    service = CaseNoteService(db)
    success = service.delete_case_note(note_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Notatka nie została znaleziona")
    
    return None