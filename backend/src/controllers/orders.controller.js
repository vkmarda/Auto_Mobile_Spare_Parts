const { query } = require('../config/db');
const { notify } = require('../services/notifications');

const placeOrder = async (req, res, next) => {
  console.log('placeOrder called')
console.log('req.user:', req.user)
console.log('req.body:', JSON.stringify(req.body, null, 2))
  try {
    const { items, notes } = req.body;
    const retailer_id = req.user.id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array must not be empty' });
    }

    for (const item of items) {
      if (!item.product_id || item.product_id === 'null' || item.product_id === 'undefined') {
        return res.status(400).json({ error: 'Invalid product_id in items' });
      }
    }

    const cleanNotes = notes && notes !== 'null' ? notes : null;
    const productIds = items.map((i) => i.product_id);
    const placeholders = productIds.map((_, idx) => `$${idx + 1}`).join(', ');
    const productResult = await query(
      `SELECT id, vendor_id, vehicle_brand, vehicle_model FROM products WHERE id IN (${placeholders})`,
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

    console.log('retailer_id:', req.user.id)
    // Create one independent order per vendor
    const createdOrders = [];
    for (const [vendor_id, vendorItems] of Object.entries(byVendor)) {
      const orderResult = await query(
        `INSERT INTO orders (retailer_id, vendor_id, notes, status) VALUES ($1, $2, $3, 'pending') RETURNING *`,
        [retailer_id, vendor_id, cleanNotes]
      );
      const order = orderResult.rows[0];
      const orderId = orderResult.rows[0].id;
      console.log('Inserting item:', {
  order_id: orderResult.rows[0].id,
  
  product_id: orderResult.rows[0].product_id,
  quantity: orderResult.rows[0].quantity,
})

      for (const item of vendorItems) {
        const p = productMap[item.product_id];
        await query(
          `INSERT INTO order_items (order_id, product_id, quantity, vehicle_brand, vehicle_model) VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.product_id, item.quantity, p.vehicle_brand || null, p.vehicle_model || null]
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

const placePhotoOrder = async (req, res, next) => {
  try {
    const { vendor_id, items } = req.body;
    const retailer_id = req.user.id;

    if (!vendor_id) return res.status(400).json({ error: 'vendor_id is required' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items must be a non-empty array' });
    if (items.some((i) => !i.photo_url)) return res.status(400).json({ error: 'Each item must have a photo_url' });

    const vendorRes = await query(
      `SELECT id, name, mobile FROM users WHERE id = $1 AND role = 'vendor'`,
      [vendor_id]
    );
    if (vendorRes.rows.length === 0) return res.status(400).json({ error: 'Vendor not found' });
    const vendor = vendorRes.rows[0];

    const orderResult = await query(
      `INSERT INTO orders (retailer_id, vendor_id, order_type, status) VALUES ($1, $2, 'photo', 'pending') RETURNING *`,
      [retailer_id, vendor_id]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await query(
        `INSERT INTO order_photo_items (order_id, photo_url, vehicle_brand, vehicle_model, manufacture_year, quantity, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, item.photo_url, item.vehicle_brand || null, item.vehicle_model || null, item.manufacture_year || null, item.quantity || 1, item.note || null]
      );
    }

    if (vendor.mobile) {
      notify({ mobile: vendor.mobile, event: 'order_placed', data: { order_number: order.order_number, retailer_name: req.user.name } })
        .catch((e) => console.error('Notify error:', e));
    }

    res.status(201).json({ orders: [{ id: order.id, order_number: order.order_number }] });
  } catch (err) { next(err); }
};

const getOrders = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;

    if (role === 'vendor') {
      const result = await query(
        `SELECT o.id, o.order_number, o.status, o.created_at, o.updated_at, o.notes,
                o.order_type, o.retailer_id, o.rejection_reason,
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

    const result = await query(
      `SELECT o.id, o.order_number, o.status, o.notes, o.created_at,
              o.order_type, o.rejection_reason,
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
              o.order_type, o.rejection_reason,
              o.accepted_at, o.dispatched_at, o.delivered_at, o.confirmed_at,
              v.name AS vendor_name, v.id AS vendor_id,
              v.mobile AS vendor_mobile, v.email AS vendor_email,
              u.name AS retailer_name, u.email AS retailer_email, u.mobile AS retailer_mobile,
              u.city AS retailer_city, u.state AS retailer_state
       FROM orders o
       JOIN users v ON v.id = o.vendor_id
       JOIN users u ON u.id = o.retailer_id
       WHERE o.id = $1 AND ${ownerField} = $2`,
      [id, userId]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = orderResult.rows[0];
    let itemsResult;

    if (order.order_type === 'photo') {
      itemsResult = await query(
        `SELECT id, photo_url, vehicle_brand, vehicle_model, manufacture_year, quantity, note
         FROM order_photo_items WHERE order_id = $1 ORDER BY id`,
        [id]
      );
    } else {
      itemsResult = await query(
        `SELECT oi.id, oi.product_id, oi.quantity, oi.approved_quantity,
                oi.vehicle_brand, oi.vehicle_model,
                p.name AS product_name, p.part_name, p.sku
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1 ORDER BY oi.id`,
        [id]
      );
    }

    res.json({ ...order, items: itemsResult.rows });
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

    await query(`UPDATE orders SET status = 'accepted', accepted_at = now(), updated_at = now() WHERE id = $1`, [id]);
    notify({ mobile: order.retailer_mobile, event: 'order_accepted', data: { order_number: order.order_number, vendor_name: req.user.name } })
      .catch((e) => console.error('Notify error:', e));
    res.json({ id, status: 'accepted' });
  } catch (err) { next(err); }
};

const rejectOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const { order, error, status } = await checkOrderAccess(id, req.user.id);
    if (error) return res.status(status).json({ error });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be rejected' });

    await query(
      `UPDATE orders SET status = 'rejected', rejection_reason = $2, rejected_at = now(), updated_at = now() WHERE id = $1`,
      [id, reason || null]
    );
    notify({ mobile: order.retailer_mobile, event: 'order_rejected', data: { order_number: order.order_number, vendor_name: req.user.name } })
      .catch((e) => console.error('Notify error:', e));
    res.json({ id, status: 'rejected' });
  } catch (err) { next(err); }
};

const confirmOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const retailer_id = req.user.id;

    const orderResult = await query(
      `SELECT * FROM orders WHERE id = $1 AND retailer_id = $2`,
      [id, retailer_id]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    if (orderResult.rows[0].status !== 'dispatched') {
      return res.status(400).json({ error: 'Only dispatched orders can be confirmed' });
    }

    await query(
      `UPDATE orders SET status = 'confirmed', delivered_at = now(), confirmed_at = now(), updated_at = now() WHERE id = $1`,
      [id]
    );

    // Auto-advance dispatch to completed if all its orders are now confirmed
    try {
      const dispatchRes = await query(
        `SELECT d.id FROM dispatches d JOIN dispatch_orders do2 ON do2.dispatch_id = d.id WHERE do2.order_id = $1 AND d.status = 'dispatched'`,
        [id]
      );
      if (dispatchRes.rows.length > 0) {
        const dispatchId = dispatchRes.rows[0].id;
        const pendingRes = await query(
          `SELECT COUNT(*) FROM dispatch_orders do2 JOIN orders o ON o.id = do2.order_id WHERE do2.dispatch_id = $1 AND o.status != 'confirmed'`,
          [dispatchId]
        );
        if (parseInt(pendingRes.rows[0].count) === 0) {
          await query(`UPDATE dispatches SET status = 'completed', updated_at = now() WHERE id = $1`, [dispatchId]);
        }
      }
    } catch (autoErr) {
      console.error('Auto-advance dispatch error (non-fatal):', autoErr);
    }

    res.json({ id, status: 'confirmed' });
  } catch (err) { next(err); }
};

const dispatchOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order, error, status } = await checkOrderAccess(id, req.user.id);
    if (error) return res.status(status).json({ error });
    if (!['accepted', 'partial_confirmed'].includes(order.status)) return res.status(400).json({ error: 'Only accepted or partially confirmed orders can be dispatched' });

    await query(`UPDATE orders SET status = 'dispatched', dispatched_at = now(), updated_at = now() WHERE id = $1`, [id]);
    notify({ mobile: order.retailer_mobile, event: 'order_dispatched', data: { order_number: order.order_number, vendor_name: req.user.name } })
      .catch((e) => console.error('Notify error:', e));
    res.json({ id, status: 'dispatched' });
  } catch (err) { next(err); }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const retailer_id = req.user.id;
    const result = await query(`SELECT * FROM orders WHERE id = $1 AND retailer_id = $2`, [id, retailer_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    if (!['pending', 'partially_accepted'].includes(result.rows[0].status)) return res.status(400).json({ error: 'Only pending or partially accepted orders can be cancelled' });
    await query(`UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1`, [id]);
    res.json({ id, status: 'cancelled' });
  } catch (err) { next(err); }
};

const partialAcceptOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array required' });
    }

    const { order, error, status } = await checkOrderAccess(id, req.user.id);
    if (error) return res.status(status).json({ error });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be partially accepted' });

    const origResult = await query(`SELECT id, quantity FROM order_items WHERE order_id = $1`, [id]);
    const origMap = {};
    for (const row of origResult.rows) origMap[row.id] = parseInt(row.quantity);

    for (const item of items) {
      const max = origMap[item.id];
      if (!max) return res.status(400).json({ error: `Invalid item id: ${item.id}` });
      if (item.approved_quantity < 0 || item.approved_quantity > max) {
        return res.status(400).json({ error: `approved_quantity for item ${item.id} must be 0–${max}` });
      }
    }
    if (items.every((i) => i.approved_quantity === 0)) {
      return res.status(400).json({ error: 'At least one item must have approved_quantity > 0' });
    }

    for (const item of items) {
      await query(`UPDATE order_items SET approved_quantity = $1 WHERE id = $2 AND order_id = $3`,
        [item.approved_quantity, item.id, id]);
    }
    await query(`UPDATE orders SET status = 'partially_accepted', updated_at = now() WHERE id = $1`, [id]);

    notify({ mobile: order.retailer_mobile, event: 'order_partially_accepted',
      data: { order_number: order.order_number, vendor_name: req.user.name } })
      .catch((e) => console.error('Notify error:', e));

    res.json({ id, status: 'partially_accepted' });
  } catch (err) { next(err); }
};

const confirmPartialOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM orders WHERE id = $1 AND retailer_id = $2`, [id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    if (result.rows[0].status !== 'partially_accepted') {
      return res.status(400).json({ error: 'Only partially accepted orders can be confirmed' });
    }
    await query(`UPDATE orders SET status = 'partial_confirmed', updated_at = now() WHERE id = $1`, [id]);
    res.json({ id, status: 'partial_confirmed' });
  } catch (err) { next(err); }
};

module.exports = { placeOrder, placePhotoOrder, getOrders, getOrderById, acceptOrder, rejectOrder, dispatchOrder, confirmOrder, cancelOrder, partialAcceptOrder, confirmPartialOrder };
