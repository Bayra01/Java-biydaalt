// Өрөө захиалах хуудас: Хайх → Сул өрөө → Захиалга → Төлбөр → Баталгаажуулалт
import { S, isStaff } from '../state.js';
import { esc, money, isoDay, badge } from '../utils.js';
import { stepper } from '../components/stepper.js';

export function bookView() {
  const f = S.flow;
  let h = `<h1>Өрөө захиалах</h1><p class="muted">Огноогоо сонгоод сул өрөөг хайна уу.</p>` + stepper(f.step);
  if (f.step <= 1) h += searchForm() + (f.rooms ? roomsList() : '');
  else if (f.step === 2) h += reviewCard();
  else if (f.step === 3) h += payCard();
  else h += doneCard();
  return h;
}

function searchForm() {
  const q = S.flow.q;
  return `<div class="card"><div class="row">
    <div class="field"><label>Ирэх өдөр</label><input type="date" data-q="checkIn" min="${isoDay(0)}" value="${esc(q.checkIn)}"></div>
    <div class="field"><label>Гарах өдөр</label><input type="date" data-q="checkOut" min="${isoDay(0)}" value="${esc(q.checkOut)}"></div>
    <div class="field"><label>Зочдын тоо</label><select data-q="guests">
      ${['', 1, 2, 3, 4].map((g) => `<option value="${g}" ${String(q.guests) === String(g) ? 'selected' : ''}>${g === '' ? 'Дурын' : g}</option>`).join('')}</select></div>
    <div class="field"><label>Өрөөний төрөл</label><select data-q="type"><option value="">Бүгд</option>
      ${S.types.map((t) => `<option value="${t.id}" ${String(q.type) === String(t.id) ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div>
    <button class="btn primary" data-act="search">Хайх</button></div></div>`;
}

function roomsList() {
  const f = S.flow;
  if (!f.rooms.length) return `<div class="card empty" style="margin-top:14px">Энэ хугацаанд сул өрөө олдсонгүй. Огноо эсвэл төрлөө өөрчилж үзнэ үү.</div>`;
  return `<h2>${f.rooms.length} сул өрөө · ${f.nights} шөнө</h2><div class="grid">${f.rooms.map((r) => `
    <div class="card room"><div class="band t-${esc(r.type)}"></div><div class="pad">
      <div class="between"><h3>${esc(r.type)}</h3><span class="muted">№ ${esc(r.room_no)}</span></div>
      <p class="muted sm" style="margin:4px 0">${r.floor ? esc(r.floor) + '-р давхар · ' : ''}${esc(r.capacity)} хүртэл зочин</p>
      <div class="price">${money(r.price_per_night)} <small>/ шөнө</small></div>
      <div class="muted">${f.nights} шөнө: <b>${money(r.total_price)}</b></div>
      <button class="btn primary block" data-act="pick" data-id="${r.id}">Захиалах</button></div></div>`).join('')}</div>`;
}

function summaryList(f, r) {
  return `<dl class="kv"><dt>Өрөө</dt><dd>${esc(f.room.type || f.room.room_type)} · № ${esc(f.room.room_no)}</dd>
    <dt>Ирэх</dt><dd>${esc(f.q.checkIn)}</dd><dt>Гарах</dt><dd>${esc(f.q.checkOut)}</dd>
    ${r ? `<dt>Захиалгын №</dt><dd>#${esc(r.id)}</dd><dt>Нийт дүн</dt><dd>${money(r.total_price)}</dd>` : `<dt>Нийт дүн</dt><dd>${money(f.room.total_price)}</dd>`}</dl>`;
}

function reviewCard() {
  const f = S.flow;
  return `<div class="card" style="max-width:560px"><h3>Захиалгаа шалгана уу</h3>${summaryList(f)}
    <div class="notice info">Захиалга үүсмэгц өрөөг <b>15 минут</b> барина. Энэ хугацаанд төлбөрөө төлнө үү.</div>
    ${isStaff() ? `<div class="field" style="max-width:240px"><label>Зочны ID (customerId)</label><input type="number" data-f="customerId" value="${esc(f.customerId)}"></div>` : ''}
    <button class="btn primary" data-act="reserve" ${f.busy ? 'disabled' : ''}>Захиалга үүсгэх</button>
    <button class="btn" data-act="backsearch">Буцах</button></div>`;
}

function payCard() {
  const f = S.flow, r = f.reservation;
  const methods = [['CARD', 'Карт'], ['QPAY', 'QPay'], ['CASH', 'Бэлэн мөнгө']];
  return `<div class="card" style="max-width:560px"><div class="between"><h3>Төлбөр төлөх</h3>${badge(r.status)}</div>
    ${summaryList(f, r)}
    <div class="muted sm">Өрөө барих хугацаа</div><div class="timer" id="timer">--:--</div>
    <h3 style="margin-top:14px;font-size:15px">Төлбөрийн хэлбэр</h3>
    <div class="pay-opt">${methods.map(([v, l], i) => `<label><input type="radio" name="method" value="${v}" ${i === 0 ? 'checked' : ''}>${l}</label>`).join('')}</div>
    <label class="sm muted"><input type="checkbox" id="sim" style="width:auto"> Төлбөр амжилтгүй болохыг туршиж үзэх (mock)</label>
    <div style="margin-top:14px"><button class="btn primary" id="pay-btn" data-act="pay">${money(r.total_price)} төлөх</button>
    <button class="btn danger" data-act="cancel" data-id="${r.id}">Цуцлах</button></div></div>`;
}

function doneCard() {
  const f = S.flow, r = f.reservation, p = f.payment || {};
  return `<div class="card" style="max-width:560px"><div class="check">✓</div><h3>Захиалга баталгаажлаа</h3>
    <p class="muted">Баталгаажуулалтыг имэйлээр илгээлээ (Мэдэгдэл хэсгээс харна уу).</p>
    ${summaryList(f, r)}<dl class="kv"><dt>Төлбөр</dt><dd>${esc(p.method || '')} · ${badge(p.status || 'PAID')}</dd><dt>Гүйлгээний код</dt><dd>${esc(p.transaction_ref || '')}</dd></dl>
    <button class="btn primary" data-act="nav" data-view="my">Миний захиалгууд</button> <button class="btn" data-act="newbook">Дахин захиалах</button></div>`;
}
