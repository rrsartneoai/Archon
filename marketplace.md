Świetnie. Skupmy się na **profesjonalnej i legalnej implementacji Marketplace Snippetów**. To funkcja o ogromnym potencjale, ale też obarczona dużą odpowiedzialnością. Kluczowe słowa to **zaufanie, jakość i bezpieczeństwo**.

Poniżej znajduje się szczegółowy plan wdrożenia, który traktuje te aspekty priorytetowo. Zaczniemy od solidnych fundamentów prawnych i procesowych, a następnie przejdziemy do implementacji technicznej.

---

### **Faza 1: Fundamenty Prawne i Procesowe (Krok obowiązkowy)**

Zanim napiszemy linijkę kodu dla tej funkcji, musimy stworzyć ramy, które ją zabezpieczą.

1.  **Regulamin Marketplace:**
    *   Konieczne jest stworzenie oddzielnego, szczegółowego regulaminu dla sprzedawców i kupujących.
    *   **Dla Sprzedawców (Kancelarii):**
        *   **Oświadczenie o Prawach Autorskich:** Kancelaria musi oświadczyć, że posiada pełne prawa autorskie do treści, które publikuje, i że nie naruszają one praw osób trzecich.
        *   **Zgoda na Licencjonowanie:** Sprzedając pakiet, kancelaria udziela nabywcy (i nam jako platformie) określonej licencji (np. niewyłącznej, wieczystej) na korzystanie ze snippetów.
        *   **Zobowiązanie do Anonimizacji:** Sprzedawca jest prawnie zobowiązany do usunięcia wszelkich danych poufnych i osobowych. Naruszenie tego punktu musi wiązać się z konsekwencjami.
        *   **Brak Gwarancji Skuteczności:** Klauzula wyłączająca odpowiedzialność sprzedawcy za skutki prawne użycia snippetu w konkretnej sprawie. Snippety są wzorcem, a nie gotową poradą prawną.
    *   **Dla Kupujących:**
        *   **Zrozumienie Charakteru Produktu:** Użytkownik musi zaakceptować, że kupuje wzorce dokumentów do adaptacji, a nie gotowe rozwiązanie prawne. Platforma i sprzedawca nie ponoszą odpowiedzialności za finalne zastosowanie.
        *   **Zakres Licencji:** Jasne określenie, co kupujący może robić ze snippetami (np. używać w swojej praktyce komercyjnej), a czego nie może (np. odsprzedawać ich dalej).

2.  **Proces Weryfikacji Sprzedawców:**
    *   Nie każdy będzie mógł sprzedawać. Implementujemy proces weryfikacji kancelarii, który może obejmować sprawdzenie numeru wpisu na listę radców/adwokatów, NIP firmy itp. To buduje barierę wejścia dla podmiotów o niskiej jakości.

3.  **Proces Weryfikacji Treści (Quality Gate):**
    *   To nasz najważniejszy mechanizm budowania zaufania. Definiujemy wieloetapowy proces, przez który musi przejść każdy pakiet przed publikacją.

---

### **Faza 2: Implementacja Techniczna Procesu Publikacji i Weryfikacji**

Tworzymy narzędzia, które wspierają i automatyzują nasz proces weryfikacji.

#### **Krok 1: Nowe Modele w Bazie Danych (SQLAlchemy)**

