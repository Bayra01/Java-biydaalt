// ???????, ??????????, ?????
import { S, newFlow, isStaff } from './state.js';
import { api } from './api.js';
import { $, parseJwt } from './utils.js';
import { toast } from './components/toast.js';
import { go, render } from './router.js';

export function openLogin() { S.authTab = 'login'; render(); }

function clearSession() {
  localStorage.removeItem('hotel_token'); localStorage.removeItem('hotel_user');
  sessionStorage.removeItem('hotel_token'); sessionStorage.removeItem('hotel_user');
}

export function logout(expired) {
  S.token = null; S.user = null;
  clearSession();
  S.flow = newFlow(); S.view = 'book'; S.data = null; S.authTab = 'login';
  if (expired) toast('??????? ??????? ???????. ????? ???????? ??.', 'bad');
  render();
}

export function togglePassword(btn) {
  const input = $('#m-pass');
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  if (!btn) return;
  btn.classList.toggle('is-on', show);
  btn.setAttribute('aria-pressed', show ? 'true' : 'false');
  btn.setAttribute('aria-label', show ? '???? ?? ????' : '???? ?? ?????');
}

export async function doAuth() {
  const tab = S.authTab;
  const v = (id) => ($('#' + id) ? $('#' + id).value.trim() : '');
  const email = v('m-email');
  const passEl = $('#m-pass');
  const password = passEl ? passEl.value : '';
  if (tab === 'register' && !v('m-name')) { toast('???? ??? ????????????.', 'bad'); return; }
  if (!email) { toast('????? ?????? ??????? ??.', 'bad'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('??? ????? ???? ??????? ??.', 'bad'); return; }
  if (!password) { toast('???? ???? ??????? ??.', 'bad'); return; }
  if (tab === 'register' && password.length < 6) { toast('???? ?? ??????? ??????? 6 ???????.', 'bad'); return; }
  try {
    let path, body;
    if (tab === 'register') {
      path = '/auth/register';
      body = { fullName: v('m-name'), email, phone: v('m-phone'), password };
    } else {
      path = tab === 'staff' ? '/auth/staff/login' : '/auth/login';
      body = { email, password };
    }
    const r = await api(path, { method: 'POST', body });
    const p = parseJwt(r.token);
    const person = r.customer || r.staff || {};
    S.token = r.token;
    S.user = { id: p.id, role: p.role, name: person.fullName || person.full_name || body.email };
    const remember = !$('#m-remember') || $('#m-remember').checked;
    const store = remember ? localStorage : sessionStorage;
    clearSession();
    store.setItem('hotel_token', S.token);
    store.setItem('hotel_user', JSON.stringify(S.user));
    toast('?????? ?????, ' + S.user.name, 'ok');
    S.flow = newFlow();
    go(isStaff() ? 'staff' : 'book');
  } catch (e) { toast(e.message, 'bad'); }
}
