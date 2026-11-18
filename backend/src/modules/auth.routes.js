const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { ah, HttpError } = require('../utils');

const sign = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '8h' });

// Бүртгүүлэх
router.post('/register', ah(async (req, res) => {
  const { fullName, email, phone, password } = req.body;
  if (!fullName || !email || !password) throw new HttpError(400, 'fullName, email, password шаардлагатай');
  if (password.length < 6) throw new HttpError(400, 'Нууц үг хамгийн багадаа 6 тэмдэгт');
  const hash = await bcrypt.hash(password, 10);
  const r = await pool.query(
    `INSERT INTO customers(full_name, email, phone, password_hash)
     VALUES ($1,$2,$3,$4) RETURNING id, full_name, email, phone`,
    [fullName, email.toLowerCase(), phone || null, hash]
  );
  const c = r.rows[0];
  res.status(201).json({ customer: c, token: sign(c.id, 'CUSTOMER') });
}));

// Хэрэглэгч нэвтрэх
router.post('/login', ah(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new HttpError(400, 'email, password шаардлагатай');
  const r = await pool.query('SELECT * FROM customers WHERE email=$1', [email.toLowerCase()]);
  const c = r.rows[0];
  if (!c || !(await bcrypt.compare(password, c.password_hash))) {
    throw new HttpError(401, 'Email эсвэл нууц үг буруу');
  }
  res.json({ token: sign(c.id, 'CUSTOMER'), customer: { id: c.id, fullName: c.full_name, email: c.email } });
}));

// Ажилтан нэвтрэх
router.post('/staff/login', ah(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new HttpError(400, 'email, password шаардлагатай');
  const r = await pool.query('SELECT * FROM staff WHERE email=$1', [email.toLowerCase()]);
  const s = r.rows[0];
  if (!s || !(await bcrypt.compare(password, s.password_hash))) {
    throw new HttpError(401, 'Email эсвэл нууц үг буруу');
  }
  res.json({ token: sign(s.id, s.role), staff: { id: s.id, fullName: s.full_name, role: s.role } });
}));

module.exports = router;
