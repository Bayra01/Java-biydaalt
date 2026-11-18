// Ажилтны самбар: Өнөөдөр · Бүх захиалга
import { S, isStaff } from '../state.js';
import { STATUS } from '../config.js';
import { esc } from '../utils.js';
import { resTable } from '../components/resTable.js';
import { needLogin, loading, errBox } from '../components/common.js';

export function staffView() {
  if (!isStaff()) return needLogin('Ажилтны эрхээр нэвтэрнэ үү.');
  const tabs = [['today', 'Өнөөдөр'], ['all', 'Бүх захиалга']];
  const head = `<h1>Ажилтны самбар</h1><div class="tabs">${tabs.map(([k, l]) =>
    `<button class="tab ${S.staffTab === k ? 'on' : ''}" data-act="stab" data-tab="${k}">${l}</button>`).join('')}</div>`;
  if (S.err) return head + errBox();
  if (!S.data) return head + loading();
  if (S.staffTab === 'today') return head + todayTab(S.data);
  return head + allTab(S.data);
}

function todayTab(d) {
  return `<div class="muted">Огноо: ${esc(d.date)}</div>
    <h2>Өнөөдөр ирэх (${d.arrivals.length})</h2>${resTable(d.arrivals, 'staff')}
    <h2>Өнөөдөр гарах (${d.departures.length})</h2>${resTable(d.departures, 'staff')}
    <h2>Одоо байрлаж буй (${d.inHouse.length})</h2>${resTable(d.inHouse, 'staff')}`;
}

function allTab(rows) {
  const statuses = Object.keys(STATUS).filter((k) => !['PAID', 'REFUNDED', 'FAILED'].includes(k));
  return `<div class="field" style="max-width:220px;margin-bottom:12px"><label>Төлөв</label><select id="flt"><option value="">Бүгд</option>
    ${statuses.map((k) => `<option value="${k}" ${S.filter === k ? 'selected' : ''}>${STATUS[k]}</option>`).join('')}</select></div>${resTable(rows, 'staff')}`;
}
