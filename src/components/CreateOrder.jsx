import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CreateOrder = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles(selectedFiles)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Symulacja wysłania zlecenia
    setTimeout(() => {
      alert('Zlecenie zostało utworzone pomyślnie!')
      navigate('/dashboard')
    }, 1500)
  }

  return (
    <div className="create-order">
      <div className="container">
        <h1>Nowe Zlecenie Analizy</h1>
        
        <form onSubmit={handleSubmit} className="order-form">
          <div className="form-group">
            <label htmlFor="title">Tytuł zlecenia *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="np. Analiza umowy najmu"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Opis zlecenia *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="5"
              placeholder="Opisz szczegółowo, jakiej analizy potrzebujesz..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="files">Dokumenty do analizy</label>
            <input
              type="file"
              id="files"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
            />
            <small className="help-text">
              Obsługiwane formaty: PDF, DOC, DOCX, TXT. Maksymalnie 10 plików.
            </small>
            
            {files.length > 0 && (
              <div className="file-list">
                <h4>Wybrane pliki:</h4>
                <ul>
                  {files.map((file, index) => (
                    <li key={index}>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => navigate('/dashboard')}
            >
              Anuluj
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Tworzenie...' : 'Utwórz Zlecenie'}
            </button>
          </div>
        </form>

        <div className="info-box">
          <h3>Jak to działa?</h3>
          <ol>
            <li>Wypełnij formularz i wgraj dokumenty</li>
            <li>Nasz operator przeanalizuje Twoje dokumenty</li>
            <li>Otrzymasz powiadomienie o gotowej analizie</li>
            <li>Po opłaceniu uzyskasz dostęp do pełnej analizy</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default CreateOrder