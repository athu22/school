import React from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import NotificationPanel from '../../components/dashboard/NotificationPanel';
import { FiUsers, FiCalendar, FiAward, FiBook } from 'react-icons/fi';
import useAuthStore from '../../store/authStore';
import { useRealtimeStats } from '../../hooks/useRealtimeStats';

const TeacherDashboard = () => {
  const { profile } = useAuthStore();
  
  // Realtime stats for teacher (e.g. students in their class)
  const { count: myStudentCount } = useRealtimeStats('students', [
    { field: 'schoolId', operator: '==', value: profile?.schoolId },
    { field: 'classId', operator: '==', value: profile?.classId } // Assuming classId exists in profile
  ]);

  const notifications = [
    { title: 'Result Entry Open', message: 'Final exam marks entry is now open.', time: '1 hour ago' },
    { title: 'Parent Meeting', message: 'Grade 10 parents meeting at 4:00 PM.', time: '3 hours ago' },
  ];

  const schedule = [
    { time: '09:00 AM', subject: 'Mathematics', class: 'Grade 10-A' },
    { time: '11:00 AM', subject: 'Physics', class: 'Grade 10-B' },
    { time: '02:00 PM', subject: 'Lab Session', class: 'Grade 9-C' },
  ];

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>Welcome, {profile?.fullName}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Here is what's happening with your classes today.</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard icon={<FiUsers />} label="Your Students" value={myStudentCount || 45} />
        <StatCard icon={<FiCalendar />} label="Attendance Marked" value="Yes" color="var(--success)" />
        <StatCard icon={<FiAward />} label="Avg Class Performance" value="82%" color="var(--warning)" />
        <StatCard icon={<FiBook />} label="Pending Assignments" value="12" color="var(--accent)" />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr 1fr))', 
        gap: '1.5rem',
      }}>
        {/* Today's Schedule */}
        <div className="premium-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Today's Schedule</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {schedule.map((item, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--background)',
                borderLeft: `4px solid var(--primary)`
              }}>
                <div>
                  <p style={{ fontWeight: '600' }}>{item.subject}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.class}</p>
                </div>
                <p style={{ fontWeight: '500', color: 'var(--primary)' }}>{item.time}</p>
              </div>
            ))}
          </div>
        </div>
        
        <NotificationPanel notifications={notifications} />
      </div>
    </DashboardLayout>
  );
};
export default TeacherDashboard;
