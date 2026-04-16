const { query } = require('../config/db');

const getDemand = async (req, res, next) => {
  try {
    const vendor_id = req.user.id;
    const result = await query(
      `SELECT p.id, p.name, p.sku,
              SUM(oi.quantity) AS total_quantity_pending,
              (
                SELECT json_object_agg(city, qty) FROM (
                  SELECT u2.city, SUM(oi2.quantity)::int AS qty
                  FROM order_items oi2
                  JOIN orders o2 ON o2.id = oi2.order_id
                  JOIN users u2 ON u2.id = o2.retailer_id
                  WHERE oi2.product_id = p.id AND o2.status = 'pending' AND o2.vendor_id = $1 AND u2.city IS NOT NULL
                  GROUP BY u2.city
                ) sub
              ) AS city_breakdown
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE o.status = 'pending' AND o.vendor_id = $1
       GROUP BY p.id, p.name, p.sku
       ORDER BY total_quantity_pending DESC`,
      [vendor_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const vendor_id = req.user.id;
    const interval = `${days} days`;
    const prevInterval = `${days * 2} days`;

    const [qtyRes, partsRes, retailersRes, topRetailersRes,
           prevQtyRes, prevPartsRes, statusCountsRes] = await Promise.all([
      query(`SELECT COALESCE(SUM(oi.quantity),0) AS total_quantity FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE o.created_at >= now()-interval '${interval}' AND o.status!='rejected' AND o.vendor_id=$1`, [vendor_id]),
      query(`SELECT COUNT(DISTINCT oi.product_id) AS unique_parts FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE o.created_at >= now()-interval '${interval}' AND o.status!='rejected' AND o.vendor_id=$1`, [vendor_id]),
      query(`SELECT COUNT(DISTINCT o.retailer_id) AS unique_retailers FROM orders o
             WHERE o.created_at >= now()-interval '${interval}' AND o.status!='rejected' AND o.vendor_id=$1`, [vendor_id]),
      query(`SELECT u.name, u.city, u.state, COUNT(o.id) AS order_count, MAX(o.created_at) AS last_order_at
             FROM orders o
             JOIN users u ON u.id = o.retailer_id
             WHERE o.created_at >= now()-interval '${interval}' AND o.status!='rejected' AND o.vendor_id=$1
             GROUP BY u.id,u.name,u.city,u.state ORDER BY MAX(o.created_at) DESC LIMIT 5`, [vendor_id]),
      query(`SELECT COALESCE(SUM(oi.quantity),0) AS total_quantity FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE o.created_at >= now()-interval '${prevInterval}' AND o.created_at < now()-interval '${interval}'
             AND o.status!='rejected' AND o.vendor_id=$1`, [vendor_id]),
      query(`SELECT COUNT(DISTINCT oi.product_id) AS unique_parts FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE o.created_at >= now()-interval '${prevInterval}' AND o.created_at < now()-interval '${interval}'
             AND o.status!='rejected' AND o.vendor_id=$1`, [vendor_id]),
      query(`SELECT status, COUNT(*) AS count FROM orders WHERE vendor_id=$1 GROUP BY status`, [vendor_id]),
    ]);

    const date_from = new Date();
    date_from.setDate(date_from.getDate() - days);

    const statusMap = {};
    for (const row of statusCountsRes.rows) statusMap[row.status] = parseInt(row.count);

    res.json({
      total_quantity:       parseInt(qtyRes.rows[0].total_quantity),
      unique_parts:         parseInt(partsRes.rows[0].unique_parts),
      unique_retailers:     parseInt(retailersRes.rows[0].unique_retailers),
      top_retailers:        topRetailersRes.rows.map((r) => ({ ...r, order_count: parseInt(r.order_count), last_order_at: r.last_order_at })),
      prev_total_quantity:  parseInt(prevQtyRes.rows[0].total_quantity),
      prev_unique_parts:    parseInt(prevPartsRes.rows[0].unique_parts),
      dispatched_count:     statusMap['dispatched'] || 0,
      delivered_count:      statusMap['delivered'] || 0,
      confirmed_count:      statusMap['confirmed'] || 0,
      return_requested_count: statusMap['return_requested'] || 0,
      days,
      date_from: date_from.toISOString(),
    });
  } catch (err) { next(err); }
};

const bulkAcceptOrders = async (req, res, next) => {
  try {
    const { order_ids } = req.body;
    const vendor_id = req.user.id;
    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      return res.status(400).json({ error: 'order_ids must be a non-empty array' });
    }

    const accepted = [];
    const skipped  = [];

    for (const id of order_ids) {
      const existing = await query('SELECT id, status, vendor_id FROM orders WHERE id = $1', [id]);
      if (existing.rows.length === 0 || existing.rows[0].status !== 'pending' || existing.rows[0].vendor_id !== vendor_id) {
        skipped.push(id);
        continue;
      }
      await query(`UPDATE orders SET status = 'accepted', updated_at = now() WHERE id = $1`, [id]);
      accepted.push(id);
    }

    res.json({ accepted, skipped });
  } catch (err) { next(err); }
};

const getSalesChart = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const vendor_id = req.user.id;
    const interval = `${days} days`;

    const result = await query(
      `SELECT date_series.date::date AS date,
              COUNT(o.id) AS order_count,
              COALESCE(SUM(oi.quantity), 0) AS total_qty
       FROM generate_series(CURRENT_DATE-interval '${interval}', CURRENT_DATE, '1 day'::interval) AS date_series(date)
       LEFT JOIN orders o ON DATE(o.created_at) = date_series.date AND o.status != 'rejected' AND o.vendor_id = $1
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY date_series.date ORDER BY date_series.date ASC`,
      [vendor_id]
    );

    res.json(result.rows.map((r) => ({
      date:        new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      order_count: parseInt(r.order_count),
      total_qty:   parseInt(r.total_qty),
    })));
  } catch (err) { next(err); }
};

const getProductStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const vendor_id = req.user.id;
    const interval = `${days} days`;

    const result = await query(
      `SELECT p.id, p.name, p.sku,
              COALESCE(SUM(oi.quantity), 0) AS total_qty
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id
         AND o.status != 'rejected'
         AND o.created_at >= now() - interval '${interval}'
         AND o.vendor_id = $1
       WHERE p.vendor_id = $1
       GROUP BY p.id, p.name, p.sku
       ORDER BY total_qty DESC`,
      [vendor_id]
    );

    res.json(result.rows
      .filter((r) => parseInt(r.total_qty) > 0)
      .map((r) => ({ id: r.id, name: r.name, sku: r.sku, total_qty: parseInt(r.total_qty) }))
    );
  } catch (err) { next(err); }
};

const getLastDispatchesByCity = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT DISTINCT ON (city) city, created_at AS last_dispatched_at
       FROM dispatches
       ORDER BY city, created_at DESC`
    );
    const map = {};
    for (const row of result.rows) map[row.city] = row.last_dispatched_at;
    res.json(map);
  } catch (err) { next(err); }
};

module.exports = { getDemand, getStats, bulkAcceptOrders, getSalesChart, getProductStats, getLastDispatchesByCity };
