const router = require('express').Router();
const pool = require('../config/db');
const { auth, role } = require('../middlewares/auth');
const { ah } = require('../utils');

router.get('/my', auth, role('CUSTOMER'), ah(async (req, res) => {
  const r = await pool.query(
    'SELECT * FROM notifications WHERE customer_id=$1 ORDER BY id DESC LIMIT 100', [req.user.id]);
  res.json(r.rows);
}));

module.exports = router;
