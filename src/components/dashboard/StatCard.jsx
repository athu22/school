import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ icon, label, value, color = 'var(--primary)', trend }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="premium-card"
      style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}
    >
      <div style={{ 
        width: '56px', 
        height: '56px', 
        borderRadius: '16px', 
        background: `${color}15`, 
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem'
      }}>
        {icon}
      </div>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>{label}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{value}</h3>
          {trend && (
            <span style={{ 
              fontSize: '0.75rem', 
              color: trend.startsWith('+') ? 'var(--success)' : 'var(--accent)',
              fontWeight: '600'
            }}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
