// orders-list.js - управление списком заказов
let ordersManager
let currentSortField = 'createdAt'
let currentSortDirection = 'desc'
let allOrders = []
let isMobile = window.innerWidth <= 768

document.addEventListener('DOMContentLoaded', async () => {
	console.log('DOM загружен, инициализация списка заказов...')

	try {
		ordersManager = new OrdersManager()
		await ordersManager.initDatabase()
		console.log('База данных инициализирована')

		checkMobileView()
		setupEventListeners()
		await loadOrders()
	} catch (error) {
		console.error('Ошибка инициализации:', error)
		showToast('Ошибка загрузки списка заказов', 'error')
	}
})

function setupEventListeners() {
	window.addEventListener('resize', checkMobileView)
	setupSearch()
	setupSorting()
	setupMobileSort()
}

function checkMobileView() {
	const oldIsMobile = isMobile
	isMobile = window.innerWidth <= 768

	const tableView = document.querySelector('.table-container')
	const cardView = document.getElementById('mobileCardView')
	const mobileControls = document.querySelector('.mobile-controls')

	if (isMobile) {
		if (tableView) tableView.style.display = 'none'
		if (cardView) cardView.style.display = 'block'
		if (mobileControls) mobileControls.style.display = 'block'
	} else {
		if (tableView) tableView.style.display = 'block'
		if (cardView) cardView.style.display = 'none'
		if (mobileControls) mobileControls.style.display = 'none'
	}

	if (oldIsMobile !== isMobile && allOrders.length > 0) {
		const searchTerm = document.getElementById('searchInput').value
		loadOrders(searchTerm)
	}
}

async function loadOrders(searchTerm = '') {
	try {
		allOrders = await ordersManager.getAllRecords(
			currentSortField,
			currentSortDirection
		)

		const filteredOrders = searchTerm
			? allOrders.filter(
					order =>
						(order.orderNumber &&
							order.orderNumber
								.toLowerCase()
								.includes(searchTerm.toLowerCase())) ||
						(order.bottomNumber &&
							order.bottomNumber
								.toLowerCase()
								.includes(searchTerm.toLowerCase())) ||
						(order.material &&
							order.material.toLowerCase().includes(searchTerm.toLowerCase()))
			  )
			: allOrders

		displayOrders(filteredOrders)
		updateResultsCount(filteredOrders.length)
	} catch (error) {
		console.error('Ошибка загрузки заказов:', error)
		showToast('Ошибка загрузки списка заказов', 'error')
	}
}

function displayOrders(orders) {
	if (isMobile) {
		displayMobileCards(orders)
	} else {
		displayTable(orders)
	}
}

function displayTable(orders) {
	const tableBody = document.getElementById('ordersTableBody')
	const noResults = document.getElementById('noResults')
	const tableView = document.querySelector('.table-container')

	if (!tableBody || !tableView) return

	if (orders.length === 0) {
		tableBody.innerHTML = ''
		if (tableView) tableView.style.display = 'none'
		if (noResults) noResults.style.display = 'flex'
		return
	}

	if (noResults) noResults.style.display = 'none'
	if (tableView) tableView.style.display = 'table'

	tableBody.innerHTML = orders
		.map(
			order => `
            <tr class="order-row" onclick="openOrder('${order.id}')">
                <td>${formatDate(order.date) || '-'}</td>
                <td class="order-number-cell">${
									order.orderNumber || 'Без номера'
								}</td>
                <td class="hide-mobile">${
									order.diameter ? order.diameter + ' мм' : '-'
								}</td>
                <td class="hide-mobile">${
									order.thickness ? order.thickness + ' мм' : '-'
								}</td>
                <td class="hide-mobile">${order.material || '-'}</td>
                <td>${order.bottomNumber || '-'}</td>
                <td class="actions-cell">
                    <button class="action-btn" onclick="event.stopPropagation(); editOrder('${
											order.id
										}')" title="Редактировать">
                        ✏️
                    </button>
                    <button class="action-btn danger" onclick="event.stopPropagation(); deleteOrder('${
											order.id
										}')" title="Удалить">
                        🗑️
                    </button>
                </td>
            </tr>
        `
		)
		.join('')
}

