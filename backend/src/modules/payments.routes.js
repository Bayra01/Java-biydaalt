const router = require('express').Router();
const pool = require('../config/db');
const { auth, role } = require('../middlewares/auth');
const { ah, HttpError, isStaff } = require('../utils');
const { notify } = require('./notify');

// Төлбөр төлөх (mock gateway). body: { reservationId, method, simulateFail }
router.post('/', auth, role('CUSTOMER', 'RECEPTIONIST', 'ADMIN'), ah(async (req, res) => {
  const { reservationId, method = 'CARD', simulateFail = false } = req.body;
  if (!reservationId) throw new HttpError(400, 'reservationId шаардлагатай');
  if (!['CARD', 'QPAY', 'CASH'].includes(method)) throw new HttpError(400, 'method: CARD | QPAY | CASH');

  const client = await pool.connect();
  let reservation, payment;
  try {
    await client.query('BEGIN');
    const r = await client.query('SELECT * FROM reservations WHERE id=$1 FOR UPDATE', [reservationId]);
    reservation = r.rows[0];
    if (!reservation) throw new HttpError(404, 'Захиалга олдсонгүй');
    if (!isStaff(req.user) && reservation.customer_id !== req.user.id) {
      throw new HttpError(403, 'Энэ захиалгад хандах эрхгүй');
    }
    if (reservation.status !== 'PENDING') {
      throw new HttpError(409, `Захиалга ${reservation.status} төлөвтэй тул төлбөр төлөх боломжгүй`);
    }
    if (reservation.expires_at && new Date(reservation.expires_at) < new Date()) {
      await client.query("UPDATE reservations SET status='EXPIRED' WHERE id=$1", [reservation.id]);
      await client.query('COMMIT');
      throw new HttpError(410, 'Захиалгын хугацаа дууссан. Дахин захиална уу.');
    }

    if (simulateFail) {
      const f = await client.query(
        `INSERT INTO payments(reservation_id, amount, method, status)
         VALUES ($1,$2,$3,'FAILED') RETURNING *`,
        [reservation.id, reservation.total_price, method]);
      await client.query('COMMIT');
      return res.status(402).json({ error: 'Төлбөр амжилтгүй боллоо', payment: f.rows[0] });
    }

    const p = await client.query(
      `INSERT INTO payments(reservation_id, amount, method, status, transaction_ref, paid_at)
       VALUES ($1,$2,$3,'PAID',$4, now()) RETURNING *`,
      [reservation.id, reservation.total_price, method, 'MOCK-' + Date.now()]);
    payment = p.rows[0];
    await client.query(
      "UPDATE reservations SET status='CONFIRMED', expires_at=NULL WHERE id=$1", [reservation.id]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }

  await notify(reservation.customer_id, 'CONFIRMATION',
    `Таны #${reservation.id} захиалга баталгаажлаа (${reservation.check_in} - ${reservation.check_out}).`);
  res.status(201).json({ payment, reservationStatus: 'CONFIRMED' });
}));

router.get('/:id', auth, ah(async (req, res) => {
  const r = await pool.query(
    `SELECT p.*, v.customer_id FROM payments p
     JOIN reservations v ON v.id = p.reservation_id WHERE p.id=$1`, [req.params.id]);
  const p = r.rows[0];
  if (!p) throw new HttpError(404, 'Төлбөр олдсонгүй');
  if (!isStaff(req.user) && p.customer_id !== req.user.id) throw new HttpError(403, 'Эрхгүй');
  res.json(p);
}));

// Буцаалт (ресепшн/админ)
router.post('/:id/refund', auth, role('RECEPTIONIST', 'ADMIN'), ah(async (req, res) => {
  const client = await pool.connect();
  let customerId, reservationId;
  try {
    await client.query('BEGIN');
    const r = await client.query('SELECT * FROM payments WHERE id=$1 FOR UPDATE', [req.params.id]);
    const p = r.rows[0];
    if (!p) throw new HttpError(404, 'Төлбөр олдсонгүй');
    if (p.status !== 'PAID') throw new HttpError(409, 'Зөвхөн PAID төлбөрийг буцаана');
    await client.query("UPDATE payments SET status='REFUNDED' WHERE id=$1", [p.id]);
    const v = await client.query(
      `UPDATE reservations SET status='CANCELLED'
       WHERE id=$1 AND status IN ('PENDING','CONFIRMED') RETURNING customer_id, id`, [p.reservation_id]);
    customerId = v.rows[0] && v.rows[0].customer_id;
    reservationId = p.reservation_id;
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
  if (customerId) await notify(customerId, 'CANCELLATION', `#${reservationId} захиалгын төлбөр буцаагдлаа.`);
  res.json({ paymentId: Number(req.params.id), status: 'REFUNDED' });
}));

// Payment gateway callback (mock)
router.post('/webhook', (req, res) => res.json({ received: true }));

module.exports = router;
