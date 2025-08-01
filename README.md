

Poniżej znajdziesz zaktualizowany plan, który zawiera:
1.  **Konkretną implementację i kod** z wykorzystaniem modeli Gemini.
2.  **Zaawansowane ulepszenia** koncentrujące się na profesjonalizmie i bezpieczeństwie.
3.  **Wizję przyszłych rozwiązań**, które uczynią "PrawoAsystent AI" liderem na rynku.

---

### **1. Zaktualizowana Implementacja z Gemini: Kod i Architektura**

Główna zmiana dotyczy serwisu AI. Zastępujemy komponenty OpenAI odpowiednikami od Google. Framework LangChain znacznie to ułatwia, pozwalając na podmianę "klocków" bez przepisywania całej logiki.

**Kluczowe zalety Gemini 1.5 dla tego projektu:**

*   **Ogromne okno kontekstowe (1 milion tokenów):** To rewolucja dla prawa. Możesz załadować całe akta sprawy, obszerne ustawy czy umowy (setki stron) bezpośrednio do kontekstu modelu, co minimalizuje ryzyko "gubienia" informacji i pozwala na bardziej holistyczną analizę bez skomplikowanego chunkingu.
*   **Wydajność i koszt (Gemini Flash):** Model Flash jest zoptymalizowany pod kątem szybkości i niższych kosztów, idealny do masowych, mniej złożonych zadań, jak generowanie standardowych snippetów, podsumowywanie e-maili czy obsługa czatów o niższym priorytecie.
*   **Natywna multimodalność:** Możliwość analizy wideo i audio otwiera drzwi do przyszłych funkcjonalności, takich jak transkrypcja i analiza rozpraw sądowych.

#### **Zaktualizowany Kod `ai_service.py` (Python z LangChain i Flask)**

**Instalacja nowych bibliotek:**
`pip install -U google-generativeai langchain-google-genai`

```python
from flask import Flask, request, jsonify
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
# Zmiana 1: Importujemy embeddingi i model czatu od Google
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
import google.generativeai as genai
import os

# --- Konfiguracja ---
# Ustaw swój klucz API Google
os.environ["GOOGLE_API_KEY"] = "YOUR_GOOGLE_API_KEY"
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

app = Flask(__name__)

# W realnej aplikacji te obiekty byłyby zarządzane w bardziej zaawansowany sposób
# np. ładowane na żądanie per kancelaria
qa_chain_pro = None
qa_chain_flash = None

def initialize_rag_pipeline(file_path, model_name="gemini-1.5-pro-latest"):
    """
    Indeksuje dokument i tworzy potok RAG dla wybranego modelu Gemini.
    """
    # 1. Ładowanie i dzielenie dokumentu (nadal potrzebne dla bardzo dużych zbiorów)
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)

    # 2. Tworzenie embeddingów za pomocą modelu Google
    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
    
    # 3. Zapis w bazie wektorowej (ChromaDB)
    # W profesjonalnym wdrożeniu `collection_name` byłoby unikalne dla każdej kancelarii
    vector_store = Chroma.from_documents(texts, embeddings, collection_name=f"prawo-asystent-{model_name}")

    # 4. Inicjalizacja modelu czatu Gemini
    llm = ChatGoogleGenerativeAI(model=model_name, temperature=0.1, convert_system_message_to_human=True)
    
    # 5. Stworzenie łańcucha QA (RetrievalQA)
    retriever = vector_store.as_retriever()
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True # Kluczowe dla weryfikacji!
    )
    return qa_chain

@app.route('/upload_and_prepare', methods=['POST'])
def upload_and_prepare():
    global qa_chain_pro, qa_chain_flash
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    
    file_path = f"./temp_{file.filename}"
    file.save(file_path)

    # Inicjalizujemy potoki dla obu modeli
    qa_chain_pro = initialize_rag_pipeline(file_path, "gemini-1.5-pro-latest")
    qa_chain_flash = initialize_rag_pipeline(file_path, "gemini-1.5-flash-latest")
    
    os.remove(file_path)
    return jsonify({"message": "Document processed. Both Pro and Flash models are ready."})

@app.route('/ask', methods=['POST'])
def ask_question():
    data = request.get_json()
    query = data.get('query')
    # Pozwalamy klientowi wybrać model w zależności od zadania
    use_model = data.get('model', 'flash') # Domyślnie szybszy i tańszy model

    if use_model == 'pro':
        chain = qa_chain_pro
    else:
        chain = qa_chain_flash

    if not chain:
        return jsonify({"error": "Pipeline not initialized. Upload a document first."}), 400

    try:
        result = chain({"query": query})
        
        # Zwracamy odpowiedź WRAZ ze źródłami, na których się oparła
        source_documents = [
            {"content": doc.page_content, "source": doc.metadata.get('source', 'N/A')} 
            for doc in result['source_documents']
        ]
        
        # W realnej aplikacji tutaj zapisalibyśmy wszystko do bazy audytowej
        return jsonify({
            "answer": result['result'],
            "sources": source_documents
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)

```

