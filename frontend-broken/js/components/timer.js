// Өрөө барих 15 минутын тоолуур
import { S } from '../state.js';
import { $ } from '../utils.js';

export function startTimer() {
  clearInterval(S.timer);
  if (S.view === 'book' && S.flow.step === 3) { tick(); S.timer = setInterval(tick, 1000); }
}

function tick() {
  const el = $('#timer'); const r = S.flow.reservation;
  if (!el || !r) return;
  const ms = new Date(r.expires_at) - Date.now();
  if (ms <= 0) {
    el.textContent = 'Хугацаа дууссан'; el.classList.add('expired');
    const b = $('#pay-btn'); if (b) b.disabled = true;
    return;
  }
  el.textContent = Math.floor(ms / 60000) + ':' + String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
}
