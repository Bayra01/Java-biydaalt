class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// async route алдааг error middleware руу дамжуулна
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const today = () => new Date().toISOString().slice(0, 10);

// Огноог шалгаад хонох шөнийн тоог буцаана
function parseStay(checkIn, checkOut, allowPast = false) {
  if (!DATE_RE.test(checkIn || '') || !DATE_RE.test(checkOut || '')) {
    throw new HttpError(400, 'checkIn/checkOut нь YYYY-MM-DD хэлбэртэй байх ёстой');
  }
  const a = new Date(checkIn + 'T00:00:00Z');
  const b = new Date(checkOut + 'T00:00:00Z');
  if (isNaN(a) || isNaN(b)) throw new HttpError(400, 'Огноо буруу байна');
  const nights = Math.round((b - a) / 86400000);
  if (nights <= 0) throw new HttpError(400, 'checkOut нь checkIn-ээс хойш байх ёстой');
  if (!allowPast && checkIn < today()) throw new HttpError(400, 'Өнгөрсөн огноо сонгох боломжгүй');
  return nights;
}

// Тайлангийн хугацаа: from < to, хамгийн ихдээ 366 хоног. Хоногийн тоог буцаана.
function parseRange(from, to) {
  if (!DATE_RE.test(from || '') || !DATE_RE.test(to || '')) {
    throw new HttpError(400, 'from/to нь YYYY-MM-DD хэлбэртэй байх ёстой');
  }
  const a = new Date(from + 'T00:00:00Z');
  const b = new Date(to + 'T00:00:00Z');
  if (isNaN(a) || isNaN(b)) throw new HttpError(400, 'Огноо буруу байна');
  const days = Math.round((b - a) / 86400000);
  if (days <= 0) throw new HttpError(400, 'Дуусах огноо нь эхлэх огнооноос хойш байх ёстой');
  if (days > 366) throw new HttpError(400, 'Хугацаа хамгийн ихдээ 366 хоног байж болно');
  return days;
}

const isStaff = (u) => u.role === 'RECEPTIONIST' || u.role === 'ADMIN';

module.exports = { HttpError, ah, today, parseStay, parseRange, isStaff };
