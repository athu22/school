import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', isLoading, ...props }) => {
  const baseStyles = {
    padding: '0.625rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: '500',
    fontSize: '0.875rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'var(--transition)',
    opacity: isLoading ? 0.7 : 1,
    cursor: isLoading ? 'not-allowed' : 'pointer'
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--primary)',
      color: '#fff',
      boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)',
    },
    secondary: {
      backgroundColor: '#fff',
      color: 'var(--text-main)',
      border: '1px solid var(--border)',
    },
    danger: {
      backgroundColor: 'var(--accent)',
      color: '#fff',
    },
  };

  return (
    <motion.button
      whileHover={!isLoading ? { scale: 1.02 } : {}}
      whileTap={!isLoading ? { scale: 0.98 } : {}}
      type={type}
      disabled={isLoading}
      onClick={onClick}
      style={{ ...baseStyles, ...variants[variant] }}
      className={`premium-button ${className}`}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          Loading...
        </span>
      ) : children}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </motion.button>
  );
};

export default Button;
