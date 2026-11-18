// Олон хуудсанд ашиглагдах жижиг блокууд
import { S } from '../state.js';
import { esc } from '../utils.js';

export const needLogin = (txt) => `<div class="card empty"><p>${txt}</p><button class="btn primary" data-act="login">Нэвтрэх</button></div>`;
export const loading = () => `<div class="empty">Ачаалж байна…</div>`;
export const errBox = () => `<div class="notice bad">${esc(S.err)}</div>`;
