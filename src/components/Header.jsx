import React from 'react'
import { Link } from 'react-router-dom'

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          📄 Platforma Analizy Dokumentów
        </Link>
        
        <nav className="nav">
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">
                {user.role === 'CLIENT' ? 'Moje Zlecenia' : 'Panel Operatora'}
              </Link>
              {user.role === 'CLIENT' && (
                <Link to="/create-order" className="nav-link">
                  Nowe Zlecenie
                </Link>
              )}
              <span className="user-info">
                {user.email} ({user.role === 'CLIENT' ? 'Klient' : 'Operator'})
              </span>
              <button onClick={onLogout} className="btn btn-outline">
                Wyloguj
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Zaloguj się
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header