import React, { useState } from 'react'

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Symulacja logowania - w rzeczywistej aplikacji byłoby to wywołanie API
    setTimeout(() => {
      // Demo users
      const demoUsers = {
        'klient@example.com': { id: 1, email: 'klient@example.com', role: 'CLIENT' },
        'operator@example.com': { id: 2, email: 'operator@example.com', role: 'OPERATOR' }
      }

      const user = demoUsers[email]
      if (user && password === 'demo123') {
        onLogin(user)
      } else {
        alert('Nieprawidłowe dane logowania')
      }
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Logowanie</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Wprowadź email"
            />
          </div>
          
          <div className="form-group">
            <label>Hasło:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Wprowadź hasło"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
        
        <div className="demo-info">
          <h4>Konta demo:</h4>
          <p><strong>Klient:</strong> klient@example.com / demo123</p>
          <p><strong>Operator:</strong> operator@example.com / demo123</p>
        </div>
      </div>
    </div>
  )
}

export default Login