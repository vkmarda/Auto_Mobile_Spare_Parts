const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../config/env');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await query(
      'SELECT id, name, email, password, role, mobile, city, state, is_approved FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.role === 'vendor' && !user.is_approved) {
      return res.status(403).json({ error: 'Your vendor account is pending admin approval. You will be notified once approved.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, mobile: user.mobile, city: user.city, state: user.state },
    });
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, mobile, city, state, gst_number } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required' });
    }
    if (!['retailer', 'vendor'].includes(role)) {
      return res.status(400).json({ error: 'Role must be retailer or vendor' });
    }
    if (role === 'vendor' && !gst_number) {
      return res.status(400).json({ error: 'GST number is required for vendors' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const is_approved = role === 'retailer'; // retailers auto-approved, vendors need admin

    const result = await query(
      `INSERT INTO users (name, email, password, role, mobile, city, state, gst_number, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, email, role, is_approved`,
      [name, email, hashed, role, mobile || null, city || null, state || null, gst_number || null, is_approved]
    );
    const user = result.rows[0];

    if (role === 'vendor') {
      return res.status(201).json({ pending: true, message: 'Registration successful. Your account is pending admin approval.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

const getMe = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { login, register, getMe };
