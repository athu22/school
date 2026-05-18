import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getTransactions } from '../../services/accountService';
import useAuthStore from '../../store/authStore';
import { FiActivity } from 'react-icons/fi';

const ProfitLoss = () => {
  const { profile } = useAuthStore();
  const [stats, setStats] = useState({ income: 0, expenses: 0 });

  useEffect(() => {
    if (!profile?.schoolId) return;
    const unsubscribe = getTransactions(profile.schoolId, (data) => {
      const income = data.filter(t => t.type === 'credit').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const expenses = data.filter(t => t.type === 'debit').reduce((acc, curr) => acc + Number(curr.amount), 0);
      setStats({ income, expenses });
    });
    return () => unsubscribe();
  }, [profile?.schoolId]);

  const netProfit = stats.income - stats.expenses;

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}><FiActivity /> Profit & Loss Account</h1>
        <p style={{ color: 'var(--text-muted)' }}>Consolidated financial performance statement.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Income Side */}
        <div className="premium-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--success)', marginBottom: '1.5rem', borderBottom: '2px solid var(--success)30', paddingBottom: '0.5rem' }}>INCOME</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span>Fee Collections</span>
            <span style={{ fontWeight: 'bold' }}>₹{stats.income.toLocaleString()}</span>
          </div>
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
            <span>Total Income</span>
            <span>₹{stats.income.toLocaleString()}</span>
          </div>
        </div>

        {/* Expense Side */}
        <div className="premium-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--accent)', marginBottom: '1.5rem', borderBottom: '2px solid var(--accent)30', paddingBottom: '0.5rem' }}>EXPENSES</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span>Operating Expenses</span>
            <span style={{ fontWeight: 'bold' }}>₹{stats.expenses.toLocaleString()}</span>
          </div>
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
            <span>Total Expenses</span>
            <span>₹{stats.expenses.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="premium-card" style={{ marginTop: '2rem', padding: '2rem', textAlign: 'center', background: netProfit >= 0 ? 'var(--success)10' : 'var(--accent)10' }}>
        <h2 style={{ color: netProfit >= 0 ? 'var(--success)' : 'var(--accent)' }}>
          {netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'}: ₹{Math.abs(netProfit).toLocaleString()}
        </h2>
      </div>
    </DashboardLayout>
  );
};

export default ProfitLoss;
