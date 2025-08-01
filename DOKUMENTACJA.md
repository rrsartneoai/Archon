# PrawoAsystent AI - Dokumentacja Projektu

## Przegląd Projektu

**PrawoAsystent AI** to zaawansowana platforma SaaS dedykowana kancelariom prawnym, która wykorzystuje najnowsze modele AI (Google Gemini 1.5 Pro/Flash) do automatyzacji i usprawnienia pracy prawników. Projekt ma na celu przekształcenie sposobu, w jaki prawnicy tworzą dokumenty, zarządzają wiedzą i analizują sprawy.

## Architektura Techniczna

### Stack Technologiczny
- **Backend**: Flask (Python) + SQLAlchemy ORM
- **Frontend**: React.js z Axios do komunikacji API
- **AI Engine**: Google Gemini 1.5 Pro/Flash via LangChain
- **Baza Danych**: PostgreSQL + ChromaDB (baza wektorowa)
- **Kolejka Zadań**: Celery + Redis
- **Autoryzacja**: JWT (JSON Web Tokens)
- **Płatności**: Stripe (w tym Stripe Connect dla marketplace)

### Architektura Systemu
```
Frontend (React) ↔ API (Flask) ↔ AI Service (Gemini) 
                      ↓
              PostgreSQL + ChromaDB
                      ↓
              Celery Workers (Redis)
```

## Kluczowe Funkcjonalności

### 1. Silnik Snippetów (Snippet Engine)

**Opis**: Inteligentny generator fragmentów dokumentów prawnych oparty na AI.

**Komponenty**:
- `SnippetGenerator.js` - interfejs użytkownika
- `/api/generate_snippet` - endpoint generowania
- Zaawansowany prompt engineering dla precyzji prawnej

**Funkcje**:
- Generowanie snippetów na podstawie opisu w języku naturalnym
- Wsparcie dla zmiennych (placeholders) typu `{{nazwa_klienta}}`
- Wybór tonu i stylu dokumentu
- Edytor WYSIWYG z podglądem na żywo
- "Supermoce" AI: uprość język, zmień ton, sprawdź spójność

**Modele Danych**:
```sql
CREATE TABLE snippets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    current_version_id INT,
    category VARCHAR(100),
    law_firm_id INT REFERENCES law_firms(id),
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE snippet_versions (
    id SERIAL PRIMARY KEY,
    snippet_id INT REFERENCES snippets(id),
    content TEXT NOT NULL,
    placeholders JSONB,
    version_number INT NOT NULL,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Multimodalny Asystent Prawny

**Opis**: Zaawansowany system transkrypcji i analizy nagrań audio z rozpraw, przesłuchań i spotkań.

**Przepływ Procesu**:
1. Upload pliku audio (MP3, WAV, M4A, OPUS)
2. Asynchroniczne przetwarzanie przez Gemini 1.5 Pro
3. Transkrypcja z identyfikacją mówców (diarization)
4. Możliwość przypisania nazwisk do mówców
5. Indeksacja w bazie wektorowej dla RAG
6. Interfejs czatu do analizy transkrypcji

**Komponenty**:
- `AudioAnalyzer.js` - główny interfejs
- `SpeakerManager.js` - zarządzanie nazwiskami mówców
- `/upload_audio` - endpoint uploadu
- `/job_status/{job_id}` - monitoring statusu
- `process_audio_task()` - zadanie w tle

**Modele Danych**:
```sql
CREATE TABLE audio_jobs (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT REFERENCES users(id),
    file_path VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    transcription_id INT REFERENCES transcriptions(id)
);

CREATE TABLE transcriptions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    original_content TEXT NOT NULL,
    formatted_content TEXT NOT NULL,
    speaker_mapping JSONB,
    raw_response JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. System RAG (Retrieval-Augmented Generation)

**Opis**: Inteligentny system wyszukiwania i odpowiadania na pytania w oparciu o dokumenty kancelarii.

**Funkcje**:
- Indeksowanie dokumentów PDF, transkrypcji i snippetów
- Wyszukiwanie semantyczne w bazie wektorowej
- Generowanie odpowiedzi z podaniem źródeł
- Podwójne sprawdzenie dla redukcji halucynacji

**Implementacja**:
- ChromaDB jako baza wektorowa
- Google Text Embedding Model dla embeddingów
- RetrievalQA chain z LangChain
- Weryfikacja odpowiedzi przez drugi model AI

### 4. Marketplace Snippetów

**Opis**: Platforma do sprzedaży i zakupu zweryfikowanych pakietów snippetów między kancelariami.

**Proces Publikacji**:
1. Kancelaria tworzy pakiet snippetów
2. Automatyczny skaner PII (danych osobowych)
3. Weryfikacja przez zespół prawny
4. Publikacja na marketplace
5. Integracja z płatnościami Stripe