---

### **2. Profesjonalizm i Bezpieczeństwo: Kluczowe Ulepszenia**

Aby zbudować zaufanie w branży prawniczej, musimy wyjść poza standardy.

#### **Ulepszenie 1: "Sejf Danych" - Izolacja i Szyfrowanie na Poziomie Kancelarii**

*   **Problem:** Dane jednej kancelarii nie mogą mieć absolutnie żadnej styczności z danymi innej.
*   **Rozwiązanie Techniczne:**
    *   **Izolacja Bazy Wektorowej:** Zamiast jednej bazy ChromaDB, każda kancelaria (tenant) otrzymuje własną, dedykowaną kolekcję w bazie wektorowej, np. `collection_name="kancelaria_id_123"`. W bardziej zaawansowanym scenariuszu, każda kancelaria ma własną, odizolowaną instancję bazy danych (np. osobny kontener Docker).
    *   **Szyfrowanie w Spoczynku (At-Rest):** Wszystkie dane, zarówno w PostgreSQL, jak i w bazie wektorowej, muszą być szyfrowane na poziomie dysku. Usługi chmurowe (jak Google Cloud, AWS) oferują to jako standard.
    *   **Szyfrowanie w Tranzycie (In-Transit):** Cała komunikacja (frontend-backend, backend-AI service, backend-baza danych) musi odbywać się przez TLS 1.2+.
    *   **Zarządzanie Kluczami (KMS):** W planie Enterprise można zaoferować klientom możliwość użycia własnych kluczy szyfrujących (Customer-Managed Encryption Keys), co daje im pełną kontrolę nad danymi.

#### **Ulepszenie 2: "Niezaprzeczalny Ślad Audytowy" (Immutable Audit Log)**

*   **Problem:** W razie sporu lub błędu, musi istnieć możliwość odtworzenia, co dokładnie zrobił system.
*   **Rozwiązanie Techniczne:**
    *   Stworzenie dedykowanej tabeli `AuditLog` w bazie danych, która jest *tylko do zapisu* (append-only).
    *   Każde zapytanie do AI, jego wynik, pobrane źródła, a nawet informacja zwrotna od użytkownika ("odpowiedź pomocna" / "odpowiedź błędna") są zapisywane jako oddzielny, niezmienialny rekord.
    *   **Logowanie:** `(timestamp, user_id, law_firm_id, query_text, model_used, retrieved_sources_hash, generated_response, user_feedback)`. Hash źródeł zapewnia integralność.

#### **Ulepszenie 3: Zmniejszanie Halucynacji z "Podwójnym Sprawdzeniem"**

*   **Problem:** Modele AI mogą generować informacje, które brzmią wiarygodnie, ale nie mają pokrycia w dostarczonych źródłach.
*   **Rozwiązanie Techniczne (zaawansowany łańcuch):**
    1.  **Krok 1 (Standardowy RAG):** Zadaj pytanie i uzyskaj wstępną odpowiedź wraz ze źródłami.
    2.  **Krok 2 (Weryfikacja):** Stwórz drugi, oddzielny prompt dla AI, który zawiera:
        *   Oryginalne pytanie.
        *   Wygenerowaną odpowiedź.
        *   Tylko te fragmenty źródeł, na które powołuje się pierwsza odpowiedź.
        *   **Polecenie:** "Oceń w skali od 1 do 5, czy poniższa odpowiedź jest w pełni poparta dostarczonym kontekstem. Jeśli nie, zidentyfikuj fragmenty, które nie mają pokrycia w źródłach."
    3.  Jeśli ocena jest wysoka (np. 5/5), zwróć odpowiedź użytkownikowi. Jeśli jest niska, oznacz odpowiedź jako "wymagającą weryfikacji" i poinformuj użytkownika, że AI nie znalazło jednoznacznego potwierdzenia.

