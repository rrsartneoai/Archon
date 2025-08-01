

Poniżej znajduje się szczegółowy opis implementacji technicznej oraz koncepcja gotowego produktu, zgodnie z wytycznymi.

---

### **Projekt: PrawoAsystent – Silnik Snippetów (Snippet Engine)**

**Wizja:** Stworzenie zintegrowanego, inteligentnego narzędzia, które transformuje sposób tworzenia, zarządzania i ponownego wykorzystywania wiedzy prawnej w formie dynamicznych snippetów. Celem jest nie zastąpienie prawnika, lecz wzmocnienie jego efektywności poprzez automatyzację powtarzalnych zadań i udostępnienie instytucjonalnej wiedzy na wyciągnięcie ręki.

**Grupa Docelowa:** Indywidualni prawnicy, małe i średnie kancelarie oraz duże działy prawne korporacji, które dążą do standaryzacji, podniesienia jakości i przyspieszenia pracy z dokumentami.

---

### **1. Nazwa Produktu i Wartość Propozycji**

*   **Nazwa Produktu:** **PrawoAsystent: Silnik Snippetów** (ang. *Snippet Engine*). Nazwa podkreśla, że jest to potężny, zintegrowany komponent większego ekosystemu, a nie tylko prosty generator.

*   **Wartość Propozycji:**
    *   **Oszczędność Czasu:** Drastyczne skrócenie czasu potrzebnego na tworzenie standardowych i złożonych dokumentów prawnych. Prawnik skupia się na strategii, a nie na mechanicznym pisaniu.
    *   **Spójność i Jakość:** Zapewnienie jednolitego standardu i języka we wszystkich dokumentach tworzonych przez kancelarię, co minimalizuje ryzyko błędów i podnosi profesjonalny wizerunek.
    *   **Demokratyzacja Wiedzy:** Umożliwienie młodszym prawnikom dostępu do zweryfikowanej wiedzy i najlepszych praktyk doświadczonych kolegów, skompilowanych w formie gotowych do użycia snippetów.
    *   **Redukcja Ryzyka:** Minimalizacja ryzyka pominięcia kluczowych klauzul lub użycia nieaktualnych sformułowań.

---

### **2. Kluczowe Funkcjonalności Produktu**

To jest serce produktu, gdzie łączymy użyteczność z potęgą AI.

1.  **Inteligentne Generowanie Snippetów:**
    *   Użytkownik opisuje potrzebę w języku naturalnym, np. "klauzula waloryzacyjna oparta o wskaźnik inflacji GUS dla umowy najmu na 5 lat". System, korzystając z Gemini Pro, generuje precyzyjny, gotowy do wstawienia projekt klauzuli.

2.  **Edytor "WYSIWYG" z Podglądem na Żywo:**
    *   Wygenerowany snippet pojawia się w intuicyjnym edytorze tekstowym. Prawnik może natychmiastowo dokonać poprawek i dostosować tekst do unikalnego kontekstu sprawy.

3.  **Zaawansowane Placeholdery (Zmienne):**
    *   **Zmienne Tekstowe:** Proste `{{nazwa_klienta}}`, `{{numer_umowy}}`.
    *   **Pola Wyboru (Dropdown):** `{{rodzaj_sadu:Rejonowy|Okręgowy}}` – użytkownik przy wstawianiu wybiera opcję z listy.
    *   **Zmienne Daty:** `{{data_dzisiejsza}}` (wstawiana automatycznie), `{{termin_platnosci}}` (wyskakuje kalendarz do wyboru).
    *   To przekształca statyczne snippety w interaktywne szablony.

4.  **"Supermoce" AI – Asystent w Edytorze:**
    *   Użytkownik zaznacza fragment tekstu w edytorze i z menu kontekstowego wybiera akcję AI:
        *   **"Uprość Język"**: Przekształca złożony żargon prawniczy na zrozumiały dla klienta.
        *   **"Zmień Ton"**: Zmienia styl fragmentu na bardziej formalny, ugodowy lub asertywny.
        *   **"Sprawdź Spójność"**: Analizuje, czy terminologia w zaznaczonym fragmencie jest spójna z resztą dokumentu (wymaga wgrania całego dokumentu).
        *   **"Zaproponuj Alternatywę"**: Generuje 2-3 alternatywne sformułowania dla zaznaczonej klauzuli.

