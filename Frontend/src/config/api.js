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

const isLocalHost = LOCAL_HOSTNAMES.includes(window.location.hostname);

export const API_BASE = isLocalHost
  ? (import.meta.env.VITE_API_BASE_URL_LOCAL || 'http://localhost:8000')
  : (import.meta.env.VITE_API_BASE_URL || 'http://192.168.4.22:8000');
