const { query } = require('../config/db');

const getAllProducts = async (req, res, next) => {
  try {
    const { category_id, vendor_id, q, model_id } = req.query;
    const role = req.user?.role;
    const userId = req.user?.id;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (role === 'vendor') {
      // Vendor sees only their own products
      conditions.push(`p.vendor_id = $${idx++}`);
      values.push(userId);
    } else {
      // Retailers and public see only approved vendors' products
      conditions.push(`v.is_approved = true`);
    }

    if (model_id) {
      conditions.push(`(p.model_id = $${idx++} OR p.model_id IS NULL)`);
      values.push(model_id);
    }

    if (category_id) {
      conditions.push(`p.category_id = $${idx++}`);
      values.push(category_id);
    }

    if (vendor_id) {
      conditions.push(`p.vendor_id = $${idx++}`);
      values.push(vendor_id);
    }

    if (q) {
      conditions.push(`(p.name ILIKE $${idx} OR p.sku ILIKE $${idx})`);
      values.push(`%${q}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT p.*, c.name AS category_name, v.name AS vendor_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN users v ON v.id = p.vendor_id
       ${where}
       ORDER BY p.name ASC`,
      values
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, sku, description, stock, category_id } = req.body;
    if (!name || !sku) {
      return res.status(400).json({ error: 'name and sku are required' });
    }

    const result = await query(
      `INSERT INTO products (name, sku, description, stock, vendor_id, category_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, sku, description || null, stock ?? 0, req.user.id, category_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sku, description, stock, category_id } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined)        { fields.push(`name = $${idx++}`);        values.push(name); }
    if (sku !== undefined)         { fields.push(`sku = $${idx++}`);         values.push(sku); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (stock !== undefined)       { fields.push(`stock = $${idx++}`);       values.push(stock); }
    if (category_id !== undefined) { fields.push(`category_id = $${idx++}`); values.push(category_id); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    values.push(id, req.user.id);
    const result = await query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} AND vendor_id = $${idx + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or access denied' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllProducts, createProduct, updateProduct };
