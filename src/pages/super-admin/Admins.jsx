import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiUsers, FiMail, FiShield, FiCalendar } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch users with role 'admin'
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdmins(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}>School Administrators</h1>
        <p style={{ color: 'var(--text-muted)' }}>Overview of all registered school admin accounts.</p>
      </div>

      <div className="premium-card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
              <th style={{ padding: '1rem' }}>Admin Name</th>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>School Name</th>
              <th style={{ padding: '1rem' }}>School ID</th>
              <th style={{ padding: '1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading admins...</td></tr>
            ) : admins.length > 0 ? admins.map((admin) => (
              <tr key={admin.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: '600' }}>{admin.fullName}</td>
                <td style={{ padding: '1rem' }}>{admin.email}</td>
                <td style={{ padding: '1rem' }}>{admin.schoolName || 'N/A'}</td>
                <td style={{ padding: '1rem' }}><code style={{ background: 'var(--background)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{admin.schoolId}</code></td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    background: admin.status === 'active' ? 'var(--success)15' : 'var(--accent)15',
                    color: admin.status === 'active' ? 'var(--success)' : 'var(--accent)',
                    fontWeight: '600'
                  }}>
                    {admin.status?.toUpperCase()}
                  </span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No school admins found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admins;
