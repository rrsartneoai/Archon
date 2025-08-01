Absolutnie. Implementacja multimodalnego asystenta to flagowa funkcja, która pokaże technologiczną przewagę Twojej aplikacji. Wykorzystamy potęgę modelu Gemini 1.5 Pro, który natywnie obsługuje audio i potrafi przeprowadzić transkrypcję z jednoczesną identyfikacją mówców (diarization).

Poniżej znajdziesz kompleksowy plan implementacji, włączając w to:
1.  **Architekturę Asynchroniczną:** Przetwarzanie audio jest czasochłonne, więc musi odbywać się w tle.
2.  **Kod Backendu:** Logika przesyłania plików, uruchamiania zadania w tle i komunikacji z Gemini.
3.  **Kod Frontendu:** Interfejs do przesyłania pliku, monitorowania statusu i analizy wyniku.
4.  **Integrację z RAG:** Proces włączenia transkrypcji do bazy wiedzy.

---

### **1. Architektura: Proces Asynchroniczny z Zadaniami w Tle**

Użytkownik nie może czekać kilkunastu minut na przetworzenie pliku audio. Kluczowe jest zastosowanie kolejki zadań (np. Celery z Redisem lub RabbitMQ).

**Przepływ procesu:**
1.  **Frontend:** Prawnik przesyła plik audio (`.mp3`, `.wav`, `.opus`) na serwer.
2.  **Backend (API):**
    *   Natychmiastowo przyjmuje plik, zapisuje go w bezpiecznym, tymczasowym miejscu (np. Google Cloud Storage).
    *   Tworzy w bazie danych wpis w nowej tabeli `AudioJobs` ze statusem `PENDING`.
    *   Uruchamia zadanie w tle (worker), przekazując mu ID tego zlecenia.
    *   Zwraca do frontendu `job_id`.
3.  **Frontend:** Otrzymuje `job_id` i zaczyna cyklicznie (co 5-10 sekund) odpytywać backend o status zadania (`/job_status/{job_id}`).
4.  **Worker (Zadanie w tle):**
    *   Pobiera zadanie. Zmienia status na `PROCESSING`.
    *   Przesyła plik audio do API Gemini 1.5 Pro z prośbą o transkrypcję i diarization.
    *   Odbiera ustrukturyzowaną odpowiedź (tekst z etykietami mówców).
    *   Zmienia status na `INDEXING`.
    *   Przetwarza transkrypcję, zapisuje ją w głównej bazie danych, a następnie **indeksuje jej treść w bazie wektorowej (ChromaDB)**.
    *   Zmienia status na `COMPLETED`.
5.  **Frontend:** Po otrzymaniu statusu `COMPLETED`, udostępnia użytkownikowi transkrypcję i interfejs do jej analizy (czat RAG).

---

### **2. Implementacja Backendu (Flask, Gemini API)**

Będziemy potrzebować rozszerzenia naszej aplikacji o obsługę plików i zadań w tle.

**Model Bazy Danych (przykład z SQLAlchemy):**

```python
# W pliku models.py
class AudioJob(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    file_path = db.Column(db.String(255), nullable=False) # Ścieżka w storage
    status = db.Column(db.String(20), nullable=False, default='PENDING') # PENDING, PROCESSING, INDEXING, COMPLETED, FAILED
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    # Relacja do finalnej transkrypcji
    transcription_id = db.Column(db.Integer, db.ForeignKey('transcription.id'), nullable=True)

class Transcription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    # Przechowujemy sformatowaną, czytelną transkrypcję
    formatted_content = db.Column(db.Text, nullable=False) 
    # Przechowujemy też surową odpowiedź z AI do ewentualnej analizy
    raw_response = db.Column(db.JSON, nullable=True) 
```

**Kod API i zadania w tle:**

```python
# W pliku main_api.py

import google.generativeai as genai
import uuid
from your_app import db, start_background_task # Załóżmy, że mamy funkcję do startu taska

# ... (istniejąca konfiguracja)

# Endpoint do przesyłania pliku audio
@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    title = request.form.get('title', 'Nowa Transkrypcja')

    # Bezpieczne zapisanie pliku (np. na Google Cloud Storage)
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    file_path = f"audio_uploads/{file_id}{file_extension}"
    # file.save(file_path) # W realnej aplikacji - upload do chmury

    # Stworzenie zlecenia w bazie danych
    new_job = AudioJob(id=file_id, user_id=current_user.id, file_path=file_path)
    db.session.add(new_job)
    db.session.commit()

    # Uruchomienie zadania w tle
    process_audio_task.delay(new_job.id, title) # Użycie Celery

    return jsonify({"job_id": new_job.id}), 202 # 202 Accepted

@app.route('/job_status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    job = AudioJob.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify({
        "status": job.status, 
        "transcription_id": job.transcription_id,
        "error": job.error_message
    })

# --- Zadanie w tle (np. w pliku tasks.py z Celery) ---

# @celery.task()
def process_audio_task(job_id, title):
    job = AudioJob.query.get(job_id)
    job.status = 'PROCESSING'
    db.session.commit()

    try:
        # 1. Przesłanie pliku do Gemini API
        # W realnej aplikacji ścieżka będzie do pliku w chmurze
        audio_file = genai.upload_file(path=job.file_path) 
        
        # 2. Definicja promptu
        prompt = "Transcribe this audio file. Enable speaker diarization to identify each speaker."
        model = genai.GenerativeModel('models/gemini-1.5-pro-latest')

        # 3. Wywołanie modelu
        response = model.generate_content([prompt, audio_file])
        
        # Gemini zwraca specjalny obiekt `Transcript` z segmentami
        # Musimy go sformatować
        formatted_transcript = ""
        for segment in response.text.split('\n'): # Uproszczenie, w praktyce API zwraca bardziej strukturalne dane
             # `response` może mieć strukturę, którą trzeba sparsować, np. `response.transcript.segments`
             # Załóżmy, że segment ma format "speaker: text"
             formatted_transcript += segment + "\n"

        # 4. Zapis transkrypcji
        job.status = 'INDEXING'
        db.session.commit()
        
        new_transcription = Transcription(
            title=title, 
            formatted_content=formatted_transcript,
            raw_response=response.to_dict() # Zapis surowej odpowiedzi
        )
        db.session.add(new_transcription)
        db.session.commit()
        
        # 5. Indeksowanie dla RAG
        # Przekazujemy tekst i metadane do naszej funkcji RAG
        index_text_for_rag(
            text=new_transcription.formatted_content,
            metadata={
                'source_type': 'transcription',
                'document_id': new_transcription.id,
                'title': new_transcription.title
            }
        )
        
        job.status = 'COMPLETED'
        job.transcription_id = new_transcription.id
        db.session.commit()

    except Exception as e:
        job.status = 'FAILED'
        job.error_message = str(e)
        db.session.commit()
```

