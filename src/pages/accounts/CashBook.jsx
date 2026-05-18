import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAccounts } from '../../hooks/useAccounts';
import useAuthStore from '../../store/authStore';
import { FiBookOpen } from 'react-icons/fi';

const CashBook = () => {
  const { profile } = useAuthStore();
  const { transactions, loading } = useAccounts(profile?.schoolId);
  const [cashEntries, setCashEntries] = useState([]);

  useEffect(() => {
    // Filter transactions that used 'Cash' (this would need paymentMode in transaction or linked expense/fee)
    // For now, filtering based on a simplified assumption or adding paymentMode to transactions service.
    setCashEntries(transactions); // Simplified view
  }, [transactions]);

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}><FiBookOpen /> Cash Book</h1>
        <p style={{ color: 'var(--text-muted)' }}>Detailed record of all cash inflows and outflows.</p>
      </div>

      <div className="premium-card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Particulars</th>
              <th style={{ padding: '1rem' }}>Receipt (In)</th>
              <th style={{ padding: '1rem' }}>Payment (Out)</th>
              <th style={{ padding: '1rem' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : cashEntries.map((t, idx) => {
              const prevBalance = idx === 0 ? 0 : 0; // Simplified balance calculation
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>{t.date}</td>
                  <td style={{ padding: '1rem' }}>{t.description}</td>
                  <td style={{ padding: '1rem', color: 'var(--success)' }}>
                    {t.type === 'credit' ? `₹${t.amount.toLocaleString()}` : '-'}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--accent)' }}>
                    {t.type === 'debit' ? `₹${t.amount.toLocaleString()}` : '-'}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>₹{t.amount.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default CashBook;
