const BASE_URL = '/api/v1';
const TOKEN_KEY = 'kw_auth_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${BASE_URL}${path}`;
  const config = {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  };

  const res = await fetch(url, config);
  let json;
  try { json = await res.json(); } catch { json = {}; }

  if (!res.ok) {
    const err = new Error(json?.error?.message || `Request failed (${res.status})`);
    err.code   = json?.error?.code;
    err.status = res.status;
    throw err;
  }

  return json;
}

function buildQS(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const http = {
  get:    (path, params)  => request(`${path}${buildQS(params)}`),
  post:   (path, body)    => request(path, { method: 'POST', body }),
  patch:  (path, body)    => request(path, { method: 'PATCH', body }),
  put:    (path, body)    => request(path, { method: 'PUT', body }),
  delete: (path)          => request(path, { method: 'DELETE' }),
};

export default http;
