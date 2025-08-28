// OrdersManagerExtended.js - расширенный функционал для управления заказами
class OrdersManagerExtended extends OrdersManager {
	constructor() {
		super()
	}

	// Инициализация приложения
	async init() {
		console.log('Инициализация приложения с IndexedDB')

		try {
			await this.initDatabase()
			this.setTodayDate()

			const urlParams = new URLSearchParams(window.location.search)
			const urlRecordId = urlParams.get('id')

			if (urlRecordId && urlParams.has('id')) {
				console.log('ID из URL:', urlRecordId)
				this.currentRecordId = urlRecordId
				document.getElementById('recordId').value = urlRecordId
				this.isEditMode = true
				await this.loadRecordData(urlRecordId)
			} else {
				console.log('Режим новой записи')
				this.updateUIForNewRecord()
			}

			this.setupEventListeners()
		} catch (error) {
			console.error('Ошибка инициализации:', error)
			this.showError('Ошибка инициализации базы данных')
		}
	}

	// Настройка обработчиков событий
	setupEventListeners() {
		document
			.getElementById('submitBtn')
			.addEventListener('click', () => this.submitForm())
		document
			.getElementById('deleteBtn')
			.addEventListener('click', () => this.deleteRecord())
		document
			.getElementById('closeBtn')
			.addEventListener('click', this.closeForm)
		document
			.getElementById('listBtn')
			.addEventListener('click', () => this.showList())
		document
			.getElementById('controlPanelBtn')
			.addEventListener('click', () => this.showControlPanel())

		setTimeout(() => {
			if (!this.isEditMode) {
				const orderNumberInput = document.getElementById('orderNumber')
				if (orderNumberInput) orderNumberInput.focus()
			}
		}, 300)
	}

	// Загрузка данных записи для редактирования
	async loadRecordData(id) {
		try {
			const record = await this.getRecordById(id)
			if (record) {
				this.populateForm(record)
				this.updateUIForEditMode(record)
			} else {
				this.showError('Запись не найдена')
				this.updateUIForNewRecord()
			}
		} catch (error) {
			console.error('Ошибка загрузки записи:', error)
			this.showError('Ошибка загрузки данных')
		}
	}

	// Заполнение формы данными
	populateForm(record) {
		document.getElementById('date').value = record.date || ''
		document.getElementById('orderNumber').value = record.orderNumber || ''
		document.getElementById('diameter').value = record.diameter || ''
		document.getElementById('thickness').value = record.thickness || ''
		document.getElementById('typeSize').value = record.typeSize || ''
		document.getElementById('cutting').value = record.cutting || ''
		document.getElementById('bottomNumber').value = record.bottomNumber || ''
		document.getElementById('material').value = record.material || ''
		document.getElementById('heatTreatment').value = record.heatTreatment || ''
		document.getElementById('treatmentDate').value = record.treatmentDate || ''

		// Заполнение исполнителей
		if (record.executors) {
			record.executors.forEach((executor, index) => {
				const executorInput = document.getElementById(`executor${index + 1}`)
				const dateInput = document.getElementById(`date${index + 1}`)

				if (executorInput) executorInput.value = executor.name || ''
				if (dateInput) dateInput.value = executor.date || ''
			})
		}
	}

	// Обновление UI для режима редактирования
	updateUIForEditMode(record) {
		document.getElementById('deleteBtn').style.display = 'block'
		document.getElementById('formTitle').textContent =
			'✏️ Редактирование заказа'

		const statusInfo = document.getElementById('statusInfo')
		if (record.createdAt) {
			const createdDate = new Date(record.createdAt).toLocaleString()
			statusInfo.textContent = `Создан: ${createdDate}`
		}

		if (record.updatedAt) {
			const updatedDate = new Date(record.updatedAt).toLocaleString()
			statusInfo.textContent += ` | Обновлен: ${updatedDate}`
		}
	}

