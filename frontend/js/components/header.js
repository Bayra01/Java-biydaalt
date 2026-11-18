import { S, isStaff } from '../state.js';
import { ROLE } from '../config.js';
import { $, esc } from '../utils.js';

export function renderHeader() {
  if (!S.user) { $('#nav').innerHTML = ''; $('#who').innerHTML = ''; return; }
  const u = S.user;
  const items = [['book', 'Өрөө захиалах']];
  if (u.role === 'CUSTOMER') items.push(['my', 'Миний захиалгууд'], ['notifications', 'Мэдэгдэл']);
  if (isStaff()) items.push(['staff', 'Ажилтны самбар']);
  if (u.role === 'ADMIN') items.push(['reports', 'Тайлан']);
  $('#nav').innerHTML = items.map(([v, l]) => `<button class="navbtn ${S.view === v ? 'on' : ''}" data-act="nav" data-view="${v}">${l}</button>`).join('');
  $('#who').innerHTML = `<span class="chip">${esc(u.name)} · ${ROLE[u.role]}</span><button class="btn ghost sm" data-act="logout">Гарах</button>`;
}
