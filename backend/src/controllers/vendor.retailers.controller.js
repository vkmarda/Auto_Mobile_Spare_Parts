const { query } = require('../config/db');

const getRetailers = async (req, res, next) => {
  try {
    const vendor_id = req.user.id;
    const result = await query(
      `SELECT u.id, u.name, u.email, u.mobile, u.city, u.state,
              COUNT(DISTINCT o.id)                                            AS total_orders,
              COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'pending')       AS pending_count,
              COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'accepted')      AS accepted_count,
              COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'dispatched')    AS dispatched_count,
              COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'delivered')     AS delivered_count,
              COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'confirmed')     AS confirmed_count,
              MAX(o.created_at)    AS last_order_at,
              MAX(o.dispatched_at) AS last_dispatched_at
       FROM users u
       JOIN orders o ON o.retailer_id = u.id AND o.vendor_id = $1
       WHERE u.role = 'retailer'
       GROUP BY u.id, u.name, u.email, u.mobile, u.city, u.state
       ORDER BY u.city NULLS LAST, u.name`,
      [vendor_id]
    );
    res.json(result.rows.map((r) => ({
      ...r,
      total_orders:     parseInt(r.total_orders),
      pending_count:    parseInt(r.pending_count),
      accepted_count:   parseInt(r.accepted_count),
      dispatched_count: parseInt(r.dispatched_count),
      delivered_count:  parseInt(r.delivered_count),
      confirmed_count:  parseInt(r.confirmed_count),
    })));
  } catch (err) { next(err); }
};

const getRetailerById = async (req, res, next) => {
  try {
    const vendor_id = req.user.id;
    const { id } = req.params;

    // Verify retailer exists and has ordered from this vendor
    const [retailerRes, ordersRes] = await Promise.all([
      query(
        `SELECT DISTINCT u.id, u.name, u.email, u.mobile, u.city, u.state
         FROM users u
         JOIN orders o ON o.retailer_id = u.id AND o.vendor_id = $2
         WHERE u.id = $1 AND u.role = 'retailer'`,
        [id, vendor_id]
      ),
      query(
        `SELECT o.id, o.order_number, o.status, o.notes, o.order_type,
                o.created_at, o.updated_at, o.accepted_at, o.dispatched_at, o.delivered_at,
                COUNT(oi.id)                  AS item_count,
                COALESCE(SUM(oi.quantity), 0) AS total_qty
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.retailer_id = $1 AND o.vendor_id = $2
         GROUP BY o.id
         ORDER BY o.created_at DESC`,
        [id, vendor_id]
      ),
    ]);

    if (retailerRes.rows.length === 0) return res.status(404).json({ error: 'Retailer not found' });

    const orders = ordersRes.rows.map((o) => ({
      ...o,
      item_count: parseInt(o.item_count),
      total_qty:  parseInt(o.total_qty),
      items: [],
    }));

    if (orders.length > 0) {
      const itemsMap = {};
      for (const o of orders) itemsMap[o.id] = [];

      const regularIds = orders.filter((o) => o.order_type !== 'photo').map((o) => o.id);
      const photoIds   = orders.filter((o) => o.order_type === 'photo').map((o) => o.id);

      if (regularIds.length > 0) {
        const itemsRes = await query(
          `SELECT oi.order_id, oi.quantity, oi.vehicle_brand, oi.vehicle_model,
                  p.name AS product_name, p.sku
           FROM order_items oi JOIN products p ON p.id = oi.product_id
           WHERE oi.order_id = ANY($1) ORDER BY oi.order_id, oi.id`,
          [regularIds]
        );
        for (const row of itemsRes.rows) itemsMap[row.order_id].push(row);
      }

      if (photoIds.length > 0) {
        const photoRes = await query(
          `SELECT order_id, photo_url, vehicle_brand, vehicle_model, quantity, note
           FROM order_photo_items WHERE order_id = ANY($1) ORDER BY order_id, id`,
          [photoIds]
        );
        for (const row of photoRes.rows) itemsMap[row.order_id].push(row);
      }

      for (const o of orders) o.items = itemsMap[o.id] || [];
    }

    res.json({ ...retailerRes.rows[0], orders });
  } catch (err) { next(err); }
};

module.exports = { getRetailers, getRetailerById };
