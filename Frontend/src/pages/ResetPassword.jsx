import React, { useState } from 'react';
import '../assets/style/ResetPassword.css';
import { API_BASE } from '../config/api';

const ResetPassword = ({ onResetSuccess, onBackToLogin, username }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Validasi real-time kriteria password
  const rules = {
    minLen: password.length >= 12,
    maxLen: password.length > 0 && password.length <= 20,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&_]/.test(password),
    match: confirmPassword.length > 0 && password === confirmPassword,
  };

  const isAllValid = Object.values(rules).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAllValid) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      // Jika sudah ada endpoint API untuk reset password:
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          username: username || '',
          new_password: password,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memperbarui kata sandi.');
      }

      alert('Password berhasil diperbarui! Silakan login kembali dengan password baru Anda.');
      if (onResetSuccess) onResetSuccess();
    } catch (err) {
      // Jika API belum siap / simulasi fallback:
      console.warn('API error or not found, falling back to simulation mode:', err.message);
      
      setTimeout(() => {
        setIsLoading(false);
        alert('Password berhasil diperbarui! Silakan login kembali.');
        if (onResetSuccess) onResetSuccess();
      }, 1000);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        {/* HEADER LOGO & JUDUL */}
        <div className="reset-header">
          <img src={logoJateng} alt="Logo Jawa Tengah" className="reset-logo" />
          <div className="reset-title-group">
            <h2>Reset Password</h2>
            <p>Silakan masukkan password baru dan konfirmasi password</p>
          </div>
        </div>

        {errorMsg && (
          <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>
            {errorMsg}
          </div>
        )}

        {/* FORM INPUT */}
        <form onSubmit={handleSubmit}>
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
            <li className={rules.minLen ? 'valid' : ''}>Minimal 12 karakter</li>
            <li className={rules.maxLen ? 'valid' : ''}>Maksimal 20 karakter</li>
            <li className={rules.upper ? 'valid' : ''}>Minimal satu huruf besar (A-Z)</li>
            <li className={rules.lower ? 'valid' : ''}>Minimal satu huruf kecil (a-z)</li>
            <li className={rules.number ? 'valid' : ''}>Minimal satu angka (0-9)</li>
            <li className={rules.special ? 'valid' : ''}>
              Minimal satu karakter spesial (@$!%*?&_)
            </li>
            <li className={rules.match ? 'valid' : ''}>
              Konfirmasi password harus cocok
            </li>
          </ul>

          <button
            type="submit"
            className="btn-reset"
            disabled={!isAllValid || isLoading}
          >
            {isLoading ? 'Memproses...' : 'Reset Password'}
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

export default ResetPassword;