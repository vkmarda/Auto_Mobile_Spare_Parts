const { query } = require('../config/db');

const createDispatch = async (req, res, next) => {
  try {
    const vendor_id = req.user.id;
    const { city: filterCity, state: filterState, order_ids: filterOrderIds } = req.body || {};

    const params = [vendor_id];
    let whereExtra = '';
    if (filterCity) { whereExtra += ` AND u.city = $${params.length + 1}`; params.push(filterCity); }
    if (filterOrderIds?.length) { whereExtra += ` AND o.id = ANY($${params.length + 1}::uuid[])`; params.push(filterOrderIds); }

    const ordersResult = await query(
      `SELECT o.id, o.order_number, u.city, u.state, u.name AS retailer_name
       FROM orders o
       JOIN users u ON u.id = o.retailer_id
       WHERE o.status IN ('accepted', 'partial_confirmed') AND o.vendor_id = $1
       ${whereExtra}
       ORDER BY u.city`,
      params
    );
    if (ordersResult.rows.length === 0) {
      return res.status(400).json({ error: 'No accepted orders to dispatch' });
    }

    const byCity = {};
    for (const order of ordersResult.rows) {
      const key = order.city;
      if (!byCity[key]) byCity[key] = { city: order.city, state: order.state, orders: [] };
      byCity[key].orders.push(order);
    }

    const createdDispatches = [];
    for (const group of Object.values(byCity)) {
      const dispatchResult = await query(
        `INSERT INTO dispatches (city, state) VALUES ($1, $2) RETURNING *`,
        [group.city, group.state]
      );
      const dispatch = dispatchResult.rows[0];
      const orderIds = group.orders.map((o) => o.id);

      for (const orderId of orderIds) {
        await query(`INSERT INTO dispatch_orders (dispatch_id, order_id) VALUES ($1, $2)`, [dispatch.id, orderId]);
      }
      await query(`UPDATE orders SET status = 'dispatched', dispatched_at = now(), updated_at = now() WHERE id = ANY($1::uuid[])`, [orderIds]);

      // Return deliveries for same city
      const returnsResult = await query(
        `SELECT rr.id FROM return_requests rr
         JOIN orders o ON o.id = rr.order_id
         JOIN users u ON u.id = o.retailer_id
         WHERE rr.status = 'return_accepted' AND u.city = $1 AND o.vendor_id = $2`,
        [group.city, vendor_id]
      );

      let returnDelivery = null;
      if (returnsResult.rows.length > 0) {
        const rdResult = await query(
          `INSERT INTO return_deliveries (dispatch_id, city, state) VALUES ($1, $2, $3) RETURNING *`,
          [dispatch.id, group.city, group.state]
        );
        const rd = rdResult.rows[0];
        const returnIds = returnsResult.rows.map((r) => r.id);
        for (const retId of returnIds) {
          await query(`INSERT INTO return_delivery_requests (return_delivery_id, return_request_id) VALUES ($1, $2)`, [rd.id, retId]);
        }
        await query(`UPDATE return_requests SET status = 'return_dispatched', dispatched_at = now(), updated_at = now() WHERE id = ANY($1::uuid[])`, [returnIds]);
        returnDelivery = { id: rd.id, return_count: returnIds.length };
      }

      createdDispatches.push({
        id: dispatch.id,
        dispatch_number: dispatch.dispatch_number,
        city: group.city,
        state: group.state,
        order_count: orderIds.length,
        return_delivery: returnDelivery,
      });
    }

    res.status(201).json({ dispatches: createdDispatches });
  } catch (err) { next(err); }
};

const getDispatches = async (req, res) => {
  try {
    const dispatchResult = await query(`
      SELECT
        d.id,
        d.dispatch_number,
        d.city,
        d.state,
        d.status,
        d.created_at,
        COUNT(do2.order_id) AS order_count
      FROM dispatches d
      LEFT JOIN dispatch_orders do2 ON do2.dispatch_id = d.id
      GROUP BY d.id, d.dispatch_number, d.city, d.state,
               d.status, d.created_at
      ORDER BY d.created_at DESC
    `);

    const dispatches = await Promise.all(
      dispatchResult.rows.map(async (dispatch) => {
        const ordersResult = await query(`
          SELECT
            o.id,
            o.order_number,
            o.status,
            
            o.created_at,
            u.name AS retailer_name,
            u.city,
            u.state
          FROM dispatch_orders do2
          JOIN orders o ON o.id = do2.order_id
          JOIN users u ON u.id = o.retailer_id
          WHERE do2.dispatch_id = $1
        `, [dispatch.id]);

        const returnDeliveryResult = await query(`
          SELECT
            rd.id,
            rd.status,
            COUNT(rdr.return_request_id) AS return_count
          FROM return_deliveries rd
          LEFT JOIN return_delivery_requests rdr
            ON rdr.return_delivery_id = rd.id
          WHERE rd.dispatch_id = $1
          GROUP BY rd.id, rd.status
        `, [dispatch.id]);

        const rd = returnDeliveryResult.rows[0] || null;
        let returnRequests = [];
        if (rd) {
          const rrResult = await query(`
            SELECT
              rr.id,
              rr.return_number,
              rr.status,
              rr.reason,
              u.name AS retailer_name,
              u.city,
              u.state
            FROM return_delivery_requests rdr
            JOIN return_requests rr ON rr.id = rdr.return_request_id
            JOIN orders o ON o.id = rr.order_id
            JOIN users u ON u.id = o.retailer_id
            WHERE rdr.return_delivery_id = $1
            ORDER BY rr.return_number
          `, [rd.id]);
          returnRequests = rrResult.rows;
        }

        return {
          ...dispatch,
          order_count: parseInt(dispatch.order_count),
          orders: ordersResult.rows,
          return_delivery: rd
            ? { ...rd, return_count: parseInt(rd.return_count), requests: returnRequests }
            : null,
        };
      })
    );

    res.json(dispatches);
  } catch (err) {
    console.error('getDispatches error:', err);
    res.status(500).json({ error: err.message });
  }
};

