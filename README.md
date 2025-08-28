# Hermes - Система управления заказами

Современная система управления заказами, построенная на стеке React + Vite + Node.js + PostgreSQL.

## 🚀 Технологии

### Frontend
- **React 18** - современная библиотека для создания пользовательских интерфейсов
- **Vite** - быстрый инструмент сборки для современной веб-разработки
- **React Router** - маршрутизация для одностраничных приложений
- **Axios** - HTTP клиент для API запросов
- **Lucide React** - красивые иконки
- **Date-fns** - утилиты для работы с датами

### Backend
- **Node.js** - серверная среда выполнения JavaScript
- **Express.js** - веб-фреймворк для Node.js
- **PostgreSQL** - мощная реляционная база данных
- **Multer** - middleware для обработки файлов
- **CSV Parser/Writer** - работа с CSV файлами

### Инфраструктура
- **Docker Compose** - оркестрация контейнеров
- **Helmet** - безопасность HTTP заголовков
- **CORS** - настройка кросс-доменных запросов
- **Morgan** - логирование HTTP запросов

## 📁 Структура проекта

```
hermes-main/
├── src/                    # Frontend React приложение
│   ├── components/         # React компоненты
│   ├── services/          # API сервисы
│   ├── utils/             # Утилиты
│   ├── App.jsx            # Главный компонент
│   └── main.jsx           # Точка входа
├── backend/               # Backend Node.js приложение
│   ├── database/          # Конфигурация базы данных
│   ├── routes/            # API маршруты
│   ├── server.js          # Основной сервер
│   └── package.json       # Зависимости backend
├── docker-compose.yml     # Docker конфигурация
├── start.bat              # Скрипт запуска для Windows
├── start.sh               # Скрипт запуска для Linux/Mac
└── README.md              # Документация
```

## 🛠️ Установка и запуск

### Предварительные требования

1. **Node.js** (версия 18 или выше)
2. **npm** или **yarn**
3. **Docker** и **Docker Compose**
4. **PostgreSQL** (если не используете Docker)

### Быстрый запуск

#### Windows
```bash
# Двойной клик по файлу start.bat
# Или в командной строке:
start.bat
```

#### Linux/Mac
```bash
# Сделать скрипт исполняемым
chmod +x start.sh

# Запустить
./start.sh
```

### Ручная установка

1. **Клонировать репозиторий**
   ```bash
   git clone <repository-url>
   cd hermes-main
   ```

2. **Установить frontend зависимости**
   ```bash
   npm install
   ```

3. **Установить backend зависимости**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Настроить базу данных**
   ```bash
   # Создать .env файл в папке backend
   cp backend/env.example backend/.env
   
   # Отредактировать .env файл под ваши настройки
   ```

5. **Запустить PostgreSQL**
   ```bash
   docker-compose up -d postgres
   ```

6. **Запустить backend**
   ```bash
   cd backend
   npm run dev
   ```

7. **Запустить frontend** (в новом терминале)
   ```bash
   npm run dev
   ```

## 🗄️ База данных

### Схема таблицы orders

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  bottom_number VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  material VARCHAR(100) NOT NULL,
  thickness DECIMAL(5,2) NOT NULL,
  width DECIMAL(8,2) NOT NULL,
  length DECIMAL(8,2) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  customer VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Индексы
- `order_number` - уникальный индекс
- `bottom_number` - уникальный индекс
- `date` - для быстрого поиска по дате
- `material` - для фильтрации по материалу
- `created_at` - для сортировки

### Триггеры
- Автоматическое обновление `updated_at` при изменении записи

## 🔌 API Endpoints

### Основные операции с заказами
- `GET /api/orders` - получить список заказов с пагинацией
- `GET /api/orders/:id` - получить заказ по ID
- `POST /api/orders` - создать новый заказ
- `PUT /api/orders/:id` - обновить заказ
- `DELETE /api/orders/:id` - удалить заказ

### Дополнительные функции
- `GET /api/orders/stats/summary` - статистика
- `POST /api/orders/export/csv` - экспорт в CSV
- `POST /api/orders/import/csv` - импорт из CSV
- `POST /api/orders/backup/create` - создать резервную копию
- `POST /api/orders/backup/restore` - восстановить из резервной копии
- `DELETE /api/orders/clear/all` - очистить все данные
- `GET /api/orders/search/query` - поиск заказов

## 🎨 UI/UX особенности

### Адаптивный дизайн
- Мобильная и десктопная версии
- Адаптивные таблицы и карточки
- Оптимизация для различных размеров экрана

### Компоненты
- **OrderForm** - форма создания/редактирования заказов
- **OrdersList** - список заказов с поиском и сортировкой
- **ControlPanel** - панель управления с статистикой

### Функциональность
- Поиск по всем полям
- Сортировка по любому столбцу
- Пагинация для больших списков
- Валидация форм
- Уведомления о действиях
- Экспорт/импорт данных
- Резервное копирование

## 🔧 Конфигурация

### Переменные окружения

Создайте файл `.env` в папке `backend/` на основе `env.example`:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hermes_db
DB_USER=postgres
DB_PASSWORD=postgres
CORS_ORIGIN=http://localhost:3000
```

### Docker конфигурация

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hermes_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
```

## 🚀 Развертывание

### Production

1. **Сборка frontend**
   ```bash
   npm run build
   ```

2. **Настройка переменных окружения**
   ```env
   NODE_ENV=production
   CORS_ORIGIN=https://yourdomain.com
   ```

3. **Запуск backend**
   ```bash
   cd backend
   npm start
   ```

### Docker

```bash
# Сборка и запуск всех сервисов
docker-compose up -d

# Только база данных
docker-compose up -d postgres

# Просмотр логов
docker-compose logs -f
```

## 🐛 Отладка

### Логи
- Backend логи выводятся в консоль
- Используйте `morgan` для HTTP логирования
- База данных логирует все запросы

### Распространенные проблемы

1. **Ошибка подключения к базе данных**
   - Проверьте, что PostgreSQL запущен
   - Проверьте настройки в `.env` файле
   - Убедитесь, что Docker контейнер работает

2. **CORS ошибки**
   - Проверьте `CORS_ORIGIN` в `.env`
   - Убедитесь, что frontend и backend порты правильные

3. **Проблемы с портами**
   - Frontend: 3000
   - Backend: 5000
   - PostgreSQL: 5432

## 📝 Лицензия

MIT License - см. файл LICENSE для деталей.

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📞 Поддержка

Если у вас есть вопросы или проблемы:
- Создайте Issue в репозитории
- Опишите проблему подробно
- Приложите логи и скриншоты

---

**Hermes** - Система управления заказами для современного бизнеса 🚀

