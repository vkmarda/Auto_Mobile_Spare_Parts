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

    // Group items by vendor
    const byVendor = {};
    for (const item of items) {
      const vid = productMap[item.product_id].vendor_id;
      if (!byVendor[vid]) byVendor[vid] = [];
      byVendor[vid].push(item);
    }

    // Create one independent order per vendor
    const createdOrders = [];
    for (const [vendor_id, vendorItems] of Object.entries(byVendor)) {
      const orderResult = await query(
        `INSERT INTO orders (retailer_id, vendor_id, notes, status) VALUES ($1, $2, $3, 'pending') RETURNING *`,
        [retailer_id, vendor_id, notes || null]
      );
      const order = orderResult.rows[0];

      for (const item of vendorItems) {
        await query(
          `INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)`,
          [order.id, item.product_id, item.quantity]
        );
      }

      const vendorRes = await query('SELECT mobile FROM users WHERE id = $1', [vendor_id]);
      const vendor = vendorRes.rows[0];
      if (vendor?.mobile) {
        notify({ mobile: vendor.mobile, event: 'order_placed', data: { order_number: order.order_number, retailer_name: req.user.name } })
          .catch((e) => console.error('Notify error:', e));
      }

      createdOrders.push({ order_number: order.order_number, id: order.id });
    }

    res.status(201).json({ orders: createdOrders });
  } catch (err) {
    next(err);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;

    if (role === 'vendor') {
      const result = await query(
        `SELECT o.id, o.order_number, o.status, o.created_at, o.updated_at, o.notes,
                u.name AS retailer_name, u.email AS retailer_email,
                u.mobile AS retailer_mobile, u.city AS retailer_city, u.state AS retailer_state,
                COUNT(oi.id) AS item_count,
                ARRAY_AGG(p.name ORDER BY oi.id) FILTER (WHERE p.name IS NOT NULL) AS product_names
         FROM orders o
         JOIN users u ON u.id = o.retailer_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE o.vendor_id = $1
         GROUP BY o.id, u.name, u.email, u.mobile, u.city, u.state
         ORDER BY o.created_at DESC`,
        [userId]
      );
      return res.json(result.rows);
    }

    // Retailer: flat list, each order belongs to one vendor
    const result = await query(
      `SELECT o.id, o.order_number, o.status, o.notes, o.created_at,
              v.name AS vendor_name,
              COUNT(oi.id) AS item_count,
              ARRAY_AGG(p.name ORDER BY oi.id) FILTER (WHERE p.name IS NOT NULL) AS product_names
       FROM orders o
       JOIN users v ON v.id = o.vendor_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.retailer_id = $1
       GROUP BY o.id, v.name
       ORDER BY o.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const ownerField = role === 'vendor' ? 'o.vendor_id' : 'o.retailer_id';
    const orderResult = await query(
      `SELECT o.id, o.order_number, o.status, o.notes, o.created_at, o.updated_at,
              v.name AS vendor_name, v.id AS vendor_id,
              u.name AS retailer_name, u.email AS retailer_email, u.mobile AS retailer_mobile,
              u.city AS retailer_city, u.state AS retailer_state
       FROM orders o
       JOIN users v ON v.id = o.vendor_id
       JOIN users u ON u.id = o.retailer_id
       WHERE o.id = $1 AND ${ownerField} = $2`,
      [id, userId]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const itemsResult = await query(
      `SELECT oi.id, oi.product_id, oi.quantity, p.name AS product_name, p.sku
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1 ORDER BY oi.id`,
      [id]
    );
    res.json({ ...orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    next(err);
  }
};

async function checkOrderAccess(id, vendor_id) {
  const result = await query(
    `SELECT o.*, u.mobile AS retailer_mobile, u.name AS retailer_name
     FROM orders o
     JOIN users u ON u.id = o.retailer_id
     WHERE o.id = $1`,
    [id]
  );
  if (result.rows.length === 0) return { error: 'Order not found', status: 404 };
  if (result.rows[0].vendor_id !== vendor_id) return { error: 'Access denied', status: 403 };
  return { order: result.rows[0] };
}

const acceptOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order, error, status } = await checkOrderAccess(id, req.user.id);
    if (error) return res.status(status).json({ error });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be accepted' });

    await query(`UPDATE orders SET status = 'accepted', updated_at = now() WHERE id = $1`, [id]);
    notify({ mobile: order.retailer_mobile, event: 'order_accepted', data: { order_number: order.order_number, vendor_name: req.user.name } })
      .catch((e) => console.error('Notify error:', e));
    res.json({ id, status: 'accepted' });
  } catch (err) { next(err); }
};

const rejectOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order, error, status } = await checkOrderAccess(id, req.user.id);
    if (error) return res.status(status).json({ error });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be rejected' });

    await query(`UPDATE orders SET status = 'rejected', updated_at = now() WHERE id = $1`, [id]);
    notify({ mobile: order.retailer_mobile, event: 'order_rejected', data: { order_number: order.order_number, vendor_name: req.user.name } })
      .catch((e) => console.error('Notify error:', e));
    res.json({ id, status: 'rejected' });
  } catch (err) { next(err); }
};

const dispatchOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order, error, status } = await checkOrderAccess(id, req.user.id);
    if (error) return res.status(status).json({ error });
    if (order.status !== 'accepted') return res.status(400).json({ error: 'Only accepted orders can be dispatched' });

    await query(`UPDATE orders SET status = 'dispatched', updated_at = now() WHERE id = $1`, [id]);
    notify({ mobile: order.retailer_mobile, event: 'order_dispatched', data: { order_number: order.order_number, vendor_name: req.user.name } })
      .catch((e) => console.error('Notify error:', e));
    res.json({ id, status: 'dispatched' });
  } catch (err) { next(err); }
};

const deliverOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order, error, status } = await checkOrderAccess(id, req.user.id);
    if (error) return res.status(status).json({ error });
    if (order.status !== 'dispatched') return res.status(400).json({ error: 'Only dispatched orders can be marked delivered' });

    await query(`UPDATE orders SET status = 'delivered', updated_at = now() WHERE id = $1`, [id]);
    notify({ mobile: order.retailer_mobile, event: 'order_delivered', data: { order_number: order.order_number, vendor_name: req.user.name } })
      .catch((e) => console.error('Notify error:', e));
    res.json({ id, status: 'delivered' });
  } catch (err) { next(err); }
};

module.exports = { placeOrder, getOrders, getOrderById, acceptOrder, rejectOrder, dispatchOrder, deliverOrder };
