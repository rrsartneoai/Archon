# API Kancelarii Prawnej

Kompleksowe rozwiązanie backendowe do zarządzania kancelariami prawnymi, zbudowane z użyciem FastAPI.

## 🚀 Funkcjonalności

- **Zarządzanie kancelariami** - tworzenie, edycja, usuwanie kancelarii prawnych
- **Zarządzanie klientami** - pełna obsługa bazy klientów z wyszukiwaniem
- **Zarządzanie sprawami** - prowadzenie spraw prawnych z dokumentami i notatkami
- **Statystyki** - podstawowe statystyki dla kancelarii
- **Dokumentacja API** - automatycznie generowana dokumentacja OpenAPI
- **Walidacja danych** - automatyczna walidacja przy użyciu Pydantic
- **Testy** - kompleksowe testy jednostkowe i integracyjne

## 📋 Wymagania

- Python 3.8+
- PostgreSQL 12+ (lub SQLite do testów)
- pip lub poetry

## 🛠️ Instalacja

### 1. Klonowanie repozytorium

```bash
git clone <adres-repozytorium>
cd api
```

### 2. Utworzenie wirtualnego środowiska

```bash
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Instalacja zależności

```bash
pip install -r requirements.txt
```

### 4. Konfiguracja środowiska

```bash
cp .env.example .env
```

Edytuj plik `.env` i uzupełnij zmienne środowiskowe:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/kancelaria_db
SECRET_KEY=your-super-secret-key-here
```

### 5. Uruchomienie aplikacji

```bash
uvicorn app.main:app --reload
```

Aplikacja będzie dostępna pod adresem:
- API: http://127.0.0.1:8000
- Dokumentacja (Swagger): http://127.0.0.1:8000/docs
- Dokumentacja (ReDoc): http://127.0.0.1:8000/redoc

## 📚 Struktura Projektu

```
api/
├── app/
│   ├── api/v1/
│   │   ├── endpoints/          # Endpointy API
│   │   │   ├── kancelarie.py
│   │   │   ├── klienci.py
│   │   │   └── sprawy.py
│   │   └── schemas/            # Schematy Pydantic
│   │       └── kancelaria.py
│   ├── core/                   # Konfiguracja
│   │   └── config.py
│   ├── db/                     # Baza danych
│   │   └── session.py
│   ├── models/                 # Modele SQLAlchemy
│   │   └── kancelaria.py
│   ├── services/               # Logika biznesowa
│   │   └── kancelaria_service.py
│   ├── tests/                  # Testy
│   │   ├── test_kancelarie.py
│   │   └── test_klienci.py
│   └── main.py                 # Główna aplikacja
├── .env.example
├── requirements.txt
├── openapi.yaml
└── README.md
```

## 🔌 API Endpoints

### Kancelarie (`/api/v1/kancelarie`)

- `POST /` - Tworzy nową kancelarię
- `GET /` - Pobiera listę kancelarii (z paginacją)
- `GET /{id}` - Pobiera szczegóły kancelarii ze statystykami
- `PUT /{id}` - Aktualizuje kancelarię
- `DELETE /{id}` - Usuwa kancelarię

### Klienci (`/api/v1/klienci`)

- `POST /` - Dodaje nowego klienta
- `GET /` - Pobiera listę klientów (z filtrowaniem i wyszukiwaniem)
- `GET /{id}` - Pobiera szczegóły klienta
- `PUT /{id}` - Aktualizuje klienta
- `DELETE /{id}` - Usuwa klienta

### Sprawy (`/api/v1/sprawy`)

- `POST /` - Tworzy nową sprawę
- `GET /` - Pobiera listę spraw (z filtrowaniem)
- `GET /statistics` - Pobiera statystyki spraw
- `GET /{id}` - Pobiera szczegóły sprawy
- `PUT /{id}` - Aktualizuje sprawę
- `DELETE /{id}` - Archiwizuje sprawę
- `POST /{id}/documents` - Dodaje dokument do sprawy
- `GET /{id}/documents` - Pobiera dokumenty sprawy
- `POST /{id}/notes` - Dodaje notatkę do sprawy
- `GET /{id}/notes` - Pobiera notatki sprawy

## 🧪 Testowanie

Uruchomienie testów:

```bash
pytest
```

Uruchomienie testów z pokryciem kodu:

```bash
pytest --cov=app
```

Uruchomienie konkretnego testu:

```bash
pytest app/tests/test_kancelarie.py::test_create_law_firm
```

## 📖 Dokumentacja API

Dokumentacja API jest automatycznie generowana przez FastAPI i dostępna pod adresami:

- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc
- **OpenAPI JSON**: http://127.0.0.1:8000/api/v1/openapi.json

Statyczna wersja specyfikacji OpenAPI znajduje się w pliku `openapi.yaml`.

## 🔧 Konfiguracja

Wszystkie ustawienia aplikacji znajdują się w pliku `app/core/config.py` i mogą być nadpisane przez zmienne środowiskowe w pliku `.env`.

### Główne zmienne środowiskowe:

- `DATABASE_URL` - URL bazy danych
- `SECRET_KEY` - Klucz do podpisywania tokenów
- `DEBUG` - Tryb debugowania (True/False)
- `ENVIRONMENT` - Środowisko (development/production)

## 🚀 Wdrożenie

### Docker (opcjonalnie)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Produkcja

Dla środowiska produkcyjnego zalecane jest użycie:

- **Gunicorn** z workerami Uvicorn
- **Nginx** jako reverse proxy
- **PostgreSQL** jako baza danych
- **Redis** do cache'owania (opcjonalnie)

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 🤝 Rozwój

### Dodawanie nowych funkcjonalności

1. Utwórz nowy model w `app/models/`
2. Dodaj schematy Pydantic w `app/api/v1/schemas/`
3. Zaimplementuj logikę biznesową w `app/services/`
4. Utwórz endpointy w `app/api/v1/endpoints/`
5. Dodaj testy w `app/tests/`
6. Zaktualizuj dokumentację

### Konwencje kodu

- Używaj type hints
- Dokumentuj funkcje i klasy
- Przestrzegaj PEP 8
- Pisz testy dla nowych funkcjonalności

## 📝 Licencja

MIT License - szczegóły w pliku LICENSE.

## 📞 Kontakt

- Email: dev@kancelaria-api.pl
- Dokumentacja: http://127.0.0.1:8000/docs