import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Login from './components/Login'
import ClientDashboard from './components/ClientDashboard'
import OperatorDashboard from './components/OperatorDashboard'
import OrderDetails from './components/OrderDetails'
import CreateOrder from './components/CreateOrder'
import SnippetEngine from './components/LegalEngine/SnippetEngine'
import RAGInterface from './components/LegalEngine/RAGInterface'
import AudioTranscription from './components/LegalEngine/AudioTranscription'
import ProjectCostDashboard from './components/LegalEngine/ProjectCostDashboard'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sprawdź czy użytkownik jest zalogowany (localStorage lub token)
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  if (loading) {
    return <div className="loading">Ładowanie...</div>
  }

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="main-content">
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} 
          />
          
          <Route 
            path="/dashboard" 
            element={
              user ? (
                user.role === 'CLIENT' ? <ClientDashboard /> : <OperatorDashboard />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          
          <Route 
            path="/create-order" 
            element={user?.role === 'CLIENT' ? <CreateOrder /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/order/:id" 
            element={user ? <OrderDetails userRole={user.role} /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/snippets" 
            element={user ? <SnippetEngine /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/rag" 
            element={user ? <RAGInterface /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/transcription" 
            element={user ? <AudioTranscription /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/project-costs" 
            element={user ? <ProjectCostDashboard /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
          />
        </Routes>
      </main>
    </div>
  )
}

export default App