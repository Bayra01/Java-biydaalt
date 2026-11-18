// Захиалгын урсгалын үйлдлүүд: хайх, сонгох, захиалах, төлөх, цуцлах
import { S, newFlow, isStaff } from '../state.js';
import { api } from '../api.js';
import { $, uuid } from '../utils.js';
import { toast } from '../components/toast.js';
import { go, render } from '../router.js';

export async function doSearch() {
  const q = S.flow.q;
  try {
    const qs = new URLSearchParams({ checkIn: q.checkIn, checkOut: q.checkOut });
    if (q.guests) qs.set('guests', q.guests);
    if (q.type) qs.set('type', q.type);
    const r = await api('/rooms/search?' + qs);
    S.flow.rooms = r.rooms; S.flow.nights = r.nights; S.flow.step = 1;
    render();
  } catch (e) { toast(e.message, 'bad'); }
}

export function pick(d) {
  const f = S.flow;
  f.room = f.rooms.find((r) => r.id == d.id);
  f.key = uuid();                       // Idempotency-Key: нэг сонголтод нэг түлхүүр
  f.step = 2; render();
}
export function backToSearch() { S.flow.step = 1; render(); }
export function newBooking() { S.flow = newFlow(); render(); }

export async function doReserve() {
  const f = S.flow;
  if (!S.user) return render();
  if (f.busy) return;
  const body = { roomId: f.room.id, checkIn: f.q.checkIn, checkOut: f.q.checkOut };
  if (isStaff()) {
    if (!f.customerId) return toast('Зочны ID оруулна уу', 'bad');
    body.customerId = Number(f.customerId);
  }
  f.busy = true;
  try {
    // Ижил түлхүүр = давхар дарсан ч нэг захиалга л үүснэ
    const r = await api('/reservations', { method: 'POST', body, headers: { 'Idempotency-Key': f.key } });
    f.reservation = r.reservation; f.step = 3; f.busy = false;
    render(); toast('Өрөөг 15 минут барьж байна', 'ok');
  } catch (e) {
    f.busy = false; toast(e.message, 'bad');
    if (e.status === 409) await doSearch();   // өрөө эзлэгдсэн: жагсаалтыг шинэчилнэ
    else render();
  }
}

export async function doPay() {
  const f = S.flow;
  const m = document.querySelector('input[name=method]:checked');
  try {
    const r = await api('/payments', { method: 'POST',
      body: { reservationId: f.reservation.id, method: m ? m.value : 'CARD', simulateFail: $('#sim').checked } });
    f.payment = r.payment; f.reservation.status = 'CONFIRMED'; f.step = 4;
    render(); toast('Төлбөр амжилттай', 'ok');
  } catch (e) {
    toast(e.message, 'bad');
    if (e.status === 410 || e.status === 409) {
      f.reservation.status = 'EXPIRED'; f.reservation.expires_at = new Date(0).toISOString(); render();
    }
  }
}

export async function doCancel(id) {
  if (!confirm('Захиалгыг цуцлах уу?')) return;
  try {
    const r = await api(`/reservations/${id}/cancel`, { method: 'POST' });
    toast(r.refunded ? 'Цуцлагдлаа. Төлбөр буцаагдана.' : 'Захиалга цуцлагдлаа', 'ok');
    if (S.flow.reservation && S.flow.reservation.id == id) S.flow = newFlow();
    go(S.view);
  } catch (e) { toast(e.message, 'bad'); }
}

// "Миний захиалгууд" -> хүлээгдэж буй захиалгын төлбөр рүү үргэлжлүүлэх
export async function payNow(id) {
  try {
    const r = await api('/reservations/' + id);
    S.flow = Object.assign(newFlow(), {
      step: 3, reservation: r,
      q: { checkIn: r.check_in, checkOut: r.check_out, guests: '', type: '' },
      room: { room_no: r.room_no, type: r.room_type }
    });
    go('book');
  } catch (e) { toast(e.message, 'bad'); }
}
