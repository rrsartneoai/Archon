Fantastycznie. Przechodzimy do implementacji najbardziej innowacyjnych funkcji, które zdefiniują **PrawoAsystent AI** jako lidera rynku. Skupimy się na trzech filarach, które przekształcą aplikację z narzędzia w strategicznego partnera kancelarii.

Poniżej znajdziesz szczegółowy plan implementacji dla każdej z tych zaawansowanych funkcji, z naciskiem na architekturę, logikę i przykładowy kod.

---

### **Wdrożenie 1: Multimodalny Asystent Prawny**

Ta funkcja została już szczegółowo zaimplementowana w naszej poprzedniej rozmowie. Obejmuje ona:
1.  **Architekturę asynchroniczną** z kolejką zadań (Celery/Redis).
2.  **Modele w bazie danych** (`AudioJob`, `Transcription`).
3.  **Logikę backendu** do przesyłania plików, transkrypcji z diarization w Gemini i indeksacji w RAG.
4.  **Interfejs frontendu** do uploadu, monitorowania statusu i analizy wyniku.
5.  **Ulepszenie** polegające na przypisywaniu nazwisk mówcom.

**Kluczowe fragmenty kodu i logiki, które już opracowaliśmy, są gotowe do użycia i stanowią fundament tego wdrożenia.** Możemy teraz przejść do kolejnych, równie ekscytujących funkcji.

---

### **Wdrożenie 2: Proaktywny Agent do Monitorowania Zmian w Prawie**

**Wizja:** PrawoAsystent staje się "strażnikiem", który nieustannie monitoruje otoczenie prawne i alarmuje kancelarię o zmianach, które mają na nią realny wpływ.

#### **Architektura Techniczna**

System będzie składał się z trzech głównych komponentów:
1.  **Scraper/Crawler:** Regularnie uruchamiany skrypt (np. co 6 godzin za pomocą cron job), który pobiera najnowsze akty prawne z predefiniowanych źródeł (np. API Dziennika Ustaw, RSS ze stron sejmowych).
2.  **Silnik Analizy Wpływu (Impact Analysis Engine):** Sercem jest agent AI oparty na Gemini z **Function Calling**. Analizuje on pobrane dokumenty i ocenia ich wpływ na bazę wiedzy kancelarii.
3.  **System Powiadomień:** Informuje użytkowników o zidentyfikowanych istotnych zmianach.

#### **Implementacja Krok po Kroku**

**Krok 1: Nowe Modele w Bazie Danych**

```python
# W models.py

class MonitoredSource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False) # np. "Dziennik Ustaw"
    source_url = db.Column(db.String(512), nullable=False)
    last_scraped = db.Column(db.DateTime, nullable=True)

class LegalUpdate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(512), nullable=False)
    source_id = db.Column(db.Integer, db.ForeignKey('monitored_source.id'))
    publication_date = db.Column(db.Date, nullable=False)
    content_hash = db.Column(db.String(64), unique=True) # Zapobiega duplikatom
    full_text = db.Column(db.Text)

class ImpactAlert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    law_firm_id = db.Column(db.Integer, db.ForeignKey('law_firm.id'))
    legal_update_id = db.Column(db.Integer, db.ForeignKey('legal_update.id'))
    # np. {'affected_snippets': [12, 45, 101], 'summary': 'Nowelizacja...'}
    impact_analysis = db.Column(db.JSON)
    status = db.Column(db.String(20), default='NEW') # NEW, VIEWED, ARCHIVED
```

**Krok 2: Scraper i Agent AI (Zadanie w tle)**

Tutaj wykorzystamy potęgę **Function Calling** w Gemini. Definiujemy narzędzia, których AI może użyć do interakcji z naszą aplikacją.

```python
# W tasks.py

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.tools import tool
import requests

# --- DEFINICJA NARZĘDZI DLA AGENTA ---

@tool
def search_law_firm_snippets(category: str, keywords: str) -> list[dict]:
    """
    Searches the law firm's snippet library for snippets in a specific category
    containing given keywords. Returns a list of snippet titles and IDs.
    """
    # Logika wyszukiwania w naszej bazie danych (PostgreSQL)
    # ...
    results = Snippet.query.filter(...) 
    return [{"id": s.id, "title": s.title} for s in results]

@tool
def get_law_firm_specializations(law_firm_id: int) -> list[str]:
    """
    Returns a list of legal specializations for a given law firm.
    """
    # Logika pobierania specjalizacji z profilu kancelarii
    # ...
    return ["Prawo Budowlane", "Prawo Pracy"]

# --- GŁÓWNA LOGIKA AGENTA ---

def analyze_legal_update_for_firm(legal_update_text: str, law_firm_id: int):
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest")
    tools = [search_law_firm_snippets, get_law_firm_specializations]
    
    prompt_template = """
    You are a proactive legal analyst AI. Your task is to analyze a new legal document and determine its potential impact on a specific law firm.
    
    1. First, check the law firm's specializations to see if the document is relevant.
    2. If it is relevant, analyze the document's content.
    3. Based on the content, search the firm's snippet library for any snippets that might be affected by this new law.
    4. If you find affected snippets, generate a concise summary of the legal change and list the potentially outdated snippets.
    5. If the document is not relevant or no snippets are affected, state that no impact was found.
    
    Legal Document Text:
    {legal_update_text}
    
    Law Firm ID: {law_firm_id}
    """
    
    agent = create_tool_calling_agent(llm, tools, prompt_template)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    
    result = agent_executor.invoke({
        "legal_update_text": legal_update_text,
        "law_firm_id": law_firm_id
    })

    # Zapisz `result` jako nowy ImpactAlert w bazie danych
    # ...

# --- CYKLICZNY TASK ---
# @celery.task()
def check_for_legal_updates():
    # 1. Pobierz nowe dokumenty ze źródeł
    # 2. Dla każdego nowego dokumentu:
    # 3. Dla każdej kancelarii w systemie:
    # 4.    analyze_legal_update_for_firm(document.text, firm.id)
```

