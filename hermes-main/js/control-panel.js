// control-panel.js - управление панелью управления
document.addEventListener('DOMContentLoaded', async () => {
	await loadStatistics()
})

async function loadStatistics() {
	try {
		const dataManager = new DataManager()
		await dataManager.initDatabase()

		const orders = await dataManager.getAllRecords()

		// Уникальные материалы
		const materials = new Set(
			orders.map(order => order.material).filter(Boolean)
		)

		// Уникальные номера заказов
		const orderNumbers = new Set(
			orders.map(order => order.orderNumber).filter(Boolean)
		)

		document.getElementById('totalOrders').textContent = orders.length
		document.getElementById('uniqueMaterials').textContent = materials.size
		document.getElementById('uniqueOrderNumbers').textContent =
			orderNumbers.size
	} catch (error) {
		console.error('Ошибка загрузки статистики:', error)
	}
}

async function exportToCSV() {
	try {
		const dataManager = new DataManager()
		await dataManager.initDatabase()
		dataManager.exportToCSV()
	} catch (error) {
		console.error('Ошибка экспорта:', error)
		alert('Ошибка при экспорте данных')
	}
}

function startImport(searchByBottomNumber = false) {
	const fileInput = document.getElementById('importFileInput')
	fileInput.onchange = e => handleImport(e, searchByBottomNumber)
	fileInput.click()
}

async function handleImport(event, searchByBottomNumber) {
	const file = event.target.files[0]
	if (!file) return

	try {
		const dataManager = new DataManager()
		await dataManager.initDatabase()

		const text = await readFileAsText(file)
		const parsedData = dataManager.parseCSV(text)

		if (parsedData.length === 0) {
			alert('Нет данных для импорта')
			return
		}

		const overwrite = confirm(
			`Найдено ${parsedData.length} записей. Перезаписывать существующие записи?`
		)

		const result = await dataManager.importOrders(
			parsedData,
			overwrite,
			searchByBottomNumber
		)

		alert(
			`Импорт завершен:\n\nДобавлено: ${result.imported}\nОбновлено: ${result.updated}\nПропущено: ${result.skipped}\nОшибок: ${result.errors}`
		)

		await loadStatistics()
	} catch (error) {
		console.error('Ошибка импорта:', error)
		alert('Ошибка при импорте данных')
	}
}

async function backupData() {
	try {
		const dataManager = new DataManager()
		await dataManager.initDatabase()
		dataManager.backupData()
	} catch (error) {
		console.error('Ошибка создания backup:', error)
		alert('Ошибка при создании backup')
	}
}

function restoreBackup() {
	const fileInput = document.getElementById('restoreFileInput')
	fileInput.onchange = handleRestoreBackup
	fileInput.click()
}

async function handleRestoreBackup(event) {
	const file = event.target.files[0]
	if (!file) return

	if (
		!confirm('Восстановление backup заменит все текущие данные. Продолжить?')
	) {
		return
	}

	try {
		const dataManager = new DataManager()
		await dataManager.initDatabase()

		const result = await dataManager.restoreBackup(file)
		alert(
			`Backup восстановлен:\n\nВосстановлено записей: ${result.restored}\nОшибок: ${result.errors}`
		)

		await loadStatistics()
	} catch (error) {
		console.error('Ошибка восстановления:', error)
		alert('Ошибка при восстановлении backup')
	}
}

async function clearAllData() {
	try {
		const dataManager = new DataManager()
		await dataManager.initDatabase()
		const success = await dataManager.clearAllData()

		if (success) {
			await loadStatistics()
		}
	} catch (error) {
		console.error('Ошибка очистки данных:', error)
		alert('Ошибка при удалении данных')
	}
}

function readFileAsText(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = e => resolve(e.target.result)
		reader.onerror = reject
		reader.readAsText(file)
	})
}
