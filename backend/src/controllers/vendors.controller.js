const { query } = require('../config/db');

const getVendors = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, city, state FROM users WHERE role = 'vendor' ORDER BY name`,
      []
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

module.exports = { getVendors };
