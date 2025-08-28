import axios from 'axios'

const API_BASE_URL = '/api'

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const orderService = {
  // Получить все заказы
  async getOrders() {
    const response = await api.get('/orders')
    return response.data.orders
  },

  // Получить заказ по ID
  async getOrder(id) {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },

  // Создать новый заказ
  async createOrder(orderData) {
    const response = await api.post('/orders', orderData)
    return response.data
  },

  // Обновить заказ
  async updateOrder(id, orderData) {
    const response = await api.put(`/orders/${id}`, orderData)
    return response.data
  },

  // Удалить заказ
  async deleteOrder(id) {
    const response = await api.delete(`/orders/${id}`)
    return response.data
  },

  // Получить статистику
  async getStats() {
    const response = await api.get('/orders/stats')
    return response.data
  },

  // Экспорт в CSV
  async exportToCSV() {
    const response = await api.get('/orders/export/csv', {
      responseType: 'text'
    })
    return response.data
  },

  // Импорт из CSV
  async importFromCSV(formData) {
    const response = await api.post('/orders/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Создать backup
  async createBackup() {
    const response = await api.get('/orders/backup')
    return response.data
  },

  // Восстановить backup
  async restoreBackup(formData) {
    const response = await api.post('/orders/restore', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Очистить все данные
  async clearAllData() {
    const response = await api.delete('/orders/clear-all')
    return response.data
  },

  // Поиск заказов
  async searchOrders(query, filters = {}) {
    const response = await api.get('/orders/search', {
      params: { q: query, ...filters }
    })
    return response.data.orders
  }
}

