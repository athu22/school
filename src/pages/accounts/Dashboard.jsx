import React, { useState, useEffect } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import DashboardChart from '../../components/dashboard/DashboardChart';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPieChart } from 'react-icons/fi';
import { getTransactions } from '../../services/accountService';
import useAuthStore from '../../store/authStore';

const AccountsDashboard = () => {
  const { profile } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0 });

  useEffect(() => {
    if (!profile?.schoolId) return;
    const unsubscribe = getTransactions(profile.schoolId, (data) => {
      setTransactions(data);
      const income = data.filter(t => t.type === 'credit').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const expenses = data.filter(t => t.type === 'debit').reduce((acc, curr) => acc + Number(curr.amount), 0);
      setStats({ income, expenses, balance: income - expenses });
    });
    return () => unsubscribe();
  }, [profile?.schoolId]);

  const chartData = [
    { name: 'Income', value: stats.income },
    { name: 'Expense', value: stats.expenses },
  ];

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}>Financial Overview</h1>
        <p style={{ color: 'var(--text-muted)' }}>Realtime tracking of school income and expenditures.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard icon={<FiTrendingUp />} label="Total Income" value={`₹${(stats.income || 0).toLocaleString()}`} color="var(--success)" />
        <StatCard icon={<FiTrendingDown />} label="Total Expenses" value={`₹${(stats.expenses || 0).toLocaleString()}`} color="var(--accent)" />
        <StatCard icon={<FiDollarSign />} label="Net Balance" value={`₹${(stats.balance || 0).toLocaleString()}`} color="var(--primary)" />
        <StatCard icon={<FiPieChart />} label="Cash in Hand" value={`₹${(stats.balance || 0).toLocaleString()}`} color="var(--warning)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="premium-card" style={{ padding: '2rem' }}>
          <h3>Recent Transactions</h3>
          <div style={{ marginTop: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Description</th>
                  <th style={{ padding: '1rem' }}>Type</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 8).map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>{t.date}</td>
                    <td style={{ padding: '1rem' }}>{t.description}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.7rem', 
                        fontWeight: '600',
                        background: t.type === 'credit' ? 'var(--success)15' : 'var(--accent)15',
                        color: t.type === 'credit' ? 'var(--success)' : 'var(--accent)'
                      }}>
                        {t.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                      {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="premium-card" style={{ padding: '2rem' }}>
          <h3>Revenue Breakdown</h3>
          <div style={{ marginTop: '2rem' }}>
            <DashboardChart type="bar" data={chartData} dataKey="value" />
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountsDashboard;
