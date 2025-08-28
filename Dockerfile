# Builder stage
FROM node:18.17.0-alpine3.18 AS builder
WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev)
RUN npm ci --quiet

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Финальный этап на основе nginx
FROM nginx:1.24.0-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80