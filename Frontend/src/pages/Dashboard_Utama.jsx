import React, { useState, useEffect, useRef } from 'react';
import '../assets/style/Dashboard_Utama.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://192.168.4.22:8000';

const Dashboard = ({ onLogout }) => {
  const [username, setUsername] = useState('User');
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Map gaya icon dan aksen warna per modul
  const moduleStyles = {
    SIMRS: { icon: 'fa-solid fa-hospital', color: '#0284c7', bg: '#e0f2fe', tag: 'Internal' },
    AMINO_MOBILE: { icon: 'fa-solid fa-mobile-screen-button', color: '#16a34a', bg: '#dcfce7', tag: 'Mobile' },
    LAPOR_AMINO: { icon: 'fa-solid fa-bullhorn', color: '#ea580c', bg: '#ffedd5', tag: 'Layanan' },
    WBS: { icon: 'fa-solid fa-shield-halved', color: '#9333ea', bg: '#f3e8ff', tag: 'Keamanan' },
  };
  const defaultStyle = { icon: 'fa-solid fa-cubes', color: '#0d9488', bg: '#ccfbf1', tag: 'Portal' };

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('sso_token');

      if (!token) {
        if (onLogout) onLogout();
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/validate`, {
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
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [onLogout]);

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
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Memuat Sesi SSO Portal...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-icon">
            <i className="fa-solid fa-hospital-user"></i>
          </div>
          <div className="brand-text">
            <h2>RSJD dr. Amino Gondohutomo</h2>
            <span>Single Sign-On Portal System</span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="status-badge">
            <span className="dot-online"></span> System Normal
          </div>

          <div className="user-menu" ref={dropdownRef}>
            <button
              className="user-menu-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="user-avatar">{initial}</div>
              <span className="user-name">{username}</span>
              <i className="fa-solid fa-chevron-down caret-icon"></i>
            </button>

            <div className={`user-dropdown ${isDropdownOpen ? 'open' : ''}`}>
              <div className="user-dropdown-header">
                <p className="dropdown-label">Signed in as</p>
                <p className="dropdown-username">{username}</p>
              </div>
              <button type="button" className="logout-btn" onClick={() => handleLogout('logout')}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout Sesi
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="dashboard-container">
        {/* WELCOME BANNER */}
        <section className="welcome-banner">
          <div className="banner-content">
            <h1>Selamat Datang Kembali, <span>{username}</span>!</h1>
            <p>Akses seluruh modul operasional dan layanan internal rumah sakit dalam satu pintu SSO.</p>
          </div>
          <div className="banner-stats">
            <div className="stat-card">
              <span className="stat-number">{modules.length}</span>
              <span className="stat-label">Aplikasi Aktif</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Layanan SSO</span>
            </div>
          </div>
        </section>

        {/* SECTION HEADER & SEARCH */}
        <section className="portal-section">
          <div className="content-header">
            <div>
              <h3>Daftar Modul Aplikasi</h3>
              <p className="sub-title">Pilih modul untuk membuka layanan terintegrasi</p>
            </div>

            <div className="search-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Cari aplikasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {/* APPS GRID */}
          <div className="apps-grid">
            {filteredModules.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-folder-open"></i>
                <p>Tidak ada modul yang ditemukan.</p>
              </div>
            ) : (
              filteredModules.map((module, index) => {
                const code = module.code || '';
                const name = module.name || code || 'Module';
                const url = module.url || '#';
                const style = moduleStyles[code] || defaultStyle;
                const description = module.description || 'Sistem informasi operasional dan portal internal RSJD.';

                return (
                  <a
                    key={index}
                    className="app-card"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="card-top">
                      <div className="card-icon" style={{ color: style.color, backgroundColor: style.bg }}>
                        <i className={style.icon}></i>
                      </div>
                      <span className="card-tag">{style.tag}</span>
                    </div>
                    <div className="card-body">
                      <h4 className="card-title">{name}</h4>
                      <p className="card-desc">{description}</p>
                    </div>
                    <div className="card-footer">
                      <span>Buka Aplikasi</span>
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;