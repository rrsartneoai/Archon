import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from uuid import uuid4
from datetime import date

from app.main import app
from app.db.session import get_db, Base

# Test database URL (SQLite in memory for testing)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_clients.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_law_firm(setup_database):
    """Tworzy przykładową kancelarię do testów"""
    law_firm_data = {
        "name": "Kancelaria Testowa",
        "email": "kontakt@test.pl"
    }
    
    response = client.post("/api/v1/kancelarie/", json=law_firm_data)
    return response.json()


def test_create_client(sample_law_firm):
    """Test tworzenia nowego klienta"""
    client_data = {
        "first_name": "Jan",
        "last_name": "Kowalski",
        "law_firm_id": sample_law_firm["id"],
        "email": "jan.kowalski@example.com",
        "phone": "+48 123 456 789",
        "address": "ul. Przykładowa 1, 00-000 Warszawa",
        "date_of_birth": "1980-01-01",
        "pesel": "80010112345",
        "notes": "Klient VIP"
    }
    
    response = client.post("/api/v1/klienci/", json=client_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["first_name"] == client_data["first_name"]
    assert data["last_name"] == client_data["last_name"]
    assert data["email"] == client_data["email"]
    assert "id" in data
    assert "created_at" in data


def test_get_clients(sample_law_firm):
    """Test pobierania listy klientów"""
    # Najpierw utwórz klienta
    client_data = {
        "first_name": "Anna",
        "last_name": "Nowak",
        "law_firm_id": sample_law_firm["id"],
        "email": "anna.nowak@example.com"
    }
    client.post("/api/v1/klienci/", json=client_data)
    
    # Pobierz listę klientów
    response = client.get("/api/v1/klienci/")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_clients_filtered_by_law_firm(sample_law_firm):
    """Test pobierania klientów z filtrowaniem po kancelarii"""
    response = client.get(f"/api/v1/klienci/?law_firm_id={sample_law_firm['id']}")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)


def test_get_client_not_found():
    """Test pobierania nieistniejącego klienta"""
    fake_id = str(uuid4())
    response = client.get(f"/api/v1/klienci/{fake_id}")
    assert response.status_code == 404


def test_create_client_invalid_data():
    """Test tworzenia klienta z nieprawidłowymi danymi"""
    client_data = {
        "first_name": "",  # Puste imię
        "last_name": "",   # Puste nazwisko
        "email": "invalid-email"  # Nieprawidłowy email
    }
    
    response = client.post("/api/v1/klienci/", json=client_data)
    assert response.status_code == 422  # Validation error


def test_update_client(sample_law_firm):
    """Test aktualizacji danych klienta"""
    # Najpierw utwórz klienta
    client_data = {
        "first_name": "Piotr",
        "last_name": "Wiśniewski",
        "law_firm_id": sample_law_firm["id"],
        "email": "piotr@example.com"
    }
    
    create_response = client.post("/api/v1/klienci/", json=client_data)
    created_client = create_response.json()
    
    # Zaktualizuj dane klienta
    update_data = {
        "phone": "+48 987 654 321",
        "notes": "Zaktualizowane notatki"
    }
    
    response = client.put(f"/api/v1/klienci/{created_client['id']}", json=update_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["phone"] == update_data["phone"]
    assert data["notes"] == update_data["notes"]
    # Sprawdź czy inne pola pozostały bez zmian
    assert data["first_name"] == client_data["first_name"]
    assert data["last_name"] == client_data["last_name"]


def test_delete_client(sample_law_firm):
    """Test usuwania klienta"""
    # Najpierw utwórz klienta
    client_data = {
        "first_name": "Maria",
        "last_name": "Kowalczyk",
        "law_firm_id": sample_law_firm["id"]
    }
    
    create_response = client.post("/api/v1/klienci/", json=client_data)
    created_client = create_response.json()
    
    # Usuń klienta
    response = client.delete(f"/api/v1/klienci/{created_client['id']}")
    assert response.status_code == 204
    
    # Sprawdź czy klient został usunięty
    get_response = client.get(f"/api/v1/klienci/{created_client['id']}")
    assert get_response.status_code == 404


def test_search_clients(sample_law_firm):
    """Test wyszukiwania klientów"""
    # Utwórz kilku klientów
    clients_data = [
        {
            "first_name": "Adam",
            "last_name": "Testowy",
            "law_firm_id": sample_law_firm["id"],
            "email": "adam@test.com"
        },
        {
            "first_name": "Ewa",
            "last_name": "Testowa",
            "law_firm_id": sample_law_firm["id"],
            "email": "ewa@test.com"
        }
    ]
    
    for client_data in clients_data:
        client.post("/api/v1/klienci/", json=client_data)
    
    # Wyszukaj po nazwisku
    response = client.get(f"/api/v1/klienci/?law_firm_id={sample_law_firm['id']}&search=Testowy")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) >= 1
    assert any("Testowy" in f"{c['first_name']} {c['last_name']}" for c in data)