import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiSearch, FiUser, FiMoon, FiSun, FiGlobe, FiCommand } from 'react-icons/fi';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import useAuthStore from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';

const Navbar = () => {
  const { profile } = useAuthStore();
  const { language, setLanguage, isMarathi } = useLanguage();
  const [isDark, setIsDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
  const [searchFocused, setSearchFocused] = useState(false);
  const [schoolName, setSchoolName] = useState('National Public School');

  useEffect(() => {
    const fetchSchoolName = async () => {
      if (profile?.schoolId) {
        try {
          const schSnap = await getDoc(doc(db, 'schools', profile.schoolId));
          if (schSnap.exists()) {
            setSchoolName(schSnap.data().name || 'National Public School');
          }
        } catch (err) {
          console.error("Error fetching school name:", err);
        }
      }
    };
    fetchSchoolName();
  }, [profile?.schoolId]);

  useEffect(() => {
    // Listen for sidebar toggles to transition margin/width smoothly
    const handleToggle = () => {
      setIsCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
    };
    window.addEventListener('sidebar-toggle', handleToggle);
    return () => window.removeEventListener('sidebar-toggle', handleToggle);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
  };

  return (
    <>
      <style>{`
        .navbar-search-wrapper {
          position: relative;
          width: 320px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .navbar-search-wrapper.focused {
          width: 380px;
        }
        .navbar-search-input {
          width: 100%;
          padding: 0.65rem 1rem 0.65rem 2.85rem;
          border-radius: var(--radius-md);
          background: var(--background);
          border: 1px solid var(--border);
          color: var(--text-main);
          outline: none;
          font-size: 0.85rem;
          transition: all 0.3s ease;
        }
        .navbar-search-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
          background: var(--surface);
        }
        .shortcut-badge {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 0.2rem 0.4rem;
          background: var(--border);
          border-radius: 4px;
          color: var(--text-muted);
          font-size: 0.7rem;
          font-weight: 600;
          pointer-events: none;
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }
        .navbar-search-wrapper.focused .shortcut-badge {
          opacity: 0;
        }
        .lang-pill-container {
          display: flex;
          background: var(--background);
          border: 1px solid var(--border);
          padding: 3px;
          border-radius: 20px;
          gap: 2px;
        }
        .lang-pill-btn {
          padding: 0.4rem 0.85rem;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          background: transparent;
          color: var(--text-muted);
        }
        .lang-pill-btn.active {
          background: var(--surface);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .nav-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-main);
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }
        .nav-btn:hover {
          border-color: var(--primary-light);
          color: var(--primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }
        .nav-btn:active {
          transform: translateY(0);
        }
        .pulse-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          background: var(--accent);
          border-radius: 50%;
          border: 2px solid var(--surface);
        }
        .pulse-radar {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          background: var(--accent);
          border-radius: 50%;
          animation: pulse-ring 1.8s infinite ease-in-out;
          opacity: 0.6;
          pointer-events: none;
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        .live-ping-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: live-ping 1.5s infinite ease-in-out;
          opacity: 0.75;
        }
        @keyframes live-ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        .user-chip {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.35rem 0.5rem 0.35rem 1rem;
          border-radius: 14px;
          background: rgba(99, 102, 241, 0.04);
          border: 1px solid rgba(99, 102, 241, 0.08);
          transition: all 0.25s ease;
          cursor: pointer;
        }
        .user-chip:hover {
          background: rgba(99, 102, 241, 0.08);
          border-color: rgba(99, 102, 241, 0.2);
          transform: translateY(-1px);
        }
      `}</style>
 
      <motion.header
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="glass"
        style={{
          height: '70px',
          position: 'fixed',
          top: 0,
          right: 0,
          left: isCollapsed ? '80px' : '280px',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          borderBottom: '1px solid var(--glass-border)',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}
      >
        {/* Left Section: Branding Banner & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Stunning Real-time School Branding Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '12px' }} title={isMarathi ? "सुरक्षित डेटा सिंक्रोनाइझेशन चालू आहे" : "Firestore Secure Real-time Sync Active"}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '8px', height: '8px' }}>
              <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
              <span className="live-ping-dot"></span>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '0.2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {schoolName}
            </span>
          </div>

          <div style={{ height: '20px', width: '1px', background: 'var(--border)' }}></div>

          {/* Search Bar section */}
          <div className={`navbar-search-wrapper ${searchFocused ? 'focused' : ''}`}>
            <FiSearch style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: searchFocused ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'color 0.2s ease',
              zIndex: 5
            }} />
            <input 
              type="text" 
              placeholder={isMarathi ? "विद्यार्थी, निकाल शोधा..." : "Search students, results..."}
              className="navbar-search-input"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <div className="shortcut-badge">
              <FiCommand size={10} />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Profile section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          
          {/* Stunning Real-time Language Selector Pill */}
          <div className="lang-pill-container" title={isMarathi ? 'भाषा बदला' : 'Change Language'}>
            <button 
              className={`lang-pill-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
            <button 
              className={`lang-pill-btn ${language === 'mr' ? 'active' : ''}`}
              onClick={() => setLanguage('mr')}
            >
              मराठी
            </button>
          </div>

          {/* Theme Toggler */}
          <button 
            onClick={toggleTheme}
            className="nav-btn"
            title={isDark ? (isMarathi ? 'प्रकाशमय मोड' : 'Light Mode') : (isMarathi ? 'अंधारमय मोड' : 'Dark Mode')}
          >
            <motion.div
              animate={{ rotate: isDark ? 180 : 0 }}
              transition={{ type: 'spring', damping: 15 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </motion.div>
          </button>

          {/* Glowing Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button 
              className="nav-btn" 
              title={isMarathi ? 'सूचना' : 'Notifications'}
            >
              <FiBell size={18} />
              <span className="pulse-badge"></span>
              <span className="pulse-radar"></span>
            </button>
          </div>

          <div style={{ height: '24px', width: '1px', background: 'var(--border)' }}></div>

          {/* Professional Branded Profile Badge */}
          <div className="user-chip">
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>
                {profile?.fullName}
              </p>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                {profile?.role === 'super_admin' ? (isMarathi ? 'मुख्य ॲडमिन' : 'Super Admin') : (isMarathi ? 'ॲडमिन' : 'Admin')}
              </p>
            </div>
            
            <div style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
              fontWeight: '700'
            }}>
              <FiUser size={18} />
            </div>
          </div>

        </div>
      </motion.header>
    </>
  );
};

export default Navbar;
