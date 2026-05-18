import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');

  useEffect(() => {
    const handleToggle = () => {
      setIsCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
    };
    window.addEventListener('sidebar-toggle', handleToggle);
    return () => window.removeEventListener('sidebar-toggle', handleToggle);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div 
        style={{ 
          flex: 1, 
          marginLeft: isCollapsed ? '80px' : '280px',
          transition: 'margin-left 0.3s ease',
          minWidth: 0 // Prevent content overflow inside flexible layouts
        }}
      >
        <Navbar />
        <main style={{ 
          marginTop: '70px', 
          padding: '2rem',
          minHeight: 'calc(100vh - 70px)',
          background: 'var(--background)'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
