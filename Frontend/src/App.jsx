import React, { useState } from 'react';
import Dashboardlogin from './pages/dashboardlogin'; // Halaman Login
import Dashboard_Utama from './pages/Dashboard_Utama'; // Halaman Dashboard Utama

function App() {
  // Cek apakah token sudah ada saat pertama kali buka
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('sso_token')
  );

  // Callback setelah sukses login & verifikasi OTP
  const handleLoginSuccess = (token) => {
    localStorage.setItem('sso_token', token);
    setIsAuthenticated(true);
  };

  // Callback saat user logout
  const handleLogout = () => {
    localStorage.removeItem('sso_token');
    setIsAuthenticated(false);
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <Dashboard_Utama onLogout={handleLogout} />
      ) : (
        <Dashboardlogin onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;