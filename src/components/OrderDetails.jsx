import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const OrderDetails = ({ userRole }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [analysis, setAnalysis] = useState({
    preview: '',
    full: ''
  })

  useEffect(() => {
    // Symulacja pobrania szczegółów zlecenia
    setTimeout(() => {
      const mockOrder = {
        id: parseInt(id),
        title: 'Analiza umowy najmu',
        description: 'Proszę o analizę umowy najmu lokalu handlowego pod kątem zgodności z prawem i potencjalnych ryzyk.',
        status: 'AWAITING_PAYMENT',
        created_at: '2024-01-15',
        client_email: 'klient@example.com',
        documents: [
          { id: 1, name: 'umowa_najmu.pdf', size: '2.3 MB' },
          { id: 2, name: 'regulamin.docx', size: '1.1 MB' }
        ],
        comments: [
          {
            id: 1,
            author: 'Operator',
            content: 'Zlecenie zostało przyjęte do realizacji. Analizuję dokumenty.',
            created_at: '2024-01-15T10:00:00'
          },
          {
            id: 2,
            author: 'Operator',
            content: 'Analiza została zakończona. Proszę o dokonanie płatności.',
            created_at: '2024-01-16T14:30:00'
          }
        ]
      }
      
      setOrder(mockOrder)
      
      // Symulacja analizy (tylko jeśli status to AWAITING_PAYMENT lub COMPLETED)
      if (mockOrder.status === 'AWAITING_PAYMENT' || mockOrder.status === 'COMPLETED') {
        setAnalysis({
          preview: 'Po analizie umowy najmu stwierdzam, że dokument zawiera kilka istotnych klauzul wymagających uwagi...',
          full: `PEŁNA ANALIZA UMOWY NAJMU

1. OCENA OGÓLNA
Przedstawiona umowa najmu lokalu handlowego jest w większości zgodna z obowiązującymi przepisami, jednak zawiera kilka klauzul, które mogą generować ryzyko prawne.

2. ZIDENTYFIKOWANE PROBLEMY
- Klauzula waloryzacyjna może być niezgodna z ustawą o ochronie praw lokatorów
- Brak precyzyjnego określenia zakresu odpowiedzialności za naprawy
- Klauzula o rozwiązaniu umowy wymaga doprecyzowania

3. REKOMENDACJE
- Sugeruję modyfikację punktu 5.2 dotyczącego waloryzacji
- Należy dodać klauzulę o procedurze zgłaszania awarii
- Warto rozważyć dodanie klauzuli mediacyjnej

4. OCENA RYZYKA
Ryzyko prawne oceniam jako ŚREDNIE. Umowa może być podpisana po wprowadzeniu sugerowanych zmian.

Szczegółowe uwagi i propozycje zmian znajdują się w załącznikach.`
        })
      }
      
      setLoading(false)
    }, 1000)
  }, [id])

  const getStatusText = (status) => {
    const statusMap = {
      'NEW': 'Nowe',
      'IN_PROGRESS': 'W trakcie analizy',
      'AWAITING_CLIENT': 'Oczekuje uzupełnienia',
      'AWAITING_PAYMENT': 'Gotowe do opłaty',
      'COMPLETED': 'Zakończone'
    }
    return statusMap[status] || status
  }

  const getStatusClass = (status) => {
    const classMap = {
      'NEW': 'status-new',
      'IN_PROGRESS': 'status-progress',
      'AWAITING_CLIENT': 'status-waiting',
      'AWAITING_PAYMENT': 'status-payment',
      'COMPLETED': 'status-completed'
    }
    return classMap[status] || ''
  }

  const handleStatusChange = (newStatus) => {
    setOrder({ ...order, status: newStatus })
    alert(`Status zmieniony na: ${getStatusText(newStatus)}`)
  }

  const handlePayment = () => {
    // Symulacja płatności
    alert('Przekierowanie do bramki płatności...')
    setTimeout(() => {
      setOrder({ ...order, status: 'COMPLETED' })
      alert('Płatność zakończona pomyślnie! Masz teraz dostęp do pełnej analizy.')
    }, 2000)
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    
    const comment = {
      id: Date.now(),
      author: userRole === 'OPERATOR' ? 'Operator' : 'Klient',
      content: newComment,
      created_at: new Date().toISOString()
    }
    
    setOrder({
      ...order,
      comments: [...order.comments, comment]
    })
    setNewComment('')
  }

  if (loading) {
    return <div className="loading">Ładowanie szczegółów zlecenia...</div>
  }

  if (!order) {
    return <div className="error">Nie znaleziono zlecenia</div>
  }

  return (
    <div className="order-details">
      <div className="container">
        <div className="order-header">
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline">
            ← Powrót
          </button>
          <div className="order-title-section">
            <h1>{order.title}</h1>
            <span className={`status ${getStatusClass(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>
        </div>

        <div className="order-content">
          <div className="order-info">
            <h3>Informacje o zleceniu</h3>
            <p><strong>Opis:</strong> {order.description}</p>
            <p><strong>Data utworzenia:</strong> {new Date(order.created_at).toLocaleDateString('pl-PL')}</p>
            {userRole === 'OPERATOR' && (
              <p><strong>Klient:</strong> {order.client_email}</p>
            )}
          </div>

          <div className="documents-section">
            <h3>Dokumenty ({order.documents.length})</h3>
            <div className="documents-list">
              {order.documents.map(doc => (
                <div key={doc.id} className="document-item">
                  <span className="doc-name">📄 {doc.name}</span>
                  <span className="doc-size">{doc.size}</span>
                  <button className="btn btn-outline btn-sm">Pobierz</button>
                </div>
              ))}
            </div>
          </div>

          {/* Panel operatora */}
          {userRole === 'OPERATOR' && (
            <div className="operator-panel">
              <h3>Panel Operatora</h3>
              <div className="status-controls">
                <label>Zmień status:</label>
                <select 
                  value={order.status} 
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="NEW">Nowe</option>
                  <option value="IN_PROGRESS">W trakcie analizy</option>
                  <option value="AWAITING_CLIENT">Oczekuje uzupełnienia</option>
                  <option value="AWAITING_PAYMENT">Gotowe do opłaty</option>
                  <option value="COMPLETED">Zakończone</option>
                </select>
              </div>
              
              {order.status === 'IN_PROGRESS' && (
                <div className="analysis-form">
                  <h4>Dodaj analizę</h4>
                  <div className="form-group">
                    <label>Fragment publiczny (zapowiedź):</label>
                    <textarea
                      value={analysis.preview}
                      onChange={(e) => setAnalysis({...analysis, preview: e.target.value})}
                      placeholder="Krótki fragment widoczny przed płatnością..."
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Pełna analiza:</label>
                    <textarea
                      value={analysis.full}
                      onChange={(e) => setAnalysis({...analysis, full: e.target.value})}
                      placeholder="Pełna treść analizy..."
                      rows="10"
                    />
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleStatusChange('AWAITING_PAYMENT')}
                  >
                    Zapisz analizę i oznacz jako gotowe do opłaty
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sekcja analizy dla klienta */}
          {userRole === 'CLIENT' && (order.status === 'AWAITING_PAYMENT' || order.status === 'COMPLETED') && (
            <div className="analysis-section">
              <h3>Analiza dokumentów</h3>
              
              {order.status === 'AWAITING_PAYMENT' ? (
                <div className="payment-required">
                  <div className="preview-content">
                    <h4>Podgląd analizy:</h4>
                    <p>{analysis.preview}</p>
                    <p className="preview-note">...aby zobaczyć pełną analizę, dokonaj płatności.</p>
                  </div>
                  
                  <div className="payment-section">
                    <div className="price-info">
                      <span className="price">299 zł</span>
                      <span className="price-note">za pełną analizę</span>
                    </div>
                    <button className="btn btn-primary btn-large" onClick={handlePayment}>
                      💳 Zapłać i zobacz pełną analizę
                    </button>
                  </div>
                </div>
              ) : (
                <div className="full-analysis">
                  <h4>Pełna analiza:</h4>
                  <div className="analysis-content">
                    <pre>{analysis.full}</pre>
                  </div>
                  <button className="btn btn-outline">📥 Pobierz jako PDF</button>
                </div>
              )}
            </div>
          )}

          {/* Sekcja komentarzy */}
          <div className="comments-section">
            <h3>Komunikacja</h3>
            
            <div className="comments-list">
              {order.comments.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <strong>{comment.author}</strong>
                    <span className="comment-date">
                      {new Date(comment.created_at).toLocaleString('pl-PL')}
                    </span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>

            <div className="add-comment">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Napisz komentarz..."
                rows="3"
              />
              <button className="btn btn-primary" onClick={handleAddComment}>
                Dodaj komentarz
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetails