import React, { useState, useEffect } from 'react';
import '../assets/style/login.css';
import bgLogin from '../assets/gambar/background_login.jpeg';
const Login = () => {
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

  // Fungsi mengambil captcha dari API Backend
  const fetchCaptcha = async () => {
    try {
      const response = await fetch(
        'http://localhost:3000/auth/captcha',
        {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          }
        }
      );

      const data = await response.json();

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
            Gagal memuat captcha
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

  // Handle perubahan input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('Data yang dikirim:', {
      ...formData,
      captcha_id: captcha.id
    });

    // Nanti bisa dihubungkan dengan API login
    // Contoh:
    //
    // await fetch('http://localhost:3000/auth/login', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     username: formData.username,
    //     password: formData.password,
    //     captcha_id: captcha.id,
    //     captcha_answer: formData.captchaAnswer
    //   })
    // });

    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
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
              Cukup masuk sekali untuk mengakses semua layanan
              internal secara aman dan cepat.
            </p>

          </div>

          <div className="features-grid">

            <div className="feature-card">
              <i className="fa-solid fa-stethoscope"></i>
              <h3>SIMRS</h3>
              <p>
                Sistem informasi manajemen rumah sakit.
              </p>
            </div>

            <div className="feature-card">
              <i className="fa-solid fa-heart-circle-check"></i>
              <h3>AMINO_MOBILE</h3>
              <p>
                Layanan mobile untuk staf dan pasien.
              </p>
            </div>

            <div className="feature-card">
              <i className="fa-solid fa-capsules"></i>
              <h3>LAPOR_AMINO</h3>
              <p>
                Kanal pelaporan dan pengaduan internal.
              </p>
            </div>

            <div className="feature-card">
              <i className="fa-regular fa-user"></i>
              <h3>WBS</h3>
              <p>
                Whistleblowing system untuk pelaporan pelanggaran.
              </p>
            </div>

          </div>

          <div className="footer-left">
            <p>
              &copy; 2026 RSJD Amino Hospital - Divisi Teknologi Informasi
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
                className="fa-solid fa-lock"
                style={{
                  fontSize: '24px',
                  color: '#16a385',
                  marginBottom: '15px'
                }}
              ></i>
            </div>

            <h2>Selamat datang</h2>

            <p>
              Masuk dengan akun pegawai untuk melanjutkan
              ke portal aplikasi.
            </p>

          </div>


          {/* ================= ALERT ================= */}
          {alert && (
            <div
              className={`alert ${
                alert.type === 'error'
                  ? 'alert-error'
                  : 'alert-info'
              }`}
              style={{
                color:
                  alert.type === 'error'
                    ? '#dc2626'
                    : '#0284c7',

                background:
                  alert.type === 'error'
                    ? '#fef2f2'
                    : '#f0f9ff',

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
              ></i>

              {' '}

              {alert.message}

            </div>
          )}


          {/* ================= FORM LOGIN ================= */}
          <form
            onSubmit={handleSubmit}
            className="login-form"
          >

            {/* USERNAME */}
            <div className="form-group">

              <label htmlFor="username">
                Username / NIP
              </label>

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

              <label htmlFor="password">
                Kata sandi
              </label>

              <div className="input-icon">

                <i className="fa-solid fa-lock icon-left"></i>

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan kata sandi"
                  required
                />

                <i
                  className={`fa-solid ${
                    showPassword
                      ? 'fa-eye-slash'
                      : 'fa-eye'
                  } icon-right`}
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  title={
                    showPassword
                      ? 'Sembunyikan sandi'
                      : 'Tampilkan sandi'
                  }
                  style={{
                    cursor: 'pointer'
                  }}
                ></i>

              </div>

            </div>


            {/* CAPTCHA */}
            <div className="form-group">
            <label htmlFor="captcha_answer">Kode Captcha</label>

            {/* Gunakan captcha-container dari CSS */}
            <div className="captcha-container">
                {/* Gunakan captcha-box dari CSS */}
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
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  {' '}
                  Memproses...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  {' '}
                  Masuk ke Portal
                </>
              )}

            </button>

          </form>


          {/* ================= SECURITY ================= */}
          <div className="security-info">

            <i className="fa-solid fa-shield-halved"></i>

            <p>
              Akses dilindungi Single Sign-On.
              Jangan bagikan kredensial Anda kepada siapa pun.
            </p>

          </div>


          {/* ================= SUPPORT ================= */}
          <div className="support-info">

            <p>
              Kendala login? Hubungi{' '}
              <strong>IT Support ext. 1123</strong>
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;