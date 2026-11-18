const router = require('express').Router();
const pool = require('../config/db');
const { auth, role } = require('../middlewares/auth');
const { ah, parseRange } = require('../utils');

// Бүх тайлан зөвхөн АДМИН-д
router.use(auth, role('ADMIN'));

const ROW_LIMIT = 2000;

// ---------- 1. ТОЙМ ----------

// Өрөөний ашиглалтын хувь
router.get('/occupancy', ah(async (req, res) => {
  const { from, to } = req.query;
  const days = parseRange(from, to);
  const rooms = await pool.query("SELECT COUNT(*)::int AS n FROM rooms WHERE status <> 'MAINTENANCE'");
  const booked = await pool.query(
    `SELECT COALESCE(SUM(GREATEST(0, LEAST(check_out, $2::date) - GREATEST(check_in, $1::date))),0)::int AS nights
     FROM reservations
     WHERE status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT')
       AND check_in < $2::date AND check_out > $1::date`, [from, to]);
  const available = rooms.rows[0].n * days;
  const bookedNights = booked.rows[0].nights;
  res.json({
    from, to, rooms: rooms.rows[0].n, availableRoomNights: available, bookedRoomNights: bookedNights,
    occupancyPercent: available ? Math.round((bookedNights / available) * 1000) / 10 : 0
  });
}));

// Орлого (төлөгдсөн төлбөрөөр)
router.get('/revenue', ah(async (req, res) => {
  const { from, to } = req.query;
  parseRange(from, to);
  const total = await pool.query(
    `SELECT COALESCE(SUM(amount),0) AS revenue, COUNT(*)::int AS payments
     FROM payments WHERE status='PAID' AND paid_at >= $1::date AND paid_at < $2::date + 1`, [from, to]);
  const daily = await pool.query(
    `SELECT paid_at::date AS day, SUM(amount) AS revenue
     FROM payments WHERE status='PAID' AND paid_at >= $1::date AND paid_at < $2::date + 1
     GROUP BY 1 ORDER BY 1`, [from, to]);
  res.json({ from, to, ...total.rows[0], daily: daily.rows });
}));

// Захиалгын төлвөөр статистик
router.get('/reservations', ah(async (req, res) => {
  const { from, to } = req.query;
  parseRange(from, to);
  const r = await pool.query(
    `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total_price),0) AS total_price
     FROM reservations WHERE created_at >= $1::date AND created_at < $2::date + 1
     GROUP BY status ORDER BY status`, [from, to]);
  res.json({ from, to, byStatus: r.rows });
}));

// ---------- 2. ЗАХИАЛГЫН ДЭЛГЭРЭНГҮЙ ЖАГСААЛТ ----------
router.get('/reservations-list', ah(async (req, res) => {
  const { from, to } = req.query;
  parseRange(from, to);
  const r = await pool.query(
    `SELECT v.id, c.full_name AS customer_name, c.email, rm.room_no, t.name AS room_type,
            v.check_in, v.check_out, (v.check_out - v.check_in) AS nights,
            v.total_price, v.status, v.created_at
     FROM reservations v
     JOIN customers c ON c.id = v.customer_id
     JOIN rooms rm ON rm.id = v.room_id
     JOIN room_types t ON t.id = rm.room_type_id
     WHERE v.created_at >= $1::date AND v.created_at < $2::date + 1
     ORDER BY v.id DESC LIMIT ${ROW_LIMIT}`, [from, to]);
  res.json({ from, to, limit: ROW_LIMIT, count: r.rowCount, rows: r.rows });
}));

// ---------- 3. ТӨЛБӨРИЙН ТАЙЛАН ----------
router.get('/payments', ah(async (req, res) => {
  const { from, to } = req.query;
  parseRange(from, to);
  const when = 'COALESCE(p.paid_at, p.created_at)';
  const rows = await pool.query(
    `SELECT p.id, p.reservation_id, c.full_name AS customer_name, p.method, p.amount,
            p.status, p.transaction_ref, ${when} AS occurred_at
     FROM payments p
     JOIN reservations v ON v.id = p.reservation_id
     JOIN customers c ON c.id = v.customer_id
     WHERE ${when} >= $1::date AND ${when} < $2::date + 1
     ORDER BY occurred_at DESC LIMIT ${ROW_LIMIT}`, [from, to]);
  const byMethod = await pool.query(
    `SELECT p.method, p.status, COUNT(*)::int AS count, COALESCE(SUM(p.amount),0) AS total
     FROM payments p
     WHERE ${when} >= $1::date AND ${when} < $2::date + 1
     GROUP BY p.method, p.status ORDER BY p.method, p.status`, [from, to]);
  res.json({ from, to, limit: ROW_LIMIT, count: rows.rowCount, byMethod: byMethod.rows, rows: rows.rows });
}));

// ---------- 4. ӨРӨӨ БҮРИЙН АШИГЛАЛТ ----------
router.get('/rooms', ah(async (req, res) => {
  const { from, to } = req.query;
  const days = parseRange(from, to);
  // overlap = тухайн хугацаанд өрөө захиалгатай байсан шөнийн тоо.
  // АНХААР: GREATEST/LEAST нь NULL-ийг үл тоодог тул захиалгагүй өрөөг (LEFT JOIN) CASE-ээр 0 болгоно.
  const overlap = `(CASE WHEN v.id IS NULL THEN 0
                         ELSE GREATEST(0, LEAST(v.check_out, $2::date) - GREATEST(v.check_in, $1::date)) END)`;
  const r = await pool.query(
    `SELECT r.id, r.room_no, t.name AS room_type,
            COUNT(v.id)::int AS bookings,
            COALESCE(SUM(${overlap}),0)::int AS booked_nights,
            COALESCE(SUM(v.total_price * ${overlap}::numeric / (v.check_out - v.check_in)),0) AS revenue
     FROM rooms r
     JOIN room_types t ON t.id = r.room_type_id
     LEFT JOIN reservations v ON v.room_id = r.id
          AND v.status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT')
          AND v.check_in < $2::date AND v.check_out > $1::date
     GROUP BY r.id, r.room_no, t.name
     ORDER BY r.room_no`, [from, to]);
  const rows = r.rows.map((x) => ({
    ...x,
    utilization: Math.round((x.booked_nights / days) * 1000) / 10,
    revenue: Math.round(Number(x.revenue))
  }));
  const bookedNights = rows.reduce((a, x) => a + x.booked_nights, 0);
  res.json({
    from, to, days, rows,
    summary: {
      rooms: rows.length, bookedNights,
      utilization: rows.length ? Math.round((bookedNights / (rows.length * days)) * 1000) / 10 : 0
    }
  });
}));

// ---------- 5. ЗОЧДЫН ТАЙЛАН (хамгийн их захиалсан/төлсөн) ----------
router.get('/customers', ah(async (req, res) => {
  const { from, to } = req.query;
  parseRange(from, to);
  const r = await pool.query(
    `SELECT c.id, c.full_name, c.email, c.phone,
            COUNT(DISTINCT v.id)::int AS reservations,
            COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'PAID'), 0) AS total_paid
     FROM customers c
     JOIN reservations v ON v.customer_id = c.id
          AND v.created_at >= $1::date AND v.created_at < $2::date + 1
     LEFT JOIN payments p ON p.reservation_id = v.id
     GROUP BY c.id, c.full_name, c.email, c.phone
     ORDER BY total_paid DESC, reservations DESC
     LIMIT 50`, [from, to]);
  res.json({ from, to, limit: 50, count: r.rowCount, rows: r.rows });
}));

module.exports = router;