	// Обновление UI для новой записи
	updateUIForNewRecord() {
		document.getElementById('deleteBtn').style.display = 'none'
		document.getElementById('formTitle').textContent = '📋 Форма учета заказов'
		document.getElementById('statusInfo').textContent = ''
		this.setTodayDate()
	}

	// Установка сегодняшней даты
	setTodayDate() {
		const today = new Date()
		const yyyy = today.getFullYear()
		let mm = today.getMonth() + 1
		let dd = today.getDate()

		if (dd < 10) dd = '0' + dd
		if (mm < 10) mm = '0' + mm

		const formattedToday = `${yyyy}-${mm}-${dd}`
		document.getElementById('date').value = formattedToday
	}

	// Показать ошибку
	showError(message) {
		showToast(message, 'error')
	}

	// Отправка формы
	async submitForm() {
		if (!this.validateForm()) return

		const btn = document.getElementById('submitBtn')
		const originalText = btn.textContent

		btn.disabled = true
		btn.textContent = this.isEditMode ? 'Обновляем...' : 'Сохраняем...'

		try {
			const formData = this.collectFormData()
			await this.saveRecord(formData)

			showToast('✅ Успешно сохранено', 'success')

			setTimeout(() => {
				if (this.isEditMode) {
					this.closeForm()
				} else {
					this.resetForm()
				}
			}, 1500)
		} catch (error) {
			this.showError(error.message || error)
		} finally {
			btn.disabled = false
			btn.textContent = originalText
		}
	}

	// Валидация формы
	validateForm() {
		const orderNumber = document.getElementById('orderNumber').value
		const date = document.getElementById('date').value

		if (!orderNumber || !date) {
			this.showError(
				'Пожалуйста, заполните обязательные поля: номер заказа и дата'
			)
			return false
		}

		const orderNumberPattern = /^[A-Za-z0-9\-]+$/
		if (!orderNumberPattern.test(orderNumber)) {
			this.showError(
				'Номер заказа может содержать только буквы, цифры и дефисы'
			)
			return false
		}

		return true
	}

	// Сбор данных формы
	collectFormData() {
		const recordId = document.getElementById('recordId').value
		const id = recordId || this.generateId()

		const executors = []
		for (let i = 1; i <= 6; i++) {
			const name = document.getElementById(`executor${i}`).value
			const date = document.getElementById(`date${i}`).value
			executors.push({ name, date })
		}

		return {
			id,
			date: document.getElementById('date').value,
			orderNumber: document.getElementById('orderNumber').value,
			diameter: document.getElementById('diameter').value,
			thickness: document.getElementById('thickness').value,
			typeSize: document.getElementById('typeSize').value,
			cutting: document.getElementById('cutting').value,
			bottomNumber: document.getElementById('bottomNumber').value,
			material: document.getElementById('material').value,
			executors,
			heatTreatment: document.getElementById('heatTreatment').value,
			treatmentDate: document.getElementById('treatmentDate').value,
			createdAt: recordId ? undefined : new Date().toISOString(),
		}
	}

	// Сброс формы
	resetForm() {
		document.getElementById('mainForm').reset()
		document.getElementById('recordId').value = ''
		this.updateUIForNewRecord()

		setTimeout(() => {
			document.getElementById('orderNumber').focus()
		}, 100)
	}

	// Закрыть форму
	closeForm() {
		window.history.back()
	}

	// Показать список заказов
	async showList() {
		try {
			window.location.href = 'orders.html'
		} catch (error) {
			console.error('Ошибка загрузки списка:', error)
			this.showError('Ошибка загрузки списка заказов')
		}
	}

	// Показать панель управления
	async showControlPanel() {
		try {
			window.open('control-panel.html', '_blank', 'width=800,height=600')
		} catch (error) {
			console.error('Ошибка открытия панели управления:', error)
			this.showError('Ошибка открытия панели управления')
		}
	}
}
