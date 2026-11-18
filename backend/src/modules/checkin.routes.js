const router = require('express').Router();
const pool = require('../config/db');
const { auth, role } = require('../middlewares/auth');
const { ah, HttpError, today } = require('../utils');

const staff = [auth, role('RECEPTIONIST', 'ADMIN')];

// Check-in: CONFIRMED + өнөөдөр check_in өдөр эсвэл түүнээс хойш, check_out өмнө
router.post('/reservations/:id/check-in', staff, ah(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query('SELECT * FROM reservations WHERE id=$1 FOR UPDATE', [req.params.id]);
    const v = r.rows[0];
    if (!v) throw new HttpError(404, 'Захиалга олдсонгүй');
    if (v.status !== 'CONFIRMED') throw new HttpError(409, `Check-in хийх боломжгүй. Төлөв: ${v.status}`);
    const t = today();
    if (t < v.check_in) throw new HttpError(409, `Check-in өдөр ${v.check_in} болоогүй байна`);
    if (t >= v.check_out) throw new HttpError(409, 'Захиалгын хугацаа өнгөрсөн байна');
    await client.query("UPDATE reservations SET status='CHECKED_IN' WHERE id=$1", [v.id]);
    await client.query("UPDATE rooms SET status='OCCUPIED' WHERE id=$1", [v.room_id]);
    await client.query('COMMIT');
    res.json({ id: v.id, status: 'CHECKED_IN' });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

router.post('/reservations/:id/check-out', staff, ah(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query('SELECT * FROM reservations WHERE id=$1 FOR UPDATE', [req.params.id]);
    const v = r.rows[0];
    if (!v) throw new HttpError(404, 'Захиалга олдсонгүй');
    if (v.status !== 'CHECKED_IN') throw new HttpError(409, `Check-out хийх боломжгүй. Төлөв: ${v.status}`);
    await client.query("UPDATE reservations SET status='CHECKED_OUT' WHERE id=$1", [v.id]);
    await client.query("UPDATE rooms SET status='AVAILABLE' WHERE id=$1", [v.room_id]);
    await client.query('COMMIT');
    res.json({ id: v.id, status: 'CHECKED_OUT' });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

// Өнөөдөр ирэх / гарах / одоо байгаа зочид
router.get('/checkin/today', staff, ah(async (req, res) => {
  const t = today();
  const q = (where) => pool.query(
    `SELECT v.id, v.status, v.check_in, v.check_out, rm.room_no, c.full_name AS customer_name
     FROM reservations v JOIN rooms rm ON rm.id=v.room_id JOIN customers c ON c.id=v.customer_id
     WHERE ${where} ORDER BY rm.room_no`, [t]);
  const [arrivals, departures, inHouse] = await Promise.all([
    q("v.check_in = $1 AND v.status = 'CONFIRMED'"),
    q("v.check_out = $1 AND v.status = 'CHECKED_IN'"),
    q("$1::date IS NOT NULL AND v.status = 'CHECKED_IN'")
  ]);
  res.json({ date: t, arrivals: arrivals.rows, departures: departures.rows, inHouse: inHouse.rows });
}));

module.exports = router;
