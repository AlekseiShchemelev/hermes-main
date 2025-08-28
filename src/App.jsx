import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Home, List, Settings, Plus } from 'lucide-react'
import OrderForm from './components/OrderForm'
import OrdersList from './components/OrdersList'
import ControlPanel from './components/ControlPanel'
import './App.css'

function App() {
  const location = useLocation()

  return (
    <div className="app">
      {/* Навигация */}
      <nav className="navbar">
        <div className="nav-brand">
          <h1>📋 Hermes</h1>
        </div>
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <Home size={20} />
            <span>Форма заказа</span>
          </Link>
          <Link 
            to="/orders" 
            className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}
          >
            <List size={20} />
            <span>Список заказов</span>
          </Link>
          <Link 
            to="/control" 
            className={`nav-link ${location.pathname === '/control' ? 'active' : ''}`}
          >
            <Settings size={20} />
            <span>Управление</span>
          </Link>
        </div>
      </nav>

      {/* Основной контент */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<OrderForm />} />
          <Route path="/orders" element={<OrdersList />} />
          <Route path="/edit/:id" element={<OrderForm />} />
          <Route path="/control" element={<ControlPanel />} />
        </Routes>
      </main>

      {/* Плавающая кнопка добавления */}
      {location.pathname === '/orders' && (
        <Link to="/" className="fab">
          <Plus size={24} />
        </Link>
      )}
    </div>
  )
}

export default App

