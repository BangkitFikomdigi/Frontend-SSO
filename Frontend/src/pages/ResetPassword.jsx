import React, { useState, useEffect } from 'react';
import '../assets/style/ResetPassword.css';
import { API_BASE } from '../config/api';

// Langkah 2 dari alur "Lupa Password": user memasukkan kode OTP yang
// dikirim ke email pada langkah sebelumnya (ForgotPassword.jsx), sekaligus
// mengisi password baru. email + resetId didapat dari komponen induk
// (dashboardlogin.jsx) setelah ForgotPassword berhasil request reset.
const ResetPassword = ({ onResetSuccess, onBackToLogin, email, resetId: initialResetId, otp: initialDevOtp }) => {
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  // resetId & devOtp sebagai state lokal (bukan langsung props) karena
  // keduanya berubah tiap kali "Kirim ulang kode" dipanggil - backend
  // forgotPassword() selalu bikin reset_id baru setiap request.
  const [resetId, setResetId] = useState(initialResetId);
  const [devOtp, setDevOtp] = useState(initialDevOtp || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [alert, setAlert] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);

  // OTP baru saja dikirim otomatis saat masuk ke halaman ini (dari langkah
  // forgot password), jadi cooldown "kirim ulang" dimulai langsung.
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  // Validasi real-time kriteria password
  const rules = {
    minLen: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&_!#-]/.test(password),
    match: confirmPassword.length > 0 && password === confirmPassword,
  };

  const otpCode = otpValues.join('');
  const isPasswordValid = Object.values(rules).every(Boolean);
  const isAllValid = otpVerified && isPasswordValid && otpCode.length === 6;

  // Hitung mundur cooldown tombol "Kirim ulang kode"
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle perubahan input OTP (pindah fokus otomatis & hanya angka)
  const handleOtpChange = (index, value) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value !== '' && index < 5) {
      document.getElementById(`reset-otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otpValues[index] === '' && index > 0) {
      document.getElementById(`reset-otp-input-${index - 1}`)?.focus();
    }
  };

  // Handle kirim ulang kode OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResendingOtp) return;

    setIsResendingOtp(true);
    setAlert(null);

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Respons resend OTP bukan JSON.');
      }

      if (!response.ok) {
        if (response.status === 429 && data.retry_after) {
          setResendCooldown(data.retry_after);
        }
        throw new Error(data.message || 'Gagal mengirim ulang kode OTP.');
      }

      setOtpValues(['', '', '', '', '', '']);
      document.getElementById('reset-otp-input-0')?.focus();
      setResendCooldown(30);
      if (data.data?.reset_id) setResetId(data.data.reset_id);
      setDevOtp(data.data?.otp || '');
      setAlert({
        type: 'info',
        message: data.message || 'Kode OTP baru telah dikirim ke email Anda.'
      });
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      setIsResendingOtp(false);
    }
  };

  // Verify OTP dulu sebelum bisa submit password baru
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;

    setIsVerifyingOtp(true);
    setAlert(null);

    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-password-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          reset_id: resetId,
          email,
          otp: otpCode
        }),
        credentials: 'include'
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Respons OTP verification bukan JSON.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'OTP tidak sesuai atau sudah kadaluarsa.');
      }

      setOtpVerified(true);
      setAlert({
        type: 'info',
        message: 'OTP terverifikasi! Silakan masukkan password baru Anda.'
      });
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAllValid) return;

    setIsLoading(true);
    setAlert(null);

    try {
      const response = await fetch(`${API_BASE}/api/auth/set-new-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          reset_id: resetId,
          email,
          password,
        }),
        credentials: 'include',
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Respons dari server bukan JSON.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memperbarui kata sandi.');
      }

      // Catatan: TIDAK bisa pakai alert(...) di sini karena nama itu
      // sudah dipakai oleh state `const [alert, setAlert] = useState(null)`
      // di atas, sehingga alert() akan memanggil objek state, bukan
      // window.alert (menyebabkan "alert is not a function").
      // onResetSuccess (lihat dashboardlogin.jsx) sudah menampilkan pesan
      // sukses sendiri setelah kembali ke layar login, jadi cukup panggil itu.
      if (onResetSuccess) onResetSuccess();
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
            <i className="fa-solid fa-key" style={{ fontSize: '24px', color: '#16a385' }}></i>
          </div>
          <div className="reset-title-group">
            <h2>Reset Password</h2>
            <p>
              Masukkan kode OTP yang dikirim ke <strong>{email}</strong>, lalu buat password baru
            </p>
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

        {/* FORM INPUT */}
        <form onSubmit={handleSubmit}>
          {/* KODE OTP */}
          {!otpVerified && (
            <>
              <div className="reset-form-section">
                <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                  Masukkan Kode OTP 6 Digit
                </label>
                <div className="reset-otp-row">
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      id={`reset-otp-input-${idx}`}
                      type="text"
                      maxLength="1"
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="otp-box"
                      autoFocus={idx === 0}
                      disabled={otpVerified}
                    />
                  ))}
                </div>

                {/* Tombol Verify OTP */}
                <button
                  type="button"
                  className="btn-reset"
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length !== 6 || isVerifyingOtp || otpVerified}
                  style={{ marginTop: '15px' }}
                >
                  {isVerifyingOtp ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Memverifikasi OTP...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i> Verifikasi OTP
                    </>
                  )}
                </button>
              </div>

              {/* Tombol Kirim Ulang OTP */}
              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <button
                  type="button"
                  className="btn-resend-otp"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResendingOtp}
                >
                  {isResendingOtp ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Mengirim ulang...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <i className="fa-regular fa-clock"></i> Kirim ulang ({resendCooldown}s)
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-rotate-right"></i> Kirim ulang kode OTP
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* PASSWORD BARU - HANYA TAMPIL SETELAH OTP VERIFIED */}
          {otpVerified && (
            <>
              <div className="reset-form-section" style={{ marginTop: '25px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                  Buat Password Baru
                </label>

                <div className="reset-input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password Baru"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <i
                    className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'} toggle-eye`}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer' }}
                  ></i>
                </div>

                <div className="reset-input-group">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Konfirmasi Password Baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <i
                    className={`fa-solid ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'} toggle-eye`}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ cursor: 'pointer' }}
                  ></i>
                </div>

                {/* LIST CHECKLIST VALIDASI */}
                <ul className="validation-list">
                  <li className={rules.minLen ? 'valid' : ''}>Minimal 8 karakter</li>
                  <li className={rules.upper ? 'valid' : ''}>Minimal satu huruf besar (A-Z)</li>
                  <li className={rules.lower ? 'valid' : ''}>Minimal satu huruf kecil (a-z)</li>
                  <li className={rules.number ? 'valid' : ''}>Minimal satu angka (0-9)</li>
                  <li className={rules.special ? 'valid' : ''}>
                    Minimal satu karakter spesial (@$!%*?&_!#-)
                  </li>
                  <li className={rules.match ? 'valid' : ''}>
                    Konfirmasi password harus cocok
                  </li>
                </ul>

                <button
                  type="submit"
                  className="btn-reset"
                  disabled={!isPasswordValid || isLoading}
                  style={{ marginTop: '15px' }}
                >
                  {isLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Memproses...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i> Ubah Password
                    </>
                  )}
                </button>
              </div>
            </>
          )}
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

export default ResetPassword;