Znakomicie. Skupmy się teraz na sercu produktywności – **Generatorze Snippetów**. To nie będzie proste pole tekstowe, ale inteligentne narzędzie, które rozumie intencje prawnika i dostarcza gotowe, wysokiej jakości fragmenty tekstu.

Poniżej znajdziesz szczegółową implementację podzieloną na trzy kluczowe części:
1.  **Backend (API):** Logika, prompt engineering i komunikacja z AI (Gemini).
2.  **Frontend:** Interfejs użytkownika w React, który umożliwia interakcję z generatorem.
3.  **Integracja z Bazą Danych:** Proces zapisu i zarządzania wygenerowanym snippetem.

---

### **Architektura Generatora Snippetów**

Przepływ danych będzie wyglądał następująco:

1.  **Frontend (React):** Użytkownik wypełnia formularz opisujący, jakiego snippetu potrzebuje.
2.  **Backend (Flask API):** Otrzymuje dane z formularza.
3.  **Prompt Engineering:** Backend tworzy precyzyjny, rozbudowany prompt dla modelu Gemini.
4.  **Google AI Service:** Backend wysyła prompt do Gemini 1.5 Flash (szybkość i niższy koszt) lub Pro (dla złożonych klauzul).
5.  **Backend:** Odbiera wygenerowany tekst.
6.  **Frontend:** Wyświetla użytkownikowi wygenerowany snippet w edytowalnym polu.
7.  **Frontend -> Backend -> Baza Danych (PostgreSQL):** Użytkownik akceptuje, edytuje i zapisuje snippet, który trafia do bazy danych.

---

### **Część 1: Backend – Silnik Generatora (Flask & Gemini)**

To tutaj dzieje się cała magia. Kluczem jest **prompt engineering** – stworzenie instrukcji dla AI, która zapewni prawniczą precyzję i odpowiedni format.

**Plik `main_api.py` (rozszerzenie poprzedniego kodu):**

```python
from flask import Flask, request, jsonify
from langchain_google_genai import ChatGoogleGenerativeAI
import os

# ... (istniejąca konfiguracja i importy)

app = Flask(__name__)

# --- NOWA FUNKCJONALNOŚĆ: GENERATOR SNIPPETÓW ---

def create_legal_snippet_prompt(description: str, snippet_type: str, tone: str, custom_vars: list = None):
    """
    Tworzy wysoce precyzyjny prompt dla modelu Gemini w celu generowania snippetów prawnych.
    """
    # 1. Definicja Roli (Kim jest AI?)
    role_definition = "Jesteś ekspertem-asystentem prawnym specjalizującym się w polskim prawie. Twoim zadaniem jest tworzenie precyzyjnych, formalnych i gotowych do użycia fragmentów dokumentów (snippetów) dla doświadczonych prawników."

    # 2. Definicja Zadania (Co ma zrobić?)
    task_definition = f"Wygeneruj snippet prawny typu '{snippet_type}' na podstawie następującego opisu: '{description}'."

    # 3. Definicja Stylu i Tonu
    tone_instruction = f"Zachowaj {tone} ton. Tekst musi być jednoznaczny, profesjonalny i zgodny z polską terminologią prawniczą."

    # 4. Instrukcje dotyczące Zmiennych (Placeholders)
    variable_instruction = ""
    if custom_vars:
        vars_string = ", ".join([f"'{{{{{var.strip()}}}}}'" for var in custom_vars])
        variable_instruction = f"W snippecie uwzględnij następujące dynamiczne zmienne (placeholdery) w formacie '{{{{zmienna}}}}': {vars_string}."

    # 5. Ograniczenia i Zasady Bezpieczeństwa
    constraints = """
WAŻNE ZASADY:
- Nie dodawaj żadnych opinii, komentarzy ani wyjaśnień poza samym tekstem snippetu.
- Skup się wyłącznie na treści merytorycznej.
- Nie generuj nagłówków ani tytułów, chyba że opis wyraźnie o to prosi.
- Zawsze używaj języka polskiego.
"""

    # 6. Złożenie kompletnego promptu
    full_prompt = f"""
{role_definition}

{task_definition}
{tone_instruction}
{variable_instruction}

{constraints}
"""
    return full_prompt

@app.route('/generate_snippet', methods=['POST'])
def generate_snippet():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input"}), 400

    # Pobranie parametrów z frontendu
    description = data.get('description')
    snippet_type = data.get('type', 'Klauzula umowna') # np. 'Klauzula', 'Paragraf', 'Email'
    tone = data.get('tone', 'formalny i zwięzły') # np. 'formalny', 'bardzo szczegółowy'
    custom_vars = data.get('variables', []) # np. ['nazwa_firmy', 'data_zawarcia', 'kwota_kary']
    model_choice = data.get('model', 'flash') # 'flash' dla szybkości, 'pro' dla złożoności

    if not description:
        return jsonify({"error": "Description is required"}), 400

    # Wybór modelu
    model_name = "gemini-1.5-flash-latest" if model_choice == 'flash' else "gemini-1.5-pro-latest"
    llm = ChatGoogleGenerativeAI(model=model_name, temperature=0.2) # Niska temperatura dla większej precyzji

    # Stworzenie i wykonanie promptu
    prompt = create_legal_snippet_prompt(description, snippet_type, tone, custom_vars)
    
    try:
        response = llm.invoke(prompt)
        generated_text = response.content
        
        # Zapis do logu audytowego (zgodnie z poprzednimi sugestiami)
        # log_audit_event(user_id, 'snippet_generation', {'prompt': prompt, 'response': generated_text})

        return jsonify({"generated_snippet": generated_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint do zapisu gotowego snippetu (po edycji przez usera)
@app.route('/snippets', methods=['POST'])
def save_snippet():
    data = request.get_json()
    # Logika zapisu do bazy danych PostgreSQL
    # Np. title = data['title'], content = data['content'], etc.
    # ...
    # db.session.add(new_snippet)
    # db.session.commit()
    print(f"Zapisywanie snippetu: {data['title']}")
    return jsonify({"message": "Snippet saved successfully!", "id": 123}), 201

# ... (reszta kodu API, np. /ask)
```

