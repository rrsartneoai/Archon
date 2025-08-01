import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const OperatorDashboard = () => {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    // Symulacja pobrania wszystkich zleceń
    const mockOrders = [
      {
        id: 1,
        title: 'Analiza umowy najmu',
        status: 'NEW',
        created_at: '2024-01-15',
        client_email: 'klient1@example.com',
        description: 'Proszę o analizę umowy najmu lokalu handlowego'
      },
      {
        id: 2,
        title: 'Weryfikacja regulaminu',
        status: 'IN_PROGRESS',
        created_at: '2024-01-10',
        client_email: 'klient2@example.com',
        description: 'Analiza zgodności regulaminu z RODO'
      },
      {
        id: 3,
        title: 'Umowa o dzieło',
        status: 'AWAITING_PAYMENT',
        created_at: '2024-01-05',
        client_email: 'klient3@example.com',
        description: 'Sprawdzenie klauzul umowy o dzieło'
      },
      {
        id: 4,
        title: 'Analiza NDA',
        status: 'AWAITING_CLIENT',
        created_at: '2024-01-12',
        client_email: 'klient4@example.com',
        description: 'Weryfikacja umowy o zachowaniu poufności'
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

  const filteredOrders = filter === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === filter)

  const getOrderCount = (status) => {
    return status === 'ALL' 
      ? orders.length 
      : orders.filter(order => order.status === status).length
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Panel Operatora</h1>
        <div className="stats">
          <span className="stat">
            Wszystkie: {getOrderCount('ALL')}
          </span>
          <span className="stat">
            Nowe: {getOrderCount('NEW')}
          </span>
          <span className="stat">
            W trakcie: {getOrderCount('IN_PROGRESS')}
          </span>
        </div>
      </div>

      <div className="filters">
        <button 
          className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          Wszystkie ({getOrderCount('ALL')})
        </button>
        <button 
          className={`filter-btn ${filter === 'NEW' ? 'active' : ''}`}
          onClick={() => setFilter('NEW')}
        >
          Nowe ({getOrderCount('NEW')})
        </button>
        <button 
          className={`filter-btn ${filter === 'IN_PROGRESS' ? 'active' : ''}`}
          onClick={() => setFilter('IN_PROGRESS')}
        >
          W trakcie ({getOrderCount('IN_PROGRESS')})
        </button>
        <button 
          className={`filter-btn ${filter === 'AWAITING_CLIENT' ? 'active' : ''}`}
          onClick={() => setFilter('AWAITING_CLIENT')}
        >
          Oczekuje uzupełnienia ({getOrderCount('AWAITING_CLIENT')})
        </button>
      </div>

      <div className="orders-grid">
        {filteredOrders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <h3>{order.title}</h3>
              <span className={`status ${getStatusClass(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
            
            <p className="order-description">{order.description}</p>
            <p className="client-info">Klient: {order.client_email}</p>
            
            <div className="order-footer">
              <span className="order-date">
                Utworzone: {new Date(order.created_at).toLocaleDateString('pl-PL')}
              </span>
              <Link to={`/order/${order.id}`} className="btn btn-primary">
                Obsłuż zlecenie
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="empty-state">
          <h3>Brak zleceń</h3>
          <p>Nie ma zleceń spełniających wybrane kryteria.</p>
        </div>
      )}
    </div>
  )
}

export default OperatorDashboard