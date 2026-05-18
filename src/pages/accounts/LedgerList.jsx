import React from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAccounts } from '../../hooks/useAccounts';
import useAuthStore from '../../store/authStore';
import { FiList } from 'react-icons/fi';

const LedgerList = () => {
  const { profile } = useAuthStore();
  const { transactions } = useAccounts(profile?.schoolId);

  // Group transactions by category to create a pseudo-ledger list
  const ledgers = transactions.reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = { name: t.category, debit: 0, credit: 0 };
    }
    if (t.type === 'debit') acc[t.category].debit += Number(t.amount);
    else acc[t.category].credit += Number(t.amount);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}><FiList /> Chart of Accounts</h1>
        <p style={{ color: 'var(--text-muted)' }}>List of all active ledgers and their balances.</p>
      </div>

      <div className="premium-card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
              <th style={{ padding: '1rem' }}>Ledger Name</th>
              <th style={{ padding: '1rem' }}>Total Debit</th>
              <th style={{ padding: '1rem' }}>Total Credit</th>
              <th style={{ padding: '1rem' }}>Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(ledgers).length > 0 ? Object.values(ledgers).map((ledger) => (
              <tr key={ledger.name} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{ledger.name}</td>
                <td style={{ padding: '1rem', color: 'var(--accent)' }}>₹{ledger.debit.toLocaleString()}</td>
                <td style={{ padding: '1rem', color: 'var(--success)' }}>₹{ledger.credit.toLocaleString()}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                  ₹{Math.abs(ledger.credit - ledger.debit).toLocaleString()} 
                  {ledger.credit >= ledger.debit ? ' Cr' : ' Dr'}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No accounting records found (0)</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default LedgerList;
