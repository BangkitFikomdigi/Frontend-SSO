// Menentukan alamat backend secara otomatis, tergantung frontend diakses
// lewat host apa. Ini penting karena backend pakai cookie session
// (credentials: 'include') — cookie hanya "aman" terkirim kalau frontend &
// backend dianggap satu "site" oleh browser (localhost<->localhost,
// atau IP<->IP dengan host yang sama). Kalau dicampur (mis. frontend
// localhost tapi backend IP), request bisa dianggap cross-site dan cookie
// captcha/login/OTP tidak ikut terkirim.
//
// Override lewat .env kalau perlu:
//   VITE_API_BASE_URL       -> dipakai saat akses via IP (atau host lain)
//   VITE_API_BASE_URL_LOCAL -> dipakai saat akses via localhost/127.0.0.1

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '::1'];
const IP_HOSTNAMES = {
  '192.168.4.22': 'http://192.168.4.22:8000',
  '192.168.4.23': 'http://192.168.4.23:8000',
};

const hostname = window.location.hostname;
const isLocalHost = LOCAL_HOSTNAMES.includes(hostname);
const ipBackend = IP_HOSTNAMES[hostname];

// Debug: log the resolved API base URL to console
const resolvedBase = isLocalHost
  ? (import.meta.env.VITE_API_BASE_URL_LOCAL || 'http://localhost:8000')
  : (import.meta.env.VITE_API_BASE_URL || ipBackend || 'http://192.168.4.22:8000');

console.log('[API Config] Hostname:', hostname, '| Resolved API_BASE:', resolvedBase);

export const API_BASE = resolvedBase;
