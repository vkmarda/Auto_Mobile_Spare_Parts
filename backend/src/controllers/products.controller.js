const { query } = require('../config/db');

const getAllProducts = async (req, res) => {
  try {
    const {
      category_id,
      vehicle_brand,
      vehicle_model,
      emission_standard,
      vehicle_type,
      search,
      limit = 48,
      offset = 0
    } = req.query

    let conditions = []
    let params = []
    let paramCount = 1

    if (category_id) {
      conditions.push(`p.category_id = $${paramCount}`)
      params.push(category_id)
      paramCount++
    }

    if (vehicle_brand) {
      conditions.push(`LOWER(p.vehicle_brand) = LOWER($${paramCount})`)
      params.push(vehicle_brand)
      paramCount++
    }

    if (vehicle_model) {
      conditions.push(`LOWER(p.vehicle_model) = LOWER($${paramCount})`)
      params.push(vehicle_model)
      paramCount++
    }

    if (emission_standard) {
      conditions.push(`LOWER(p.emission_standard) = LOWER($${paramCount})`)
      params.push(emission_standard)
      paramCount++
    }

    if (vehicle_type) {
      conditions.push(`LOWER(p.vehicle_type) = LOWER($${paramCount})`)
      params.push(vehicle_type)
      paramCount++
    }

    if (search) {
      conditions.push(`(
        LOWER(p.name) LIKE LOWER($${paramCount}) OR
        LOWER(p.part_name) LIKE LOWER($${paramCount}) OR
        LOWER(p.vehicle_model) LIKE LOWER($${paramCount}) OR
        LOWER(p.product_type) LIKE LOWER($${paramCount})
      )`)
      params.push(`%${search}%`)
      paramCount++
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : ''

    const countResult = await query(
      `SELECT COUNT(*) FROM products p ${whereClause}`,
      params
    )
    const totalCount = parseInt(countResult.rows[0].count)

    params.push(parseInt(limit))
    params.push(parseInt(offset))

    const result = await query(`
      SELECT
        p.id,
        p.name,
        p.part_name,
        p.sku,
        p.description,
        p.stock,
        p.image_url,
        p.product_type,
        p.vehicle_brand,
        p.vehicle_model,
        p.emission_standard,
        p.vehicle_type,
        p.model_variant,
        p.handle,
        p.created_at,
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'image_url', pi.image_url,
              'is_primary', pi.is_primary,
              'sort_order', pi.sort_order
            ) ORDER BY pi.sort_order
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) AS images
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN product_images pi ON pi.product_id = p.id
      ${whereClause}
      GROUP BY p.id, c.id, c.name, c.slug
      ORDER BY p.name ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, params)

    res.json({
      products: result.rows,
      total: totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + parseInt(limit) < totalCount
    })

  } catch (err) {
    console.error('getAllProducts error:', err)
    res.status(500).json({ error: err.message })
  }
}

const getProductById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await query(`
      SELECT
        p.*,
        c.name AS category_name,
        c.slug AS category_slug,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'image_url', pi.image_url,
              'is_primary', pi.is_primary,
              'sort_order', pi.sort_order
            ) ORDER BY pi.sort_order
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) AS images
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, c.name, c.slug
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

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

module.exports = { getAllProducts, getProductById, createProduct, updateProduct };