5.  **Biblioteka i Zarządzanie Snippetami:**
    *   Wszystkie zapisane snippety trafiają do centralnej biblioteki kancelarii.
    *   **Kategoryzacja i Tagi:** Możliwość przypisywania kategorii (np. "Prawo Pracy", "Nieruchomości") i tagów ("RODO", "kary umowne", "NDA").
    *   **Wyszukiwanie Pełnotekstowe:** Błyskawiczne przeszukiwanie całej bazy po słowach kluczowych.

6.  **Współpraca i Kontrola Wersji:**
    *   **Historia Zmian:** Każdy snippet ma pełną historię wersji z informacją, kto i kiedy dokonał zmiany. Możliwość przywrócenia poprzedniej wersji.
    *   **System Zatwierdzeń (Approval Workflow):** W planie Enterprise, snippety tworzone przez juniorów mogą wymagać zatwierdzenia przez partnera, zanim staną się dostępne dla całej kancelarii.
    *   **Komentarze:** Możliwość prowadzenia dyskusji w kontekście konkretnego snippetu.

7.  **Automatyczne Rozwijanie (Keyword Expansion):**
    *   Użytkownik definiuje skrót, np. `.kunda`. Wpisanie tego skrótu w dowolnym polu tekstowym w systemie i naciśnięcie spacji automatycznie wklei pełną treść "Klauzuli o poufności dla umowy o dzieło".

---

### **3. Szczegóły Implementacji (Architektura Techniczna)**

#### **Frontend (React)**
*   **Komponenty UI:**
    *   `SnippetGeneratorForm.js`: Formularz do opisywania potrzebnego snippetu.
    *   `SnippetEditor.js`: Główny komponent z edytorem tekstu (np. z użyciem biblioteki `Tiptap` lub `Quill.js`), który zawiera menu kontekstowe z "supermocami" AI.
    *   `SnippetLibrary.js`: Widok biblioteki z listą snippetów, filtrami i wyszukiwarką.
    *   `PlaceholderManager.js`: Interfejs do definiowania i zarządzania placeholderami w snippecie.
*   **Zarządzanie Stanem:** `React Context API` dla prostszych przypadków lub `Redux Toolkit` dla zarządzania złożonym stanem aplikacji (dane użytkownika, biblioteka snippetów, stan edytora).
*   **Interakcja z API:** `Axios` do komunikacji z backendem, z centralnie skonfigurowanym interceptorem do obsługi autoryzacji (JWT) i błędów.

#### **Backend (Flask)**
*   **Endpointy API:**
    *   `POST /api/v1/snippets/generate`: Przyjmuje opis i parametry, zwraca wygenerowany przez AI tekst.
    *   `POST /api/v1/snippets`: Zapisuje nowy snippet w bibliotece.
    *   `GET /api/v1/snippets`: Pobiera listę snippetów z paginacją i filtrowaniem.
    *   `PUT /api/v1/snippets/{id}`: Aktualizuje istniejący snippet i tworzy nową wersję.
    *   `POST /api/v1/snippets/assistant`: Endpoint dla "supermocy" AI, przyjmuje tekst i polecenie (np. "uprość").
*   **Prompt Engineering Strategy (Kluczowy element):**
    1.  **Konstrukcja Dynamicznego Promptu:** Funkcja w Pythonie, która buduje prompt z kilku części:
        *   **Kontekst Systemowy (Rola):** `"Jesteś ekspertem prawnym, asystentem tworzącym precyzyjne klauzule dla polskich kancelarii..."`
        *   **Zadanie (Task):** Na podstawie danych z formularza, np. `"Wygeneruj snippet typu 'Klauzula umowna'..."`
        *   **Dane Wejściowe (Input):** Opis od użytkownika.
        *   **Ograniczenia (Constraints):** `"Tekst musi być w języku polskim. Nie dodawaj żadnych komentarzy ani wyjaśnień. Używaj formalnego języka. Uwzględnij placeholdery: {{zmienna1}}, {{zmienna2}}."`
        *   **Format Wyjściowy (Output Format):** Dla bardziej złożonych zapytań można prosić o odpowiedź w formacie JSON: `{"title": "Propozycja tytułu", "content": "Treść klauzuli"}`.
    2.  **Wybór Modelu:** Logika, która na podstawie typu zadania (np. prosta klauzula vs. cały paragraf z analizą) wybiera `Gemini Flash` (szybkość/koszt) lub `Gemini Pro` (precyzja).
