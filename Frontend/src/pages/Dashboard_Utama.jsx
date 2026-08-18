import React, { useState, useEffect, useRef } from 'react';
import '../assets/style/Dashboard_Utama.css';

const Dashboard = ({ username = 'User', modules = [], onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Map gaya icon, aksen warna, dan deskripsi per modul
  const moduleStyles = {
    SIMRS: {
      icon: 'fa-solid fa-hospital', color: '#0284c7', bg: '#e0f2fe', tag: 'Internal',
      desc: 'Sistem informasi terintegrasi untuk manajemen rekam medis dan administrasi rumah sakit.'
    },
    AMINO_MOBILE: {
      icon: 'fa-solid fa-mobile-screen-button', color: '#16a34a', bg: '#dcfce7', tag: 'Mobile',
      desc: 'Aplikasi layanan mandiri untuk kemudahan pendaftaran online dan akses informasi pasien.'
    },
    LAPOR_AMINO: {
      icon: 'fa-solid fa-bullhorn', color: '#ea580c', bg: '#ffedd5', tag: 'Layanan',
      desc: 'Platform terpadu untuk penyampaian saran, kritik, dan pengaduan layanan masyarakat.'
    },
    WBS: {
      icon: 'fa-solid fa-shield-halved', color: '#9333ea', bg: '#f3e8ff', tag: 'Keamanan',
      desc: 'Whistleblowing System untuk pelaporan indikasi pelanggaran secara rahasia dan aman.'
    },
  };

  const defaultStyle = {
    icon: 'fa-solid fa-cubes', color: '#0d9488', bg: '#ccfbf1', tag: 'Portal',
    desc: 'Layanan sistem informasi dan portal operasional internal.'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const filteredModules = modules.filter((module) => {
    const name = module.name || module.code || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const initial = username ? username.charAt(0).toUpperCase() : 'U';

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
              <button type="button" className="logout-btn" onClick={handleLogout}>
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

                // Prioritas: deskripsi dari API -> deskripsi dari style bawaan -> default
                const description = module.description || style.desc;

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