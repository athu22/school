import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getTransactions } from '../../services/accountService';
import useAuthStore from '../../store/authStore';
import { FiBook } from 'react-icons/fi';

const DayBook = () => {
  const { profile } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile?.schoolId) return;
    const unsubscribe = getTransactions(profile.schoolId, (data) => {
      // Filter only today's transactions
      const todayData = data.filter(t => t.date === today);
      setTransactions(todayData);
    });
    return () => unsubscribe();
  }, [profile?.schoolId]);

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}><FiBook /> Day Book</h1>
        <p style={{ color: 'var(--text-muted)' }}>Daily transaction summary for <strong>{today}</strong>.</p>
      </div>

      <div className="premium-card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
              <th style={{ padding: '1rem' }}>Category</th>
              <th style={{ padding: '1rem' }}>Description</th>
              <th style={{ padding: '1rem' }}>Debit (Out)</th>
              <th style={{ padding: '1rem' }}>Credit (In)</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? transactions.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>{t.category}</td>
                <td style={{ padding: '1rem' }}>{t.description}</td>
                <td style={{ padding: '1rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                  {t.type === 'debit' ? `₹${t.amount.toLocaleString()}` : '-'}
                </td>
                <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>
                  {t.type === 'credit' ? `₹${t.amount.toLocaleString()}` : '-'}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions for today yet.</td></tr>
            )}
          </tbody>
          {transactions.length > 0 && (
            <tfoot>
              <tr style={{ background: 'var(--background)', fontWeight: 'bold' }}>
                <td colSpan="2" style={{ padding: '1rem', textAlign: 'right' }}>Total:</td>
                <td style={{ padding: '1rem', color: 'var(--accent)' }}>
                  ₹{transactions.filter(t => t.type === 'debit').reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()}
                </td>
                <td style={{ padding: '1rem', color: 'var(--success)' }}>
                  ₹{transactions.filter(t => t.type === 'credit').reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </DashboardLayout>
  );
};

export default DayBook;