*   **Autoryzacja:** Implementacja JWT (JSON Web Tokens). Użytkownik loguje się, otrzymuje token, który jest dołączany do każdego kolejnego zapytania w nagłówku `Authorization`.

#### **Baza Danych (PostgreSQL)**
*   **Schemat Bazy Danych:**
    ```sql
    -- Tabela Kancelarii (dla multi-tenancy)
    CREATE TABLE law_firms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
    );

    -- Tabela Użytkowników
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        law_firm_id INT REFERENCES law_firms(id),
        role VARCHAR(50) NOT NULL -- np. 'junior', 'senior', 'admin'
    );

    -- Tabela Snippetów (główna)
    CREATE TABLE snippets (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        current_version_id INT, -- Wskaźnik na aktywną wersję
        category VARCHAR(100),
        law_firm_id INT REFERENCES law_firms(id),
        created_by INT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabela Wersji Snippetów (dla historii i audytu)
    CREATE TABLE snippet_versions (
        id SERIAL PRIMARY KEY,
        snippet_id INT REFERENCES snippets(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        placeholders JSONB, -- Przechowuje definicje placeholderów
        version_number INT NOT NULL,
        created_by INT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Tagi i tabela łącząca
    CREATE TABLE tags (id SERIAL PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL);
    CREATE TABLE snippet_tags (snippet_id INT REFERENCES snippets(id), tag_id INT REFERENCES tags(id), PRIMARY KEY (snippet_id, tag_id));
    ```

#### **Aspekty Bezpieczeństwa**
*   **Poufność Danych:** Ścisła izolacja danych pomiędzy kancelariami (`law_firm_id` w każdej tabeli).
*   **Szyfrowanie:** Komunikacja przez HTTPS (TLS 1.3). Szyfrowanie danych "at-rest" na poziomie serwera bazy danych.
*   **Kontrola Dostępu (RBAC):** Backend weryfikuje rolę użytkownika (`admin` może zarządzać użytkownikami, `junior` może tworzyć, ale nie zatwierdzać snippetów).
*   **Ochrona przed Atakami:** Walidacja wszystkich danych wejściowych (np. przy użyciu `Pydantic` lub `Marshmallow`), zapobieganie SQL Injection przez użycie ORM (SQLAlchemy), ochrona przed XSS przez biblioteki frontendowe.
*   **Zgodność z RODO:** Jasna polityka prywatności, możliwość eksportu i usunięcia danych użytkownika.

---

### **4. Potencjalne Rozszerzenia i Przyszłe Funkcje**

*   **Integracja z Edytorami Tekstu:** Stworzenie dodatków (add-ins) do MS Word i Google Docs, które pozwolą na wstawianie i generowanie snippetów bezpośrednio w dokumencie.
*   **Silnik Rekomendacji:** AI analizujące treść tworzonego dokumentu i proaktywnie sugerujące pasujące snippety z biblioteki.
*   **Analityka dla Kancelarii:** Dashboard pokazujący, które snippety są najczęściej używane, ile czasu zostało zaoszczędzone, którzy użytkownicy są najbardziej aktywni.
*   **Automatyczne Redlinowanie:** Możliwość wgrania dwóch wersji umowy, a AI podświetli różnice i oceni ich wpływ prawny.
*   **Marketplace Snippetów:** Możliwość (dla zweryfikowanych kancelarii) udostępniania lub sprzedaży wysokiej jakości, zanonimizowanych pakietów snippetów (np. "Kompletny pakiet RODO dla E-commerce").

---

### **5. Model Biznesowy (SaaS)**

