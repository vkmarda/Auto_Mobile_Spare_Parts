const { query } = require('../config/db');

const placeOrder = async (req, res, next) => {
  try {
    const { items, notes } = req.body;
    const retailer_id = req.user.id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array must not be empty' });
    }

    // Fetch unit prices for all products
    const productIds = items.map((i) => i.product_id);
    const placeholders = productIds.map((_, idx) => `$${idx + 1}`).join(', ');
    const productResult = await query(
      `SELECT id, unit_price FROM products WHERE id IN (${placeholders})`,
      productIds
    );
    const productMap = {};
    for (const row of productResult.rows) productMap[row.id] = row.unit_price;

    // Validate all product_ids exist
    for (const item of items) {
      if (!productMap[item.product_id]) {
        return res.status(400).json({ error: `Invalid product_id: ${item.product_id}` });
      }
    }

    // Calculate total
    const total_amount = items.reduce((sum, item) => {
      return sum + item.quantity * parseFloat(productMap[item.product_id]);
    }, 0);

    // Insert order
    const orderResult = await query(
      `INSERT INTO orders (retailer_id, status, total_amount, notes)
       VALUES ($1, 'pending', $2, $3)
       RETURNING *`,
      [retailer_id, total_amount.toFixed(2), notes || null]
    );
    const order = orderResult.rows[0];

    // Insert order items
    const insertedItems = [];
    for (const item of items) {
      const unit_price = productMap[item.product_id];
      const itemResult = await query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [order.id, item.product_id, item.quantity, unit_price]
      );
      insertedItems.push(itemResult.rows[0]);
    }

    res.status(201).json({ ...order, items: insertedItems });
  } catch (err) {
    next(err);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;

    let result;
    if (role === 'retailer') {
      result = await query(
        `SELECT o.id, u.name AS retailer_name, o.status, o.total_amount, o.created_at
         FROM orders o
         JOIN users u ON u.id = o.retailer_id
         WHERE o.retailer_id = $1
         ORDER BY o.created_at DESC`,
        [userId]
      );
    } else {
      result = await query(
        `SELECT o.id, u.name AS retailer_name, o.status, o.total_amount, o.created_at
         FROM orders o
         JOIN users u ON u.id = o.retailer_id
         ORDER BY o.created_at DESC`,
        []
      );
    }

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const orderResult = await query(
      `SELECT o.*, u.name AS retailer_name
       FROM orders o
       JOIN users u ON u.id = o.retailer_id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (role === 'retailer' && order.retailer_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const itemsResult = await query(
      `SELECT oi.id, oi.quantity, oi.unit_price, oi.created_at,
              p.name AS product_name, p.sku
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({ ...order, items: itemsResult.rows });
  } catch (err) {
    next(err);
  }
};
const acceptOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (existing.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be accepted' });
    }

    const result = await query(
      `UPDATE orders SET status = 'accepted', updated_at = now()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const rejectOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (existing.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be rejected' });
    }

    const result = await query(
      `UPDATE orders SET status = 'rejected', updated_at = now()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { placeOrder, getOrders, getOrderById, acceptOrder, rejectOrder };
