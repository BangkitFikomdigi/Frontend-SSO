import React, { useState, useEffect, useRef } from 'react';
import '../assets/style/Dashboard_Utama.css';

const Dashboard = ({ onLogout }) => {
  const [username, setUsername] = useState('User');
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Icon bawaan Font Awesome
  const moduleStyles = {
    SIMRS: { icon: 'fa-solid fa-hospital' },
    AMINO_MOBILE: { icon: 'fa-solid fa-mobile-screen' },
    LAPOR_AMINO: { icon: 'fa-solid fa-bullhorn' },
    WBS: { icon: 'fa-solid fa-shield-halved' },
  };
  const defaultStyle = { icon: 'fa-solid fa-grip' };

  // Validasi Sesi & Fetch Data
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('sso_token');

      // Jika tidak ada token, panggil logout
      if (!token) {
        if (onLogout) onLogout();
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/auth/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({})
        });

        const sessionData = await response.json();

        if (sessionData && sessionData.success && sessionData.valid) {
          setModules(sessionData.data?.user?.modul_akses || []);
          setUsername(sessionData.data?.user?.username || 'User');
        } else {
          if (onLogout) onLogout('expired');
        }
      } catch (error) {
        console.error('Gagal memvalidasi sesi:', error);
        // Tetap tampilkan dashboard dengan array kosong jika API backend mati/error
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [onLogout]);

  // Handle Klik di luar Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = (reason = '') => {
    localStorage.removeItem('sso_token');
    if (onLogout) onLogout(reason);
  };

  const filteredModules = modules.filter((module) => {
    const name = module.name || module.code || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const initial = username ? username.charAt(0).toUpperCase() : 'U';

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#16a385', fontFamily: 'Inter, sans-serif' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-title">RSJD dr. Amino Gondohutomo</div>
        <div className="topbar-right">
          <div className="topbar-tab">
            <i className="fa-solid fa-th-large"></i> Apps
          </div>

          <div className="user-menu" ref={dropdownRef}>
            <button
              className="user-menu-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="user-avatar">{initial}</span>
              {username}
              <i className="fa-solid fa-caret-down"></i>
            </button>

            <div className={`user-dropdown ${isDropdownOpen ? 'open' : ''}`}>
              <div className="user-dropdown-name">{username}</div>
              <button type="button" onClick={() => handleLogout('logout')}>
                <i className="fa-solid fa-right-from-bracket"></i> Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="content">
        <div className="content-header">
          <h1>Portal Aplikasi</h1>
          <div className="search-box">
            <i className="fa-solid fa-search"></i>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {/* APPS GRID */}
        <div className="apps-grid">
          {filteredModules.length === 0 ? (
            <p className="empty-state">Belum ada aplikasi yang dapat diakses.</p>
          ) : (
            filteredModules.map((module, index) => {
              const code = module.code || '';
              const name = module.name || code || 'Module';
              const url = module.url || '#';
              const style = moduleStyles[code] || defaultStyle;
              const description = module.description || 'Layanan sistem informasi dan portal internal.';

              return (
                <a
                  key={index}
                  className="app-card"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="card-icon">
                    <i className={style.icon}></i>
                  </div>
                  <h3 className="card-title">{name}</h3>
                  <p className="card-desc">{description}</p>
                </a>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;