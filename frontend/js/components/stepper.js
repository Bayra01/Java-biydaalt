// Customer → Search → Availability → Reservation → Payment → Confirmation
const LABELS = ['Хайх', 'Сул өрөө', 'Захиалга', 'Төлбөр', 'Баталгаажуулалт'];

export function stepper(i) {
  return `<ol class="stepper">${LABELS.map((t, k) =>
    `<li class="${k < i ? 'done' : k === i ? 'active' : ''}"><b>${k < i ? '✓' : k + 1}</b><span>${t}</span></li>`).join('')}</ol>`;
}
