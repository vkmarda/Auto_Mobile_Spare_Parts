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

    const [salesRes, qtyRes, partsRes, retailersRes] = await Promise.all([
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
    ]);

    const date_from = new Date();
    date_from.setDate(date_from.getDate() - days);

    res.json({
      total_sales:       parseFloat(salesRes.rows[0].total_sales),
      total_quantity:    parseInt(qtyRes.rows[0].total_quantity),
      unique_parts:      parseInt(partsRes.rows[0].unique_parts),
      unique_retailers:  parseInt(retailersRes.rows[0].unique_retailers),
      days,
      date_from:         date_from.toISOString(),
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

module.exports = { getDemand, getStats, bulkAcceptOrders };
