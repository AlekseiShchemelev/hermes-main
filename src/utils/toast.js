// Утилита для показа уведомлений
let toastContainer = null

const createToastContainer = () => {
  if (toastContainer) return toastContainer

  toastContainer = document.createElement('div')
  toastContainer.className = 'toast-container'
  document.body.appendChild(toastContainer)
  return toastContainer
}

const removeToast = (toastElement) => {
  if (toastElement.parentNode) {
    toastElement.parentNode.removeChild(toastElement)
  }
}

export const toast = (message, type = 'info', duration = 3000) => {
  const container = createToastContainer()
  
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  
  const icon = document.createElement('span')
  icon.className = 'toast-icon'
  
  // Иконки для разных типов уведомлений
  switch (type) {
    case 'success':
      icon.textContent = '✅'
      break
    case 'error':
      icon.textContent = '❌'
      break
    case 'warning':
      icon.textContent = '⚠️'
      break
    default:
      icon.textContent = 'ℹ️'
  }
  
  const text = document.createElement('span')
  text.className = 'toast-text'
  text.textContent = message
  
  toast.appendChild(icon)
  toast.appendChild(text)
  
  container.appendChild(toast)
  
  // Анимация появления
  setTimeout(() => {
    toast.classList.add('show')
  }, 10)
  
  // Автоматическое удаление
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => {
      removeToast(toast)
    }, 300)
  }, duration)
  
  // Возможность закрыть кликом
  toast.addEventListener('click', () => {
    toast.classList.remove('show')
    setTimeout(() => {
      removeToast(toast)
    }, 300)
  })
}