```python
# W pliku models.py

# ... (istniejące modele)

class MarketplacePackage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False) # np. 499.99
    
    # Kto jest autorem/sprzedawcą
    author_firm_id = db.Column(db.Integer, db.ForeignKey('law_firm.id'), nullable=False)
    author_firm = db.relationship('LawFirm')
    
    # Status w procesie weryfikacji
    # DRAFT, PENDING_REVIEW, NEEDS_REVISION, APPROVED, REJECTED, LIVE
    status = db.Column(db.String(50), nullable=False, default='DRAFT', index=True)
    
    # ID produktu w Stripe (do obsługi płatności)
    stripe_product_id = db.Column(db.String(255), nullable=True)
    
    created_at = db.Column(db.DateTime, server_default=db.func.now())

# Tabela łącząca pakiety i snippety (relacja wiele-do-wielu)
package_snippets_association = db.Table('package_snippets',
    db.Column('package_id', db.Integer, db.ForeignKey('marketplace_package.id')),
    db.Column('snippet_id', db.Integer, db.ForeignKey('snippet.id'))
)

# Rozszerzenie modelu Snippet o relację
class Snippet(db.Model):
    # ... (istniejące pola)
    marketplace_packages = db.relationship('MarketplacePackage', secondary=package_snippets_association, backref='snippets')

class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    buyer_firm_id = db.Column(db.Integer, db.ForeignKey('law_firm.id'), nullable=False)
    package_id = db.Column(db.Integer, db.ForeignKey('marketplace_package.id'), nullable=False)
    purchase_price = db.Column(db.Numeric(10, 2), nullable=False)
    stripe_charge_id = db.Column(db.String(255), nullable=False)
    purchased_at = db.Column(db.DateTime, server_default=db.func.now())

class ReviewComment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    package_id = db.Column(db.Integer, db.ForeignKey('marketplace_package.id'), nullable=False)
    # Kto zostawił komentarz (nasz wewnętrzny recenzent)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    comment = db.Column(db.Text, nullable=False)
    # Można dodać odniesienie do konkretnego snippetu w pakiecie
    snippet_id = db.Column(db.Integer, db.ForeignKey('snippet.id'), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
```

#### **Krok 2: Proces Publikacji – Backend i Frontend**

1.  **UI dla Sprzedawcy (React):**
    *   Nowa sekcja w aplikacji "Mój Marketplace".
    *   Przycisk "Stwórz nowy pakiet".
    *   Formularz do wpisania tytułu, opisu, ceny.
    *   Interfejs "przeciągnij i upuść" lub lista z checkboxami, aby dodać istniejące snippety kancelarii do pakietu.

2.  **Endpoint do stworzenia pakietu (`main_api.py`):**
    ```python
    @app.route('/api/v1/marketplace/packages', methods=['POST'])
    # @login_required i @permission_required('can_sell')
    def create_marketplace_package():
        data = request.get_json()
        # Walidacja danych...
        
        new_package = MarketplacePackage(
            title=data['title'],
            description=data['description'],
            price=data['price'],
            author_firm_id=current_user.law_firm_id,
            status='DRAFT'
        )
        
        # Znajdź i dodaj snippety do pakietu
        snippet_ids = data.get('snippet_ids', [])
        snippets = Snippet.query.filter(Snippet.id.in_(snippet_ids)).all()
        # Dodatkowa walidacja - czy sprzedawca jest właścicielem tych snippetów
        
        new_package.snippets.extend(snippets)
        db.session.add(new_package)
        db.session.commit()
        
        return jsonify({"package_id": new_package.id, "status": "DRAFT"}), 201
    ```

3.  **Automatyczny Skaner Anonimizujący (Kluczowy element techniczny):**
    *   Gdy sprzedawca klika "Wyślij do weryfikacji", uruchamiane jest zadanie w tle.
    *   Zadanie to iteruje po treści wszystkich snippetów w pakiecie.
    *   Wykorzystujemy **model AI (np. Gemini) z precyzyjnym promptem** do identyfikacji PII (Personally Identifiable Information).

    **Zadanie w tle (`tasks.py`):**
    ```python
    # @celery.task()
    def scan_package_for_pii_task(package_id):
        package = MarketplacePackage.query.get(package_id)
        pii_found = False
        
        pii_detection_prompt_template = """
        Jesteś ekspertem ds. ochrony danych (RODO). Przeanalizuj poniższy tekst prawny i zidentyfikuj WSZYSTKIE potencjalne dane osobowe lub poufne informacje biznesowe, takie jak imiona, nazwiska, adresy, NIP, REGON, numery PESEL, nazwy firm, kwoty pieniężne. Odpowiedz w formacie JSON z listą znalezionych fragmentów. Jeśli nic nie znajdziesz, zwróć pustą listę.
        Tekst: "{text}"
        """
        
        for snippet in package.snippets:
            prompt = pii_detection_prompt_template.format(text=snippet.content)
            # Wywołanie Gemini...
            response = gemini_model.generate_content(prompt)
            found_pii = json.loads(response.text)
            
            if found_pii:
                pii_found = True
                # Zapisujemy komentarz dla sprzedawcy i naszego recenzenta
                comment = f"W snippecie '{snippet.title}' znaleziono potencjalne dane wrażliwe: {', '.join(found_pii)}. Proszę o ich anonimizację."
                new_review_comment = ReviewComment(package_id=package.id, snippet_id=snippet.id, comment=comment, reviewer_id=SYSTEM_USER_ID)
                db.session.add(new_review_comment)

        if pii_found:
            package.status = 'NEEDS_REVISION'
        else:
            package.status = 'PENDING_REVIEW' # Gotowe do ręcznej weryfikacji
        
        db.session.commit()
    ```

