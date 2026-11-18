// Тайлангийн хэсэг (зөвхөн админ): Тойм · Захиалга · Төлбөр · Өрөө · Зочид
import { S } from '../state.js';
import { STATUS } from '../config.js';
import { esc, money, badge } from '../utils.js';
import { REPORTS, tableHtml } from '../reportDefs.js';
import { loading, errBox } from '../components/common.js';

export function reportsView() {
  if (!S.user || S.user.role !== 'ADMIN') {
    return `<div class="card empty">Тайлан харах эрх зөвхөн админд байна.</div>`;
  }
  const def = REPORTS[S.reportType];
  const { from, to } = S.rep;
  const tabs = Object.entries(REPORTS).map(([k, d]) =>
    `<button class="tab ${S.reportType === k ? 'on' : ''}" data-act="rtab" data-type="${k}">${d.label}</button>`).join('');
  const presets = [['7', 'Сүүлийн 7 хоног'], ['30', 'Сүүлийн 30 хоног'], ['90', 'Сүүлийн 90 хоног'], ['month', 'Энэ сар']]
    .map(([k, l]) => `<button class="btn" data-act="preset" data-p="${k}">${l}</button>`).join('');

  return `<h1 class="no-print">Тайлан</h1>
    <div class="tabs no-print">${tabs}</div>
    <div class="card no-print"><div class="presets">${presets}</div><div class="row">
      <div class="field"><label>Эхлэх</label><input type="date" data-rep="from" value="${esc(from)}"></div>
      <div class="field"><label>Дуусах</label><input type="date" data-rep="to" value="${esc(to)}"></div>
      <button class="btn primary" data-act="loadrep">Шинэчлэх</button>
      <button class="btn" data-act="csv" ${S.data ? '' : 'disabled'}>CSV татах</button>
      <button class="btn" data-act="print" ${S.data ? '' : 'disabled'}>Хэвлэх / PDF</button></div></div>
    <div class="print-only"><h2>Grand Hotel — ${esc(def.label)} тайлан</h2>
      <div>Хугацаа: ${esc(from)} — ${esc(to)} · Хэвлэсэн: ${esc(new Date().toLocaleString())} · ${esc(S.user.name)}</div></div>
    <div style="margin-top:14px">${body()}</div>`;
}

function body() {
  if (S.err) return errBox();
  if (!S.data) return loading();
  const d = S.data;
  const trunc = d.count >= d.limit ? `<div class="notice warn">Эхний ${esc(d.limit)} мөрийг харуулав. Хугацаагаа нарийсгана уу.</div>` : '';
  switch (S.reportType) {
    case 'summary': return summary(d);
    case 'reservations': return reservationsBody(d, trunc);
    case 'payments': return paymentsBody(d, trunc);
    case 'rooms': return roomsBody(d);
    default: return trunc + `<div class="muted sm" style="margin-bottom:8px">Төлсөн дүнгээр эрэмбэлсэн, эхний ${esc(d.limit)} зочин</div>` + tableHtml(REPORTS.customers, d.rows);
  }
}

const stat = (n, l) => `<div class="card stat"><div class="n">${n}</div><div class="l">${l}</div></div>`;

function summary(d) {
  const max = Math.max(1, ...d.rev.daily.map((x) => Number(x.revenue)));
  const daily = d.rev.daily.length
    ? d.rev.daily.map((x) => `<div class="b"><span>${esc(x.day)}</span><div class="t"><i style="width:${Math.round(Number(x.revenue) / max * 100)}%"></i></div><span>${money(x.revenue)}</span></div>`).join('')
    : '<div class="muted">Энэ хугацаанд төлбөр алга.</div>';
  const byStatus = d.res.byStatus.map((x) => `<tr><td>${badge(x.status)}</td><td class="num">${esc(x.count)}</td><td class="num">${money(x.total_price)}</td></tr>`).join('')
    || '<tr><td colspan="3" class="muted">Мэдээлэл алга</td></tr>';
  return `<div class="grid">
      ${stat(esc(d.occ.occupancyPercent) + '%', 'Өрөөний ашиглалт')}
      ${stat(`${esc(d.occ.bookedRoomNights)} / ${esc(d.occ.availableRoomNights)}`, 'Захиалгат / боломжит шөнө')}
      ${stat(money(d.rev.revenue), `Орлого (${esc(d.rev.payments)} төлбөр)`)}</div>
    <h2>Өдрийн орлого</h2><div class="card bars">${daily}</div>
    <h2>Захиалгын статистик</h2><div class="card scroll"><table><thead><tr><th>Төлөв</th><th class="num">Тоо</th><th class="num">Нийт дүн</th></tr></thead><tbody>${byStatus}</tbody></table></div>`;
}

function reservationsBody(d, trunc) {
  const active = d.rows.filter((r) => ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(r.status));
  const sum = active.reduce((a, r) => a + Number(r.total_price), 0);
  return `<div class="grid" style="margin-bottom:14px">${stat(esc(d.count), 'Нийт захиалга')}${stat(esc(active.length), 'Баталгаажсан (цуцлагдаагүй)')}${stat(money(sum), 'Баталгаажсан захиалгын дүн')}</div>`
    + trunc + tableHtml(REPORTS.reservations, d.rows);
}

function paymentsBody(d, trunc) {
  const total = (st) => d.byMethod.filter((x) => x.status === st).reduce((a, x) => a + Number(x.total), 0);
  const count = (st) => d.byMethod.filter((x) => x.status === st).reduce((a, x) => a + x.count, 0);
  const methods = d.byMethod.filter((x) => x.status === 'PAID')
    .map((x) => `<tr><td>${esc(x.method)}</td><td class="num">${esc(x.count)}</td><td class="num">${money(x.total)}</td></tr>`).join('')
    || '<tr><td colspan="3" class="muted">Төлөгдсөн төлбөр алга</td></tr>';
  return `<div class="grid" style="margin-bottom:14px">${stat(money(total('PAID')), `Төлөгдсөн (${count('PAID')})`)}
      ${stat(money(total('REFUNDED')), `Буцаагдсан (${count('REFUNDED')})`)}${stat(esc(count('FAILED')), STATUS.FAILED + ' оролдлого')}</div>
    <h2>Төлбөрийн хэлбэрээр (төлөгдсөн)</h2><div class="card scroll"><table><thead><tr><th>Хэлбэр</th><th class="num">Тоо</th><th class="num">Дүн</th></tr></thead><tbody>${methods}</tbody></table></div>
    <h2>Бүх гүйлгээ</h2>` + trunc + tableHtml(REPORTS.payments, d.rows);
}

function roomsBody(d) {
  return `<div class="grid" style="margin-bottom:14px">${stat(esc(d.summary.utilization) + '%', 'Нийт ашиглалт')}
      ${stat(esc(d.summary.bookedNights), 'Захиалгат шөнө')}${stat(esc(d.summary.rooms), `Өрөө (${esc(d.days)} хоног)`)}</div>
    <div class="muted sm" style="margin-bottom:8px">Орлого нь захиалгын дүнг тухайн хугацаанд ногдох шөнөөр хуваарилж тооцсон.</div>` + tableHtml(REPORTS.rooms, d.rows);
}