*   **Plan Free/Trial:** Ograniczona liczba generacji AI miesięcznie, limit 2 użytkowników i 50 snippetów w bibliotece.
*   **Plan Pro (dla małych zespołów):** Miesięczna subskrypcja na użytkownika. Większe limity AI, nieograniczona liczba snippetów, podstawowa współpraca.
*   **Plan Enterprise (dla dużych kancelarii):** Wycena indywidualna. Pełna funkcjonalność, w tym zaawansowana kontrola dostępu, system zatwierdzeń, dedykowane wsparcie i gwarancje SLA.
*   






extended







Znakomicie. Skupmy się teraz na przekształceniu **PrawoAsystent** z doskonałego produktu w **lidera rynku i ekosystem**. Te przyszłe funkcje to nie tylko dodatki, ale strategiczne kroki, które głęboko zintegrują aplikację z codziennym przepływem pracy prawnika i otworzą nowe źródła przychodów.

Oto szczegółowa implementacja każdej z tych wizjonerskich funkcji, od architektury po fragmenty kodu.

---

### **1. Integracja z Edytorami Tekstu (MS Word & Google Docs)**

**Wizja:** Prawnik nie musi opuszczać swojego ulubionego edytora. PrawoAsystent jest dostępny jako boczny panel, gotowy do działania w kontekście edytowanego dokumentu.

#### **Architektura Techniczna**

*   **Wspólny Rdzeń Logiki:** Zarówno dodatek do Worda, jak i Google Docs, będą cienkimi klientami (thin clients). Cała logika biznesowa, komunikacja z AI i bazą danych pozostaje w naszym głównym backendzie Flask. Dodatki będą jedynie renderować UI i komunikować się z naszym API.
*   **Technologia:**
    *   **MS Word (Office Add-in):** Wykorzystujemy `Office.js` API. Dodatek to w praktyce aplikacja webowa (HTML, CSS, JavaScript/React) hostowana na naszym serwerze i osadzona w panelu bocznym Worda.
    *   **Google Docs (Google Workspace Add-on):** Używamy `Apps Script` do stworzenia logiki i `Card Service` do zbudowania interfejsu (lub `HTML Service` dla bardziej niestandardowego UI opartego na React).
*   **Autoryzacja:** Użyjemy protokołu OAuth 2.0. Przy pierwszym uruchomieniu dodatku, użytkownik zostanie przekierowany na stronę logowania PrawoAsystent, aby autoryzować dodatek do dostępu do swojego konta.

#### **Implementacja (Przykład dla MS Word Add-in z React)**

1.  **Stworzenie manifestu (`manifest.xml`):** Plik XML, który opisuje dodatek, jego uprawnienia (np. `ReadWriteDocument`) i lokalizację naszej aplikacji webowej.

2.  **Aplikacja React dla Panelu Bocznego:**
    ```jsx
    // WordAddin.js
    import React, { useState, useEffect } from 'react';
    import axios from 'axios';

    // Inicjalizacja Office.js
    // Office.onReady();

    const WordAddin = () => {
        const [snippets, setSnippets] = useState([]);
        const [searchTerm, setSearchTerm] = useState('');

        useEffect(() => {
            // Pobierz snippety z naszego API po załadowaniu
            const fetchSnippets = async () => {
                const token = await getAuthToken(); // Funkcja do obsługi OAuth
                const response = await axios.get('/api/v1/snippets', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setSnippets(response.data);
            };
            fetchSnippets();
        }, []);

        const handleInsertSnippet = (content) => {
            Word.run(async (context) => {
                const range = context.document.getSelection();
                // Wstawia treść snippetu w miejscu kursora
                range.insertText(content, Word.InsertLocation.replace);
                await context.sync();
            }).catch(error => console.log('Error: ' + error));
        };

        return (
            <div>
                <input 
                    type="text" 
                    placeholder="Szukaj snippetu..." 
                    onChange={e => setSearchTerm(e.target.value)} 
                />
                <ul>
                    {snippets.filter(s => s.title.includes(searchTerm)).map(snippet => (
                        <li key={snippet.id} onClick={() => handleInsertSnippet(snippet.current_version.content)}>
                            {snippet.title}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };
    ```

---

### **2. Silnik Rekomendacji Snippetów**

