// Нэвтрэх, бүртгүүлэх, гарах
import { S, newFlow, isStaff } from './state.js';
import { api } from './api.js';
import { $, parseJwt } from './utils.js';
import { toast } from './components/toast.js';
import { go, render } from './router.js';

export function openLogin() { S.authTab = 'login'; render(); }

export function logout(expired) {
  S.token = null; S.user = null;
  localStorage.removeItem('hotel_token'); localStorage.removeItem('hotel_user');
  S.flow = newFlow(); S.view = 'book'; S.data = null; S.authTab = 'login';
  if (expired) toast('Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.', 'bad');
  render();
}

export async function doAuth() {
  const tab = S.authTab;
  const v = (id) => ($('#' + id) ? $('#' + id).value.trim() : '');
  try {
    let path, body;
    if (tab === 'register') {
      path = '/auth/register';
      body = { fullName: v('m-name'), email: v('m-email'), phone: v('m-phone'), password: $('#m-pass').value };
    } else {
      path = tab === 'staff' ? '/auth/staff/login' : '/auth/login';
      body = { email: v('m-email'), password: $('#m-pass').value };
    }
    const r = await api(path, { method: 'POST', body });
    const p = parseJwt(r.token);
    const person = r.customer || r.staff || {};
    S.token = r.token;
    S.user = { id: p.id, role: p.role, name: person.fullName || person.full_name || body.email };
    localStorage.setItem('hotel_token', S.token);
    localStorage.setItem('hotel_user', JSON.stringify(S.user));
    toast('Тавтай морил, ' + S.user.name, 'ok');
    S.flow = newFlow();
    go(isStaff() ? 'staff' : 'book');
  } catch (e) { toast(e.message, 'bad'); }
}