const getDispatchSheet = async (req, res, next) => {
  try {
    const { id } = req.params;

    const dispatchRes = await query(`SELECT * FROM dispatches WHERE id = $1`, [id]);
    if (dispatchRes.rows.length === 0) return res.status(404).json({ error: 'Dispatch not found' });
    const dispatch = dispatchRes.rows[0];

    const ordersRes = await query(`
      SELECT o.id, o.order_number, o.order_type, o.status, o.notes,
             u.id AS retailer_id, u.name AS retailer_name, u.mobile, u.city, u.state
      FROM dispatch_orders do2
      JOIN orders o ON o.id = do2.order_id
      JOIN users u ON u.id = o.retailer_id
      WHERE do2.dispatch_id = $1
      ORDER BY o.order_number
    `, [id]);

    const orders = [];
    for (const order of ordersRes.rows) {
      let items = [];
      if (order.order_type === 'photo') {
        const photoRes = await query(`
          SELECT photo_url, vehicle_brand, vehicle_model, manufacture_year, quantity, note
          FROM order_photo_items WHERE order_id = $1 ORDER BY id
        `, [order.id]);
        items = photoRes.rows;
      } else {
        const itemsRes = await query(`
          SELECT COALESCE(oi.vehicle_brand, p.vehicle_brand) AS vehicle_brand,
                 COALESCE(oi.vehicle_model, p.vehicle_model) AS vehicle_model,
                 oi.quantity, p.name AS product_name, p.part_name, p.sku
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = $1
        `, [order.id]);
        items = itemsRes.rows;
      }
      orders.push({ ...order, items });
    }

    const rdRes = await query(`SELECT * FROM return_deliveries WHERE dispatch_id = $1`, [id]);
    let return_delivery = null;
    if (rdRes.rows.length > 0) {
      const rd = rdRes.rows[0];
      const rrRes = await query(`
        SELECT rr.id, rr.return_number, rr.status, rr.reason,
               u.id AS retailer_id, u.name AS retailer_name, u.mobile, u.city, u.state
        FROM return_delivery_requests rdr
        JOIN return_requests rr ON rr.id = rdr.return_request_id
        JOIN orders o ON o.id = rr.order_id
        JOIN users u ON u.id = o.retailer_id
        WHERE rdr.return_delivery_id = $1
        ORDER BY rr.return_number
      `, [rd.id]);

      const requests = [];
      for (const rr of rrRes.rows) {
        const itemsRes = await query(`
          SELECT ri.quantity,
                 COALESCE(p.name, '') AS product_name, COALESCE(p.part_name, '') AS part_name, COALESCE(p.sku, '') AS sku,
                 COALESCE(oi.vehicle_brand, p.vehicle_brand, '') AS vehicle_brand,
                 COALESCE(oi.vehicle_model, p.vehicle_model, '') AS vehicle_model,
                 opi.photo_url, opi.vehicle_brand AS photo_brand, opi.vehicle_model AS photo_model, opi.manufacture_year
          FROM return_items ri
          LEFT JOIN order_items oi ON oi.id = ri.order_item_id
          LEFT JOIN products p ON p.id = oi.product_id
          LEFT JOIN order_photo_items opi ON opi.id = ri.order_photo_item_id
          WHERE ri.return_request_id = $1
        `, [rr.id]);
        requests.push({ ...rr, items: itemsRes.rows });
      }
      return_delivery = { ...rd, requests };
    }

    res.json({ ...dispatch, orders, return_delivery });
  } catch (err) { next(err); }
};

module.exports = { createDispatch, getDispatches, getDispatchSheet };
