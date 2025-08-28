-- Инициализация базы данных Hermes
-- Этот скрипт выполняется автоматически при первом запуске PostgreSQL контейнера

-- Создаем расширение для работы с JSON
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  diameter DECIMAL(10,2),
  thickness DECIMAL(10,2),
  type_size VARCHAR(50),
  cutting VARCHAR(10),
  bottom_number VARCHAR(100),
  material VARCHAR(50),
  heat_treatment TEXT,
  treatment_date DATE,
  executors JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_bottom_number ON orders(bottom_number);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
CREATE INDEX IF NOT EXISTS idx_orders_material ON orders(material);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Вставляем тестовые данные (опционально)
INSERT INTO orders (
  date, 
  order_number, 
  diameter, 
  thickness, 
  type_size, 
  cutting, 
  bottom_number, 
  material, 
  heat_treatment, 
  treatment_date, 
  executors
) VALUES 
  ('2024-01-15', 'ORD-001', 100.5, 5.0, 'Стандарт', 'Да', 'BOT-001', 'Сталь 3', 'Нормализация', '2024-01-20', '["Иванов И.И.", "Петров П.П."]'),
  ('2024-01-16', 'ORD-002', 150.0, 8.0, 'Большой', 'Нет', 'BOT-002', 'Сталь 20', 'Закалка', '2024-01-25', '["Сидоров С.С."]'),
  ('2024-01-17', 'ORD-003', 80.0, 3.5, 'Малый', 'Да', 'BOT-003', 'Сталь 3', 'Отжиг', '2024-01-22', '["Козлов К.К.", "Новиков Н.Н."]')
ON CONFLICT (order_number) DO NOTHING;

-- Создаем представление для статистики
CREATE OR REPLACE VIEW orders_stats AS
SELECT 
  COUNT(*) as total_orders,
  COUNT(DISTINCT material) as unique_materials,
  COUNT(DISTINCT order_number) as unique_order_numbers,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM orders;

-- Комментарии к таблице
COMMENT ON TABLE orders IS 'Таблица заказов системы Hermes';
COMMENT ON COLUMN orders.id IS 'Уникальный идентификатор заказа';
COMMENT ON COLUMN orders.date IS 'Дата заказа';
COMMENT ON COLUMN orders.order_number IS 'Номер заказа (уникальный)';
COMMENT ON COLUMN orders.diameter IS 'Диаметр в миллиметрах';
COMMENT ON COLUMN orders.thickness IS 'Толщина в миллиметрах';
COMMENT ON COLUMN orders.type_size IS 'Типоразмер изделия';
COMMENT ON COLUMN orders.cutting IS 'Требуется ли раскрой (Да/Нет)';
COMMENT ON COLUMN orders.bottom_number IS 'Номер днища';
COMMENT ON COLUMN orders.material IS 'Материал изделия';
COMMENT ON COLUMN orders.heat_treatment IS 'Режим термической обработки';
COMMENT ON COLUMN orders.treatment_date IS 'Дата термической обработки';
COMMENT ON COLUMN orders.executors IS 'Список исполнителей в формате JSON';
COMMENT ON COLUMN orders.created_at IS 'Дата создания записи';
COMMENT ON COLUMN orders.updated_at IS 'Дата последнего обновления';

-- Создаем пользователя для приложения (опционально)
-- CREATE USER hermes_app WITH PASSWORD 'app_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hermes_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hermes_app;


