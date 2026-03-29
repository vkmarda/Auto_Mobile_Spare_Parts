const { query } = require('../config/db');
const { notify } = require('../services/notifications');

const placeOrder = async (req, res, next) => {
  try {
    const { items, notes } = req.body;
    const retailer_id = req.user.id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array must not be empty' });
    }

    const productIds = items.map((i) => i.product_id);
    const placeholders = productIds.map((_, idx) => `$${idx + 1}`).join(', ');
    const productResult = await query(
      `SELECT id, vendor_id FROM products WHERE id IN (${placeholders})`,
      productIds
    );
    const productMap = {};
    for (const row of productResult.rows) productMap[row.id] = row;

    for (const item of items) {
      if (!productMap[item.product_id]) {
        return res.status(400).json({ error: `Invalid product_id: ${item.product_id}` });
      }
    }

    // All products must belong to the same vendor
    const vendorIds = [...new Set(Object.values(productMap).map((p) => p.vendor_id).filter(Boolean))];
    if (vendorIds.length > 1) {
      return res.status(400).json({ error: 'All products in an order must be from the same vendor' });
    }
    const vendor_id = vendorIds[0] || null;

    const orderResult = await query(
      `INSERT INTO orders (retailer_id, vendor_id, status, notes)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [retailer_id, vendor_id, notes || null]
    );
    const order = orderResult.rows[0];

    const insertedItems = [];
    for (const item of items) {
      const itemResult = await query(
        `INSERT INTO order_items (order_id, product_id, quantity)
         VALUES ($1, $2, $3) RETURNING *`,
        [order.id, item.product_id, item.quantity]
      );
      insertedItems.push(itemResult.rows[0]);
    }

    // Notify vendor about new order
    if (vendor_id) {
      const vendorRes = await query('SELECT mobile, name FROM users WHERE id = $1', [vendor_id]);
      const vendor = vendorRes.rows[0];
      if (vendor?.mobile) {
        notify({ mobile: vendor.mobile, event: 'order_placed', data: { order_number: order.order_number, retailer_name: req.user.name } })
          .catch((e) => console.error('Notify error:', e));
      }
    }

    res.status(201).json({ ...order, items: insertedItems });
  } catch (err) {
    next(err);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const BASE_SELECT = `
      SELECT o.id, o.order_number, o.status, o.notes, o.created_at, o.updated_at,
             u.name AS retailer_name, u.email AS retailer_email, u.mobile AS retailer_mobile,
             u.city AS retailer_city, u.state AS retailer_state,
             v.name AS vendor_name,
             COUNT(oi.id) AS item_count,
             ARRAY_AGG(p.name ORDER BY oi.id) FILTER (WHERE p.name IS NOT NULL) AS product_names
      FROM orders o
      JOIN users u ON u.id = o.retailer_id
      LEFT JOIN users v ON v.id = o.vendor_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id`;
    const GROUP_BY = `GROUP BY o.id, u.name, u.email, u.mobile, u.city, u.state, v.name ORDER BY o.created_at DESC`;

    let result;
    if (role === 'retailer') {
      result = await query(`${BASE_SELECT} WHERE o.retailer_id = $1 ${GROUP_BY}`, [userId]);
    } else if (role === 'vendor') {
      result = await query(`${BASE_SELECT} WHERE o.vendor_id = $1 ${GROUP_BY}`, [userId]);
    } else {
      result = await query(`${BASE_SELECT} ${GROUP_BY}`, []);
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
      `SELECT o.*, u.name AS retailer_name, u.email AS retailer_email,
              u.mobile AS retailer_mobile, u.city AS retailer_city, u.state AS retailer_state,
              v.name AS vendor_name
       FROM orders o
       JOIN users u ON u.id = o.retailer_id
       LEFT JOIN users v ON v.id = o.vendor_id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderResult.rows[0];

    if (role === 'retailer' && order.retailer_id !== userId) return res.status(403).json({ error: 'Access denied' });
    if (role === 'vendor' && order.vendor_id !== userId) return res.status(403).json({ error: 'Access denied' });

    const itemsResult = await query(
      `SELECT oi.id, oi.product_id, oi.quantity, oi.created_at,
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

async function checkOrderAccess(id, vendor_id) {
  const existing = await query('SELECT * FROM orders WHERE id = $1', [id]);
  if (existing.rows.length === 0) return { error: 'Order not found', status: 404 };
  if (existing.rows[0].vendor_id !== vendor_id) return { error: 'Access denied', status: 403 };
  return { order: existing.rows[0] };
}

async function getOrderWithRetailer(id) {
  const result = await query(
    `SELECT o.*, u.name AS retailer_name, u.email AS retailer_email,
            u.mobile AS retailer_mobile, u.city AS retailer_city, u.state AS retailer_state,
            v.name AS vendor_name
     FROM orders o JOIN users u ON u.id = o.retailer_id
     LEFT JOIN users v ON v.id = o.vendor_id WHERE o.id = $1`,
    [id]
  );
  return result.rows[0];
}

const acceptOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order, error, status } = await checkOrderAccess(id, req.user.id);
    if (error) return res.status(status).json({ error });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be accepted' });

    await query(`UPDATE orders SET status = 'accepted', updated_at = now() WHERE id = $1`, [id]);
    const updated = await getOrderWithRetailer(id);

    notify({ mobile: order.retailer_mobile, event: 'order_accepted', data: { order_number: order.order_number, vendor_name: req.user.name } })
      .catch((e) => console.error('Notify error:', e));

    res.json(updated);
  } catch (err) { next(err); }
};

const rejectOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order, error, status } = await checkOrderAccess(id, req.user.id);
    if (error) return res.status(status).json({ error });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be rejected' });

    await query(`UPDATE orders SET status = 'rejected', updated_at = now() WHERE id = $1`, [id]);
    const updated = await getOrderWithRetailer(id);

    notify({ mobile: order.retailer_mobile, event: 'order_rejected', data: { order_number: order.order_number, vendor_name: req.user.name } })
      .catch((e) => console.error('Notify error:', e));

    res.json(updated);
  } catch (err) { next(err); }
};

const dispatchOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order, error, status } = await checkOrderAccess(id, req.user.id);
    if (error) return res.status(status).json({ error });
    if (order.status !== 'accepted') return res.status(400).json({ error: 'Only accepted orders can be dispatched' });

    await query(`UPDATE orders SET status = 'dispatched', updated_at = now() WHERE id = $1`, [id]);
    const updated = await getOrderWithRetailer(id);

    notify({ mobile: order.retailer_mobile, event: 'order_dispatched', data: { order_number: order.order_number, vendor_name: req.user.name } })
      .catch((e) => console.error('Notify error:', e));

    res.json(updated);
  } catch (err) { next(err); }
};

const deliverOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order, error, status } = await checkOrderAccess(id, req.user.id);
    if (error) return res.status(status).json({ error });
    if (order.status !== 'dispatched') return res.status(400).json({ error: 'Only dispatched orders can be marked delivered' });

    await query(`UPDATE orders SET status = 'delivered', updated_at = now() WHERE id = $1`, [id]);
    const updated = await getOrderWithRetailer(id);

    notify({ mobile: order.retailer_mobile, event: 'order_delivered', data: { order_number: order.order_number, vendor_name: req.user.name } })
      .catch((e) => console.error('Notify error:', e));

    res.json(updated);
  } catch (err) { next(err); }
};

module.exports = { placeOrder, getOrders, getOrderById, acceptOrder, rejectOrder, dispatchOrder, deliverOrder };
