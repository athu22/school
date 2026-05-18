import React from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAccounts } from '../../hooks/useAccounts';
import useAuthStore from '../../store/authStore';
import { FiPieChart } from 'react-icons/fi';

const BalanceSheet = () => {
  const { profile } = useAuthStore();
  const { transactions } = useAccounts(profile?.schoolId);

  const totalIncome = transactions.filter(t => t.type === 'credit').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'debit').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const netSurplus = totalIncome - totalExpense;

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}><FiPieChart /> Balance Sheet</h1>
        <p style={{ color: 'var(--text-muted)' }}>Financial position of the school as of today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Liabilities */}
        <div className="premium-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>LIABILITIES</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span>Capital Fund (Surplus)</span>
            <span>₹{netSurplus.toLocaleString()}</span>
          </div>
          <div style={{ marginTop: '5rem', borderTop: '2px solid #000', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Total Liabilities</span>
            <span>₹{netSurplus.toLocaleString()}</span>
          </div>
        </div>

        {/* Assets */}
        <div className="premium-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>ASSETS</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span>Cash in Hand & Bank</span>
            <span>₹{netSurplus.toLocaleString()}</span>
          </div>
          <div style={{ marginTop: '5rem', borderTop: '2px solid #000', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Total Assets</span>
            <span>₹{netSurplus.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BalanceSheet;
