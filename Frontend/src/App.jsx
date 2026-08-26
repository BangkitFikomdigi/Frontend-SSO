import React, { useState, useEffect, useCallback } from 'react';
import Dashboardlogin from './pages/dashboardlogin'; // Halaman Login
import Dashboard_Utama from './pages/Dashboard_Utama'; // Halaman Dashboard Utama
import './assets/style/Dashboard_Utama.css'; // dipakai untuk styling loader awal (.loader-container, .spinner)
import { API_BASE } from './config/api';

function App() {
  // 'checking'  -> sedang memvalidasi token yang ada di localStorage
  // 'auth'      -> token valid, tampilkan dashboard
  // 'guest'     -> tidak ada token / token tidak valid (baik karena idle
  //                timeout maupun logout), tampilkan halaman login
  const [authStatus, setAuthStatus] = useState('checking');
  const [sessionUser, setSessionUser] = useState(null); // { username, modules }

  // Validasi token ke backend. Dipakai saat pertama buka app & setelah login sukses.
  // Catatan: sengaja TIDAK mencoba /refresh otomatis di sini. Kalau token
  // sudah tidak valid (idle timeout ataupun logout), user memang harus
  // melihat halaman login lagi - bedanya cuma di halaman login itu OTP-nya
  // wajib atau tidak, dan itu ditentukan backend saat login (lihat
  // AuthController::shouldRequireOtp), bukan disembunyikan di sini.
  const validateSession = useCallback(async () => {
    const token = localStorage.getItem('sso_access_token');

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
          name: data.data?.user?.name || data.data?.user?.username || 'User',
          modules: data.data?.user?.modul_akses || []
        });
        setAuthStatus('auth');
        return;
      }
    } catch (error) {
      console.error('Gagal memvalidasi sesi SSO:', error);
    }

    // access_token tidak ada / tidak valid lagi -> tampilkan halaman login.
    // Tidak perlu hapus token secara khusus di sini; login berikutnya akan
    // menimpa localStorage dengan token baru begitu berhasil.
    localStorage.removeItem('sso_access_token');
    localStorage.removeItem('sso_refresh_token');
    setSessionUser(null);
    setAuthStatus('guest');
  }, []);

  // Jalankan sekali saat aplikasi pertama kali dibuka
  useEffect(() => {
    validateSession();
  }, [validateSession]);

  // Callback setelah sukses login (baik langsung dapat token tanpa OTP,
  // maupun setelah verifikasi OTP di halaman login)
  const handleLoginSuccess = async ({ accessToken, refreshToken }) => {
    localStorage.setItem('sso_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('sso_refresh_token', refreshToken);
    }
    setAuthStatus('checking');
    await validateSession(); // ambil data user (username, modules) sebelum masuk dashboard
  };

  // Callback saat user pencet tombol Logout
  const handleLogout = async () => {
    const token = localStorage.getItem('sso_access_token');

    // Beritahu backend supaya session ini benar-benar dihapus di server
    // (bukan cuma dihapus dari localStorage). Ini KRUSIAL: cuma logout
    // eksplisit yang boleh menghapus session di server - itulah yang
    // membuat login berikutnya wajib OTP lagi (lihat
    // AuthController::shouldRequireOtp).
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

    localStorage.removeItem('sso_access_token');
    localStorage.removeItem('sso_refresh_token');
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
          name={sessionUser?.name}
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