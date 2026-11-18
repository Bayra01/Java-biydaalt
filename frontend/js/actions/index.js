// data-act="..." товчлуурууд ямар функц дуудахыг энд тодорхойлно
import { S } from '../state.js';
import { go, render } from '../router.js';
import { openLogin, logout, doAuth } from '../auth.js';
import { doSearch, pick, backToSearch, newBooking, doReserve, doPay, doCancel, payNow } from './booking.js';
import { staffAct } from './staff.js';
import { setReportType, setPreset, exportCsv, printReport } from './reports.js';

export const ACT = {
  nav: (d) => go(d.view),
  login: () => openLogin(),
  logout: () => logout(false),
  mtab: (d) => { S.authTab = d.tab; render(); },
  auth: doAuth,
  search: doSearch,
  pick,
  backsearch: backToSearch,
  newbook: newBooking,
  reserve: doReserve,
  pay: doPay,
  cancel: (d) => doCancel(d.id),
  paynow: (d) => payNow(d.id),
  checkin: (d) => staffAct(d.id, 'check-in'),
  checkout: (d) => staffAct(d.id, 'check-out'),
  stab: (d) => { S.staffTab = d.tab; go('staff'); },
  loadrep: () => go('reports'),
  rtab: setReportType,
  preset: setPreset,
  csv: exportCsv,
  print: printReport
};
