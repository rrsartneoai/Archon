import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const ClientDashboard = () => {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    // Symulacja pobrania zleceń klienta
    const mockOrders = [
      {
        id: 1,
        title: 'Analiza umowy najmu',
        status: 'NEW',
        created_at: '2024-01-15',
        description: 'Proszę o analizę umowy najmu lokalu handlowego'
      },
      {
        id: 2,
        title: 'Weryfikacja regulaminu',
        status: 'IN_PROGRESS',
        created_at: '2024-01-10',
        description: 'Analiza zgodności regulaminu z RODO'
      },
      {
        id: 3,
        title: 'Umowa o dzieło',
        status: 'AWAITING_PAYMENT',
        created_at: '2024-01-05',
        description: 'Sprawdzenie klauzul umowy o dzieło'
      }
    ]
    setOrders(mockOrders)
  }, [])

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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Moje Zlecenia</h1>
        <Link to="/create-order" className="btn btn-primary">
          + Nowe Zlecenie
        </Link>
      </div>

      <div className="orders-grid">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <h3>{order.title}</h3>
              <span className={`status ${getStatusClass(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
            
            <p className="order-description">{order.description}</p>
            
            <div className="order-footer">
              <span className="order-date">
                Utworzone: {new Date(order.created_at).toLocaleDateString('pl-PL')}
              </span>
              <Link to={`/order/${order.id}`} className="btn btn-outline">
                Zobacz szczegóły
              </Link>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="empty-state">
          <h3>Brak zleceń</h3>
          <p>Nie masz jeszcze żadnych zleceń. Utwórz pierwsze zlecenie, aby rozpocząć.</p>
          <Link to="/create-order" className="btn btn-primary">
            Utwórz pierwsze zlecenie
          </Link>
        </div>
      )}
    </div>
  )
}

export default ClientDashboard