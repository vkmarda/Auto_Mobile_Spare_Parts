const router = require('express').Router();
const { login, register, getMe } = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

router.post('/login',    login);
router.post('/register', register);
router.get('/me',        auth, getMe);

module.exports = router;