**Wizja:** Gdy prawnik pisze umowę, system analizuje otaczający tekst i proaktywnie sugeruje: "Wygląda na to, że tworzysz umowę o dzieło. Czy chcesz dodać klauzulę o przeniesieniu praw autorskich?".

#### **Architektura Techniczna**

*   **Podejście hybrydowe (dwa etapy):**
    1.  **Etap 1 (Szybki i Tani - Embedding-based):**
        *   Gdy użytkownik przestaje pisać na kilka sekund, dodatek (z Worda/Google Docs) wysyła ostatnie 1-2 paragrafy tekstu do specjalnego endpointu w naszym API.
        *   Backend tworzy wektor (embedding) dla tego fragmentu tekstu.
        *   System przeszukuje **bazę wektorową zawierającą wszystkie snippety kancelarii**, aby znaleźć te, które są semantycznie najbliższe.
        *   Zwraca 3-5 najlepiej pasujących snippetów jako sugestie.
    2.  **Etap 2 (Zaawansowany - LLM-based):**
        *   Użytkownik klika przycisk "Głęboka analiza".
        *   Do API wysyłany jest znacznie większy fragment tekstu (lub cały dokument).
        *   Backend tworzy prompt dla Gemini, który zawiera ten tekst oraz instrukcję: `"Jesteś asystentem prawnym. Przeanalizuj poniższy dokument i zidentyfikuj potencjalne brakujące klauzule lub obszary, które można uzupełnić. Zasugeruj 3 najbardziej adekwatne snippety z poniższej listy [opcjonalnie można podać listę tytułów snippetów], które mogłyby wzbogacić ten dokument."`
        *   Gemini zwraca bardziej kontekstowe i inteligentne rekomendacje.

#### **Implementacja (Endpoint dla szybkiego silnika rekomendacji)**

```python
# W pliku main_api.py

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from your_vector_store import vector_store # Zaimportowana instancja bazy wektorowej

@app.route('/api/v1/snippets/recommend', methods=['POST'])
def recommend_snippets():
    data = request.get_json()
    context_text = data.get('context_text')
    
    if not context_text:
        return jsonify({"error": "Context text is required"}), 400

    # Używamy tej samej instancji co w RAG, ale do innego celu
    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
    
    # Tworzymy wektor dla kontekstu i szukamy podobnych w bazie wektorowej snippetów
    results = vector_store.similarity_search(context_text, k=3)
    
    recommended_snippets = [
        {
            "id": res.metadata['snippet_id'],
            "title": res.metadata['title'],
            "reason": "Semantycznie pasuje do Twojego tekstu." 
        } for res in results
    ]

    return jsonify(recommended_snippets)
```

---

### **3. Analityka dla Kancelarii**

**Wizja:** Partner zarządzający loguje się i widzi dashboard, który w przejrzysty sposób pokazuje, jak technologia wpływa na wydajność i koszty kancelarii.

#### **Architektura Techniczna**

*   **Zbieranie Danych:** Musimy logować kluczowe zdarzenia w dedykowanej tabeli `analytics_events`.
    *   `snippet_created`, `snippet_used`, `ai_generation_invoked`, `user_login`.
*   **Przetwarzanie Danych:** Można to robić na dwa sposoby:
    1.  **Na żywo:** Agregowanie danych bezpośrednio z bazy SQL przy ładowaniu dashboardu (dobre dla małej skali).
    2.  **Batchowo:** Codzienny skrypt (np. cron job), który przetwarza surowe logi i zapisuje zagregowane wyniki w oddzielnych tabelach analitycznych. To znacznie wydajniejsze.
*   **Wizualizacja:** Użycie biblioteki do wykresów na frontendzie (np. `Chart.js` lub `D3.js`).

#### **Implementacja (Przykładowy schemat tabeli i dashboard)**

**Model `AnalyticsEvent`:**
```python
class AnalyticsEvent(db.Model):
    id = db.Column(db.BigInteger, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False, index=True) # np. 'snippet_used'
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    law_firm_id = db.Column(db.Integer, db.ForeignKey('law_firm.id'), index=True)
    metadata = db.Column(db.JSON) # np. {'snippet_id': 123, 'time_saved_estimate_sec': 300}
    timestamp = db.Column(db.DateTime, server_default=db.func.now(), index=True)
```

