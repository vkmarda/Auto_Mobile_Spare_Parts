const { query, withTransaction } = require('../config/db');

const createReturn = async (req, res, next) => {
  try {
    const { order_id, reason, items } = req.body;
    const retailer_id = req.user.id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array' });
    }

    const orderResult = await query(
      `SELECT * FROM orders WHERE id = $1 AND retailer_id = $2`,
      [order_id, retailer_id]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    if (orderResult.rows[0].status !== 'confirmed') {
      return res.status(400).json({ error: 'Only confirmed orders can be returned' });
    }

    for (const item of items) {
      const origResult = await query(
        `SELECT quantity FROM order_items WHERE id = $1 AND order_id = $2`,
        [item.order_item_id, order_id]
      );
      if (origResult.rows.length === 0) {
        return res.status(400).json({ error: `Invalid order_item_id: ${item.order_item_id}` });
      }
      if (item.quantity > origResult.rows[0].quantity) {
        return res.status(400).json({ error: `Return quantity exceeds original for item ${item.order_item_id}` });
      }
    }

    const returnReq = await withTransaction(async (tq) => {
      const returnResult = await tq(
        `INSERT INTO return_requests (order_id, retailer_id, reason, status) VALUES ($1, $2, $3, 'return_requested') RETURNING *`,
        [order_id, retailer_id, reason]
      );
      const rr = returnResult.rows[0];
      for (const item of items) {
        await tq(
          `INSERT INTO return_items (return_request_id, order_item_id, product_id, quantity) VALUES ($1, $2, $3, $4)`,
          [rr.id, item.order_item_id, item.product_id, item.quantity]
        );
      }
      await tq(`UPDATE orders SET status = 'return_requested', updated_at = now() WHERE id = $1`, [order_id]);
      return rr;
    });

    res.status(201).json({ return_number: returnReq.return_number, id: returnReq.id });
  } catch (err) { next(err); }
};

const getReturns = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const filterField = role === 'vendor' ? 'o.vendor_id' : 'rr.retailer_id';

    const result = await query(
      `SELECT rr.id, rr.return_number, rr.reason, rr.status, rr.created_at,
              o.order_number, u.name AS retailer_name, u.city, u.state,
              rdr.return_delivery_id,
              d.dispatch_number
       FROM return_requests rr
       JOIN orders o ON o.id = rr.order_id
       JOIN users u ON u.id = rr.retailer_id
       LEFT JOIN return_delivery_requests rdr ON rdr.return_request_id = rr.id
       LEFT JOIN return_deliveries rdel ON rdel.id = rdr.return_delivery_id
       LEFT JOIN dispatches d ON d.id = rdel.dispatch_id
       WHERE ${filterField} = $1
       ORDER BY rr.created_at DESC`,
      [userId]
    );

    const returns = [];
    for (const row of result.rows) {
      const itemsResult = await query(
        `SELECT ri.id, ri.quantity, p.name AS product_name, p.sku
         FROM return_items ri
         JOIN products p ON p.id = ri.product_id
         WHERE ri.return_request_id = $1`,
        [row.id]
      );
      returns.push({ ...row, items: itemsResult.rows });
    }

    res.json(returns);
  } catch (err) { next(err); }
};

const acceptReturn = async (req, res) => {
  try {
    const { id } = req.params;

    const checkResult = await query(
      'SELECT * FROM return_requests WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Return request not found' });
    }

    const returnRequest = checkResult.rows[0];
    console.log('Return request found:', returnRequest);
    console.log('Current status:', returnRequest.status);

    if (returnRequest.status !== 'return_requested') {
      return res.status(400).json({
        error: `Cannot accept return. Current status is: ${returnRequest.status}`,
      });
    }

    const result = await query(
      `UPDATE return_requests
       SET status = 'return_accepted', updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('acceptReturn error:', err);
    res.status(500).json({ error: err.message });
  }
};

const settleReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendor_id = req.user.id;

    const result = await query(
      `SELECT rr.* FROM return_requests rr
       JOIN orders o ON o.id = rr.order_id
       WHERE rr.id = $1 AND o.vendor_id = $2`,
      [id, vendor_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Return request not found' });

    await query(`UPDATE return_requests SET status = 'return_settled', updated_at = now() WHERE id = $1`, [id]);
    res.json({ id, status: 'return_settled' });
  } catch (err) { next(err); }
};

const cancelReturn = async (req, res, next) => {
  try {
    const { order_id } = req.params;
    const retailer_id = req.user.id;

    const result = await query(
      `SELECT rr.id, rr.status FROM return_requests rr
       WHERE rr.order_id = $1 AND rr.retailer_id = $2 AND rr.status = 'return_requested'`,
      [order_id, retailer_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No cancellable return request found for this order' });
    }

    const rr = result.rows[0];
    await query(`UPDATE return_requests SET status = 'return_cancelled', updated_at = now() WHERE id = $1`, [rr.id]);
    await query(`UPDATE orders SET status = 'confirmed', updated_at = now() WHERE id = $1`, [order_id]);

    res.json({ return_id: rr.id, status: 'return_cancelled' });
  } catch (err) { next(err); }
};

module.exports = { createReturn, getReturns, acceptReturn, settleReturn, cancelReturn };
