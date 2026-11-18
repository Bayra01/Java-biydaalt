// Захиалгын хүснэгт: mode = 'my' (зочин) | 'staff' (ресепшн, админ)
import { esc, money, badge } from '../utils.js';

export function resTable(rows, mode) {
  if (!rows.length) return `<div class="card empty">Захиалга алга.</div>`;
  return `<div class="card scroll"><table><thead><tr><th>#</th><th>Өрөө</th>${mode === 'staff' ? '<th>Зочин</th>' : ''}<th>Огноо</th><th>Дүн</th><th>Төлөв</th><th></th></tr></thead><tbody>
  ${rows.map((r) => {
    const exp = r.status === 'PENDING' && r.expires_at && new Date(r.expires_at) < new Date();
    return `<tr><td>${esc(r.id)}</td><td>${esc(r.room_no)}${r.room_type ? ' · ' + esc(r.room_type) : ''}</td>${mode === 'staff' ? `<td>${esc(r.customer_name)}</td>` : ''}
      <td>${esc(r.check_in)} → ${esc(r.check_out)}</td><td>${r.total_price != null ? money(r.total_price) : '—'}</td>
      <td>${badge(exp ? 'EXPIRED' : r.status)}</td><td>${rowActions(r, mode, exp)}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

function rowActions(r, mode, exp) {
  let a = '';
  const cancellable = ['PENDING', 'CONFIRMED'].includes(r.status);
  if (mode === 'my') {
    if (r.status === 'PENDING' && !exp) a += `<button class="btn primary sm" data-act="paynow" data-id="${r.id}">Төлөх</button> `;
  } else {
    if (r.status === 'CONFIRMED') a += `<button class="btn primary sm" data-act="checkin" data-id="${r.id}">Check-in</button> `;
    if (r.status === 'CHECKED_IN') a += `<button class="btn accent sm" data-act="checkout" data-id="${r.id}">Check-out</button> `;
  }
  if (cancellable) a += `<button class="btn danger sm" data-act="cancel" data-id="${r.id}">Цуцлах</button>`;
  return a;
}
