const router = require('express').Router();
const pool = require('../config/db');
const { auth, role } = require('../middlewares/auth');
const { ah, HttpError, parseStay, isStaff, today } = require('../utils');
const { notify } = require('./notify');

const HOLD_MINUTES = parseInt(process.env.HOLD_MINUTES || '15', 10);

// Захиалгыг үзэх эрх: өөрийн захиалга эсвэл ажилтан
function assertAccess(user, reservation) {
  if (!isStaff(user) && reservation.customer_id !== user.id) {
    throw new HttpError(403, 'Энэ захиалгад хандах эрхгүй');
  }
}

/**
 * ЗАХИАЛГА ҮҮСГЭХ - давхар захиалгаас хамгаалсан гол хэсэг
 * 1) BEGIN
 * 2) Өрөөг SELECT ... FOR UPDATE-ээр түгжинэ (нэг өрөөний хүсэлтүүд дараалалд орно)
 * 3) Idempotency-Key шалгана (давхар дарснаас сэргийлнэ)
 * 4) INSERT -> PENDING (15 минут барина)
 * 5) DB-ийн EXCLUDE constraint нь сүүлчийн хаалт: давхцвал 23P01 алдаа
 */
router.post('/', auth, role('CUSTOMER', 'RECEPTIONIST', 'ADMIN'), ah(async (req, res) => {
  const key = req.get('Idempotency-Key');
  if (!key) throw new HttpError(400, 'Idempotency-Key header шаардлагатай');
  const { roomId, checkIn, checkOut } = req.body;
  const customerId = req.user.role === 'CUSTOMER' ? req.user.id : Number(req.body.customerId);
  if (!roomId || !customerId) throw new HttpError(400, 'roomId (болон ажилтан бол customerId) шаардлагатай');
  const nights = parseStay(checkIn, checkOut);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const room = await client.query(
      `SELECT r.id, r.status, t.price_per_night
       FROM rooms r JOIN room_types t ON t.id = r.room_type_id
       WHERE r.id = $1 FOR UPDATE OF r`, [roomId]);
    if (!room.rows[0]) throw new HttpError(404, 'Өрөө олдсонгүй');
    if (room.rows[0].status === 'MAINTENANCE') throw new HttpError(409, 'Өрөө засвартай байна');

    // Түгжээ авсны дараа idempotency шалгана
    const dup = await client.query('SELECT * FROM reservations WHERE idempotency_key=$1', [key]);
    if (dup.rows[0]) {
      if (dup.rows[0].customer_id !== customerId) {
        throw new HttpError(409, 'Idempotency-Key өөр захиалгад ашиглагдсан байна');
      }
      await client.query('COMMIT');
      return res.status(200).json({ reservation: dup.rows[0], idempotentReplay: true });
    }

    const total = Number(room.rows[0].price_per_night) * nights;
    const ins = await client.query(
      `INSERT INTO reservations(customer_id, room_id, check_in, check_out, total_price,
                                idempotency_key, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6, now() + ($7 || ' minutes')::interval)
       RETURNING *`,
      [customerId, roomId, checkIn, checkOut, total, key, String(HOLD_MINUTES)]);

    await client.query('COMMIT');
    res.status(201).json({
      reservation: ins.rows[0],
      message: `Өрөөг ${HOLD_MINUTES} минут барьж байна. Энэ хугацаанд төлбөр төлнө үү.`
    });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e; // 23P01 -> error middleware 409
  } finally {
    client.release();
  }
}));

router.get('/my', auth, role('CUSTOMER'), ah(async (req, res) => {
  const r = await pool.query(
    `SELECT v.*, rm.room_no, t.name AS room_type
     FROM reservations v JOIN rooms rm ON rm.id = v.room_id
     JOIN room_types t ON t.id = rm.room_type_id
     WHERE v.customer_id=$1 ORDER BY v.created_at DESC`, [req.user.id]);
  res.json(r.rows);
}));

// Ажилтан: бүх захиалга (шүүлттэй)
router.get('/', auth, role('RECEPTIONIST', 'ADMIN'), ah(async (req, res) => {
  const { status, from, to } = req.query;
  const r = await pool.query(
    `SELECT v.*, rm.room_no, c.full_name AS customer_name
     FROM reservations v JOIN rooms rm ON rm.id = v.room_id
     JOIN customers c ON c.id = v.customer_id
     WHERE ($1::text IS NULL OR v.status::text = $1)
       AND ($2::date IS NULL OR v.check_in >= $2)
       AND ($3::date IS NULL OR v.check_in <= $3)
     ORDER BY v.created_at DESC LIMIT 500`,
    [status || null, from || null, to || null]);
  res.json(r.rows);
}));

router.get('/:id', auth, ah(async (req, res) => {
  const r = await pool.query(
    `SELECT v.*, rm.room_no, t.name AS room_type
     FROM reservations v JOIN rooms rm ON rm.id = v.room_id
     JOIN room_types t ON t.id = rm.room_type_id WHERE v.id=$1`, [req.params.id]);
  if (!r.rows[0]) throw new HttpError(404, 'Захиалга олдсонгүй');
  assertAccess(req.user, r.rows[0]);
  const p = await pool.query('SELECT * FROM payments WHERE reservation_id=$1 ORDER BY id', [req.params.id]);
  res.json({ ...r.rows[0], payments: p.rows });
}));

// Цуцлах: check-in-ээс 2+ хоногийн өмнө бол бүрэн буцаалттай
router.post('/:id/cancel', auth, ah(async (req, res) => {
  const client = await pool.connect();
  let reservation, refunded = false;
  try {
    await client.query('BEGIN');
    const r = await client.query('SELECT * FROM reservations WHERE id=$1 FOR UPDATE', [req.params.id]);
    reservation = r.rows[0];
    if (!reservation) throw new HttpError(404, 'Захиалга олдсонгүй');
    assertAccess(req.user, reservation);
    if (!['PENDING', 'CONFIRMED'].includes(reservation.status)) {
      throw new HttpError(409, `${reservation.status} төлөвтэй захиалгыг цуцлах боломжгүй`);
    }
    if (reservation.status === 'CONFIRMED') {
      const daysLeft = (new Date(reservation.check_in + 'T00:00:00Z') - new Date(today() + 'T00:00:00Z')) / 86400000;
      if (daysLeft >= 2) {
        const p = await client.query(
          "UPDATE payments SET status='REFUNDED' WHERE reservation_id=$1 AND status='PAID'", [reservation.id]);
        refunded = p.rowCount > 0;
      }
    }
    await client.query("UPDATE reservations SET status='CANCELLED' WHERE id=$1", [reservation.id]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
  await notify(reservation.customer_id, 'CANCELLATION',
    `Таны #${reservation.id} захиалга цуцлагдлаа.${refunded ? ' Төлбөр буцаагдана.' : ''}`);
  res.json({ id: reservation.id, status: 'CANCELLED', refunded });
}));

module.exports = router;
