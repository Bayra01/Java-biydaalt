// Зочны хуудсууд: Миний захиалгууд, Мэдэгдэл
import { S } from '../state.js';
import { esc } from '../utils.js';
import { resTable } from '../components/resTable.js';
import { needLogin, loading, errBox } from '../components/common.js';

export function myView() {
  if (!S.user) return needLogin('Захиалгаа харахын тулд нэвтэрнэ үү.');
  return `<h1>Миний захиалгууд</h1>` + (S.err ? errBox() : S.data ? resTable(S.data, 'my') : loading());
}

export function notifView() {
  if (!S.user) return needLogin('Мэдэгдлээ харахын тулд нэвтэрнэ үү.');
  let body = loading();
  if (S.err) body = errBox();
  else if (S.data) {
    body = S.data.length
      ? S.data.map((n) => `<div class="card" style="margin-bottom:10px"><div class="between"><b>${esc(n.type)}</b>
          <span class="muted sm">${esc(new Date(n.sent_at || Date.now()).toLocaleString())}</span></div><div>${esc(n.message)}</div></div>`).join('')
      : `<div class="card empty">Мэдэгдэл алга.</div>`;
  }
  return `<h1>Мэдэгдэл</h1>` + body;
}
