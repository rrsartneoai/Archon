import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from uuid import uuid4

from app.main import app
from app.db.session import get_db, Base
from app.models.kancelaria import LawFirm

# Test database URL (SQLite in memory for testing)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

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


def test_create_law_firm(setup_database):
    """Test tworzenia nowej kancelarii"""
    law_firm_data = {
        "name": "Kancelaria Testowa",
        "address": "ul. Testowa 1, 00-000 Warszawa",
        "phone": "+48 123 456 789",
        "email": "kontakt@test.pl",
        "tax_id": "1234567890",
        "registration_number": "0000123456",
        "website": "https://test.pl",
        "description": "Testowa kancelaria prawna"
    }
    
    response = client.post("/api/v1/kancelarie/", json=law_firm_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["name"] == law_firm_data["name"]
    assert data["email"] == law_firm_data["email"]
    assert "id" in data
    assert "created_at" in data


def test_get_law_firms(setup_database):
    """Test pobierania listy kancelarii"""
    response = client.get("/api/v1/kancelarie/")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)


def test_get_law_firm_not_found(setup_database):
    """Test pobierania nieistniejącej kancelarii"""
    fake_id = str(uuid4())
    response = client.get(f"/api/v1/kancelarie/{fake_id}")
    assert response.status_code == 404


def test_create_law_firm_invalid_data(setup_database):
    """Test tworzenia kancelarii z nieprawidłowymi danymi"""
    law_firm_data = {
        "name": "",  # Puste imię - powinno być błędem
        "email": "invalid-email"  # Nieprawidłowy email
    }
    
    response = client.post("/api/v1/kancelarie/", json=law_firm_data)
    assert response.status_code == 422  # Validation error


def test_health_check():
    """Test endpointu health check"""
    response = client.get("/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_root_endpoint():
    """Test głównego endpointu"""
    response = client.get("/")
    assert response.status_code == 200
    
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert "docs_url" in data