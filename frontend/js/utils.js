// Жижиг туслах функцүүд
import { STATUS } from './config.js';

export const $ = (s) => document.querySelector(s);

// XSS-ээс хамгаалах: HTML-д оруулах бүх текстийг заавал esc()-ээр дамжуулна
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const money = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) + '₮';

// Өнөөдрөөс n хоногийн дараах огноо (YYYY-MM-DD)
export const isoDay = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

export const uuid = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : 'k-' + Date.now() + '-' + Math.random().toString(16).slice(2));

export const badge = (s) => `<span class="badge ${esc(s)}">${esc(STATUS[s] || s)}</span>`;

export function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return {}; }
}
