const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const { query, getClient } = require('../database/db');

const router = express.Router();

// Добавьте это сразу после: const router = express.Router();

// GET simple statistics (for frontend) - ПЕРВЫЙ endpoint!
router.get('/stats', async (req, res) => {
  try {
    const totalResult = await query('SELECT COUNT(*) as count FROM orders');
    const activeResult = await query('SELECT COUNT(*) as count FROM orders WHERE status = $1', ['active']);
    const totalValueResult = await query('SELECT COALESCE(SUM(total_price), 0) as sum FROM orders WHERE status = $1', ['active']);
    
    res.json({
      total: parseInt(totalResult.rows[0].count),
      active: parseInt(activeResult.rows[0].count),
      totalValue: parseFloat(totalValueResult.rows[0].sum)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET all orders with pagination and search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params = [];
    let paramIndex = 1;
    
    if (search) {
      whereClause = `WHERE order_number ILIKE $${paramIndex} OR bottom_number ILIKE $${paramIndex} OR material ILIKE $${paramIndex} OR customer ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    const validSortFields = ['order_number', 'bottom_number', 'date', 'material', 'created_at', 'total_price'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const countQuery = `SELECT COUNT(*) FROM orders ${whereClause}`;
    const countResult = await query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);
    
    const dataQuery = `
      SELECT * FROM orders 
      ${whereClause}
      ORDER BY ${sortField} ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(parseInt(limit), offset);
    const dataResult = await query(dataQuery, params);
    
    res.json({
      orders: dataResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST create new order
router.post('/', async (req, res) => {
  try {
    const {
      order_number,
      bottom_number,
      date,
      material,
      thickness,
      width,
      length,
      quantity,
      unit_price,
      total_price,
      customer,
      notes
    } = req.body;
    
    // Validate required fields
    if (!order_number || !bottom_number || !date || !material || !thickness || !width || !length || !quantity || !unit_price || !total_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await query(`
      INSERT INTO orders (order_number, bottom_number, date, material, thickness, width, length, quantity, unit_price, total_price, customer, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [order_number, bottom_number, date, material, thickness, width, length, quantity, unit_price, total_price, customer, notes]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Order number or bottom number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create order' });
    }
  }
});

// PUT update order
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      order_number,
      bottom_number,
      date,
      material,
      thickness,
      width,
      length,
      quantity,
      unit_price,
      total_price,
      customer,
      notes,
      status
    } = req.body;
    
    const result = await query(`
      UPDATE orders 
      SET order_number = $1, bottom_number = $2, date = $3, material = $4, thickness = $5, 
          width = $6, length = $7, quantity = $8, unit_price = $9, total_price = $10, 
          customer = $11, notes = $12, status = $13, updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `, [order_number, bottom_number, date, material, thickness, width, length, quantity, unit_price, total_price, customer, notes, status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Order number or bottom number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update order' });
    }
  }
});

// DELETE order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully', order: result.rows[0] });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// GET statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(DISTINCT customer) as unique_customers,
        COUNT(DISTINCT material) as unique_materials,
        SUM(total_price) as total_revenue,
        AVG(total_price) as average_order_value,
        MIN(date) as earliest_date,
        MAX(date) as latest_date
      FROM orders
      WHERE status = 'active'
    `);
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// POST export to CSV
router.post('/export/csv', async (req, res) => {
  try {
    const { filters = {} } = req.body;
    
    let whereClause = 'WHERE status = \'active\'';
    let params = [];
    let paramIndex = 1;
    
    if (filters.dateFrom) {
      whereClause += ` AND date >= $${paramIndex}`;
      params.push(filters.dateFrom);
      paramIndex++;
    }
    
    if (filters.dateTo) {
      whereClause += ` AND date <= $${paramIndex}`;
      params.push(filters.dateTo);
      paramIndex++;
    }
    
    if (filters.material) {
      whereClause += ` AND material ILIKE $${paramIndex}`;
      params.push(`%${filters.material}%`);
      paramIndex++;
    }
    
    const result = await query(`SELECT * FROM orders ${whereClause} ORDER BY date DESC`, params);
    
    const csvWriter = createCsvWriter({
      path: 'orders_export.csv',
      header: [
        { id: 'order_number', title: 'Order Number' },
        { id: 'bottom_number', title: 'Bottom Number' },
        { id: 'date', title: 'Date' },
        { id: 'material', title: 'Material' },
        { id: 'thickness', title: 'Thickness' },
        { id: 'width', title: 'Width' },
        { id: 'length', title: 'Length' },
        { id: 'quantity', title: 'Quantity' },
        { id: 'unit_price', title: 'Unit Price' },
        { id: 'total_price', title: 'Total Price' },
        { id: 'customer', title: 'Customer' },
        { id: 'notes', title: 'Notes' },
        { id: 'status', title: 'Status' },
        { id: 'created_at', title: 'Created At' }
      ]
    });
    
    await csvWriter.writeRecords(result.rows);
    
    res.download('orders_export.csv', 'orders_export.csv', (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Clean up file after download
      fs.unlink('orders_export.csv', (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// POST import from CSV
router.post('/import/csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const orders = [];
    const errors = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Validate and parse row data
          const order = {
            order_number: row['Order Number'] || row.order_number,
            bottom_number: row['Bottom Number'] || row.bottom_number,
            date: row['Date'] || row.date,
            material: row['Material'] || row.material,
            thickness: parseFloat(row['Thickness'] || row.thickness),
            width: parseFloat(row['Width'] || row.width),
            length: parseFloat(row['Length'] || row.length),
            quantity: parseInt(row['Quantity'] || row.quantity),
            unit_price: parseFloat(row['Unit Price'] || row.unit_price),
            total_price: parseFloat(row['Total Price'] || row.total_price),
            customer: row['Customer'] || row.customer,
            notes: row['Notes'] || row.notes
          };
          
          // Basic validation
          if (!order.order_number || !order.bottom_number || !order.date) {
            errors.push({ row, error: 'Missing required fields' });
            return;
          }
          
          orders.push(order);
        } catch (parseError) {
          errors.push({ row, error: parseError.message });
        }
      })
      .on('end', async () => {
        try {
          // Clean up uploaded file
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
          });
          
          if (orders.length === 0) {
            return res.status(400).json({ error: 'No valid orders found in CSV', errors });
          }
          
          // Insert orders in transaction
          const client = await getClient();
          try {
            await client.query('BEGIN');
            
            for (const order of orders) {
              await client.query(`
                INSERT INTO orders (order_number, bottom_number, date, material, thickness, width, length, quantity, unit_price, total_price, customer, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (order_number) DO UPDATE SET
                  bottom_number = EXCLUDED.bottom_number,
                  date = EXCLUDED.date,
                  material = EXCLUDED.material,
                  thickness = EXCLUDED.thickness,
                  width = EXCLUDED.width,
                  length = EXCLUDED.length,
                  quantity = EXCLUDED.quantity,
                  unit_price = EXCLUDED.unit_price,
                  total_price = EXCLUDED.total_price,
                  customer = EXCLUDED.customer,
                  notes = EXCLUDED.notes,
                  updated_at = CURRENT_TIMESTAMP
              `, [order.order_number, order.bottom_number, order.date, order.material, order.thickness, order.width, order.length, order.quantity, order.unit_price, order.total_price, order.customer, order.notes]);
            }
            
            await client.query('COMMIT');
            
            res.json({
              message: `Successfully imported ${orders.length} orders`,
              imported: orders.length,
              errors: errors.length > 0 ? errors : undefined
            });
          } catch (transactionError) {
            await client.query('ROLLBACK');
            throw transactionError;
          } finally {
            client.release();
          }
        } catch (importError) {
          console.error('Error importing orders:', importError);
          res.status(500).json({ error: 'Failed to import orders', details: importError.message });
        }
      });
  } catch (error) {
    console.error('Error processing CSV upload:', error);
    res.status(500).json({ error: 'Failed to process CSV upload' });
  }
});

// POST create backup
router.post('/backup/create', async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      orders: result.rows,
      total_orders: result.rows.length
    };
    
    const backupDir = 'backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    
    res.json({
      message: 'Backup created successfully',
      filename,
      total_orders: result.rows.length,
      filepath
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// POST restore from backup
router.post('/backup/restore', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No backup file uploaded' });
    }
    
    const backupData = JSON.parse(fs.readFileSync(req.file.path, 'utf8'));
    
    if (!backupData.orders || !Array.isArray(backupData.orders)) {
      return res.status(400).json({ error: 'Invalid backup file format' });
    }
    
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      // Clear existing data
      await client.query('TRUNCATE TABLE orders RESTART IDENTITY CASCADE');
      
      // Restore orders
      for (const order of backupData.orders) {
        await client.query(`
          INSERT INTO orders (order_number, bottom_number, date, material, thickness, width, length, quantity, unit_price, total_price, customer, notes, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [order.order_number, order.bottom_number, order.date, order.material, order.thickness, order.width, order.length, order.quantity, order.unit_price, order.total_price, order.customer, order.notes, order.status || 'active', order.created_at, order.updated_at]);
      }
      
      await client.query('COMMIT');
      
      // Clean up uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
      
      res.json({
        message: 'Backup restored successfully',
        restored_orders: backupData.orders.length,
        backup_timestamp: backupData.timestamp
      });
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup', details: error.message });
  }
});

// DELETE clear all data
router.delete('/clear/all', async (req, res) => {
  try {
    const result = await query('TRUNCATE TABLE orders RESTART IDENTITY CASCADE');
    
    res.json({
      message: 'All orders cleared successfully',
      affected_rows: result.rowCount
    });
  } catch (error) {
    console.error('Error clearing orders:', error);
    res.status(500).json({ error: 'Failed to clear orders' });
  }
});

// GET search orders
router.get('/search/query', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const result = await query(`
      SELECT * FROM orders 
      WHERE order_number ILIKE $1 OR bottom_number ILIKE $1 OR material ILIKE $1 OR customer ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [`%${q.trim()}%`, parseInt(limit)]);
    
    res.json({
      query: q,
      results: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error searching orders:', error);
    res.status(500).json({ error: 'Failed to search orders' });
  }
});

// GET simple statistics (for frontend) - ДОБАВЬТЕ ЭТО ПЕРВЫМ
router.get('/stats', async (req, res) => {
  try {
    const totalResult = await query('SELECT COUNT(*) as count FROM orders');
    const activeResult = await query('SELECT COUNT(*) as count FROM orders WHERE status = $1', ['active']);
    const totalValueResult = await query('SELECT COALESCE(SUM(total_price), 0) as sum FROM orders WHERE status = $1', ['active']);
    
    res.json({
      total: parseInt(totalResult.rows[0].count),
      active: parseInt(activeResult.rows[0].count),
      totalValue: parseFloat(totalValueResult.rows[0].sum)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET simple statistics (for frontend compatibility)
router.get('/stats', async (req, res) => {
  try {
    const totalResult = await query('SELECT COUNT(*) as count FROM orders');
    const activeResult = await query('SELECT COUNT(*) as count FROM orders WHERE status = $1', ['active']);
    const totalValueResult = await query('SELECT COALESCE(SUM(total_price), 0) as sum FROM orders WHERE status = $1', ['active']);
    
    res.json({
      total: parseInt(totalResult.rows[0].count),
      active: parseInt(activeResult.rows[0].count),
      totalValue: parseFloat(totalValueResult.rows[0].sum)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;

