// Програмын эхлэх цэг
import { S } from './state.js';
import { api, setUnauthorizedHandler } from './api.js';
import { parseJwt } from './utils.js';
import { toast } from './components/toast.js';
import { render, go } from './router.js';
import { logout, doAuth } from './auth.js';
import { ACT } from './actions/index.js';

setUnauthorizedHandler(() => logout(true));

// Бүх товчлуурын даралтыг нэг газраас зохицуулна (data-act)
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACT[el.dataset.act];
  if (fn) fn(el.dataset, el, e);
});

// Form-ын утгыг төлөвт хадгална
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.q) S.flow.q[t.dataset.q] = t.value;
  if (t.dataset.f) S.flow[t.dataset.f] = t.value;
  if (t.dataset.rep) S.rep[t.dataset.rep] = t.value;
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'flt') { S.filter = e.target.value; go('staff'); }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !S.user && e.target.closest('.authcard')) doAuth();
});

(async function init() {
  if (S.token) {
    const p = parseJwt(S.token);
    if (!p.exp || p.exp * 1000 < Date.now()) logout(false);
  }
  render();
  try { S.types = await api('/room-types'); render(); }
  catch (e) { toast('Серверт холбогдож чадсангүй', 'bad'); }
})();
