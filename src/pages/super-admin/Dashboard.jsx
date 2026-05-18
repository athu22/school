import React from 'react';
import StatCard from '../../components/dashboard/StatCard';
import DashboardChart from '../../components/dashboard/DashboardChart';
import NotificationPanel from '../../components/dashboard/NotificationPanel';
import { FiBookOpen, FiUserCheck, FiDollarSign, FiActivity } from 'react-icons/fi';
import { useRealtimeStats } from '../../hooks/useRealtimeStats';

const SuperAdminDashboard = () => {
  const { count: schoolCount } = useRealtimeStats('schools');
  const { count: userCount } = useRealtimeStats('users');
  const { data: recentSchools = [] } = useRealtimeStats('schools'); 

  const revenueData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
    { name: 'Jul', value: 3490 },
  ];

  const notifications = [
    { title: 'New School Registered', message: 'Bright Minds Academy joined the platform.', time: '2 mins ago' },
    { title: 'System Update', message: 'v2.4.0 is now live with PDF reports.', time: '1 hour ago' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>System Intelligence</h1>
        <p style={{ color: 'var(--text-muted)' }}>Global overview of your SaaS platform performance.</p>
      </div>

      {/* Top Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard icon={<FiBookOpen />} label="Total Schools" value={schoolCount || 12} trend="+2 this month" />
        <StatCard icon={<FiUserCheck />} label="Active Users" value={userCount || 142} color="var(--success)" />
        <StatCard icon={<FiDollarSign />} label="Total Revenue" value="₹4.2L" color="var(--warning)" trend="+12%" />
        <StatCard icon={<FiActivity />} label="Server Status" value="99.9%" color="var(--accent)" />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 2fr 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Revenue Analytics */}
        <div className="premium-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Revenue Analytics</h3>
          <DashboardChart data={revenueData} dataKey="value" />
        </div>

        {/* Recent Notifications */}
        <NotificationPanel notifications={notifications} />
      </div>

      {/* Recent School Registrations */}
      <div className="premium-card" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Recent School Registrations</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>School Name</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>Admin</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>Plan</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSchools?.slice(0, 5).map((school) => (
                <tr key={school.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{school.name}</td>
                  <td style={{ padding: '1rem' }}>{school.adminName}</td>
                  <td style={{ padding: '1rem' }}><span className="badge">Premium</span></td>
                  <td style={{ padding: '1rem' }}><span style={{ color: 'var(--success)', fontWeight: '600' }}>Active</span></td>
                </tr>
              ))}
              {recentSchools.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No schools registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