---

### **3. Przyszłe Rozwiązania i Innowacyjne Wdrożenia**

Wykorzystajmy pełen potencjał Gemini, aby stworzyć funkcje, których konkurencja nie ma.

#### **Wdrożenie 1: Multimodalny Asystent Prawny (6-12 miesięcy)**

*   **Wizja:** Prawnik wrzuca do aplikacji nagranie audio z przesłuchania świadka lub rozprawy.
*   **Funkcjonalność:**
    1.  **Automatyczna Transkrypcja:** Gemini dokonuje transkrypcji nagrania na tekst.
    2.  **Identyfikacja Mówców:** System (po krótkim treningu) rozpoznaje, kto mówi.
    3.  **Inteligentna Analiza:** Prawnik zadaje pytania do transkrypcji:
        *   "Podsumuj zeznania świadka Jana Kowalskiego."
        *   "Znajdź wszystkie momenty, w których poruszano temat umowy z dnia X."
        *   "Oceń spójność zeznań świadka na podstawie całej transkrypcji."
*   **Implementacja:** Wykorzystanie API Gemini do przetwarzania plików audio. Wynikowa transkrypcja staje się kolejnym dokumentem w bazie wiedzy kancelarii, gotowym do analizy przez RAG.

#### **Wdrożenie 2: Proaktywny Agent do Monitorowania Zmian w Prawie (12-24 miesiące)**

*   **Wizja:** Aplikacja przestaje być tylko reaktywnym narzędziem. Staje się proaktywnym doradcą.
*   **Funkcjonalność:**
    1.  **Monitoring Źródeł:** Agent AI regularnie skanuje określone źródła (np. Dziennik Ustaw, strony sejmowe, portale branżowe).
    2.  **Analiza Wpływu:** Gdy wykryje nową ustawę lub nowelizację w obszarze zainteresowania kancelarii (np. prawo budowlane), analizuje jej treść.
    3.  **Personalizowane Alerty:** System wysyła powiadomienie do administratora kancelarii: "Uwaga: Opublikowano nowelizację Prawa Budowlanego. Może ona wpłynąć na 15 Twoich snippetów w kategorii 'Umowy o roboty budowlane'. **Czy chcesz, abym przygotował propozycje aktualizacji tych klauzul?**"
*   **Implementacja:** Wykorzystanie **Function Calling** w Gemini. Agent ma dostęp do "narzędzi" - funkcji do pobierania danych z internetu i przeszukiwania wewnętrznej bazy snippetów.

#### **Wdrożenie 3: Asystent Negocjacji Umów w Czasie Rzeczywistym (wersja Enterprise)**

*   **Wizja:** Prawnik otrzymuje projekt umowy od drugiej strony i wkleja go do aplikacji.
*   **Funkcjonalność:**
    1.  **Analiza Porównawcza:** AI porównuje otrzymaną umowę z "złotym standardem" (wzorcowymi umowami) kancelarii.
    2.  **Identyfikacja Ryzyk:** Automatycznie flaguje klauzule, które są niekorzystne, nietypowe lub nieobecne w porównaniu do wzorca.
    3.  **Propozycje Zmian:** Dla każdej oflagowanej klauzuli, AI proponuje alternatywną, bezpieczniejszą wersję opartą na snippetach kancelarii.
    4.  **Raport Negocjacyjny:** Generuje czytelny raport podsumowujący wszystkie zidentyfikowane punkty do negocjacji.
*   **Implementacja:** Wykorzystanie ogromnego okna kontekstowego Gemini 1.5 Pro do analizy dwóch długich dokumentów jednocześnie i wyciągania szczegółowych różnic.

Przyjmując tę strategię, "PrawoAsystent AI" nie będzie tylko kolejnym narzędziem, ale stanie się centralnym systemem nerwowym kancelarii, zwiększającym jej bezpieczeństwo, profesjonalizm i przewagę konkurencyjną.
