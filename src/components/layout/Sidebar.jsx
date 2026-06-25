import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Clock, CreditCard, FileSpreadsheet,
  FileText, Settings, Wallet, LibraryBig, List, BookOpen,
  ChevronDown, ChevronRight, Utensils, Package, IndianRupee,
  DollarSign, TrendingUp, TrendingDown, Book, Award,
  Edit3, Download, Lock, PanelLeftClose, PanelLeftOpen,
  LogOut, Briefcase, GraduationCap, Building2, UserCircle, Calculator,
  ArrowRightLeft, PlusCircle, Weight, Map, UserCheck, Layers
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';

const Sidebar = () => {
  const { profile, logout } = useAuthStore();
  const { t, isMarathi } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
  const [expandedItems, setExpandedItems] = useState({});

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
    // Emit window event so DashboardLayout can update margin instantly
    window.dispatchEvent(new Event('sidebar-toggle'));
  };

  const getNavItems = (role) => {
    if (role === 'super_admin') {
      return [
        {
          nameKey: 'dashboard',
          path: '/super-admin/dashboard',
          icon: <LayoutDashboard size={20} />,
          label: isMarathi ? 'डॅशबोर्ड' : 'Dashboard'
        },
        {
          nameKey: 'schools',
          hasSubmenu: true,
          icon: <Building2 size={20} />,
          label: isMarathi ? 'शाळा व्यवस्थापन' : 'School Management',
          submenu: [
            {
              nameKey: 'manageSchools',
              path: '/super-admin/schools',
              icon: <BookOpen size={18} />,
              label: isMarathi ? 'शाळा व्यवस्थापित करा' : 'Manage Schools'
            },
            {
              nameKey: 'manageAdmins',
              path: '/super-admin/admins',
              icon: <UserCheck size={18} />,
              label: isMarathi ? 'ॲडमिन्स व्यवस्थापित करा' : 'Manage Admins'
            },
          ]
        },
        {
          nameKey: 'settings',
          path: '/super-admin/settings',
          icon: <Settings size={20} />,
          label: isMarathi ? 'सेटिंग्ज' : 'Settings'
        },
      ];
    }

    if (role === 'admin') {
      return [
        {
          nameKey: 'dashboard',
          path: '/admin/dashboard',
          icon: <LayoutDashboard size={20} />,
          label: isMarathi ? 'डॅशबोर्ड' : 'Dashboard'
        },

        // Academic Section (Top Level Menu)
        {
          nameKey: 'academic',
          hasSubmenu: true,
          icon: <GraduationCap size={20} />,
          label: isMarathi ? 'शैक्षणिक' : 'Academic',
          submenu: [
            {
              nameKey: 'studentList',
              path: '/admin/students',
              icon: <List size={18} />,
              label: isMarathi ? 'विद्यार्थी यादी' : 'Student List'
            },
            {
              nameKey: 'studentAdmission',
              path: '/admin/students/add',
              icon: <PlusCircle size={18} />,
              label: isMarathi ? 'विद्यार्थी प्रवेश' : 'Student Admission'
            },
            {
              nameKey: 'classes',
              path: '/admin/classes',
              icon: <BookOpen size={18} />,
              label: isMarathi ? 'वर्ग' : 'Classes'
            },
            {
              nameKey: 'divisions',
              path: '/admin/divisions',
              icon: <Layers size={18} />,
              label: isMarathi ? 'तुकड्या' : 'Divisions'
            },
            {
              nameKey: 'teachers',
              path: '/admin/teachers',
              icon: <UserCheck size={18} />,
              label: isMarathi ? 'शिक्षक' : 'Teachers'
            },
            {
              nameKey: 'attendance',
              path: '/admin/attendance',
              icon: <Clock size={18} />,
              label: isMarathi ? 'हजेरी पत्रक' : 'Presenty Sheet'
            },
            {
              nameKey: 'attendanceReport',
              path: '/admin/attendance/report',
              icon: <FileSpreadsheet size={18} />,
              label: isMarathi ? 'हजेरी अहवाल' : 'Presenty Report'
            },
            /* {
              nameKey: 'idCards',
              path: '/admin/id-cards',
              icon: <CreditCard size={18} />,
              label: isMarathi ? 'ओळखपत्र' : 'ID Cards'
            }, */
          ]
        },

        // Examinations Section (Top Level Menu)
        {
          nameKey: 'examinations',
          hasSubmenu: true,
          icon: <FileText size={20} />,
          label: isMarathi ? 'परीक्षा आणि निकाल' : 'Exams & Results',
          submenu: [
            {
              nameKey: 'examList',
              path: '/admin/exams',
              icon: <List size={18} />,
              label: isMarathi ? 'परीक्षा यादी' : 'Exam List'
            },
            {
              nameKey: 'addExam',
              path: '/admin/exams/add',
              icon: <PlusCircle size={18} />,
              label: isMarathi ? 'परीक्षा वेळापत्रक' : 'Schedule Exam'
            },
            {
              nameKey: 'results',
              path: '/admin/results',
              icon: <Award size={18} />,
              label: isMarathi ? 'निकाल' : 'Results'
            },
          ]
        },

        // Accounts Section (Top Level Menu)
        {
          nameKey: 'accounts',
          hasSubmenu: true,
          icon: <DollarSign size={20} />,
          label: isMarathi ? 'लेखा विभाग' : 'Accounts',
          submenu: [
            {
              nameKey: 'overview',
              path: '/admin/accounts',
              icon: <LayoutDashboard size={18} />,
              label: isMarathi ? 'आढावा' : 'Overview'
            },
            {
              nameKey: 'fees',
              path: '/admin/accounts/fees',
              icon: <IndianRupee size={18} />,
              label: isMarathi ? 'फी संकलन' : 'Fee Collection'
            },
            {
              nameKey: 'expenses',
              path: '/admin/accounts/expenses',
              icon: <TrendingDown size={18} />,
              label: isMarathi ? 'खर्च' : 'Expenses'
            },
            {
              nameKey: 'daybook',
              path: '/admin/accounts/day-book',
              icon: <Book size={18} />,
              label: isMarathi ? 'दैनंदिन नोंदवही' : 'Day Book'
            },
            {
              nameKey: 'profitloss',
              path: '/admin/accounts/profit-loss',
              icon: <TrendingUp size={18} />,
              label: isMarathi ? 'नफा आणि तोटा' : 'Profit & Loss'
            },
            {
              nameKey: 'cashbook',
              path: '/admin/accounts/cash-book',
              icon: <Wallet size={18} />,
              label: isMarathi ? 'रोख नोंदवही' : 'Cash Book'
            },
            {
              nameKey: 'ledgers',
              path: '/admin/accounts/ledgers',
              icon: <BookOpen size={18} />,
              label: isMarathi ? 'खातेवही' : 'Ledger List'
            },
            {
              nameKey: 'balancesheet',
              path: '/admin/accounts/balance-sheet',
              icon: <FileSpreadsheet size={18} />,
              label: isMarathi ? 'ताळेबंद' : 'Balance Sheet'
            },
          ]
        },

        // Certificates & Settings
        /* {
          nameKey: 'certificates',
          hasSubmenu: true,
          icon: <Award size={20} />,
          label: isMarathi ? 'प्रमाणपत्रे' : 'Certificates',
          submenu: [
            {
              nameKey: 'certificateHistory',
              path: '/admin/certificates',
              icon: <FileText size={18} />,
              label: isMarathi ? 'दाखले नोंदवही' : 'Certificate Registry'
            },
            {
              nameKey: 'bonafide',
              path: '/admin/certificates/generate?type=Bonafide',
              icon: <FileText size={18} />,
              label: isMarathi ? 'बोनाफाईड प्रमाणपत्र' : 'Bonafide Certificate'
            },
            {
              nameKey: 'lc',
              path: '/admin/certificates/generate?type=LC',
              icon: <FileText size={18} />,
              label: isMarathi ? 'शाळा सोडल्याचा दाखला (L.C.)' : 'Leaving Certificate (L.C.)'
            },
            {
              nameKey: 'tc',
              path: '/admin/certificates/generate?type=TC',
              icon: <FileText size={18} />,
              label: isMarathi ? 'बदलीचा दाखला (T.C.)' : 'Transfer Certificate (T.C.)'
            },
            {
              nameKey: 'nirgam',
              path: '/admin/certificates/generate?type=Nirgam',
              icon: <FileText size={18} />,
              label: isMarathi ? 'निर्गम उतारा (G.R. Extract)' : 'General Register Extract'
            },
            {
              nameKey: 'character',
              path: '/admin/certificates/generate?type=Character',
              icon: <FileText size={18} />,
              label: isMarathi ? 'चारित्र्य प्रमाणपत्र' : 'Character Certificate'
            },
          ]
        }, */
        {
          nameKey: 'settings',
          path: '/admin/settings',
          icon: <Settings size={20} />,
          label: isMarathi ? 'सेटिंग्ज' : 'Settings'
        },
      ];
    }

    return [];
  };

  const navItems = getNavItems(profile?.role);

  // Ensure active parent is expanded on mount/location change
  useEffect(() => {
    navItems.forEach(item => {
      if (item.hasSubmenu) {
        const hasActiveChild = (submenu) => {
          return submenu.some(sub => {
            const cleanPath = sub.path ? sub.path.split('?')[0] : '';
            if (cleanPath === location.pathname) return true;
            if (sub.hasSubmenu) return hasActiveChild(sub.submenu);
            return false;
          });
        };

        if (hasActiveChild(item.submenu)) {
          setExpandedItems(prev => ({ ...prev, [item.nameKey]: true }));
        }
      }
    });
  }, [location.pathname, profile?.role]);

  const toggleSubmenu = (itemKey) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  const renderNavItem = (item, level = 0) => {
    const isExpanded = expandedItems[item.nameKey];
    const indentSize = isCollapsed ? 0 : (level === 0 ? 0 : 20 + (level - 1) * 15);

    if (item.hasSubmenu) {
      return (
        <li key={item.nameKey} style={{ marginBottom: '4px' }}>
          <button
            className={`nav-item ${isExpanded ? 'submenu-open' : ''}`}
            onClick={() => toggleSubmenu(item.nameKey)}
            style={{
              width: '100%',
              paddingLeft: `${indentSize + 16}px`,
              background: isExpanded && level === 0 ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              borderLeft: isExpanded && level === 0 ? '3px solid #818cf8' : '3px solid transparent',
              borderTop: 'none',
              borderRight: 'none',
              borderBottom: 'none'
            }}
          >
            <span className="icon-wrapper" style={{ opacity: isExpanded ? 1 : 0.8 }}>{item.icon}</span>
            {!isCollapsed && (
              <>
                <span className="nav-label" style={{
                  fontWeight: level === 0 ? '700' : (level === 1 ? '600' : '500'),
                  fontSize: level === 0 ? '0.95rem' : '0.9rem',
                  flex: 1,
                  textAlign: 'left'
                }}>
                  {item.label}
                </span>
                {isExpanded ? <ChevronDown size={14} style={{ opacity: 0.8 }} /> : <ChevronRight size={14} style={{ opacity: 0.8 }} />}
              </>
            )}
          </button>

          <AnimatePresence>
            {isExpanded && !isCollapsed && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="submenu-list"
                style={{ position: 'relative', listStyle: 'none', padding: 0, margin: 0 }}
              >
                {!isCollapsed && (
                  <div style={{
                    position: 'absolute',
                    left: `${indentSize + 25}px`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background: 'rgba(255,255,255,0.12)'
                  }} />
                )}
                {item.submenu.map(subItem => renderNavItem(subItem, level + 1))}
              </motion.ul>
            )}
          </AnimatePresence>
        </li>
      );
    }

    // Precise path matching logic to prevent duplicate highlight conflict
    let isActive = false;
    if (item.path) {
      const hasQuery = item.path.includes('?');
      const itemBasePath = hasQuery ? item.path.split('?')[0] : item.path;
      const itemSearch = hasQuery ? ('?' + item.path.split('?')[1]) : '';

      if (item.path === '/admin/students') {
        isActive = location.pathname === '/admin/students' ||
          location.pathname.startsWith('/admin/students/profile') ||
          location.pathname.startsWith('/admin/students/edit');
      } else if (item.path === '/admin/attendance') {
        isActive = location.pathname === '/admin/attendance';
      } else if (hasQuery) {
        isActive = location.pathname === itemBasePath && location.search === itemSearch;
      } else {
        isActive = location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
      }
    }

    return (
      <li key={item.path || item.nameKey} style={{ marginBottom: '4px' }}>
        <NavLink
          to={item.path}
          className={() => (isActive ? 'nav-item active' : 'nav-item')}
          style={{
            paddingLeft: `${indentSize + 16}px`,
          }}
        >
          <span className="icon-wrapper">{item.icon}</span>
          {!isCollapsed && (
            <span className="nav-label" style={{ fontSize: '0.9rem', flex: 1, textAlign: 'left' }}>
              {item.label}
            </span>
          )}
        </NavLink>
      </li>
    );
  };

  return (
    <>
      <style>{`
        .sidebar {
          background: linear-gradient(180deg, #4f46e5 0%, #1e1b4b 100%);
          color: white;
          height: 100vh;
          overflow-y: auto;
          scrollbar-width: none;
          transition: width 0.3s ease;
          box-shadow: 4px 0 20px rgba(79, 70, 229, 0.18);
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
          display: flex;
          flex-direction: column;
        }
        .sidebar::-webkit-scrollbar { display: none; }
        
        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.85rem 1rem;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          gap: 12px;
          font-size: 0.9rem;
          text-align: left;
          border-radius: 8px;
          margin: 0 8px;
        }
        
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.12);
          color: white;
        }
        
        .nav-item.active {
          background: #ffffff !important;
          color: #4f46e5 !important;
          font-weight: 700;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
          transform: translateX(4px);
        }
        
        .nav-item.active .icon-wrapper {
          color: #4f46e5 !important;
          transform: scale(1.05);
        }

        .nav-item:active {
          transform: scale(0.98);
        }
        
        .submenu-open {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }
        
        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          opacity: 0.9;
        }
        
        .submenu-list {
          list-style: none;
          padding: 0;
          margin-top: 2px;
        }
      `}</style>

      <motion.aside
        className="sidebar"
        animate={{ width: isCollapsed ? 80 : 280 }}
      >
        <div style={{
          padding: '1.5rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          background: 'rgba(0,0,0,0.08)'
        }}>
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 36,
                height: 36,
                background: 'white',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4f46e5',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>SV</div>
              <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: 'white', letterSpacing: '0.5px' }}>SCHOOL VIDYA</h2>
            </div>
          )}
          <button
            onClick={toggleCollapse}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        <nav style={{ padding: '1rem 0', flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {navItems.map(item => renderNavItem(item))}
          </ul>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.8)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
            className="nav-item-logout"
          >
            <LogOut size={20} />
            {!isCollapsed && <span>{isMarathi ? 'लॉगआउट' : 'Logout'}</span>}
          </button>
        </div>

      </motion.aside>
    </>
  );
};

export default Sidebar;
