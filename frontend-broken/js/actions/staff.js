// Ресепшний үйлдлүүд
import { api } from '../api.js';
import { toast } from '../components/toast.js';
import { go } from '../router.js';

export async function staffAct(id, what) {
  try {
    await api(`/reservations/${id}/${what}`, { method: 'POST' });
    toast(what === 'check-in' ? 'Check-in хийгдлээ' : 'Check-out хийгдлээ', 'ok');
    go('staff');
  } catch (e) { toast(e.message, 'bad'); }
}
