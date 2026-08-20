import React, { useState, useEffect } from 'react';
import '../assets/style/login.css';
import bgLogin from '../assets/gambar/background_login.jpg';
import { API_BASE } from '../config/api';

const Login = ({ onLoginSuccess }) => {
  // State untuk menyimpan input user
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    captchaAnswer: ''
  });

  // State untuk UI dan data dari server
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captcha, setCaptcha] = useState({ id: '', svg: '' });
  const [alert, setAlert] = useState(null);

  // State Tambahan untuk OTP
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otpUsername, setOtpUsername] = useState('');
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Fungsi mengambil captcha dari API Backend
  const fetchCaptcha = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/captcha`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        credentials: 'include'   // <-- TAMBAHKAN
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Respons captcha bukan JSON. Pastikan endpoint benar (api/auth/captcha).');
      }

      if (data && data.data && data.data.captcha) {
        setCaptcha({
          id: data.data.captcha.id,
          svg: data.data.captcha.svg
        });
      }
    } catch (error) {
      console.error('Gagal memuat captcha:', error);

      setCaptcha({
        id: '',
        svg: `
          <span style="
            font-size:12px;
            color:#dc2626;
            padding:8px;
          ">
            Gagal memuat captcha: ${error.message}
          </span>
        `
      });
    }
  };

  // Jalankan saat halaman pertama kali dibuka
  useEffect(() => {
    fetchCaptcha();

    const params = new URLSearchParams(window.location.search);

    if (params.get('error')) {
      setAlert({
        type: 'error',
        message: 'Username, password, atau captcha tidak valid.'
      });
    } else if (params.get('expired')) {
      setAlert({
        type: 'info',
        message: 'Sesi Anda telah berakhir. Silakan login kembali.'
      });
    } else if (params.get('logout')) {
      setAlert({
        type: 'info',
        message: 'Anda telah keluar dari sesi SSO.'
      });
    }
  }, []);

  // Handle perubahan input form login
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle submit form login awal (mengirim ke backend untuk request OTP)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          captcha_id: captcha.id,
          captcha_answer: formData.captchaAnswer
        }),
        credentials: 'include'   // <-- TAMBAHKAN
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Respons dari server bukan JSON. Pastikan endpoint benar (api/auth/login).');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login gagal. Silakan coba lagi.');
      }

      // Jika backend meminta verifikasi OTP (requires_otp: true)
      if (data.data && data.data.requires_otp && data.data.session_id) {
        setOtpSessionId(data.data.session_id);
        setOtpUsername(
          (data.data.user && data.data.user.username) || formData.username
        );
        setIsOtpStep(true);
        setResendCooldown(30);
        setAlert({
          type: 'info',
          message: data.message || 'Kode OTP telah dikirimkan ke email Anda. Silakan masukkan di bawah.'
        });
      } else if (data.data && data.data.access_token) {
        // Backend langsung memberi sesi aktif tanpa OTP
        onLoginSuccess?.({
          accessToken: data.data.access_token,
          refreshToken: data.data.refresh_token
        });
      } else {
        throw new Error('Respons login tidak dikenali dari server.');
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message
      });
      fetchCaptcha(); // Refresh captcha jika login gagal
    } finally {
      setIsLoading(false);
    }
  };

  // Handle perubahan input OTP (pindah fokus otomatis & hanya angka)
  const handleOtpChange = (index, value) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value !== '' && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  // Handle tombol Backspace pada input OTP
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otpValues[index] === '' && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    }
  };

  // Hitung mundur cooldown tombol "Kirim ulang kode"
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle kirim ulang kode OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResendingOtp) return;

    setIsResendingOtp(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          session_id: otpSessionId,
          username: otpUsername
        }),
        credentials: 'include'   // <-- TAMBAHKAN
      });

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Respons resend OTP bukan JSON. Pastikan endpoint benar (api/auth/resend-otp).');
      }

      if (!response.ok) {
        if (response.status === 429 && data.retry_after) {
          setResendCooldown(data.retry_after);
        }
        throw new Error(data.message || 'Gagal mengirim ulang kode OTP.');
      }

      setOtpValues(['', '', '', '', '', '']);
      document.getElementById('otp-input-0')?.focus();
      setResendCooldown(30);
      setAlert({
        type: 'info',
        message: data.message || 'Kode OTP baru telah dikirim ke email Anda.'
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message
      });
    } finally {
      setIsResendingOtp(false);
    }
  };

  // Handle submit OTP (verifikasi ke backend)
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otpValues.join('');

    if (otpCode.length < 6) {
      setAlert({
        type: 'error',
        message: 'Silakan isi 6 digit kode OTP dengan lengkap.'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          session_id: otpSessionId,
          username: otpUsername,
          otp: otpCode
        }),
        credentials: 'include'   // <-- TAMBAHKAN
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Respons OTP bukan JSON. Pastikan endpoint benar (api/auth/verify-otp).');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Verifikasi OTP gagal. Silakan coba lagi.');
      }

      if (!data.data || !data.data.access_token) {
        throw new Error('Token sesi tidak diterima dari server.');
      }

      setAlert({
        type: 'info',
        message: data.message || 'Verifikasi berhasil! Mengalihkan ke dashboard...'
      });

      onLoginSuccess?.({
        accessToken: data.data.access_token,
        refreshToken: data.data.refresh_token
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      {/* ================= BAGIAN KIRI ================= */}
      <div
        className="left-panel"
        style={{ backgroundImage: `url(${bgLogin})` }}
      >
        <div className="overlay"></div>
        <div className="content-wrapper">
          <div className="brand">
            <div className="logo-icon">
              <i className="fa-solid fa-heart-pulse"></i>
            </div>

            <div className="brand-text">
              <h1>RSJD AMINO HOSPITAL</h1>
              <p>Single Sign-On Portal</p>
            </div>
          </div>

          <div className="main-text">
            <h2>
              Satu akun,
              <br />
              empat aplikasi rumah sakit.
            </h2>

            <p>
              Cukup masuk sekali untuk mengakses semua layanan internal secara aman
              dan cepat.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <i className="fa-solid fa-stethoscope"></i>
              <h3>SIMRS</h3>
              <p>Sistem informasi manajemen rumah sakit.</p>
            </div>

            <div className="feature-card">
              <i className="fa-solid fa-heart-circle-check"></i>
              <h3>AMINO MOBILE</h3>
              <p>Layanan mobile untuk staf dan pasien.</p>
            </div>

            <div className="feature-card">
              <i className="fa-solid fa-capsules"></i>
              <h3>LAPOR AMINO</h3>
              <p>Kanal pelaporan dan pengaduan internal.</p>
            </div>

            <div className="feature-card">
              <i className="fa-regular fa-user"></i>
              <h3>WBS</h3>
              <p>Whistleblowing system untuk pelaporan pelanggaran.</p>
            </div>
          </div>

          <div className="footer-left">
            <p>
              &copy; 2026 RSJD Amino Hospital - Informatika 2024
            </p>
          </div>
        </div>
      </div>

      {/* ================= BAGIAN KANAN ================= */}
      <div className="right-panel">
        <div className="login-wrapper">
          <div className="login-header">
            <div className="login-icon">
              <i
                className={`fa-solid ${isOtpStep ? 'fa-shield-halved' : 'fa-lock'}`}
                style={{
                  fontSize: '24px',
                  color: '#16a385',
                  marginBottom: '15px'
                }}
              ></i>
            </div>

            <h2>{isOtpStep ? 'Verifikasi OTP' : 'Selamat datang'}</h2>

            <p>
              {isOtpStep
                ? 'Masukkan 6 digit kode keamanan yang dikirimkan ke nomor Anda.'
                : 'Masuk dengan akun pegawai untuk melanjutkan ke portal aplikasi.'}
            </p>
          </div>

          {/* ================= ALERT ================= */}
          {alert && (
            <div
              className={`alert ${
                alert.type === 'error' ? 'alert-error' : 'alert-info'
              }`}
              style={{
                color: alert.type === 'error' ? '#dc2626' : '#0284c7',
                background: alert.type === 'error' ? '#fef2f2' : '#f0f9ff',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px'
              }}
            >
              <i
                className={`fa-solid ${
                  alert.type === 'error'
                    ? 'fa-circle-exclamation'
                    : alert.message.includes('keluar')
                    ? 'fa-right-from-bracket'
                    : 'fa-clock'
                }`}
              ></i>{' '}
              {alert.message}
            </div>
          )}

          {/* ================= RENDER FORM BERDASARKAN STEP ================= */}
          {!isOtpStep ? (
            /* --- FORM 1: LOGIN UTAMA --- */
            <form onSubmit={handleSubmit} className="login-form">
              {/* USERNAME */}
              <div className="form-group">
                <label htmlFor="username">Username / NIP</label>
                <div className="input-icon">
                  <i className="fa-regular fa-user icon-left"></i>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Masukkan username"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <label htmlFor="password">Kata sandi</label>
                <div className="input-icon">
                  <i className="fa-solid fa-lock icon-left"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Masukkan kata sandi"
                    required
                  />
                  <i
                    className={`fa-solid ${
                      showPassword ? 'fa-eye-slash' : 'fa-eye'
                    } icon-right`}
                    onClick={() => setShowPassword(!showPassword)}
                    title={
                      showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'
                    }
                    style={{ cursor: 'pointer' }}
                  ></i>
                </div>
              </div>

              {/* CAPTCHA */}
              <div className="form-group">
                <label htmlFor="captcha_answer">Kode Captcha</label>
                <div className="captcha-container">
                  <div
                    className="captcha-box"
                    dangerouslySetInnerHTML={{ __html: captcha.svg }}
                  />
                  <button
                    type="button"
                    className="btn-refresh"
                    onClick={fetchCaptcha}
                    title="Ganti Captcha"
                  >
                    <i className="fa-solid fa-rotate-right"></i>
                  </button>
                </div>

                <div className="input-icon">
                  <i className="fa-solid fa-shield-keyhole icon-left"></i>
                  <input
                    type="text"
                    id="captcha_answer"
                    name="captchaAnswer"
                    value={formData.captchaAnswer}
                    onChange={handleChange}
                    placeholder="Masukkan kode captcha di atas"
                    required
                  />
                </div>
              </div>

              {/* TOMBOL LOGIN */}
              <button
                type="submit"
                className="btn-login"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Memprose...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-right-to-bracket"></i> Masuk ke Portal
                  </>
                )}
              </button>
            </form>
          ) : (
            /* --- FORM 2: VERIFIKASI OTP --- */
            <form onSubmit={handleOtpSubmit} className="login-form">
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'center',
                    marginTop: '10px'
                  }}
                >
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      maxLength="1"
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="otp-box"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              {/* TOMBOL VERIFIKASI OTP */}
              <button
                type="submit"
                className="btn-login"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Memverifikasi...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-circle-check"></i> Verifikasi Kode
                  </>
                )}
              </button>

              {/* KIRIM ULANG KODE OTP */}
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResendingOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#94a3b8' : '#16a385',
                    cursor: resendCooldown > 0 || isResendingOtp ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isResendingOtp ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Mengirim ulang...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <i className="fa-regular fa-clock"></i> Kirim ulang kode ({resendCooldown}s)
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-rotate-right"></i> Kirim ulang kode OTP
                    </>
                  )}
                </button>
              </div>

              {/* KEMBALI KE FORM LOGIN */}
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpStep(false);
                    setOtpValues(['', '', '', '', '', '']);
                    setResendCooldown(0);
                    setAlert(null);
                    fetchCaptcha();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#16a385',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-arrow-left"></i> Kembali ke Form Login
                </button>
              </div>
            </form>
          )}

          {/* ================= SECURITY ================= */}
          <div className="security-info">
            <i className="fa-solid fa-shield-halved"></i>
            <p>
              Akses dilindungi Single Sign-On. Jangan bagikan kredensial Anda
              kepada siapa pun.
            </p>
          </div>

          {/* ================= SUPPORT ================= */}
          <div className="support-info">
            <p>
              Kendala login? Hubungi <strong>admin MDSI</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;