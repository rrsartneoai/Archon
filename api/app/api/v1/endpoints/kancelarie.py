from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.db.session import get_db
from app.services.kancelaria_service import LawFirmService
from app.api.v1.schemas.kancelaria import (
    LawFirm, LawFirmCreate, LawFirmUpdate, LawFirmWithStats
)

router = APIRouter()


@router.post("/", response_model=LawFirm, status_code=201)
def create_law_firm(
    law_firm_data: LawFirmCreate,
    db: Session = Depends(get_db)
):
    """
    Tworzy nową kancelarię prawną.
    
    - **name**: Nazwa kancelarii (wymagane)
    - **address**: Adres kancelarii
    - **phone**: Numer telefonu
    - **email**: Adres email
    - **tax_id**: NIP
    - **registration_number**: Numer KRS
    - **website**: Strona internetowa
    - **description**: Opis kancelarii
    """
    service = LawFirmService(db)
    return service.create_law_firm(law_firm_data)


@router.get("/", response_model=List[LawFirm])
def get_law_firms(
    skip: int = Query(0, ge=0, description="Liczba rekordów do pominięcia"),
    limit: int = Query(100, ge=1, le=1000, description="Maksymalna liczba rekordów"),
    db: Session = Depends(get_db)
):
    """
    Pobiera listę wszystkich kancelarii z paginacją.
    """
    service = LawFirmService(db)
    return service.get_law_firms(skip=skip, limit=limit)


@router.get("/{kancelaria_id}", response_model=LawFirmWithStats)
def get_law_firm(
    kancelaria_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Pobiera szczegóły kancelarii wraz ze statystykami.
    
    Zwraca informacje o kancelarii oraz podstawowe statystyki:
    - Liczba klientów
    - Liczba spraw
    - Liczba aktywnych spraw
    """
    service = LawFirmService(db)
    law_firm = service.get_law_firm(kancelaria_id)
    
    if not law_firm:
        raise HTTPException(status_code=404, detail="Kancelaria nie została znaleziona")
    
    # Pobierz statystyki
    stats = service.get_law_firm_stats(kancelaria_id)
    
    # Połącz dane kancelarii ze statystykami
    law_firm_dict = law_firm.__dict__.copy()
    law_firm_dict.update(stats)
    
    return law_firm_dict


@router.put("/{kancelaria_id}", response_model=LawFirm)
def update_law_firm(
    kancelaria_id: UUID,
    law_firm_data: LawFirmUpdate,
    db: Session = Depends(get_db)
):
    """
    Aktualizuje dane kancelarii.
    
    Można aktualizować wybrane pola - pola nie podane w żądaniu pozostaną bez zmian.
    """
    service = LawFirmService(db)
    updated_law_firm = service.update_law_firm(kancelaria_id, law_firm_data)
    
    if not updated_law_firm:
        raise HTTPException(status_code=404, detail="Kancelaria nie została znaleziona")
    
    return updated_law_firm


@router.delete("/{kancelaria_id}", status_code=204)
def delete_law_firm(
    kancelaria_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Usuwa kancelarię.
    
    **Uwaga**: Operacja nieodwracalna. Usuwa również wszystkie powiązane dane.
    """
    service = LawFirmService(db)
    success = service.delete_law_firm(kancelaria_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Kancelaria nie została znaleziona")
    
    return None