**Frontend (Dashboard):**
Komponent React, który pobiera dane z endpointów `GET /api/v1/analytics/usage_summary` i `GET /api/v1/analytics/top_users` i renderuje je za pomocą `Chart.js`.

---

### **4. Automatyczne Redlinowanie**

**Wizja:** Prawnik wrzuca dwie wersje umowy (np. swoją i tę, którą odesłał klient), a system w kilka sekund generuje raport z podsumowaniem zmian i oceną ryzyka.

#### **Architektura Techniczna**

*   **Wykorzystanie gigantycznego okna kontekstowego Gemini 1.5 Pro:** To funkcja stworzona dla tego zadania. Nie musimy porównywać plików linia po linii.
*   **Proces:**
    1.  Użytkownik wgrywa dwa pliki (Dokument A, Dokument B).
    2.  Backend odczytuje tekst z obu dokumentów.
    3.  Tworzony jest bardzo precyzyjny prompt:
        ```prompt
        Jesteś ekspertem w analizie umów prawnych. Poniżej znajdują się dwie wersje tej samej umowy: 'Dokument A (Oryginał)' i 'Dokument B (Wersja Zmieniona)'. Twoim zadaniem jest:
        1.  Zidentyfikować i wylistować wszystkie istotne zmiany (dodane, usunięte i zmodyfikowane klauzule) pomiędzy dokumentami.
        2.  Dla każdej zmiany, oceń jej potencjalny wpływ i ryzyko dla strony reprezentowanej przez 'Dokument A' w skali od Niskiego do Krytycznego.
        3.  Zaproponuj kontrpropozycje lub pytania wyjaśniające dla zmian o ryzyku Średnim lub wyższym.
        Odpowiedz w formacie JSON z listą obiektów, gdzie każdy obiekt ma klucze: 'clause_summary', 'change_type', 'risk_level', 'recommendation'.

        --- DOKUMENT A (ORYGINAŁ) ---
        [treść dokumentu A]

        --- DOKUMENT B (WERSJA ZMIENIONA) ---
        [treść dokumentu B]
        ```
    4.  Backend wysyła prompt do Gemini 1.5 Pro.
    5.  Otrzymana odpowiedź JSON jest parsowana i wyświetlana na frontendzie w formie czytelnego raportu.

---

### **5. Marketplace Snippetów**

**Wizja:** Tworzymy ekosystem, w którym najlepsze kancelarie mogą monetyzować swoją wiedzę, a mniejsze podmioty mogą uzyskać dostęp do wysokiej jakości, zweryfikowanych wzorców.

#### **Architektura Techniczna**

*   **Nowe Modele w Bazie Danych:**
    *   `MarketplacePackage`: Opis pakietu (tytuł, opis, cena, autor-kancelaria).
    *   `PackageSnippets`: Tabela łącząca pakiety ze snippetami.
    *   `Purchase`: Zapis transakcji zakupu.
*   **Proces Publikacji:**
    1.  Kancelaria-sprzedawca tworzy pakiet i wybiera snippety, które chce w nim umieścić.
    2.  **Proces Anonimizacji i Weryfikacji (Kluczowy!):**
        *   Automatyczny skaner AI przeszukuje snippety w poszukiwaniu danych osobowych, nazw firm itp. i flaguje je do ręcznej anonimizacji.
        *   Nasz wewnętrzny zespół prawny (lub zaufani partnerzy) weryfikuje jakość i uniwersalność pakietu. To buduje zaufanie do marketplace.
    3.  Po zatwierdzeniu, pakiet staje się widoczny na marketplace.
*   **Integracja z Płatnościami (Stripe Connect):**
    *   Używamy Stripe Connect, aby obsłużyć płatności i automatycznie dzielić przychody pomiędzy nas (jako platformę) a kancelarię-sprzedawcę. Stripe zajmuje się skomplikowaną logiką wypłat i rozliczeń.

Te rozszerzenia, choć ambitne, są logicznym następstwem rozwoju platformy. Budują one "fosę" wokół produktu – głęboką integrację, efekty sieciowe (marketplace) i unikalne, trudne do skopiowania funkcjonalności oparte na AI.
