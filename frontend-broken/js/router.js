// Хуудас солих (go) ба дэлгэцэнд зурах (render)
import { S } from './state.js';
import { api } from './api.js';
import { $ } from './utils.js';
import { renderHeader } from './components/header.js';
import { startTimer } from './components/timer.js';
import { authView } from './views/auth.view.js';
import { bookView } from './views/book.view.js';
import { myView, notifView } from './views/my.view.js';
import { staffView } from './views/staff.view.js';
import { reportsView } from './views/reports.view.js';

const VIEWS = { book: bookView, my: myView, notifications: notifView, staff: staffView, reports: reportsView };

// Хуудас бүрийн өгөгдлийг серверээс татах функцүүд
const LOADERS = {
  my: () => api('/reservations/my'),
  notifications: () => api('/notifications/my'),
  staff: async () => {
    if (S.staffTab === 'today') return api('/checkin/today');
    return api('/reservations' + (S.filter ? '?status=' + S.filter : ''));
  },
  reports: async () => {
    const qs = `?from=${S.rep.from}&to=${S.rep.to}`;
    switch (S.reportType) {
      case 'reservations': return api('/reports/reservations-list' + qs);
      case 'payments': return api('/reports/payments' + qs);
      case 'rooms': return api('/reports/rooms' + qs);
      case 'customers': return api('/reports/customers' + qs);
      default: {
        const [occ, rev, res] = await Promise.all([api('/reports/occupancy' + qs), api('/reports/revenue' + qs), api('/reports/reservations' + qs)]);
        return { occ, rev, res };
      }
    }
  }
};

export function render() {
  renderHeader();
  // Нэвтрээгүй бол зөвхөн нэвтрэх хуудас харагдана
  if (!S.user) {
    clearInterval(S.timer);
    $('#app').innerHTML = authView();
    const first = $('#m-name') || $('#m-email'); if (first) first.focus();
    return;
  }
  $('#app').innerHTML = VIEWS[S.view]();
  startTimer();
}

export async function go(view) {
  S.view = view; S.data = null; S.err = null;
  render();
  const load = LOADERS[view];
  if (load && S.user) {
    try { S.data = await load(); } catch (e) { S.err = e.message; }
    if (S.view === view) render();
  }
}