function displayMobileCards(orders) {
	const cardView = document.getElementById('mobileCardView')
	const noResults = document.getElementById('noResults')

	if (!cardView) return

	if (orders.length === 0) {
		cardView.innerHTML = ''
		if (noResults) noResults.style.display = 'flex'
		return
	}

	if (noResults) noResults.style.display = 'none'
	cardView.style.display = 'block'

	cardView.innerHTML = orders
		.map(
			order => `
            <div class="mobile-order-card" onclick="openOrder('${order.id}')">
                <div class="mobile-card-header">
                    <div class="mobile-order-number">📦 ${
											order.orderNumber || 'Без номера'
										}</div>
                    <div class="mobile-order-date">📅 ${
											formatDate(order.date) || '-'
										}</div>
                </div>
                
                <div class="mobile-card-details">
                    <div class="mobile-detail">
                        <span class="mobile-label">Днище:</span>
                        <span class="mobile-value">${
													order.bottomNumber || '-'
												}</span>
                    </div>
                    <div class="mobile-detail">
                        <span class="mobile-label">Материал:</span>
                        <span class="mobile-value">${
													order.material || '-'
												}</span>
                    </div>
                    ${
											order.diameter
												? `
                    <div class="mobile-detail">
                        <span class="mobile-label">Диаметр:</span>
                        <span class="mobile-value">${order.diameter} мм</span>
                    </div>
                    `
												: ''
										}
                    ${
											order.thickness
												? `
                    <div class="mobile-detail">
                        <span class="mobile-label">Толщина:</span>
                        <span class="mobile-value">${order.thickness} мм</span>
                    </div>
                    `
												: ''
										}
                    ${
											order.heatTreatment
												? `
                    <div class="mobile-detail">
                        <span class="mobile-label">Режим ТО:</span>
                        <span class="mobile-value">${order.heatTreatment}</span>
                    </div>
                    `
												: ''
										}
                    ${
											order.treatmentDate
												? `
                    <div class="mobile-detail">
                        <span class="mobile-label">Дата ТО:</span>
                        <span class="mobile-value">${formatDate(
													order.treatmentDate
												)}</span>
                    </div>
                    `
												: ''
										}
                </div>
                
                <div class="mobile-card-actions">
                    <button class="mobile-action-btn" onclick="event.stopPropagation(); editOrder('${
											order.id
										}')">
                        ✏️ Редактировать
                    </button>
                    <button class="mobile-action-btn danger" onclick="event.stopPropagation(); deleteOrder('${
											order.id
										}')">
                        🗑️ Удалить
                    </button>
                </div>
            </div>
        `
		)
		.join('')
}

function formatDate(dateString) {
	if (!dateString) return ''
	try {
		const date = new Date(dateString)
		if (isNaN(date.getTime())) return dateString
		return date.toLocaleDateString('ru-RU')
	} catch (e) {
		return dateString
	}
}

function setupSearch() {
	const searchInput = document.getElementById('searchInput')
	if (!searchInput) return

	let searchTimeout
	searchInput.addEventListener('input', e => {
		clearTimeout(searchTimeout)
		searchTimeout = setTimeout(() => {
			loadOrders(e.target.value.trim())
		}, 300)
	})
}

function setupSorting() {
	const sortableHeaders = document.querySelectorAll('.sortable')
	sortableHeaders.forEach(header => {
		header.addEventListener('click', e => {
			e.stopPropagation()
			const field = header.getAttribute('data-sort')
			sortByField(field)
		})
	})
}

function setupMobileSort() {
	const sortSelect = document.getElementById('sortSelect')
	if (!sortSelect) return

	sortSelect.value = `${currentSortField}-${currentSortDirection}`

	sortSelect.addEventListener('change', function () {
		const [field, direction] = this.value.split('-')
		currentSortField = field
		currentSortDirection = direction
		loadOrders(document.getElementById('searchInput').value)
	})
}

function sortByField(field) {
	if (currentSortField === field) {
		currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc'
	} else {
		currentSortField = field
		currentSortDirection = 'asc'
	}

	updateSortIndicators()
	loadOrders(document.getElementById('searchInput').value)

	const sortSelect = document.getElementById('sortSelect')
	if (sortSelect) {
		sortSelect.value = `${currentSortField}-${currentSortDirection}`
	}
}

function updateSortIndicators() {
	const headers = document.querySelectorAll('.sortable')
	headers.forEach(header => {
		const icon = header.querySelector('.sort-icon')
		const field = header.getAttribute('data-sort')

		if (field === currentSortField) {
			icon.textContent = currentSortDirection === 'asc' ? '↑' : '↓'
			header.classList.add('sorting-active')
		} else {
			icon.textContent = '↕'
			header.classList.remove('sorting-active')
		}
	})
}

function updateResultsCount(count) {
	const counter = document.getElementById('resultsCount')
	if (counter) {
		counter.textContent = `Найдено: ${count}`
	}
}

function openOrder(id) {
	window.location.href = `index.html?id=${id}`
}

function editOrder(id) {
	openOrder(id)
}

async function deleteOrder(id) {
	if (
		!confirm(
			'Вы уверены, что хотите удалить этот заказ?\nЭто действие нельзя отменить.'
		)
	) {
		return
	}

	try {
		await ordersManager.deleteRecordById(id)
		showToast('✅ Заказ удален', 'success')
		await loadOrders(document.getElementById('searchInput').value)
	} catch (error) {
		console.error('Ошибка удаления:', error)
		showToast('❌ Ошибка при удалении', 'error')
	}
}

function goBack() {
	window.location.href = 'index.html'
}

function showToast(message, type = 'info') {
	document.querySelectorAll('.toast').forEach(toast => {
		if (toast.parentNode) {
			toast.parentNode.removeChild(toast)
		}
	})

	const toast = document.createElement('div')
	toast.className = 'toast'
	toast.textContent = message
	toast.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${
					type === 'error'
						? '#dc3545'
						: type === 'success'
						? '#28a745'
						: '#17a2b8'
				};
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        max-width: 90%;
        text-align: center;
        font-size: 16px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        pointer-events: none;
    `

	document.body.appendChild(toast)

	requestAnimationFrame(() => {
		toast.style.opacity = '1'
	})

	setTimeout(() => {
		toast.style.opacity = '0'
		setTimeout(() => {
			if (toast.parentNode) {
				document.body.removeChild(toast)
			}
		}, 300)
	}, 3000)
}

setTimeout(() => {
	checkMobileView()
}, 100)
