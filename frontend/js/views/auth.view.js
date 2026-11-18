// Нэвтрэх / Бүртгүүлэх / Ажилтан нэвтрэх хуудас
import { S } from '../state.js';

const TABS = [['login', 'Зочин нэвтрэх'], ['register', 'Бүртгүүлэх'], ['staff', 'Ажилтан']];
const HINTS = {
  login: 'Туршилт: demo@hotel.mn / demo123',
  register: '',
  staff: 'Ресепшн: reception@hotel.mn / recep123<br>Админ: admin@hotel.mn / admin123'
};

export function authView() {
  const t = S.authTab;
  return `<div class="authwrap"><div class="card authcard">
    <div class="center"><div class="mark big">G</div><h1>Grand Hotel</h1>
      <p class="muted">Захиалгын системд тавтай морилно уу. Үргэлжлүүлэхийн тулд нэвтэрнэ үү.</p></div>
    <div class="tabs">${TABS.map(([k, l]) => `<button class="tab ${t === k ? 'on' : ''}" data-act="mtab" data-tab="${k}">${l}</button>`).join('')}</div>
    ${t === 'register' ? `<div class="field"><label>Овог нэр</label><input id="m-name"></div><div class="field"><label>Утас</label><input id="m-phone"></div>` : ''}
    <div class="field"><label>Email</label><input id="m-email" type="email" autocomplete="username"></div>
    <div class="field"><label>Нууц үг</label><input id="m-pass" type="password" autocomplete="current-password"></div>
    ${HINTS[t] ? `<div class="muted sm">${HINTS[t]}</div>` : ''}
    <button class="btn primary block" data-act="auth">${t === 'register' ? 'Бүртгүүлэх' : 'Нэвтрэх'}</button>
  </div></div>`;
}
