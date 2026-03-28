const { query } = require('../config/db');

const getVehicleTypes = async (req, res, next) => {
  try {
    const result = await query('SELECT id, name, slug FROM vehicle_types ORDER BY name', []);
    res.json(result.rows);
  } catch (err) { next(err); }
};

const getBrands = async (req, res, next) => {
  try {
    const { vehicle_type_id } = req.query;
    if (!vehicle_type_id) return res.status(400).json({ error: 'vehicle_type_id required' });
    const result = await query(
      'SELECT id, name, slug FROM brands WHERE vehicle_type_id = $1 ORDER BY name',
      [vehicle_type_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const getModels = async (req, res, next) => {
  try {
    const { brand_id } = req.query;
    if (!brand_id) return res.status(400).json({ error: 'brand_id required' });
    const result = await query(
      'SELECT id, name, slug, year_from, year_to FROM models WHERE brand_id = $1 ORDER BY name',
      [brand_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const getCategories = async (req, res, next) => {
  try {
    const result = await query('SELECT id, name, slug, icon FROM categories ORDER BY name', []);
    res.json(result.rows);
  } catch (err) { next(err); }
};

module.exports = { getVehicleTypes, getBrands, getModels, getCategories };
