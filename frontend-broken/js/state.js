// Програмын нэгдсэн төлөв (state)
import { isoDay } from './utils.js';

// Өрөө захиалах урсгалын төлөв (алхам, хайлт, сонгосон өрөө, захиалга ...)
export function newFlow() {
  return {
    step: 0,                                   // 0 хайх · 1 сул өрөө · 2 захиалга · 3 төлбөр · 4 баталгаажуулалт
    q: { checkIn: isoDay(1), checkOut: isoDay(3), guests: '', type: '' },
    rooms: null, nights: 0, room: null,
    key: null,                                 // Idempotency-Key (давхар дарснаас хамгаална)
    reservation: null, payment: null, customerId: '', busy: false
  };
}

export const S = {
  token: localStorage.getItem('hotel_token'),
  user: JSON.parse(localStorage.getItem('hotel_user') || 'null'),
  view: 'book', staffTab: 'today', filter: '', reportType: 'summary',
  rep: { from: isoDay(-30), to: isoDay(1) },
  types: [], flow: newFlow(), data: null, err: null, authTab: 'login', timer: null
};

export const isStaff = () => !!S.user && (S.user.role === 'RECEPTIONIST' || S.user.role === 'ADMIN');