---

### **3. Implementacja Frontendu (React)**

Tworzymy komponent, który zarządza całym procesem z perspektywy użytkownika.

**Plik `AudioAnalyzer.js`:**

```jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// Załóżmy, że mamy komponent czatu RAG
import RagChatInterface from './RagChatInterface'; 

const AudioAnalyzer = () => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState('IDLE'); // IDLE, UPLOADING, PROCESSING, COMPLETED, FAILED
    const [transcriptionData, setTranscriptionData] = useState(null);
    
    const pollInterval = useRef(null);

    // Efekt do odpytywania o status zadania
    useEffect(() => {
        if (jobId && (jobStatus === 'PROCESSING' || jobStatus === 'UPLOADING')) {
            pollInterval.current = setInterval(async () => {
                const { data } = await axios.get(`/api/job_status/${jobId}`);
                setJobStatus(data.status);

                if (data.status === 'COMPLETED' || data.status === 'FAILED') {
                    clearInterval(pollInterval.current);
                    if (data.status === 'COMPLETED') {
                        // Pobierz finalną transkrypcję
                        const transcriptionRes = await axios.get(`/api/transcriptions/${data.transcription_id}`);
                        setTranscriptionData(transcriptionRes.data);
                    }
                }
            }, 5000); // Odpytuj co 5 sekund
        }

        // Czyszczenie interwału
        return () => clearInterval(pollInterval.current);
    }, [jobId, jobStatus]);


    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setJobStatus('UPLOADING');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);

        try {
            const { data } = await axios.post('/api/upload_audio', formData);
            setJobId(data.job_id);
            setJobStatus('PROCESSING'); // Backend potwierdził, worker startuje
        } catch (err) {
            console.error(err);
            setJobStatus('FAILED');
        }
    };

    return (
        <div className="audio-analyzer-container">
            <h2>Analizator Nagrań Audio</h2>

            {jobStatus === 'IDLE' && (
                <form onSubmit={handleUpload}>
                    <input type="text" placeholder="Tytuł nagrania (np. Przesłuchanie świadka X)" value={title} onChange={e => setTitle(e.target.value)} required />
                    <input type="file" accept=".mp3,.wav,.m4a,.opus" onChange={e => setFile(e.target.files[0])} required />
                    <button type="submit">Prześlij i analizuj</button>
                </form>
            )}

            {['UPLOADING', 'PROCESSING', 'INDEXING'].includes(jobStatus) && (
                <div>
                    <h3>Przetwarzanie w toku...</h3>
                    <p>Status: {jobStatus}</p>
                    <p>To może potrwać kilka minut. Możesz kontynuować pracę, a wynik pojawi się tutaj automatycznie.</p>
                </div>
            )}
            
            {jobStatus === 'FAILED' && <p className="error">Wystąpił błąd podczas przetwarzania.</p>}
            
            {jobStatus === 'COMPLETED' && transcriptionData && (
                <div className="analysis-view">
                    <div className="transcription-panel">
                        <h3>Transkrypcja: {transcriptionData.title}</h3>
                        <pre>{transcriptionData.formatted_content}</pre>
                    </div>
                    <div className="chat-panel">
                        <h3>Zadaj pytanie do transkrypcji</h3>
                        <RagChatInterface 
                            // Przekazujemy ID dokumentu, aby RAG mógł zawęzić wyszukiwanie
                            // do tej konkretnej transkrypcji
                            documentContext={{ type: 'transcription', id: transcriptionData.id }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AudioAnalyzer;
```

---

### **4. Ulepszenie: Przypisywanie Nazw Mówcom**

Początkowo Gemini zwróci ogólne etykiety (`Speaker 1`, `Speaker 2`). Możemy dodać funkcję, która pozwoli użytkownikowi przypisać do nich realne nazwiska.

1.  **Po zakończeniu transkrypcji** interfejs wyświetla listę unikalnych mówców (`Speaker 1`, `Speaker 2`...).
2.  **Użytkownik wpisuje w pola tekstowe nazwiska:** `Speaker 1` -> `Sędzia Anna Nowak`, `Speaker 2` -> `
