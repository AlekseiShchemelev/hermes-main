import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { orderService } from '../services/orderService'
import { toast } from '../utils/toast'
import './OrdersList.css'

const OrdersList = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterAndSortOrders()
  }, [orders, searchTerm, sortField, sortDirection])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await orderService.getOrders()
      setOrders(data)
    } catch (error) {
      toast('Ошибка загрузки заказов', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortOrders = () => {
    let filtered = orders.filter(order => {
      const searchLower = searchTerm.toLowerCase()
      return (
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.bottomNumber?.toLowerCase().includes(searchLower) ||
        order.material?.toLowerCase().includes(searchLower)
      )
    })

    // Сортировка
    filtered.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (sortField === 'date') {
        aVal = new Date(aVal || 0)
        bVal = new Date(bVal || 0)
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setFilteredOrders(filtered)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      return
    }

    try {
      await orderService.deleteOrder(id)
      toast('Заказ удален успешно', 'success')
      loadOrders()
    } catch (error) {
      toast('Ошибка удаления заказа', 'error')
    }
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={16} />
    return sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
  }

  if (loading) {
    return <div className="loading">Загрузка заказов...</div>
  }

  return (
    <div className="orders-list-container">
      <div className="list-header">
        <h1>📋 Список заказов</h1>
        <div className="list-stats">
          Найдено: {filteredOrders.length} из {orders.length}
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="🔍 Поиск по номеру заказа, днища или материалу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Таблица заказов */}
      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th 
                className="sortable"
                onClick={() => handleSort('date')}
              >
                📅 Дата {getSortIcon('date')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('orderNumber')}
              >
                📦 Номер {getSortIcon('orderNumber')}
              </th>
              <th 
                className="sortable hide-mobile"
                onClick={() => handleSort('diameter')}
              >
                📏 Диаметр {getSortIcon('diameter')}
              </th>
              <th 
                className="sortable hide-mobile"
                onClick={() => handleSort('thickness')}
              >
                📐 Толщина {getSortIcon('thickness')}
              </th>
              <th 
                className="sortable hide-mobile"
                onClick={() => handleSort('material')}
              >
                🧱 Материал {getSortIcon('material')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('bottomNumber')}
              >
                🔢 Днище {getSortIcon('bottomNumber')}
              </th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="order-row">
                <td>
                  {order.date ? format(new Date(order.date), 'dd.MM.yyyy', { locale: ru }) : '-'}
                </td>
                <td className="order-number">{order.orderNumber}</td>
                <td className="hide-mobile">{order.diameter || '-'}</td>
                <td className="hide-mobile">{order.thickness || '-'}</td>
                <td className="hide-mobile">{order.material || '-'}</td>
                <td>{order.bottomNumber || '-'}</td>
                <td className="actions">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => navigate(`/edit/${order.id}`)}
                    title="Редактировать"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(order.id)}
                    title="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon">📭</div>
            <div className="no-results-text">
              {searchTerm ? 'Заказы не найдены по вашему запросу' : 'Заказы не найдены'}
            </div>
          </div>
        )}
      </div>

      {/* Мобильные карточки */}
      <div className="mobile-cards">
        {filteredOrders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="card-header">
              <div className="card-title">
                <strong>{order.orderNumber}</strong>
                {order.date && (
                  <span className="card-date">
                    {format(new Date(order.date), 'dd.MM.yyyy', { locale: ru })}
                  </span>
                )}
              </div>
            </div>
            
            <div className="card-content">
              <div className="card-row">
                <span className="card-label">Днище:</span>
                <span>{order.bottomNumber || '-'}</span>
              </div>
              <div className="card-row">
                <span className="card-label">Материал:</span>
                <span>{order.material || '-'}</span>
              </div>
              <div className="card-row">
                <span className="card-label">Диаметр:</span>
                <span>{order.diameter || '-'} мм</span>
              </div>
              <div className="card-row">
                <span className="card-label">Толщина:</span>
                <span>{order.thickness || '-'} мм</span>
              </div>
            </div>
            
            <div className="card-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/edit/${order.id}`)}
              >
                <Edit size={16} />
                Редактировать
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(order.id)}
              >
                <Trash2 size={16} />
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OrdersList

