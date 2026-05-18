import React from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiClock } from 'react-icons/fi';

const NotificationPanel = ({ notifications }) => {
  return (
    <div className="premium-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem' }}>Notifications</h3>
        <FiBell style={{ color: 'var(--primary)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
        {notifications.length > 0 ? notifications.map((notif, index) => (
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            key={notif.id || index} 
            style={{ 
              padding: '1rem', 
              borderRadius: 'var(--radius-md)', 
              background: 'var(--background)',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}
          >
            <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{notif.title}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{notif.message}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <FiClock size={10} />
              <span>{notif.time || 'Just now'}</span>
            </div>
          </motion.div>
        )) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <p>No new notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
