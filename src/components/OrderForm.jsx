import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Trash2, X, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { orderService } from '../services/orderService'
import { toast } from '../utils/toast'
import './OrderForm.css'

const OrderForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    orderNumber: '',
    diameter: '',
    thickness: '',
    typeSize: '',
    cutting: '',
    bottomNumber: '',
    material: '',
    heatTreatment: '',
    treatmentDate: '',
    executors: [
      { title: 'Сварщик', name: '', date: '' },
      { title: 'Штамповка', name: '', date: '' },
      { title: 'Отбортовка', name: '', date: '' },
      { title: 'Калибровка', name: '', date: '' },
      { title: 'Сварщик (заглушки)', name: '', date: '' },
      { title: 'Резчик', name: '', date: '' }
    ]
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEditing) {
      loadOrder()
    }
  }, [id])

  const loadOrder = async () => {
    try {
      setLoading(true)
      const order = await orderService.getOrder(id)
      if (order) {
        setFormData({
          ...order,
          executors: order.executors || formData.executors
        })
      }
    } catch (error) {
      toast('Ошибка загрузки заказа', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleExecutorChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      executors: prev.executors.map((executor, i) =>
        i === index ? { ...executor, [field]: value } : executor
      )
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.orderNumber.trim()) {
      toast('Номер заказа обязателен', 'error')
      return
    }

    try {
      setLoading(true)
      
      if (isEditing) {
        await orderService.updateOrder(id, formData)
        toast('Заказ обновлен успешно', 'success')
      } else {
        await orderService.createOrder(formData)
        toast('Заказ создан успешно', 'success')
      }
      
      navigate('/orders')
    } catch (error) {
      toast('Ошибка сохранения заказа', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      return
    }

    try {
      setLoading(true)
      await orderService.deleteOrder(id)
      toast('Заказ удален успешно', 'success')
      navigate('/orders')
    } catch (error) {
      toast('Ошибка удаления заказа', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEditing) {
    return <div className="loading">Загрузка...</div>
  }

  return (
    <div className="order-form-container">
      <div className="form-header">
        <h1>{isEditing ? 'Редактирование заказа' : 'Новый заказ'}</h1>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft size={16} />
            К списку
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        {/* Основная информация */}
        <div className="form-section">
          <h3>Основная информация</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date" className="required">📅 Дата</label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="orderNumber" className="required">📦 Номер заказа</label>
              <input
                type="text"
                id="orderNumber"
                value={formData.orderNumber}
                onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                placeholder="Введите номер заказа"
                pattern="[A-Za-z0-9\-]+"
                title="Только буквы, цифры и дефисы"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="diameter">📏 Диаметр (мм)</label>
              <input
                type="number"
                id="diameter"
                value={formData.diameter}
                onChange={(e) => handleInputChange('diameter', e.target.value)}
                placeholder="Диаметр в миллиметрах"
                min="0"
                step="0.1"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="thickness">📐 Толщина (мм)</label>
              <input
                type="number"
                id="thickness"
                value={formData.thickness}
                onChange={(e) => handleInputChange('thickness', e.target.value)}
                placeholder="Толщина в миллиметрах"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="typeSize">🔠 Типоразмер</label>
              <input
                type="text"
                id="typeSize"
                value={formData.typeSize}
                onChange={(e) => handleInputChange('typeSize', e.target.value)}
                placeholder="Например: 1000×2000"
                pattern="[0-9]+×[0-9]+"
                title="Формат: число×число (например: 1000×2000)"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="cutting">⚙️ Раскрой</label>
              <select
                id="cutting"
                value={formData.cutting}
                onChange={(e) => handleInputChange('cutting', e.target.value)}
              >
                <option value="">— Выберите раскрой —</option>
                {['О', 'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З'].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bottomNumber">🔢 Номер днища</label>
              <input
                type="text"
                id="bottomNumber"
                value={formData.bottomNumber}
                onChange={(e) => handleInputChange('bottomNumber', e.target.value)}
                placeholder="Номер днища"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="material">🧱 Материал</label>
              <select
                id="material"
                value={formData.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
              >
                <option value="">— Выберите материал —</option>
                {['09Г2С', 'Ст3сп', '12Х18Н10Т', '08Х18Н10', 'AISI304', 'AISI304L', 'AISI321'].map(material => (
                  <option key={material} value={material}>{material}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Исполнители */}
        <div className="form-section">
          <h3>👥 Исполнители и даты</h3>
          
          {formData.executors.map((executor, index) => (
            <div key={index} className="executor-item">
              <div className="executor-title">{executor.title}</div>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    value={executor.name}
                    onChange={(e) => handleExecutorChange(index, 'name', e.target.value)}
                    placeholder="ФИО исполнителя"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="date"
                    value={executor.date}
                    onChange={(e) => handleExecutorChange(index, 'date', e.target.value)}
                    max="2099-12-31"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Термическая обработка */}
        <div className="form-section">
          <h3>🔥 Термическая обработка</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="heatTreatment">Режим ТО</label>
              <input
                type="text"
                id="heatTreatment"
                value={formData.heatTreatment}
                onChange={(e) => handleInputChange('heatTreatment', e.target.value)}
                placeholder="Укажите режим термической обработки"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="treatmentDate">📅 Дата ТО</label>
              <input
                type="date"
                id="treatmentDate"
                value={formData.treatmentDate}
                onChange={(e) => handleInputChange('treatmentDate', e.target.value)}
                max="2099-12-31"
              />
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            <Save size={16} />
            {isEditing ? 'Обновить' : 'Создать'}
          </button>
          
          {isEditing && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 size={16} />
              Удалить
            </button>
          )}
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/orders')}
            disabled={loading}
          >
            <X size={16} />
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

export default OrderForm

