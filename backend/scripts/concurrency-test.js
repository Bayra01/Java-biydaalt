// Зэрэг захиалгын тест. Эхлээд сервер ажиллаж байх ёстой (npm run dev).
// Ажиллуулах: npm run test:concurrency [roomId]
const BASE = process.env.BASE_URL || 'http://localhost:3000/api';

async function api(path, { method = 'GET', headers = {}, body } = {}) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await r.json(); } catch (e) { /* ignore */ }
  return { status: r.status, data };
}
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const count = (arr, s) => arr.filter((x) => x.status === s).length;

(async () => {
  const login = await api('/auth/login', { method: 'POST', body: { email: 'demo@hotel.mn', password: 'demo123' } });
  if (login.status !== 200) { console.error('Нэвтэрч чадсангүй. npm run seed ажиллуулсан уу?'); process.exit(1); }
  const auth = { Authorization: 'Bearer ' + login.data.token };
  const roomId = Number(process.argv[2] || 1);

  // ---- ТЕСТ 1: 20 хүсэлт нэг өрөө, нэг огноонд зэрэг ----
  let off = 300 + Math.floor(Math.random() * 300);
  const N = 20;
  const t1 = await Promise.all(Array.from({ length: N }, (_, i) =>
    api('/reservations', {
      method: 'POST',
      headers: { ...auth, 'Idempotency-Key': `t1-${Date.now()}-${i}` },
      body: { roomId, checkIn: day(off), checkOut: day(off + 2) }
    })));
  const ok1 = count(t1, 201), conflict1 = count(t1, 409);
  console.log(`\nТЕСТ 1: ${N} хүн нэг өрөөг зэрэг захиалав`);
  console.log(`  201 Created : ${ok1}`);
  console.log(`  409 Conflict: ${conflict1}`);
  console.log(`  Бусад       : ${N - ok1 - conflict1}`);
  console.log(ok1 === 1 && conflict1 === N - 1 ? '  => PASS: яг 1 захиалга үүссэн' : '  => FAIL');

  // ---- ТЕСТ 2: ижил Idempotency-Key-ээр 10 удаа дарах ----
  off += 10;
  const key = `t2-${Date.now()}`;
  const t2 = await Promise.all(Array.from({ length: 10 }, () =>
    api('/reservations', {
      method: 'POST',
      headers: { ...auth, 'Idempotency-Key': key },
      body: { roomId, checkIn: day(off), checkOut: day(off + 2) }
    })));
  const ids = new Set(t2.filter((x) => x.data && x.data.reservation).map((x) => x.data.reservation.id));
  console.log('\nТЕСТ 2: ижил Idempotency-Key-ээр 10 удаа дарав');
  console.log(`  201: ${count(t2, 201)}, 200 (replay): ${count(t2, 200)}, бусад: ${10 - count(t2, 201) - count(t2, 200)}`);
  console.log(`  Үүссэн ялгаатай захиалгын тоо: ${ids.size}`);
  console.log(ids.size === 1 && count(t2, 201) === 1 ? '  => PASS: нэг л захиалга үүссэн' : '  => FAIL');
})();
