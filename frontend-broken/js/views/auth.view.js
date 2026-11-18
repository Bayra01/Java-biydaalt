// ??????? / ?????????? / ??????? ????????
import { S } from '../state.js';

const TABS = [['login', '????? ???????'], ['register', '??????????'], ['staff', '???????']];
const HINTS = {
  login: '???????: demo@hotel.mn / demo123',
  register: '',
  staff: '???????: reception@hotel.mn / recep123<br>?????: admin@hotel.mn / admin123'
};

const EYE = `<button type="button" class="eye" data-act="togglepass" aria-label="???? ?? ?????" aria-pressed="false">
  <svg class="i-show" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
  <svg class="i-hide" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.39-1.61"/><path d="M2 2l20 20"/></svg>
</button>`;

const SCENE = `<svg class="auth-scene" viewBox="0 0 900 1100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="ghSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a4650"/><stop offset="58%" stop-color="#123F3F"/><stop offset="100%" stop-color="#0c2428"/>
    </linearGradient>
    <pattern id="ghWin" width="64" height="78" patternUnits="userSpaceOnUse">
      <rect width="64" height="78" fill="#102e30"/>
      <rect x="16" y="14" width="26" height="36" fill="#e7efee" opacity=".16"/>
      <rect x="16" y="14" width="26" height="1.6" fill="#C99A3B" opacity=".5"/>
    </pattern>
  </defs>
  <rect width="900" height="1100" fill="url(#ghSky)"/>
  <rect x="30" y="500" width="190" height="600" fill="#0e3032"/>
  <rect x="680" y="450" width="190" height="650" fill="#0e3032"/>
  <polygon points="140,230 450,78 760,230" fill="#14383a"/>
  <polygon points="230,228 450,118 670,228" fill="none" stroke="#C99A3B" stroke-width="1.5" opacity=".75"/>
  <rect x="150" y="222" width="600" height="8" fill="#C99A3B" opacity=".8"/>
  <rect x="160" y="230" width="580" height="870" fill="url(#ghWin)"/>
  <rect x="250" y="748" width="400" height="14" fill="#C99A3B" opacity=".72"/>
  <g fill="#184544">
    <rect x="286" y="762" width="26" height="338"/><rect x="386" y="762" width="26" height="338"/>
    <rect x="488" y="762" width="26" height="338"/><rect x="588" y="762" width="26" height="338"/>
  </g>
  <path d="M392 1100 V912 a58 58 0 0 1 116 0 V1100 Z" fill="#081618"/>
  <path d="M392 912 a58 58 0 0 1 116 0" fill="none" stroke="#C99A3B" stroke-width="1.75" opacity=".85"/>
</svg>`;

function field(id, label, type, attrs) {
  return `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="${type}" ${attrs}></div>`;
}

export function authView() {
  const t = S.authTab;
  const passAuto = t === 'register' ? 'new-password' : 'current-password';
  return `<div class="auth-shell">
    <section class="auth-brand" aria-label="Grand Hotel">
      ${SCENE}
      <div class="auth-brand-inner">
        <div class="auth-wordmark"><span class="mark" aria-hidden="true">G</span><span>Grand Hotel</span></div>
        <hr class="auth-rule">
        <h1>Grand Hotel Management System</h1>
        <p>????? ??????? ??? ?????????? ??? ?????? ??????? ???? ??????.</p>
      </div>
    </section>
    <section class="authcard auth-panel" aria-label="???????">
      <div class="auth-panel-inner">
        <div class="panel-brand"><span class="mark" aria-hidden="true">G</span><span>Grand Hotel</span></div>
        <h2>?????? ??????? ??</h2>
        <p class="muted">??????? ??????? ????? ??????? ???????? ??.</p>
        <div class="tabs auth-tabs" role="tablist">${TABS.map(([k, l]) =>
          `<button class="tab ${t === k ? 'on' : ''}" role="tab" aria-selected="${t === k}" data-act="mtab" data-tab="${k}">${l}</button>`
        ).join('')}</div>
        ${t === 'register' ? field('m-name', '???? ???', 'text', 'autocomplete="name" required') + field('m-phone', '????', 'tel', 'autocomplete="tel"') : ''}
        ${field('m-email', '?????', 'email', `autocomplete="${t === 'register' ? 'email' : 'username'}" required`)}
        <div class="field"><label for="m-pass">???? ??</label><div class="passwrap"><input id="m-pass" type="password" autocomplete="${passAuto}" required>${EYE}</div></div>
        <label class="remember" for="m-remember"><input id="m-remember" type="checkbox" checked><span>?????? ????</span></label>
        ${HINTS[t] ? `<p class="auth-hint">${HINTS[t]}</p>` : ''}
        <button class="btn primary block" data-act="auth">${t === 'register' ? '??????????' : '???????'}</button>
        <p class="auth-legal">Ac 2026 Grand Hotel. All rights reserved.</p>
      </div>
    </section>
  </div>`;
}