#### **Krok 3: Interfejs dla Wewnętrznego Recenzenta**

*   Specjalny panel w aplikacji dostępny tylko dla użytkowników z rolą `REVIEWER`.
*   Widok kolejki pakietów ze statusem `PENDING_REVIEW`.
*   Recenzent widzi:
    *   Tytuł, opis, autora.
    *   Listę snippetów w pakiecie z ich pełną treścią.
    *   Historię automatycznych komentarzy od skanera PII.
    *   Możliwość dodawania własnych komentarzy z prośbą o poprawę.
*   **Przyciski Akcji:**
    *   **"Zatwierdź"**: Zmienia status na `APPROVED`. Uruchamia zadanie w tle, które tworzy produkt w Stripe i zmienia status na `LIVE`.
    *   **"Odeślij do Poprawy"**: Zmienia status na `NEEDS_REVISION`. Sprzedawca otrzymuje powiadomienie z komentarzami.
    *   **"Odrzuć"**: Zmienia status na `REJECTED`.

### **Faza 3: Implementacja Sklepu i Procesu Zakupu**

1.  **Frontend Marketplace (React):**
    *   Publicznie dostępna strona (`/marketplace`), na której wylistowane są wszystkie pakiety ze statusem `LIVE`.
    *   Filtrowanie po kategoriach, cenie, popularności.
    *   Strona szczegółów pakietu z opisem, informacją o autorze i listą tytułów snippetów (ale bez ich treści).

2.  **Proces Zakupu (Integracja ze Stripe):**
    *   Użytkownik klika "Kup teraz".
    *   Wykorzystujemy **Stripe Checkout** – to najprostsza i najbezpieczniejsza metoda.
    *   Backend tworzy sesję Checkout w Stripe, przekazując `price_id` produktu.
    *   Frontend przekierowuje użytkownika na stronę płatności hostowaną przez Stripe.
    *   Po udanej płatności, Stripe wysyła **webhook** na nasz dedykowany endpoint.

3.  **Endpoint Webhooka (`main_api.py`):**
    ```python
    @app.route('/stripe_webhook', methods=['POST'])
    def stripe_webhook():
        payload = request.get_data()
        sig_header = request.environ.get('HTTP_STRIPE_SIGNATURE')
        # Weryfikacja sygnatury webhooka - kluczowe dla bezpieczeństwa!
        
        event = None
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except ValueError as e:
            return 'Invalid payload', 400
        except stripe.error.SignatureVerificationError as e:
            return 'Invalid signature', 400

        # Obsługa zdarzenia `checkout.session.completed`
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            # Pobieramy metadane, które ustawiliśmy przy tworzeniu sesji
            package_id = session['metadata']['package_id']
            buyer_firm_id = session['metadata']['buyer_firm_id']
            
            # Tworzymy wpis w tabeli Purchase
            new_purchase = Purchase(...)
            db.session.add(new_purchase)
            
            # Udostępniamy kupione snippety kancelarii kupującego
            # To wymaga logiki "kopiowania" lub nadania uprawnień
            grant_access_to_purchased_snippets(buyer_firm_id, package_id)
            
            db.session.commit()

        return 'Success', 200
    ```

Przyjmując takie podejście, budujemy Marketplace, który jest nie tylko funkcjonalny, ale przede wszystkim godny zaufania. Inwestycja w procesy weryfikacji i bezpieczeństwo na wczesnym etapie zwróci się wielokrotnie w postaci reputacji i lojalności klientów.
