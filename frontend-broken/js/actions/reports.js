// Тайлангийн үйлдлүүд: төрөл солих, хугацааны бэлэн сонголт, CSV, хэвлэх
import { S } from '../state.js';
import { isoDay } from '../utils.js';
import { REPORTS, tableCsvRows } from '../reportDefs.js';
import { downloadCsv } from '../csv.js';
import { toast } from '../components/toast.js';
import { go } from '../router.js';

export function setReportType(d) { S.reportType = d.type; go('reports'); }

export function setPreset(d) {
  if (d.p === 'month') {
    const n = new Date();
    const first = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1)).toISOString().slice(0, 10);
    const next = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
    S.rep = { from: first, to: next };
  } else {
    S.rep = { from: isoDay(-Number(d.p)), to: isoDay(1) };
  }
  go('reports');
}

// Одоо харагдаж буй тайланг CSV болгож татна
export function exportCsv() {
  const d = S.data; if (!d) return;
  const def = REPORTS[S.reportType];
  let rows;
  if (S.reportType === 'summary') {
    rows = [['Үзүүлэлт', 'Утга'], ['Эхлэх', S.rep.from], ['Дуусах', S.rep.to],
      ['Өрөөний ашиглалт %', d.occ.occupancyPercent], ['Захиалгат шөнө', d.occ.bookedRoomNights],
      ['Боломжит шөнө', d.occ.availableRoomNights], ['Орлого', Number(d.rev.revenue)], ['Төлбөрийн тоо', d.rev.payments],
      [], ['Төлөв', 'Тоо', 'Нийт дүн'], ...d.res.byStatus.map((x) => [x.status, x.count, Number(x.total_price)]),
      [], ['Өдөр', 'Орлого'], ...d.rev.daily.map((x) => [x.day, Number(x.revenue)])];
  } else {
    rows = tableCsvRows(def, d.rows);
  }
  downloadCsv(`tailan-${def.file}-${S.rep.from}_${S.rep.to}.csv`, rows);
  toast('CSV файл татагдлаа', 'ok');
}

export function printReport() { window.print(); }
