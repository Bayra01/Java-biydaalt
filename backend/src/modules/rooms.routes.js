const router = require('express').Router();
const pool = require('../config/db');
const { auth, role } = require('../middlewares/auth');
const { ah, HttpError, parseStay } = require('../utils');

// Идэвхтэй захиалгатай давхцаж буй эсэхийг шалгах нөхцөл (дахин ашиглана)
const OVERLAP = `
  EXISTS (
    SELECT 1 FROM reservations x
    WHERE x.room_id = r.id
      AND x.status IN ('PENDING','CONFIRMED','CHECKED_IN')
      AND daterange(x.check_in, x.check_out, '[)') && daterange($1::date, $2::date, '[)')
  )`;

router.get('/room-types', ah(async (req, res) => {
  const r = await pool.query('SELECT * FROM room_types ORDER BY price_per_night');
  res.json(r.rows);
}));

// Өрөө хайх + сул эсэхийг шалгах
router.get('/rooms/search', ah(async (req, res) => {
  const { checkIn, checkOut, type, guests } = req.query;
  const nights = parseStay(checkIn, checkOut);
  const r = await pool.query(
    `SELECT r.id, r.room_no, r.floor, t.id AS room_type_id, t.name AS type,
            t.capacity, t.price_per_night, t.price_per_night * $5::int AS total_price
     FROM rooms r JOIN room_types t ON t.id = r.room_type_id
     WHERE r.status <> 'MAINTENANCE'
       AND ($3::bigint IS NULL OR t.id = $3)
       AND ($4::int IS NULL OR t.capacity >= $4)
       AND NOT ${OVERLAP}
     ORDER BY t.price_per_night, r.room_no`,
    [checkIn, checkOut, type || null, guests || null, nights]
  );
  res.json({ checkIn, checkOut, nights, count: r.rowCount, rooms: r.rows });
}));

// Нэг өрөөний сул эсэх
router.get('/rooms/:id/availability', ah(async (req, res) => {
  const { checkIn, checkOut } = req.query;
  parseStay(checkIn, checkOut);
  const r = await pool.query(
    `SELECT r.id, r.status <> 'MAINTENANCE' AS in_service, ${OVERLAP} AS booked
     FROM rooms r WHERE r.id = $3`,
    [checkIn, checkOut, req.params.id]
  );
  if (!r.rows[0]) throw new HttpError(404, 'Өрөө олдсонгүй');
  const { in_service, booked } = r.rows[0];
  res.json({ roomId: Number(req.params.id), checkIn, checkOut, available: in_service && !booked });
}));

router.get('/rooms/:id', ah(async (req, res) => {
  const r = await pool.query(
    `SELECT r.*, t.name AS type, t.price_per_night, t.capacity, t.description
     FROM rooms r JOIN room_types t ON t.id = r.room_type_id WHERE r.id=$1`, [req.params.id]);
  if (!r.rows[0]) throw new HttpError(404, 'Өрөө олдсонгүй');
  res.json(r.rows[0]);
}));

// ---- Админ ----
router.post('/rooms', auth, role('ADMIN'), ah(async (req, res) => {
  const { roomNo, roomTypeId, floor } = req.body;
  if (!roomNo || !roomTypeId) throw new HttpError(400, 'roomNo, roomTypeId шаардлагатай');
  const r = await pool.query(
    'INSERT INTO rooms(room_no, room_type_id, floor) VALUES ($1,$2,$3) RETURNING *',
    [roomNo, roomTypeId, floor || null]);
  res.status(201).json(r.rows[0]);
}));

router.put('/rooms/:id', auth, role('ADMIN'), ah(async (req, res) => {
  const { roomNo, roomTypeId, floor } = req.body;
  const r = await pool.query(
    `UPDATE rooms SET room_no = COALESCE($1, room_no),
            room_type_id = COALESCE($2, room_type_id), floor = COALESCE($3, floor)
     WHERE id=$4 RETURNING *`,
    [roomNo || null, roomTypeId || null, floor || null, req.params.id]);
  if (!r.rows[0]) throw new HttpError(404, 'Өрөө олдсонгүй');
  res.json(r.rows[0]);
}));

router.patch('/rooms/:id/status', auth, role('ADMIN'), ah(async (req, res) => {
  const { status } = req.body;
  if (!['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].includes(status)) {
    throw new HttpError(400, 'status: AVAILABLE | OCCUPIED | MAINTENANCE');
  }
  const r = await pool.query('UPDATE rooms SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
  if (!r.rows[0]) throw new HttpError(404, 'Өрөө олдсонгүй');
  res.json(r.rows[0]);
}));

router.delete('/rooms/:id', auth, role('ADMIN'), ah(async (req, res) => {
  const r = await pool.query('DELETE FROM rooms WHERE id=$1 RETURNING id', [req.params.id]);
  if (!r.rows[0]) throw new HttpError(404, 'Өрөө олдсонгүй');
  res.json({ deleted: r.rows[0].id });
}));

module.exports = router;
