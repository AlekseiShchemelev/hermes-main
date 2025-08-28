// main.js - главный файл приложения
document.addEventListener('DOMContentLoaded', async () => {
	const app = new OrdersManagerExtended()
	await app.init()

	// Глобальные функции для использования в HTML
	window.showToast = showToast
})

// Глобальная функция для показа уведомлений
function showToast(message, type = 'info') {
	const toast = document.getElementById('toast')
	if (!toast) return

	toast.textContent = message
	toast.className = 'toast show'

	if (type === 'error') {
		toast.style.backgroundColor = '#dc3545'
	} else if (type === 'success') {
		toast.style.backgroundColor = '#28a745'
	} else {
		toast.style.backgroundColor = '#17a2b8'
	}

	setTimeout(() => {
		toast.className = 'toast'
	}, 3000)
}
