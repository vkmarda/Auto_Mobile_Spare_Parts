const { query } = require('../config/db');

const getPendingVendors = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, email, mobile, city, state, gst_number, created_at
       FROM users WHERE role = 'vendor' AND is_approved = false
       ORDER BY created_at ASC`,
      []
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const getAllVendors = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, email, mobile, city, state, gst_number, is_approved, created_at
       FROM users WHERE role = 'vendor' ORDER BY created_at DESC`,
      []
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const approveVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE users SET is_approved = true WHERE id = $1 AND role = 'vendor'
       RETURNING id, name, email, is_approved`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

const getAllRetailers = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, email, mobile, city, state, created_at
       FROM users WHERE role = 'retailer' ORDER BY created_at DESC`,
      []
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

module.exports = { getPendingVendors, getAllVendors, approveVendor, getAllRetailers };
