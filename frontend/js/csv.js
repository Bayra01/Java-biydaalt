// CSV үүсгэх ба татах (Excel-д кирилл зөв нээгдэхийн тулд UTF-8 BOM нэмнэ)

// Нэг утгыг CSV-д аюулгүй бичих
function cell(v) {
  let s = v == null ? '' : String(v);
  // CSV injection-ээс хамгаалах: зочны нэр "=cmd|..." гэх мэтээр эхэлбэл Excel томьёо гэж ажиллуулахаас сэргийлнэ
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// rows: [[...], [...]] -> CSV текст
export function toCsv(rows) {
  return '\uFEFF' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
}

export function downloadCsv(filename, rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
