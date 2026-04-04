const { query } = require('../config/db');

const getVehicleTypes = async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT vehicle_type AS name
      FROM products
      WHERE vehicle_type IS NOT NULL
        AND vehicle_type != ''
      ORDER BY vehicle_type ASC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
};

const getBrands = async (req, res) => {
  try {
    const { vehicle_type } = req.query
    if (!vehicle_type) {
      return res.status(400).json({ error: 'vehicle_type required' })
    }

    const result = await query(`
      SELECT DISTINCT
        vehicle_brand AS name,
        COUNT(*) AS product_count
      FROM products
      WHERE LOWER(vehicle_type) = LOWER($1)
        AND vehicle_brand IS NOT NULL
        AND vehicle_brand != ''
      GROUP BY vehicle_brand
      ORDER BY vehicle_brand ASC
    `, [vehicle_type])

    res.json(result.rows)
  } catch (err) {
    console.error('getBrands error:', err)
    res.status(500).json({ error: err.message })
  }
};

const getModels = async (req, res) => {
  try {
    const { vehicle_brand, vehicle_type } = req.query
    if (!vehicle_brand) {
      return res.status(400).json({ error: 'vehicle_brand required' })
    }

    let conditions = [
      `LOWER(vehicle_brand) = LOWER($1)`,
      `vehicle_model IS NOT NULL`,
      `vehicle_model != ''`
    ]
    let params = [vehicle_brand]

    if (vehicle_type) {
      conditions.push(`LOWER(vehicle_type) = LOWER($2)`)
      params.push(vehicle_type)
    }

    const result = await query(`
      SELECT DISTINCT
        vehicle_model AS model_name,
        COUNT(*) AS product_count
      FROM products
      WHERE ${conditions.join(' AND ')}
      GROUP BY vehicle_model
      ORDER BY vehicle_model ASC
    `, params)

    res.json(result.rows)
  } catch (err) {
    console.error('getModels error:', err)
    res.status(500).json({ error: err.message })
  }
};

const getCategories = async (req, res, next) => {
  try {
    const result = await query('SELECT id, name, slug, icon FROM categories ORDER BY name', []);
    res.json(result.rows);
  } catch (err) { next(err); }
};

module.exports = { getVehicleTypes, getBrands, getModels, getCategories };