---

### **Część 2: Frontend – Interfejs Użytkownika (React)**

Tworzymy komponent `SnippetGenerator`, który będzie formularzem i wyświetli wynik.

**Instalacja bibliotek (jeśli potrzebne):**
`npm install axios` (lub można użyć wbudowanego `fetch`)

**Plik `SnippetGenerator.js`:**

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const SnippetGenerator = ({ onSnippetSaved }) => {
    // Stan dla pól formularza
    const [description, setDescription] = useState('');
    const [snippetType, setSnippetType] = useState('Klauzula umowna');
    const [tone, setTone] = useState('formalny i zwięzły');
    const [variables, setVariables] = useState('');

    // Stan dla wyniku i procesu
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generatedSnippet, setGeneratedSnippet] = useState('');

    // Stan dla finalnego snippetu do zapisu
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');

    const handleGenerate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setGeneratedSnippet('');

        try {
            const response = await axios.post('/api/generate_snippet', {
                description,
                type: snippetType,
                tone,
                variables: variables.split(',').filter(v => v.trim() !== '')
            });
            setGeneratedSnippet(response.data.generated_snippet);
        } catch (err) {
            setError('Wystąpił błąd podczas generowania snippetu. Spróbuj ponownie.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title || !generatedSnippet) {
            alert('Tytuł i treść snippetu są wymagane.');
            return;
        }
        // Logika zapisu do bazy danych
        try {
            const response = await axios.post('/api/snippets', {
                title,
                content: generatedSnippet,
                category,
                tags: [] // Można dodać pole na tagi
            });
            alert('Snippet zapisany pomyślnie!');
            // Czyścimy formularz i stan
            setTitle('');
            setGeneratedSnippet('');
            // Wywołujemy funkcję zwrotną, aby odświeżyć listę snippetów w komponencie nadrzędnym
            if (onSnippetSaved) {
                onSnippetSaved(response.data);
            }
        } catch (err) {
            alert('Błąd podczas zapisu snippetu.');
        }
    };

    return (
        <div className="snippet-generator-container">
            <h2>Generator Snippetów AI</h2>
            <form onSubmit={handleGenerate}>
                <div className="form-group">
                    <label>Opisz, co ma zawierać snippet:</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Np. klauzula kary umownej za opóźnienie w wykonaniu dzieła w wysokości 0.5% wartości umowy za każdy dzień zwłoki"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Typ snippetu:</label>
                    <select value={snippetType} onChange={(e) => setSnippetType(e.target.value)}>
                        <option>Klauzula umowna</option>
                        <option>Paragraf regulaminu</option>
                        <option>Fragment e-maila</option>
                        <option>Notatka wewnętrzna</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Zmienne (placeholdery) oddzielone przecinkami:</label>
                    <input 
                        type="text"
                        value={variables}
                        onChange={(e) => setVariables(e.target.value)}
                        placeholder="np. kwota_kary, data_wykonania, nazwa_strony"
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Generowanie...' : 'Generuj Snippet'}
                </button>
            </form>

            {error && <p className="error-message">{error}</p>}
            
            {generatedSnippet && (
                <div className="result-section">
                    <h3>Wygenerowany Snippet (możesz edytować)</h3>
                    <div className="form-group">
                        <label>Tytuł snippetu:</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <textarea 
                        className="result-textarea"
                        value={generatedSnippet}
                        onChange={(e) => setGeneratedSnippet(e.target.value)}
                    />
                     <div className="form-group">
                        <label>Kategoria:</label>
                        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="np. Umowy o dzieło"/>
                    </div>
                    <button onClick={handleSave}>Zapisz Snippet w Bazie</button>
                </div>
            )}
        </div>
    );
};

export default SnippetGenerator;

```

---

### **Część 3: Integracja z Bazą Danych (Model i Zapis)**

Chociaż logika zapisu znajduje się w backendzie, warto pokazać, jak wyglądałby model danych, który przechowuje snippet. Używając ORM jak SQLAlchemy, model mógłby wyglądać tak:

**Plik `models.py` (przykład z SQLAlchemy):**

```python
from your_app import db # Zaimportowana instancja bazy danych

class Snippet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), index=True)
    # Relacja do kancelarii, aby zapewnić izolację danych
    law_firm_id = db.Column(db.Integer, db.ForeignKey('law_firm.id'), nullable=False)
    # Relacja do autora
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    # Można dodać relację do tagów dla lepszej organizacji
    # tags = db.relationship(...)
```

Ten kompletny przepływ – od interfejsu użytkownika, przez inteligentne tworzenie promptu, aż po bezpieczny zapis w bazie danych – stanowi fundament profesjonalnego generatora snippetów, który realnie przyspieszy pracę każdej kancelarii prawnej.