**Modele Danych**:
```sql
CREATE TABLE marketplace_packages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    author_firm_id INT REFERENCES law_firms(id),
    status VARCHAR(50) DEFAULT 'DRAFT',
    stripe_product_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    buyer_firm_id INT REFERENCES law_firms(id),
    package_id INT REFERENCES marketplace_packages(id),
    purchase_price NUMERIC(10, 2) NOT NULL,
    stripe_charge_id VARCHAR(255) NOT NULL,
    purchased_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Proaktywny Agent Monitorowania Prawa

**Opis**: AI agent, który monitoruje zmiany w prawie i alarmuje o wpływie na snippety kancelarii.

**Funkcje**:
- Automatyczny scraping źródeł prawnych (Dziennik Ustaw, Sejm)
- Analiza wpływu zmian na bazę wiedzy kancelarii
- Function Calling w Gemini dla interakcji z bazą danych
- Personalizowane alerty dla każdej kancelarii

**Komponenty**:
- `check_for_legal_updates()` - cykliczny task
- `analyze_legal_update_for_firm()` - analiza wpływu
- Narzędzia AI: `search_law_firm_snippets()`, `get_law_firm_specializations()`

### 6. Asystent Negocjacji Umów

**Opis**: Narzędzie do porównywania wersji umów i generowania raportów różnic z oceną ryzyka.

**Funkcje**:
- Porównanie dwóch wersji umowy
- Identyfikacja zmian z oceną ryzyka
- Propozycje kontrpropozycji
- Raport w formacie JSON z rekomendacjami

**Endpoint**: `/api/v1/contracts/analyze_differences`

## Bezpieczeństwo i Zgodność

### Izolacja Danych (Multi-tenancy)
- Każda kancelaria ma własny `law_firm_id`
- Ścisła separacja danych na poziomie bazy
- Dedykowane kolekcje w bazie wektorowej

### Szyfrowanie
- TLS 1.3 dla komunikacji
- Szyfrowanie danych w spoczynku
- Opcjonalne Customer-Managed Encryption Keys (Enterprise)

### Audit Log
```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INT REFERENCES users(id),
    law_firm_id INT REFERENCES law_firms(id),
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### Zgodność z RODO
- Jasna polityka prywatności
- Możliwość eksportu i usunięcia danych
- Automatyczna anonimizacja w marketplace

## Model Biznesowy (SaaS)

### Plany Cenowe
1. **Free/Trial**: Ograniczone funkcje, 2 użytkowników, 50 snippetów
2. **Pro**: Pełne funkcje dla małych zespołów
3. **Enterprise**: Dedykowane wsparcie, zaawansowana kontrola dostępu

### Źródła Przychodów
- Miesięczne subskrypcje
- Prowizje z marketplace (Stripe Connect)
- Usługi premium (dedykowane wdrożenia)

## Przyszłe Rozszerzenia

### Integracje z Edytorami
- Add-in dla MS Word (Office.js)
- Google Docs Add-on (Apps Script)
- Synchronizacja w czasie rzeczywistym

### Analityka i Insights
- Dashboard wydajności kancelarii
- Statystyki użycia snippetów
- ROI z automatyzacji

### Zaawansowane AI
- Silnik rekomendacji snippetów
- Automatyczne redlinowanie dokumentów
- Predykcyjna analiza prawna

## Status Implementacji

### ✅ Zaprojektowane i Gotowe do Implementacji
- Architektura systemu
- Modele danych
- API endpoints
- Komponenty React
- Logika AI i prompt engineering
- System bezpieczeństwa

### 🔄 W Trakcie Rozwoju
- Integracje z edytorami tekstu
- Marketplace (weryfikacja i płatności)
- Zaawansowana analityka

### 📋 Planowane
- Mobile app
- API dla integracji zewnętrznych
- Rozszerzenia branżowe (notariusze, komornicy)

## Wymagania Techniczne

### Środowisko Deweloperskie
```bash
# Backend
pip install flask sqlalchemy langchain-google-genai celery redis

# Frontend
npm install react axios chart.js

# Baza danych
postgresql >= 13
redis >= 6
```

### Zmienne Środowiskowe
```env
GOOGLE_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_...
JWT_SECRET_KEY=your_jwt_secret
```

## Kontakt i Wsparcie

Projekt **PrawoAsystent AI** reprezentuje przyszłość automatyzacji w branży prawniczej, łącząc najnowsze osiągnięcia w dziedzinie AI z głębokim zrozumieniem potrzeb prawników i kancelarii.

---

*Dokumentacja wygenerowana automatycznie na podstawie specyfikacji projektu.*