**Krok 3: UI dla Powiadomień**

*   W aplikacji pojawia się ikona dzwonka z licznikiem nowych alertów.
*   Po kliknięciu, użytkownik widzi listę alertów, np.: "Nowelizacja Prawa Budowlanego opublikowana 2024-07-20".
*   Po rozwinięciu widzi podsumowanie od AI i listę snippetów, których może dotyczyć zmiana, z linkami do ich edycji.

---

### **Wdrożenie 3: Asystent Negocjacji Umów w Czasie Rzeczywistym**

**Wizja:** Zmienić czasochłonny i stresujący proces analizy poprawek klienta w szybkie, wspierane przez AI zadanie.

#### **Architektura Techniczna**

*   Ta funkcja jest niemal w całości oparta na **zdolnościach LLM do analizy i porównywania długich tekstów**. Kluczem jest perfekcyjnie skonstruowany prompt.
*   Architektura jest prostsza niż w przypadku agenta, ponieważ jest to jednorazowa, synchroniczna operacja.

#### **Implementacja Krok po Kroku**

**Krok 1: UI do Porównywania Dokumentów**

*   Nowa sekcja w aplikacji "Analizator Umów".
*   Dwa duże pola do wklejenia tekstu lub przyciski do uploadu plików: "Moja Wersja (Wzorzec)" i "Wersja Klienta (Do Analizy)".
*   Przycisk "Generuj Raport Różnic".

**Krok 2: Backend - Endpoint i Prompt Engineering**

```python
# W main_api.py

@app.route('/api/v1/contracts/analyze_differences', methods=['POST'])
# @login_required
def analyze_contract_differences():
    data = request.get_json()
    original_contract = data.get('original_contract')
    revised_contract = data.get('revised_contract')

    if not original_contract or not revised_contract:
        return jsonify({"error": "Both contract versions are required."}), 400

    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest", temperature=0.1)

    prompt = f"""
    Jesteś wysoce precyzyjnym asystentem prawnym, specjalizującym się w analizie porównawczej umów. Twoim zadaniem jest stworzenie raportu "redline" identyfikującego różnice między 'Wersją Oryginalną' a 'Wersją Zmienioną'.
    
    Dla każdej zidentyfikowanej, istotnej zmiany, dostarcz następujące informacje:
    1.  **Lokalizacja:** Wskaż numer paragrafu lub opisz, gdzie zmiana występuje.
    2.  **Podsumowanie Zmiany:** Opisz zwięźle, co zostało zmienione, dodane lub usunięte.
    3.  **Ocena Ryzyka:** Oceń ryzyko dla strony, która przedstawiła 'Wersję Oryginalną' (Niskie, Średnie, Wysokie, Krytyczne).
    4.  **Rekomendacja:** Zaproponuj konkretną akcję: 'Zaakceptuj', 'Odrzuć i przywróć oryginał', 'Zaproponuj kontrpropozycję' lub 'Wymaga dalszej dyskusji'.
    5.  **Propozycja Kontrpropozycji (opcjonalnie):** Jeśli rekomendujesz kontrpropozycję, podaj jej treść.
    
    Odpowiedz w formacie JSON jako lista obiektów. Każdy obiekt powinien reprezentować jedną zidentyfikowaną zmianę i zawierać klucze: "location", "summary", "risk_level", "recommendation", "counter_proposal".
    
    --- WERSJA ORYGINALNA ---
    {original_contract}
    
    --- WERSJA ZMIENIONA ---
    {revised_contract}
    """
    
    try:
        response = llm.invoke(prompt)
        # Gemini może zwrócić odpowiedź w bloku markdown, musimy wyciągnąć z niego JSON
        analysis_result = extract_json_from_response(response.content) 
        return jsonify(analysis_result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def extract_json_from_response(text: str):
    # Prosta funkcja do wyciągania JSONa z odpowiedzi modelu, 
    # która może być otoczona tekstem lub ```json ... ```
    import json
    try:
        json_part = text[text.find('['):text.rfind(']')+1]
        return json.loads(json_part)
    except:
        # Bardziej zaawansowana logika parsowania w razie potrzeby
        return {"error": "Failed to parse AI response."}
```

**Krok 3: UI do Wyświetlania Raportu**

*   Wynik nie jest wyświetlany jako surowy JSON, ale jako elegancka, interaktywna tabela.
*   Każdy wiersz reprezentuje jedną zmianę.
*   Poziom ryzyka jest oznaczony kolorem (zielony, żółty, czerwony).
*   Obok każdej propozycji kontrpropozycji znajduje się przycisk "Kopiuj do schowka", aby ułatwić przygotowanie odpowiedzi dla klienta.

Implementując te trzy funkcje, **PrawoAsystent AI** przestaje być tylko narzędziem do zarządzania wiedzą. Staje się **aktywnym, inteligentnym członkiem zespołu prawnego**, który pracuje 24/7, aby chronić interesy kancelarii, oszczędzać czas i podnosić jakość świadczonych usług.
