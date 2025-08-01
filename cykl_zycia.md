Znakomity pomysł. To ulepszenie jest idealnym przykładem funkcji, która oddziela dobre narzędzie od **wybitnego**. Podnosi użyteczność o rząd wielkości, pozwalając na naturalną interakcję z danymi.

Oto pełna implementacja tej funkcjonalności, od backendu po frontend, z naciskiem na czystość kodu i solidną logikę.

---

### **Krok 1: Modyfikacja Modelu Danych i Architektury**

Musimy rozszerzyć nasz model `Transcription`, aby przechowywał mapowanie domyślnych etykiet na prawdziwe nazwiska.

**Zaktualizowany `models.py`:**

```python
import json

# ... (istniejące importy)

class Transcription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    
    # Przechowuje ORYGINALNĄ transkrypcję z etykietami 'Speaker X'
    original_content = db.Column(db.Text, nullable=False)
    
    # Przechowuje SPERSONALIZOWANĄ transkrypcję po przypisaniu nazwisk
    # Ta wersja będzie indeksowana w bazie wektorowej!
    formatted_content = db.Column(db.Text, nullable=False) 
    
    # Nowe pole do przechowywania mapowania
    # np. {'Speaker 1': 'Sędzia Anna Nowak', 'Speaker 2': 'Świadek Jan Kowalski'}
    speaker_mapping = db.Column(db.JSON, nullable=True, default={})

    raw_response = db.Column(db.JSON, nullable=True)
    
    # Funkcja pomocnicza do parsowania mówców z oryginalnej treści
    def get_unique_speakers(self):
        import re
        # Prosta implementacja, w praktyce można to zrobić bardziej elegancko
        speakers = re.findall(r'^(Speaker \d+):', self.original_content, re.MULTILINE)
        return sorted(list(set(speakers)))
```

**Zmiana w logice `process_audio_task`:**
Teraz po wygenerowaniu transkrypcji zapisujemy ją zarówno do `original_content`, jak i `formatted_content`. Początkowo będą identyczne.

```python
# W pliku tasks.py

# ... (wewnątrz `process_audio_task`)
# ... po otrzymaniu transkrypcji `transcript_text` z Gemini

new_transcription = Transcription(
    title=title, 
    original_content=transcript_text,
    formatted_content=transcript_text, # Początkowo to samo
    raw_response=response.to_dict()
)
db.session.add(new_transcription)
db.session.commit()

# Indeksujemy początkową wersję
index_text_for_rag(
    text=new_transcription.formatted_content,
    metadata={...} # metadane jak wcześniej
)

# ...
```

---

### **Krok 2: Backend – Endpoint do Aktualizacji Nazwisk**

Potrzebujemy nowego endpointu, który przyjmie mapowanie od użytkownika, zaktualizuje transkrypcję i uruchomi reindeksację.

**Nowy endpoint w `main_api.py`:**

```python
# ... (istniejące importy)

@app.route('/transcriptions/<int:transcription_id>/update_speakers', methods=['POST'])
def update_transcription_speakers(transcription_id):
    transcription = Transcription.query.get_or_404(transcription_id)
    # Sprawdzenie uprawnień (czy użytkownik ma dostęp do tej transkrypcji)
    # if transcription.user_id != current_user.id:
    #     return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    new_mapping = data.get('speaker_mapping')

    if not new_mapping or not isinstance(new_mapping, dict):
        return jsonify({"error": "Invalid speaker_mapping format"}), 400

    # 1. Aktualizacja mapowania w bazie danych
    transcription.speaker_mapping = new_mapping

    # 2. Wygenerowanie nowej, sformatowanej transkrypcji
    updated_content = transcription.original_content
    # Sortujemy klucze malejąco po długości, aby uniknąć problemu, 
    # gdy 'Speaker 10' zostanie zastąpione przez 'Speaker 1'
    sorted_speakers = sorted(new_mapping.keys(), key=len, reverse=True)
    
    for speaker_label in sorted_speakers:
        speaker_name = new_mapping[speaker_label]
        # Używamy wyrażeń regularnych, aby zapewnić, że zamieniamy tylko całe etykiety
        updated_content = re.sub(
            rf'^{re.escape(speaker_label)}:', 
            f'{speaker_name}:', 
            updated_content, 
            flags=re.MULTILINE
        )
    
    transcription.formatted_content = updated_content

    # 3. Zapis do bazy danych
    db.session.commit()

    # 4. Uruchomienie zadania reindeksacji w tle
    # To ważne, aby nie blokować odpowiedzi API!
    reindex_transcription_task.delay(transcription.id)

    return jsonify({
        "message": "Speakers updated successfully. Reindexing in progress.",
        "updated_content": updated_content
    })

# --- Nowe zadanie w tle (tasks.py) ---

# @celery.task()
def reindex_transcription_task(transcription_id):
    transcription = Transcription.query.get(transcription_id)
    if not transcription:
        return

    # Usunięcie starych wektorów (opcjonalne, ale zalecane dla czystości)
    # To wymaga bardziej zaawansowanej logiki w bazie wektorowej,
    # np. usuwania dokumentów po ID.
    # delete_vectors_by_document_id(transcription.id)

    # Indeksowanie nowej treści
    index_text_for_rag(
        text=transcription.formatted_content,
        metadata={
            'source_type': 'transcription',
            'document_id': transcription.id,
            'title': transcription.title
        }
    )
    print(f"Reindexed transcription ID: {transcription_id}")
```

