const { query } = require('../config/db');

const getOrderDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendor_id = req.user.id;

    const orderRes = await query(
      `SELECT o.id, o.order_number, o.status, o.order_type, o.notes,
              o.created_at, o.accepted_at, o.rejected_at, o.dispatched_at, o.delivered_at, o.confirmed_at,
              u.name AS retailer_name, u.mobile AS retailer_mobile,
              u.city AS retailer_city, u.state AS retailer_state
       FROM orders o
       JOIN users u ON u.id = o.retailer_id
       WHERE o.id = $1 AND o.vendor_id = $2`,
      [id, vendor_id]
    );
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderRes.rows[0];

    let itemsRes;
    if (order.order_type === 'photo') {
      itemsRes = await query(
        `SELECT id, photo_url, vehicle_brand, vehicle_model, manufacture_year, quantity, note
         FROM order_photo_items WHERE order_id = $1 ORDER BY id`,
        [id]
      );
    } else {
      itemsRes = await query(
        `SELECT oi.id, oi.quantity, oi.vehicle_brand, oi.vehicle_model,
                p.name AS product_name, p.part_name, p.sku
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1 ORDER BY oi.id`,
        [id]
      );
    }

    const dispatchRes = await query(
      `SELECT d.dispatch_number, d.status AS dispatch_status, d.city,
              d.created_at AS dispatched_at, d.updated_at AS dispatch_updated_at
       FROM dispatches d
       JOIN dispatch_orders dord ON dord.dispatch_id = d.id
       WHERE dord.order_id = $1
       ORDER BY d.created_at DESC LIMIT 1`,
      [id]
    );
    const dispatch = dispatchRes.rows[0] || null;

    const returnRes = await query(
      `SELECT rr.return_number, rr.status AS return_status, rr.reason,
              rr.created_at AS return_requested_at,
              rr.accepted_at, rr.dispatched_at AS return_dispatched_at,
              rr.received_at, rr.settled_at, rr.cancelled_at
       FROM return_requests rr
       WHERE rr.order_id = $1
       ORDER BY rr.created_at DESC LIMIT 1`,
      [id]
    );
    const ret = returnRes.rows[0] || null;

    // Build timeline using dedicated timestamp columns
    const timeline = [{ event: 'Order placed', time: order.created_at, type: 'placed' }];

    if (order.status === 'rejected') {
      timeline.push({ event: 'Order rejected', time: order.rejected_at, type: 'rejected' });
    } else {
      if (order.accepted_at) {
        timeline.push({ event: 'Order accepted', time: order.accepted_at, type: 'accepted' });
      }
      if (order.dispatched_at || dispatch) {
        timeline.push({ event: `Dispatched · ${dispatch?.dispatch_number || ''}`, time: order.dispatched_at || dispatch?.dispatched_at, type: 'dispatched' });
      }
      if (order.delivered_at) {
        timeline.push({ event: 'Delivered to retailer', time: order.delivered_at, type: 'delivered' });
      }
      if (order.confirmed_at) {
        timeline.push({ event: 'Receipt confirmed by retailer', time: order.confirmed_at, type: 'confirmed' });
      }
      if (ret) {
        timeline.push({ event: 'Return requested', time: ret.return_requested_at, type: 'return_requested' });
        if (ret.accepted_at)          timeline.push({ event: 'Return accepted',     time: ret.accepted_at,          type: 'return_accepted' });
        if (ret.return_dispatched_at) timeline.push({ event: 'Return in transit',   time: ret.return_dispatched_at, type: 'return_dispatched' });
        if (ret.received_at)          timeline.push({ event: 'Return received',      time: ret.received_at,          type: 'return_received' });
        if (ret.settled_at)           timeline.push({ event: 'Return settled',       time: ret.settled_at,           type: 'return_settled' });
        if (ret.cancelled_at)         timeline.push({ event: 'Return cancelled',     time: ret.cancelled_at,         type: 'return_cancelled' });
      }
    }

    res.json({ order, items: itemsRes.rows, dispatch, return: ret, timeline });
  } catch (err) { next(err); }
};

const getReturnDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendor_id = req.user.id;

    const returnRes = await query(
      `SELECT rr.id, rr.return_number, rr.status, rr.reason, rr.photos,
              rr.created_at, rr.accepted_at, rr.dispatched_at, rr.received_at, rr.settled_at, rr.cancelled_at,
              o.id AS order_id, o.order_number, o.order_type,
              u.name AS retailer_name, u.mobile AS retailer_mobile,
              u.city AS retailer_city, u.state AS retailer_state
       FROM return_requests rr
       JOIN orders o ON o.id = rr.order_id
       JOIN users u ON u.id = rr.retailer_id
       WHERE rr.id = $1 AND o.vendor_id = $2`,
      [id, vendor_id]
    );
    if (returnRes.rows.length === 0) return res.status(404).json({ error: 'Return not found' });
    const ret = returnRes.rows[0];

    const itemsRes = await query(
      `SELECT ri.id, ri.quantity,
              p.name AS product_name, p.sku,
              opi.photo_url, opi.vehicle_brand, opi.vehicle_model, opi.manufacture_year
       FROM return_items ri
       LEFT JOIN order_items oi ON oi.id = ri.order_item_id
       LEFT JOIN products p ON p.id = oi.product_id
       LEFT JOIN order_photo_items opi ON opi.id = ri.order_photo_item_id
       WHERE ri.return_request_id = $1`,
      [id]
    );

    const timeline = [{ event: 'Return requested', time: ret.created_at, type: 'return_requested' }];
    if (ret.accepted_at)   timeline.push({ event: 'Return accepted',   time: ret.accepted_at,   type: 'return_accepted' });
    if (ret.dispatched_at) timeline.push({ event: 'Return in transit', time: ret.dispatched_at, type: 'return_dispatched' });
    if (ret.received_at)   timeline.push({ event: 'Return received',   time: ret.received_at,   type: 'return_received' });
    if (ret.settled_at)    timeline.push({ event: 'Return settled',    time: ret.settled_at,    type: 'return_settled' });
    if (ret.cancelled_at)  timeline.push({ event: 'Return cancelled',  time: ret.cancelled_at,  type: 'return_cancelled' });

    res.json({ return: ret, items: itemsRes.rows, timeline });
  } catch (err) { next(err); }
};

module.exports = { getOrderDetail, getReturnDetail };
