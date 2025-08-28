// OrdersManager.js - базовый класс для работы с IndexedDB
class OrdersManager {
	constructor() {
		this.db = null
		this.DB_NAME = 'OrdersDB'
		this.DB_VERSION = 3
		this.STORE_NAME = 'orders'
		this.isEditMode = false
		this.currentRecordId = ''
	}

	// Инициализация базы данных
	async initDatabase() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

			request.onerror = () => reject(request.error)
			request.onsuccess = () => {
				this.db = request.result
				console.log('База данных успешно открыта')
				resolve(this.db)
			}

			request.onupgradeneeded = event => {
				const db = event.target.result
				const oldVersion = event.oldVersion || 0
				this.handleDatabaseMigration(db, oldVersion, event.newVersion)
			}
		})
	}

	// Обработка миграций базы данных
	handleDatabaseMigration(db, oldVersion, newVersion) {
		console.log(`Миграция БД с версии ${oldVersion} на ${newVersion}`)

		if (oldVersion < 3) {
			if (db.objectStoreNames.contains(this.STORE_NAME)) {
				db.deleteObjectStore(this.STORE_NAME)
			}

			const store = db.createObjectStore(this.STORE_NAME, {
				keyPath: 'id',
				autoIncrement: false,
			})

			// Создаем индексы для быстрого поиска
			store.createIndex('orderNumber', 'orderNumber', { unique: false })
			store.createIndex('date', 'date', { unique: false })
			store.createIndex('material', 'material', { unique: false })
			store.createIndex('bottomNumber', 'bottomNumber', { unique: false })
			store.createIndex('diameter', 'diameter', { unique: false })
			store.createIndex('thickness', 'thickness', { unique: false })
			store.createIndex('createdAt', 'createdAt', { unique: false })
		}
	}

	// Генерация UUID v4
	generateId() {
		return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
			(
				c ^
				(crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
			).toString(16)
		)
	}

	// Получение записи по ID
	async getRecordById(id) {
		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('База данных не инициализирована'))
				return
			}

			const transaction = this.db.transaction([this.STORE_NAME], 'readonly')
			const store = transaction.objectStore(this.STORE_NAME)
			const request = store.get(id)

			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve(request.result)
		})
	}

	// Сохранение записи
	async saveRecord(record) {
		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('База данных не инициализирована'))
				return
			}

			// Добавляем метку времени
			if (!record.createdAt) {
				record.createdAt = new Date().toISOString()
			}
			record.updatedAt = new Date().toISOString()

			const transaction = this.db.transaction([this.STORE_NAME], 'readwrite')
			const store = transaction.objectStore(this.STORE_NAME)
			const request = store.put(record)

			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve(request.result)
		})
	}

	// Удаление записи
	async deleteRecordById(id) {
		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('База данных не инициализирована'))
				return
			}

			const transaction = this.db.transaction([this.STORE_NAME], 'readwrite')
			const store = transaction.objectStore(this.STORE_NAME)
			const request = store.delete(id)

			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve(true)
		})
	}

	// Получение всех записей
	async getAllRecords(sortBy = 'createdAt', sortDirection = 'desc') {
		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('База данных не инициализирована'))
				return
			}

			const transaction = this.db.transaction([this.STORE_NAME], 'readonly')
			const store = transaction.objectStore(this.STORE_NAME)
			const request = store.getAll()

			request.onerror = () => reject(request.error)
			request.onsuccess = () => {
				let records = request.result
				records.sort((a, b) => {
					const valueA = a[sortBy] || ''
					const valueB = b[sortBy] || ''
					return sortDirection === 'desc'
						? valueB.localeCompare(valueA)
						: valueA.localeCompare(valueB)
				})
				resolve(records)
			}
		})
	}

	// Поиск записей по номеру днища
	async searchByBottomNumber(bottomNumber) {
		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('База данных не инициализирована'))
				return
			}

			const transaction = this.db.transaction([this.STORE_NAME], 'readonly')
			const store = transaction.objectStore(this.STORE_NAME)
			const index = store.index('bottomNumber')
			const range = IDBKeyRange.only(bottomNumber)
			const request = index.getAll(range)

			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve(request.result)
		})
	}

	// Поиск записей по номеру заказа
	async searchByOrderNumber(orderNumber) {
		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('База данных не инициализирована'))
				return
			}

			const transaction = this.db.transaction([this.STORE_NAME], 'readonly')
			const store = transaction.objectStore(this.STORE_NAME)
			const index = store.index('orderNumber')
			const range = IDBKeyRange.only(orderNumber)
			const request = index.getAll(range)

			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve(request.result)
		})
	}

	// Поиск записей
	async searchRecords(searchTerm, field = 'orderNumber') {
		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error('База данных не инициализирована'))
				return
			}

			const transaction = this.db.transaction([this.STORE_NAME], 'readonly')
			const store = transaction.objectStore(this.STORE_NAME)

			if (field === 'id') {
				const request = store.get(searchTerm)
				request.onerror = () => reject(request.error)
				request.onsuccess = () =>
					resolve(request.result ? [request.result] : [])
			} else {
				const index = store.index(field)
				const request = index.getAll(searchTerm)
				request.onerror = () => reject(request.error)
				request.onsuccess = () => resolve(request.result)
			}
		})
	}
}