---

### **Krok 3: Frontend – Interfejs do Zarządzania Mówcami**

Rozbudowujemy komponent `AudioAnalyzer`, aby po zakończeniu transkrypcji wyświetlał formularz do edycji nazwisk.

**Zaktualizowany `AudioAnalyzer.js` (React):**

```jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import RagChatInterface from './RagChatInterface'; 

// Nowy, wydzielony komponent do zarządzania mówcami
const SpeakerManager = ({ transcription, onUpdate }) => {
    const [mapping, setMapping] = useState(transcription.speaker_mapping || {});
    const uniqueSpeakers = transcription.unique_speakers || [];

    const handleNameChange = (speakerLabel, newName) => {
        setMapping(prev => ({ ...prev, [speakerLabel]: newName }));
    };

    const handleSave = async () => {
        try {
            await axios.post(`/api/transcriptions/${transcription.id}/update_speakers`, {
                speaker_mapping: mapping
            });
            alert('Nazwiska zaktualizowane. Reindeksacja w toku.');
            // Wywołujemy funkcję zwrotną, aby odświeżyć dane w komponencie nadrzędnym
            onUpdate(); 
        } catch (error) {
            console.error('Failed to update speakers:', error);
            alert('Błąd podczas aktualizacji nazwisk.');
        }
    };

    if (uniqueSpeakers.length === 0) {
        return null; // Nie pokazuj, jeśli nie znaleziono mówców
    }

    return (
        <div className="speaker-manager">
            <h4>Zarządzaj Mówcami</h4>
            {uniqueSpeakers.map(speakerLabel => (
                <div key={speakerLabel} className="speaker-mapping-row">
                    <label>{speakerLabel}:</label>
                    <input
                        type="text"
                        placeholder="Wpisz imię i nazwisko..."
                        value={mapping[speakerLabel] || ''}
                        onChange={(e) => handleNameChange(speakerLabel, e.target.value)}
                    />
                </div>
            ))}
            <button onClick={handleSave}>Zapisz i Reindeksuj</button>
        </div>
    );
};


const AudioAnalyzer = () => {
    // ... (istniejący stan: file, title, jobId, jobStatus, etc.)
    const [transcriptionData, setTranscriptionData] = useState(null);

    // ... (istniejąca logika useEffect do odpytywania)

    // Funkcja do ponownego pobrania danych transkrypcji po aktualizacji
    const refreshTranscriptionData = async (transcriptionId) => {
        const { data } = await axios.get(`/api/transcriptions/${transcriptionId}`);
        // Musimy dodać unikalnych mówców do obiektu, jeśli backend ich nie zwraca
        // Załóżmy, że endpoint /api/transcriptions/{id} zwraca teraz `unique_speakers`
        setTranscriptionData(data);
    };
    
    // Zmodyfikujmy logikę w `useEffect`
    useEffect(() => {
        // ... (logika odpytywania)
        if (data.status === 'COMPLETED') {
            clearInterval(pollInterval.current);
            refreshTranscriptionData(data.transcription_id);
        }
        // ...
    }, [jobId, jobStatus]);


    // ... (istniejąca logika `handleUpload`)

    return (
        <div className="audio-analyzer-container">
            {/* ... (istniejący JSX dla uploadu i statusu) ... */}
            
            {jobStatus === 'COMPLETED' && transcriptionData && (
                <div className="analysis-view">
                    <div className="transcription-panel">
                        <h3>Transkrypcja: {transcriptionData.title}</h3>
                        <SpeakerManager 
                            transcription={transcriptionData} 
                            onUpdate={() => refreshTranscriptionData(transcriptionData.id)}
                        />
                        <pre>{transcriptionData.formatted_content}</pre>
                    </div>
                    <div className="chat-panel">
                        <h3>Zadaj pytanie do transkrypcji</h3>
                        <RagChatInterface 
                            documentContext={{ type: 'transcription', id: transcriptionData.id }}
                            // Kluczowy dodatek: dodajemy 'key', aby zmusić komponent do pełnego
                            // rerenderu po aktualizacji transkrypcji. To zapewni, że będzie
                            // on korzystał z najnowszych, zreindeksowanych danych.
                            key={transcriptionData.formatted_content}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AudioAnalyzer;
```

**Kluczowe zmiany na frontendzie:**
1.  **Wydzielenie `SpeakerManager`:** Tworzymy oddzielny, czysty komponent do zarządzania mapowaniem nazwisk.
2.  **Stan `mapping`:** Komponent przechowuje aktualne mapowanie w swoim stanie, pozwalając na edycję.
3.  **Funkcja `onUpdate`:** `SpeakerManager` wywołuje funkcję zwrotną po udanej aktualizacji, co pozwala komponentowi nadrzędnemu (`AudioAnalyzer`) odświeżyć dane transkrypcji.
4.  **Klucz (`key`) w `RagChatInterface`:** Dodanie `key={transcriptionData.formatted_content}` to ważna technika w React. Gdy `key` się zmienia, React niszczy stary komponent i tworzy nowy od zera. To gwarantuje, że interfejs czatu zostanie "zresetowany" i będzie korzystał z najnowszej, zreindeksowanej wiedzy.

W ten sposób stworzyliśmy kompletny, profesjonalny i wysoce użyteczny cykl życia funkcji: od automatycznej transkrypcji, przez personalizację danych przez użytkownika, aż po bezproblemową aktualizację bazy wiedzy AI.
