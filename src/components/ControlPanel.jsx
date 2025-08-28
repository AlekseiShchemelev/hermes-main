import React, { useState, useEffect } from 'react'
import { BarChart3, Database, AlertTriangle, Download, Upload, Save, Trash2 } from 'lucide-react'
import { orderService } from '../services/orderService'
import { toast } from '../utils/toast'
import './ControlPanel.css'

const ControlPanel = () => {
  const [activeTab, setActiveTab] = useState('stats')
  const [stats, setStats] = useState({
    totalOrders: 0,
    uniqueMaterials: 0,
    uniqueOrderNumbers: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await orderService.getStats()
      setStats(data)
    } catch (error) {
      toast('Ошибка загрузки статистики', 'error')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = async () => {
    try {
      setLoading(true)
      const csvData = await orderService.exportToCSV()
      
      // Создание и скачивание файла
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `hermes_orders_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast('Экспорт завершен успешно', 'success')
    } catch (error) {
      toast('Ошибка экспорта', 'error')
    } finally {
      setLoading(false)
    }
  }

  const startImport = (byBottomNumber = false) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('byBottomNumber', byBottomNumber)
        
        await orderService.importFromCSV(formData)
        toast('Импорт завершен успешно', 'success')
        loadStats() // Обновляем статистику
      } catch (error) {
        toast('Ошибка импорта', 'error')
      } finally {
        setLoading(false)
      }
    }
    input.click()
  }

  const backupData = async () => {
    try {
      setLoading(true)
      const backup = await orderService.createBackup()
      
      // Создание и скачивание backup файла
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `hermes_backup_${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast('Backup создан успешно', 'success')
    } catch (error) {
      toast('Ошибка создания backup', 'error')
    } finally {
      setLoading(false)
    }
  }

  const restoreBackup = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      if (!window.confirm('Восстановление backup заменит все текущие данные. Продолжить?')) {
        return
      }

      try {
        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)
        
        await orderService.restoreBackup(formData)
        toast('Backup восстановлен успешно', 'success')
        loadStats() // Обновляем статистику
      } catch (error) {
        toast('Ошибка восстановления backup', 'error')
      } finally {
        setLoading(false)
      }
    }
    input.click()
  }

  const clearAllData = async () => {
    if (!window.confirm('⚠️ ВНИМАНИЕ! Это действие невозможно отменить. Все данные будут безвозвратно удалены. Продолжить?')) {
      return
    }

    if (!window.confirm('Для подтверждения введите "УДАЛИТЬ ВСЕ" в следующем поле:')) {
      return
    }

    const confirmation = window.prompt('Введите "УДАЛИТЬ ВСЕ" для подтверждения:')
    if (confirmation !== 'УДАЛИТЬ ВСЕ') {
      toast('Операция отменена', 'info')
      return
    }

    try {
      setLoading(true)
      await orderService.clearAllData()
      toast('Все данные удалены', 'success')
      loadStats() // Обновляем статистику
    } catch (error) {
      toast('Ошибка удаления данных', 'error')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'stats', label: '📊 Статистика', icon: BarChart3 },
    { id: 'data', label: '📁 Управление данными', icon: Database },
    { id: 'danger', label: '⚠️ Опасная зона', icon: AlertTriangle }
  ]

  return (
    <div className="control-panel-container">
      <div className="panel-header">
        <h1>⚙️ Панель управления заказами</h1>
      </div>

      {/* Навигационные вкладки */}
      <div className="tabs">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Содержимое вкладок */}
      <div className="tab-content">
        {/* Вкладка статистики */}
        {activeTab === 'stats' && (
          <div className="stats-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.totalOrders}</div>
                <div className="stat-label">Всего заказов</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.uniqueMaterials}</div>
                <div className="stat-label">Разных материалов</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.uniqueOrderNumbers}</div>
                <div className="stat-label">Уникальных номеров</div>
              </div>
            </div>
            
            <div className="stats-actions">
              <button
                className="btn btn-secondary"
                onClick={loadStats}
                disabled={loading}
              >
                Обновить статистику
              </button>
            </div>
          </div>
        )}

        {/* Вкладка управления данными */}
        {activeTab === 'data' && (
          <div className="data-tab">
            <div className="btn-container">
              <button
                className="btn btn-primary"
                onClick={exportToCSV}
                disabled={loading}
              >
                <Download size={16} />
                Экспорт в CSV
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={() => startImport(false)}
                disabled={loading}
              >
                <Upload size={16} />
                Импорт по номеру заказа
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={() => startImport(true)}
                disabled={loading}
              >
                <Upload size={16} />
                Импорт по номеру днища
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={backupData}
                disabled={loading}
              >
                <Save size={16} />
                Создать backup
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={restoreBackup}
                disabled={loading}
              >
                <Upload size={16} />
                Восстановить backup
              </button>
            </div>
          </div>
        )}

        {/* Вкладка опасной зоны */}
        {activeTab === 'danger' && (
          <div className="danger-tab">
            <div className="danger-zone">
              <h2 className="danger-title">⚠️ Опасная зона</h2>
              <p className="danger-text">
                Эти действия невозможно отменить. Все данные будут безвозвратно удалены. 
                Рекомендуется создать backup перед выполнением этих операций.
              </p>
              
              <div className="btn-container">
                <button
                  className="btn btn-danger"
                  onClick={clearAllData}
                  disabled={loading}
                >
                  <Trash2 size={16} />
                  Очистить все данные
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Индикатор загрузки */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Обработка...</div>
        </div>
      )}
    </div>
  )
}

export default ControlPanel

