import React, { useState, useEffect, useCallback } from 'react';
import Dashboardlogin from './pages/dashboardlogin'; // Halaman Login
import Dashboard_Utama from './pages/Dashboard_Utama'; // Halaman Dashboard Utama
import './assets/style/Dashboard_Utama.css'; // dipakai untuk styling loader awal (.loader-container, .spinner)

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://192.168.4.22:8000';

function App() {
  // 'checking'  -> sedang memvalidasi token yang ada di localStorage
  // 'auth'      -> token valid, tampilkan dashboard
  // 'guest'     -> tidak ada token / token tidak valid, tampilkan login (wajib OTP)
  const [authStatus, setAuthStatus] = useState('checking');
  const [sessionUser, setSessionUser] = useState(null); // { username, modules }

  // Coba perpanjang sesi diam-diam pakai refresh_token yang sama, TANPA
  // password/OTP. Ini yang membedakan "sesi timeout karena idle" dengan
  // "user pencet logout": timeout tidak menghapus refresh_token di server,
  // logout eksplisit yang menghapusnya (lihat AuthController::logout).
  const attemptRefresh = useCallback(async (token) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ refresh_token: token })
      });

      const data = await response.json();

      if (data && data.success && data.data) {
        return {
          username: data.data.user?.username || 'User',
          modules: data.data.user?.modul_akses || []
        };
      }
    } catch (error) {
      console.error('Gagal memperpanjang sesi:', error);
    }

    return null;
  }, []);

  // Validasi token ke backend. Dipakai saat pertama buka app & setelah login sukses.
  const validateSession = useCallback(async () => {
    const token = localStorage.getItem('sso_token');

    if (!token) {
      setSessionUser(null);
      setAuthStatus('guest');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data && data.success && data.valid) {
        setSessionUser({
          username: data.data?.user?.username || 'User',
          modules: data.data?.user?.modul_akses || []
        });
        setAuthStatus('auth');
        return;
      }
    } catch (error) {
      console.error('Gagal memvalidasi sesi SSO:', error);
    }

    // Token tidak valid/expired lewat /validate -> JANGAN langsung anggap
    // logout. Coba dulu perpanjang diam-diam lewat /refresh (ini yang akan
    // berhasil kalau penyebabnya cuma timeout inaktivitas, dan akan gagal
    // kalau memang sudah logout eksplisit atau refresh_token sudah lewat 7 hari).
    const refreshed = await attemptRefresh(token);

    if (refreshed) {
      setSessionUser(refreshed);
      setAuthStatus('auth');
      return;
    }

    // Refresh juga gagal -> baru benar-benar dianggap sesi habis, wajib login+OTP ulang
    localStorage.removeItem('sso_token');
    setSessionUser(null);
    setAuthStatus('guest');
  }, [attemptRefresh]);

  // Jalankan sekali saat aplikasi pertama kali dibuka
  useEffect(() => {
    validateSession();
  }, [validateSession]);

  // Selagi tab masih terbuka & user masih login, perpanjang sesi tiap 5
  // menit di background - supaya sesi tidak sempat timeout duluan padahal
  // user masih aktif memakai aplikasi.
  useEffect(() => {
    if (authStatus !== 'auth') return undefined;

    const token = localStorage.getItem('sso_token');
    if (!token) return undefined;

    const interval = setInterval(() => {
      attemptRefresh(token);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authStatus, attemptRefresh]);

  // Callback setelah sukses login & verifikasi OTP
  const handleLoginSuccess = async (token) => {
    localStorage.setItem('sso_token', token);
    setAuthStatus('checking');
    await validateSession(); // ambil data user (username, modules) sebelum masuk dashboard
  };

  // Callback saat user logout
  const handleLogout = async () => {
    const token = localStorage.getItem('sso_token');

    // Beritahu backend supaya session & refresh token ini di-nonaktifkan
    // di server (bukan cuma dihapus dari localStorage). Kalau gagal
    // (mis. server tidak bisa dihubungi), tetap lanjut logout di sisi
    // client - jangan sampai user "terjebak" tidak bisa logout.
    if (token) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({})
        });
      } catch (error) {
        console.error('Gagal memberi tahu server saat logout:', error);
      }
    }

    localStorage.removeItem('sso_token');
    setSessionUser(null);
    setAuthStatus('guest');
  };

  // Selama proses cek sesi awal, jangan render dashboard maupun form login dulu
  if (authStatus === 'checking') {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Memeriksa sesi...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {authStatus === 'auth' ? (
        <Dashboard_Utama
          username={sessionUser?.username}
          modules={sessionUser?.modules || []}
          onLogout={handleLogout}
        />
      ) : (
        <Dashboardlogin onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;