const router = require('express').Router();
const pool = require('../config/db');
const { auth, role } = require('../middlewares/auth');
const { ah, HttpError } = require('../utils');

router.get('/me', auth, role('CUSTOMER'), ah(async (req, res) => {
  const r = await pool.query(
    'SELECT id, full_name, email, phone, created_at FROM customers WHERE id=$1', [req.user.id]);
  res.json(r.rows[0]);
}));

router.put('/me', auth, role('CUSTOMER'), ah(async (req, res) => {
  const { fullName, phone } = req.body;
  const r = await pool.query(
    `UPDATE customers SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone)
     WHERE id=$3 RETURNING id, full_name, email, phone`,
    [fullName || null, phone || null, req.user.id]);
  res.json(r.rows[0]);
}));

router.get('/', auth, role('RECEPTIONIST', 'ADMIN'), ah(async (req, res) => {
  const r = await pool.query(
    'SELECT id, full_name, email, phone, created_at FROM customers ORDER BY id DESC LIMIT 200');
  res.json(r.rows);
}));

module.exports = router;
