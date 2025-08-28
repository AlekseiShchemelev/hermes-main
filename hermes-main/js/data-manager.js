// DataManager.js - управление данными (импорт/экспорт/backup)
class DataManager extends OrdersManager {
	constructor() {
		super()
	}

	// Экспорт в CSV
	async exportToCSV() {
		try {
			const orders = await this.getAllRecords()

			if (orders.length === 0) {
				alert('Нет данных для экспорта')
				return
			}

			const headers = [
				'ID',
				'Дата заказа',
				'Номер заказа',
				'Диаметр (мм)',
				'Толщина (мм)',
				'Типоразмер',
				'Раскрой',
				'Номер днища',
				'Материал',
				'Режим ТО',
				'Дата ТО',
				'Сварщик',
				'Дата сварки',
				'Штамповка',
				'Дата штамповки',
				'Отбортовка',
				'Дата отбортовки',
				'Калибровка',
				'Дата калибровки',
				'Сварщик (заглушки)',
				'Дата сварки заглушек',
				'Резчик',
				'Дата резки',
				'Дата создания',
				'Дата обновления',
			]

			const csvRows = [headers.join(',')]

			orders.forEach(order => {
				const row = [
					this.escapeCSV(order.id || ''),
					this.escapeCSV(order.date || ''),
					this.escapeCSV(order.orderNumber || ''),
					this.escapeCSV(order.diameter || ''),
					this.escapeCSV(order.thickness || ''),
					this.escapeCSV(order.typeSize || ''),
					this.escapeCSV(order.cutting || ''),
					this.escapeCSV(order.bottomNumber || ''),
					this.escapeCSV(order.material || ''),
					this.escapeCSV(order.heatTreatment || ''),
					this.escapeCSV(order.treatmentDate || ''),
					this.escapeCSV(order.executors?.[0]?.name || ''),
					this.escapeCSV(order.executors?.[0]?.date || ''),
					this.escapeCSV(order.executors?.[1]?.name || ''),
					this.escapeCSV(order.executors?.[1]?.date || ''),
					this.escapeCSV(order.executors?.[2]?.name || ''),
					this.escapeCSV(order.executors?.[2]?.date || ''),
					this.escapeCSV(order.executors?.[3]?.name || ''),
					this.escapeCSV(order.executors?.[3]?.date || ''),
					this.escapeCSV(order.executors?.[4]?.name || ''),
					this.escapeCSV(order.executors?.[4]?.date || ''),
					this.escapeCSV(order.executors?.[5]?.name || ''),
					this.escapeCSV(order.executors?.[5]?.date || ''),
					this.escapeCSV(order.createdAt || ''),
					this.escapeCSV(order.updatedAt || ''),
				]
				csvRows.push(row.join(','))
			})

			const csvContent = csvRows.join('\n')
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
			const link = document.createElement('a')
			const url = URL.createObjectURL(blob)

			link.setAttribute('href', url)
			link.setAttribute(
				'download',
				'orders_export_' + new Date().toISOString().slice(0, 10) + '.csv'
			)
			link.style.visibility = 'hidden'

			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)

			alert('Данные экспортированы в CSV')
		} catch (error) {
			console.error('Ошибка экспорта:', error)
			alert('Ошибка при экспорте данных')
		}
	}

	// Импорт данных
	async importOrders(ordersToImport, overwrite, searchByBottomNumber = false) {
		let imported = 0
		let skipped = 0
		let errors = 0
		let updated = 0

		try {
			for (const orderData of ordersToImport) {
				try {
					let existingOrder = null
					const searchKey = searchByBottomNumber
						? orderData['номер днища']
						: orderData['номер заказа']

					// Поиск существующей записи
					if (searchKey) {
						try {
							if (searchByBottomNumber) {
								const results = await this.searchByBottomNumber(searchKey)
								existingOrder = results.length > 0 ? results[0] : null
							} else {
								const results = await this.searchRecords(
									searchKey,
									'orderNumber'
								)
								existingOrder = results.length > 0 ? results[0] : null
							}
						} catch (searchError) {
							console.error('Ошибка поиска записи:', searchError)
						}
					}

					// Если запись существует и не разрешена перезапись - пропускаем
					if (existingOrder && !overwrite) {
						skipped++
						continue
					}

					// Определяем ID
					const orderId = existingOrder ? existingOrder.id : this.generateId()

					// Подготавливаем данные для сохранения
					const orderToSave = {
						id: orderId,
						date: orderData['дата заказа'] || '',
						orderNumber: orderData['номер заказа'] || '',
						diameter: orderData['диаметр (мм)'] || '',
						thickness: orderData['толщина (мм)'] || '',
						typeSize: orderData['типоразмер'] || '',
						cutting: orderData['раскрой'] || '',
						bottomNumber: orderData['номер днища'] || '',
						material: orderData['материал'] || '',
						heatTreatment: orderData['режим то'] || '',
						treatmentDate: orderData['дата то'] || '',
						executors: [
							{
								name: orderData['сварщик'] || '',
								date: orderData['дата сварки'] || '',
							},
							{
								name: orderData['штамповка'] || '',
								date: orderData['дата штамповки'] || '',
							},
							{
								name: orderData['отбортовка'] || '',
								date: orderData['дата отбортовки'] || '',
							},
							{
								name: orderData['калибровка'] || '',
								date: orderData['дата калибровки'] || '',
							},
							{
								name: orderData['сварщик (заглушки)'] || '',
								date: orderData['дата сварки заглушек'] || '',
							},
							{
								name: orderData['резчик'] || '',
								date: orderData['дата резки'] || '',
							},
						],
						createdAt: existingOrder
							? existingOrder.createdAt
							: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}

					// Сохраняем запись
					await this.saveRecord(orderToSave)
					existingOrder ? updated++ : imported++
				} catch (orderError) {
					console.error('Ошибка обработки записи:', orderError)
					errors++
				}
			}

			return {
				imported,
				updated,
				skipped,
				errors,
				total: ordersToImport.length,
			}
		} catch (error) {
			console.error('Ошибка импорта:', error)
			throw error
		}
	}

	// Создание backup
	async backupData() {
		try {
			const orders = await this.getAllRecords()
			const backupData = {
				version: 1,
				timestamp: new Date().toISOString(),
				totalRecords: orders.length,
				data: orders,
			}

			const blob = new Blob([JSON.stringify(backupData, null, 2)], {
				type: 'application/json',
			})

			const link = document.createElement('a')
			const url = URL.createObjectURL(blob)

			link.setAttribute('href', url)
			link.setAttribute(
				'download',
				`orders_backup_${new Date().toISOString().replace(/:/g, '-')}.json`
			)
			link.style.visibility = 'hidden'

			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)

			alert(`Backup создан успешно! Сохранено записей: ${orders.length}`)
		} catch (error) {
			console.error('Ошибка создания backup:', error)
			alert('Ошибка при создании backup')
		}
	}

	// Восстановление из backup
	async restoreBackup(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()

			reader.onload = async e => {
				try {
					const backupData = JSON.parse(e.target.result)

					if (!backupData.data || !Array.isArray(backupData.data)) {
						throw new Error('Неверный формат backup файла')
					}

					let restored = 0
					let errors = 0

					for (const order of backupData.data) {
						try {
							await this.saveRecord(order)
							restored++
						} catch (saveError) {
							console.error('Ошибка восстановления записи:', saveError)
							errors++
						}
					}

					resolve({
						restored,
						errors,
						total: backupData.data.length,
					})
				} catch (parseError) {
					reject(parseError)
				}
			}

			reader.onerror = () => reject(reader.error)
			reader.readAsText(file)
		})
	}

	// Очистка всех данных
	async clearAllData() {
		if (
			!confirm(
				'⚠️ ВНИМАНИЕ! Это действие удалит ВСЕ данные без возможности восстановления.\n\nПродолжить?'
			)
		) {
			return
		}

		try {
			const transaction = this.db.transaction([this.STORE_NAME], 'readwrite')
			const store = transaction.objectStore(this.STORE_NAME)
			const request = store.clear()

			await new Promise((resolve, reject) => {
				request.onsuccess = resolve
				request.onerror = () => reject(request.error)
			})

			alert('Все данные успешно удалены')
			return true
		} catch (error) {
			console.error('Ошибка очистки данных:', error)
			alert('Ошибка при удалении данных')
			return false
		}
	}

	// Экранирование для CSV
	escapeCSV(value) {
		if (value === null || value === undefined) return ''
		const stringValue = String(value)
		if (
			stringValue.includes(',') ||
			stringValue.includes('"') ||
			stringValue.includes('\n')
		) {
			return '"' + stringValue.replace(/"/g, '""') + '"'
		}
		return stringValue
	}

	// Парсинг CSV
	parseCSV(csvText) {
		const lines = csvText.split('\n').filter(line => line.trim())
		if (lines.length < 2) return []

		const headers = lines[0]
			.split(',')
			.map(header => header.trim().toLowerCase().replace(/"/g, ''))

		const results = []
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i]
			const values = []
			let inQuotes = false
			let currentValue = ''

			for (let j = 0; j < line.length; j++) {
				const char = line[j]

				if (char === '"') {
					inQuotes = !inQuotes
				} else if (char === ',' && !inQuotes) {
					values.push(currentValue.trim())
					currentValue = ''
				} else {
					currentValue += char
				}
			}
			values.push(currentValue.trim())

			const row = {}
			headers.forEach((header, index) => {
				row[header] = values[index] || ''
			})

			results.push(row)
		}

		return results
	}
}
