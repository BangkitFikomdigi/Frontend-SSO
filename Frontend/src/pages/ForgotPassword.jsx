import React, { useState } from 'react';
import '../assets/style/ForgotPassword.css';
import { API_BASE } from '../config/api';

// Langkah 1 dari alur "Lupa Password":
// User memasukkan email -> backend cek di SIMRS/SSO -> kalau ada,
// backend kirim kode OTP ke email terdaftar dan mengembalikan reset_id.
// reset_id + email itu yang dibawa ke halaman berikutnya (ResetPassword)
// untuk verifikasi OTP + set password baru.
const ForgotPassword = ({ onResetRequested, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setAlert(null);

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ email: email.trim() }),
        credentials: 'include'
      });

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(
          'Respons dari server bukan JSON. Pastikan endpoint benar (api/auth/forgot-password).'
        );
      }

      if (!response.ok) {
        throw new Error(data.message || 'Email tidak ditemukan di sistem kami.');
      }

      // Backend sengaja tidak mengirim reset_id kalau email tidak terdaftar
      // (anti-enumeration: mencegah orang mengecek email mana yang valid).
      // Ini BUKAN error, jadi cukup tampilkan pesan netral dari backend.
      if (!data.data || !data.data.reset_id) {
        setAlert({
          type: 'info',
          message:
            data.message ||
            'Jika email Anda terdaftar, kami akan mengirim instruksi reset password ke email Anda.'
        });
        return;
      }

      // Callback ke parent (halaman yang memanggil) dengan data reset
      onResetRequested?.({
        email: email.trim(),
        resetId: data.data.reset_id,
        otp: data.data.otp // OTP hanya ada di dev mode
      });
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        {/* HEADER ICON & JUDUL */}
        <div className="reset-header">
          <div className="reset-logo">
            <i
              className="fa-solid fa-envelope-circle-check"
              style={{ fontSize: '24px', color: '#16a385' }}
            ></i>
          </div>
          <div className="reset-title-group">
            <h2>Lupa Password</h2>
            <p>Masukkan email akun Anda untuk menerima kode verifikasi (OTP)</p>
          </div>
        </div>

        {alert && (
          <div
            className={`fp-alert ${alert.type === 'error' ? 'fp-alert-error' : 'fp-alert-info'}`}
          >
            <i
              className={`fa-solid ${
                alert.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'
              }`}
            ></i>{' '}
            {alert.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="reset-input-group">
            <input
              type="email"
              placeholder="Masukkan email terdaftar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>

          <button type="submit" className="btn-reset" disabled={isLoading || !email.trim()}>
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Memeriksa email...
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane"></i> Kirim Kode OTP
              </>
            )}
          </button>
        </form>

        {onBackToLogin && (
          <button type="button" className="btn-back-login" onClick={onBackToLogin}>
            <i className="fa-solid fa-arrow-left"></i> Kembali ke Login
          </button>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;