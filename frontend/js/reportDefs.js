// Тайлан бүрийн баганын тодорхойлолт. Нэг тодорхойлолтоос хүснэгт ба CSV хоёулаа үүснэ.
import { STATUS } from './config.js';
import { esc, money, badge } from './utils.js';

const p2 = (n) => String(n).padStart(2, '0');
export const fmtDT = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
};

// Баганын төрөл бүрийн дэлгэц дээрх харагдац (html) болон CSV дэх утга (csv)
const TYPES = {
  text:     { html: (v) => esc(v), csv: (v) => v ?? '', num: false },
  int:      { html: (v) => esc(v), csv: (v) => Number(v), num: true },
  money:    { html: (v) => money(v), csv: (v) => Number(v), num: true },
  pct:      { html: (v) => `<span class="pct-bar"><i style="width:${Math.min(100, Number(v))}%"></i></span>${esc(v)}%`, csv: (v) => Number(v), num: true },
  status:   { html: (v) => badge(v), csv: (v) => STATUS[v] || v, num: false },
  datetime: { html: (v) => esc(fmtDT(v)), csv: (v) => fmtDT(v), num: false }
};

// [талбар, гарчиг, төрөл]
export const REPORTS = {
  summary: { label: 'Тойм', file: 'toim' },
  reservations: {
    label: 'Захиалга', file: 'zahialga',
    cols: [['id', '#', 'int'], ['customer_name', 'Зочин', 'text'], ['room_no', 'Өрөө', 'text'], ['room_type', 'Төрөл', 'text'],
           ['check_in', 'Ирэх', 'text'], ['check_out', 'Гарах', 'text'], ['nights', 'Шөнө', 'int'],
           ['total_price', 'Дүн', 'money'], ['status', 'Төлөв', 'status'], ['created_at', 'Үүсгэсэн', 'datetime']]
  },
  payments: {
    label: 'Төлбөр', file: 'tulbur',
    cols: [['id', '#', 'int'], ['reservation_id', 'Захиалга', 'int'], ['customer_name', 'Зочин', 'text'], ['method', 'Хэлбэр', 'text'],
           ['amount', 'Дүн', 'money'], ['status', 'Төлөв', 'status'], ['transaction_ref', 'Гүйлгээний код', 'text'], ['occurred_at', 'Огноо', 'datetime']]
  },
  rooms: {
    label: 'Өрөө', file: 'uruu',
    cols: [['room_no', 'Өрөө', 'text'], ['room_type', 'Төрөл', 'text'], ['bookings', 'Захиалга', 'int'],
           ['booked_nights', 'Захиалгат шөнө', 'int'], ['utilization', 'Ашиглалт', 'pct'], ['revenue', 'Орлого (хуваарилсан)', 'money']]
  },
  customers: {
    label: 'Зочид', file: 'zochid',
    cols: [['full_name', 'Зочин', 'text'], ['email', 'Email', 'text'], ['phone', 'Утас', 'text'],
           ['reservations', 'Захиалга', 'int'], ['total_paid', 'Төлсөн дүн', 'money']]
  }
};

export function tableHtml(def, rows) {
  if (!rows.length) return `<div class="card empty">Энэ хугацаанд мэдээлэл алга.</div>`;
  const head = def.cols.map(([, label, t]) => `<th class="${TYPES[t].num ? 'num' : ''}">${esc(label)}</th>`).join('');
  const body = rows.map((r) => `<tr>${def.cols.map(([k, , t]) => `<td class="${TYPES[t].num ? 'num' : ''}">${TYPES[t].html(r[k])}</td>`).join('')}</tr>`).join('');
  return `<div class="card scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

export function tableCsvRows(def, rows) {
  return [def.cols.map((c) => c[1]), ...rows.map((r) => def.cols.map(([k, , t]) => TYPES[t].csv(r[k])))];
}
