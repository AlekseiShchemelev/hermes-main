@echo off
echo ========================================
echo    Hermes - Система управления заказами
echo ========================================
echo.
echo Устанавливаю зависимости для frontend...
cd hermes-main
call npm install
if %errorlevel% neq 0 (
    echo Ошибка при установке frontend зависимостей!
    pause
    exit /b 1
)

echo.
echo Устанавливаю зависимости для backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Ошибка при установке backend зависимостей!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Установка завершена успешно!
echo ========================================
echo.
echo Для запуска приложения:
echo 1. Запустите PostgreSQL (docker-compose up -d postgres)
echo 2. В папке backend: npm run dev
echo 3. В папке hermes-main: npm run dev
echo.
echo Frontend будет доступен по адресу: http://localhost:3000
echo Backend API будет доступен по адресу: http://localhost:5000
echo.
pause


