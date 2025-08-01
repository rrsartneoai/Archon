from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.db.session import get_db
from app.services.kancelaria_service import ClientService
from app.api.v1.schemas.kancelaria import (
    Client, ClientCreate, ClientUpdate, ClientWithCases
)

router = APIRouter()


@router.post("/", response_model=Client, status_code=201)
def create_client(
    client_data: ClientCreate,
    db: Session = Depends(get_db)
):
    """
    Dodaje nowego klienta do systemu.
    
    - **first_name**: Imię klienta (wymagane)
    - **last_name**: Nazwisko klienta (wymagane)
    - **law_firm_id**: ID kancelarii (wymagane)
    - **email**: Adres email
    - **phone**: Numer telefonu
    - **address**: Adres zamieszkania
    - **date_of_birth**: Data urodzenia
    - **pesel**: Numer PESEL
    - **notes**: Dodatkowe notatki
    """
    service = ClientService(db)
    return service.create_client(client_data)


@router.get("/", response_model=List[Client])
def get_clients(
    law_firm_id: Optional[UUID] = Query(None, description="Filtruj po ID kancelarii"),
    search: Optional[str] = Query(None, description="Wyszukaj po imieniu, nazwisku lub emailu"),
    skip: int = Query(0, ge=0, description="Liczba rekordów do pominięcia"),
    limit: int = Query(100, ge=1, le=1000, description="Maksymalna liczba rekordów"),
    db: Session = Depends(get_db)
):
    """
    Pobiera listę klientów z opcjonalnym filtrowaniem i wyszukiwaniem.
    
    Można filtrować po kancelarii i wyszukiwać po imieniu, nazwisku lub emailu.
    """
    service = ClientService(db)
    
    if search and law_firm_id:
        return service.search_clients(law_firm_id, search, skip=skip, limit=limit)
    else:
        return service.get_clients(law_firm_id=law_firm_id, skip=skip, limit=limit)


@router.get("/{klient_id}", response_model=Client)
def get_client(
    klient_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Pobiera szczegóły klienta.
    """
    service = ClientService(db)
    client = service.get_client(klient_id)
    
    if not client:
        raise HTTPException(status_code=404, detail="Klient nie został znaleziony")
    
    return client


@router.put("/{klient_id}", response_model=Client)
def update_client(
    klient_id: UUID,
    client_data: ClientUpdate,
    db: Session = Depends(get_db)
):
    """
    Aktualizuje dane klienta.
    
    Można aktualizować wybrane pola - pola nie podane w żądaniu pozostaną bez zmian.
    """
    service = ClientService(db)
    updated_client = service.update_client(klient_id, client_data)
    
    if not updated_client:
        raise HTTPException(status_code=404, detail="Klient nie został znaleziony")
    
    return updated_client


@router.delete("/{klient_id}", status_code=204)
def delete_client(
    klient_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Usuwa klienta z systemu.
    
    **Uwaga**: Operacja nieodwracalna. Usuwa również wszystkie powiązane sprawy.
    """
    service = ClientService(db)
    success = service.delete_client(klient_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Klient nie został znaleziony")
    
    return None