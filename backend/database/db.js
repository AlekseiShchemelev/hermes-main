const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hermes_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('🔌 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// SQL for creating the orders table
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS orders (
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

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
  CREATE INDEX IF NOT EXISTS idx_orders_bottom_number ON orders(bottom_number);
  CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
  CREATE INDEX IF NOT EXISTS idx_orders_material ON orders(material);
  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

  -- Create function to update updated_at column
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Create trigger to automatically update updated_at
  DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
  CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

// Initialize database
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    try {
      // Create table and indexes
      await client.query(createTableSQL);
      console.log('✅ Database schema created successfully');
      
      // Check if table has data
      const result = await client.query('SELECT COUNT(*) FROM orders');
      const count = parseInt(result.rows[0].count);
      
      if (count === 0) {
        console.log('📝 Table is empty - ready for data');
      } else {
        console.log(`📊 Found ${count} existing orders`);
      }
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Execute a query
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📝 Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
}

// Get a client for transactions
async function getClient() {
  return await pool.connect();
}

module.exports = {
  pool,
  query,
  getClient,
  initializeDatabase
};

