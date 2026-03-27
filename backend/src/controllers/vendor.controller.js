const { query } = require('../config/db');

const getDemand = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         p.id,
         p.name,
         p.sku,
         p.unit_price,
         SUM(oi.quantity) AS total_quantity_pending
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE o.status = 'pending'
       GROUP BY p.id, p.name, p.sku, p.unit_price
       ORDER BY total_quantity_pending DESC`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const interval = `${days} days`;

    const prevInterval = `${days * 2} days`;

    const [salesRes, qtyRes, partsRes, retailersRes, topRetailersRes,
           prevSalesRes, prevQtyRes, prevPartsRes] = await Promise.all([
      query(
        `SELECT COALESCE(SUM(total_amount), 0) AS total_sales
         FROM orders
         WHERE created_at >= now() - interval '${interval}'
         AND status != 'rejected'`,
        []
      ),
      query(
        `SELECT COALESCE(SUM(oi.quantity), 0) AS total_quantity
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.created_at >= now() - interval '${interval}'
         AND o.status != 'rejected'`,
        []
      ),
      query(
        `SELECT COUNT(DISTINCT oi.product_id) AS unique_parts
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.created_at >= now() - interval '${interval}'
         AND o.status != 'rejected'`,
        []
      ),
      query(
        `SELECT COUNT(DISTINCT retailer_id) AS unique_retailers
         FROM orders
         WHERE created_at >= now() - interval '${interval}'
         AND status != 'rejected'`,
        []
      ),
      query(
        `SELECT u.name, u.city, u.state,
                SUM(o.total_amount) AS total_value,
                COUNT(o.id) AS order_count
         FROM orders o
         JOIN users u ON u.id = o.retailer_id
         WHERE o.created_at >= now() - interval '${interval}'
         AND o.status != 'rejected'
         GROUP BY u.id, u.name, u.city, u.state
         ORDER BY total_value DESC
         LIMIT 5`,
        []
      ),
      query(
        `SELECT COALESCE(SUM(total_amount), 0) AS total_sales
         FROM orders
         WHERE created_at >= now() - interval '${prevInterval}'
         AND created_at < now() - interval '${interval}'
         AND status != 'rejected'`,
        []
      ),
      query(
        `SELECT COALESCE(SUM(oi.quantity), 0) AS total_quantity
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.created_at >= now() - interval '${prevInterval}'
         AND o.created_at < now() - interval '${interval}'
         AND o.status != 'rejected'`,
        []
      ),
      query(
        `SELECT COUNT(DISTINCT oi.product_id) AS unique_parts
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.created_at >= now() - interval '${prevInterval}'
         AND o.created_at < now() - interval '${interval}'
         AND o.status != 'rejected'`,
        []
      ),
    ]);

    const date_from = new Date();
    date_from.setDate(date_from.getDate() - days);

    res.json({
      total_sales:        parseFloat(salesRes.rows[0].total_sales),
      total_quantity:     parseInt(qtyRes.rows[0].total_quantity),
      unique_parts:       parseInt(partsRes.rows[0].unique_parts),
      unique_retailers:   parseInt(retailersRes.rows[0].unique_retailers),
      top_retailers:      topRetailersRes.rows.map((r) => ({ ...r, total_value: parseFloat(r.total_value), order_count: parseInt(r.order_count) })),
      prev_total_sales:   parseFloat(prevSalesRes.rows[0].total_sales),
      prev_total_quantity: parseInt(prevQtyRes.rows[0].total_quantity),
      prev_unique_parts:  parseInt(prevPartsRes.rows[0].unique_parts),
      days,
      date_from:          date_from.toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

const bulkAcceptOrders = async (req, res, next) => {
  try {
    const { order_ids } = req.body;
    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      return res.status(400).json({ error: 'order_ids must be a non-empty array' });
    }

    const accepted = [];
    const skipped = [];

    for (const id of order_ids) {
      const existing = await query('SELECT id, status FROM orders WHERE id = $1', [id]);
      if (existing.rows.length === 0 || existing.rows[0].status !== 'pending') {
        skipped.push(id);
        continue;
      }
      await query(
        `UPDATE orders SET status = 'accepted', updated_at = now() WHERE id = $1`,
        [id]
      );
      accepted.push(id);
    }

    res.json({ accepted, skipped });
  } catch (err) {
    next(err);
  }
};

const getSalesChart = async (req, res, next) => {
  try {
    const days     = parseInt(req.query.days) || 7;
    const interval = `${days} days`;

    const result = await query(
      `SELECT
         date_series.date::date AS date,
         COALESCE(SUM(o.total_amount), 0) AS total_sales,
         COUNT(o.id)             AS order_count,
         COALESCE(SUM(oi.quantity), 0)    AS total_qty
       FROM generate_series(
         CURRENT_DATE - interval '${interval}',
         CURRENT_DATE,
         '1 day'::interval
       ) AS date_series(date)
       LEFT JOIN orders o
         ON DATE(o.created_at) = date_series.date
         AND o.status != 'rejected'
       LEFT JOIN order_items oi
         ON oi.order_id = o.id
       GROUP BY date_series.date
       ORDER BY date_series.date ASC`,
      []
    );

    const data = result.rows.map((r) => ({
      date:        new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      total_sales: parseFloat(r.total_sales),
      order_count: parseInt(r.order_count),
      total_qty:   parseInt(r.total_qty),
    }));

    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getProductStats = async (req, res, next) => {
  try {
    const days     = parseInt(req.query.days) || 7;
    const interval = `${days} days`;

    const result = await query(
      `SELECT
         p.id,
         p.name,
         p.sku,
         COALESCE(SUM(oi.quantity), 0)                  AS total_qty,
         COALESCE(SUM(oi.quantity * oi.unit_price), 0)  AS total_sales
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id
         AND o.status != 'rejected'
         AND o.created_at >= now() - interval '${interval}'
       GROUP BY p.id, p.name, p.sku
       ORDER BY total_sales DESC`,
      []
    );

    const data = result.rows
      .filter((r) => parseFloat(r.total_sales) > 0)
      .map((r) => ({
        id:          r.id,
        name:        r.name,
        sku:         r.sku,
        total_qty:   parseInt(r.total_qty),
        total_sales: parseFloat(r.total_sales),
      }));

    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getDemand, getStats, bulkAcceptOrders, getSalesChart, getProductStats };
