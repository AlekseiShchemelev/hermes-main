// DeleteManager.js - управление удалением записей
class DeleteManager extends OrdersManager {
	constructor() {
		super()
	}

	// Удаление записи
	async deleteRecord() {
		const recordId = document.getElementById('recordId').value

		if (!recordId) {
			alert('Нет записи для удаления')
			return
		}

		if (
			!confirm(
				'Вы уверены, что хотите удалить эту запись?\nЭто действие нельзя отменить.'
			)
		) {
			return
		}

		try {
			await this.deleteRecordById(recordId)
			showToast('✅ Запись удалена', 'success')

			setTimeout(() => {
				this.closeForm()
			}, 1500)
		} catch (error) {
			console.error('Ошибка удаления:', error)
			showToast('❌ Ошибка при удалении', 'error')
		}
	}

	// Удаление записи по ID
	async deleteRecordById(id) {
		return super.deleteRecordById(id)
	}

	// Массовое удаление записей
	async deleteMultipleRecords(ids) {
		if (!ids || ids.length === 0) return { deleted: 0, errors: 0 }

		let deleted = 0
		let errors = 0

		for (const id of ids) {
			try {
				await this.deleteRecordById(id)
				deleted++
			} catch (error) {
				console.error(`Ошибка удаления записи ${id}:`, error)
				errors++
			}
		}

		return { deleted, errors }
	}

	// Закрыть форму
	closeForm() {
		window.history.back()
	}
}
