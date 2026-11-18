// Backend-тэй харилцах цорын ганц газар
import { API } from './config.js';
import { S } from './state.js';

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const h = { 'Content-Type': 'application/json', ...headers };
  if (S.token) h.Authorization = 'Bearer ' + S.token;
  const r = await fetch(API + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await r.json(); } catch (e) { /* хариу хоосон */ }
  if (!r.ok) {
    if (r.status === 401 && S.token) onUnauthorized();
    const err = new Error((data && data.error) || 'Алдаа ' + r.status);
    err.status = r.status; err.data = data;
    throw err;
  }
  return data;
}
