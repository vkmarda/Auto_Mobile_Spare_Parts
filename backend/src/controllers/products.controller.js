const { query } = require('../config/db');

const getAllProducts = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM products ORDER BY name ASC',
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, sku, description, unit_price, stock } = req.body;
    if (!name || !sku || unit_price === undefined) {
      return res.status(400).json({ error: 'name, sku, and unit_price are required' });
    }

    const result = await query(
      `INSERT INTO products (name, sku, description, unit_price, stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, sku, description || null, unit_price, stock ?? 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sku, description, unit_price, stock } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined)        { fields.push(`name = $${idx++}`);        values.push(name); }
    if (sku !== undefined)         { fields.push(`sku = $${idx++}`);         values.push(sku); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (unit_price !== undefined)  { fields.push(`unit_price = $${idx++}`);  values.push(unit_price); }
    if (stock !== undefined)       { fields.push(`stock = $${idx++}`);       values.push(stock); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    values.push(id);
    const result = await query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllProducts, createProduct, updateProduct };
