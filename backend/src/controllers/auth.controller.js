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
      'SELECT id, name, email, password, role, mobile, city, state FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
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

const getMe = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { login, getMe };
