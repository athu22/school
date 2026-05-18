import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import DashboardChart from '../../components/dashboard/DashboardChart';
import NotificationPanel from '../../components/dashboard/NotificationPanel';
import { 
  Users, FileText, IndianRupee, ClipboardList, 
  BookOpen, PlusCircle, ArrowRightLeft, ShieldAlert, 
  Sparkles, Award, GraduationCap, Building2, CalendarRange,
  Clock, FileSpreadsheet, CreditCard
} from 'lucide-react';
import { FiUsers, FiUserCheck, FiCalendar, FiFileText } from 'react-icons/fi';
import useAuthStore from '../../store/authStore';
import { useRealtimeStats } from '../../hooks/useRealtimeStats';
import { useLanguage } from '../../context/LanguageContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AdminDashboard = () => {
  const { profile } = useAuthStore();
  const { isMarathi } = useLanguage();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('academics');
  const [schoolData, setSchoolData] = useState(null);

  // Realtime stats filtered by school
  const { count: studentCount } = useRealtimeStats('students', [
    { field: 'schoolId', operator: '==', value: profile?.schoolId }
  ]);
  const { count: teacherCount } = useRealtimeStats('teachers', [
    { field: 'schoolId', operator: '==', value: profile?.schoolId }
  ]);

  // Fetch school details from Firestore to show on the dashboard
  useEffect(() => {
    const fetchSchoolDetails = async () => {
      if (profile?.schoolId) {
        try {
          const snap = await getDoc(doc(db, 'schools', profile.schoolId));
          if (snap.exists()) {
            setSchoolData(snap.data());
          }
        } catch (e) {
          console.error("Failed to load school profile on dashboard:", e);
        }
      }
    };
    fetchSchoolDetails();
  }, [profile?.schoolId]);

  const feeData = [
    { name: isMarathi ? 'सोम' : 'Mon', value: 12000 },
    { name: isMarathi ? 'मंगळ' : 'Tue', value: 15000 },
    { name: isMarathi ? 'बुध' : 'Wed', value: 10000 },
    { name: isMarathi ? 'गुरू' : 'Thu', value: 18000 },
    { name: isMarathi ? 'शुक्र' : 'Fri', value: 22000 },
    { name: isMarathi ? 'शनी' : 'Sat', value: 9000 },
  ];

  const notifications = [
    { 
      title: isMarathi ? 'नवीन प्रवेशनोंद' : 'New Student Enrolled', 
      message: isMarathi ? 'अनिकेत पाटील इयत्ता ५ वी मध्ये दाखल झाला.' : 'Aniket Patil joined Grade 5.', 
      time: isMarathi ? '१० मिनिटांपूर्वी' : '10 mins ago' 
    },
    { 
      title: isMarathi ? 'फी संकलन नोंद' : 'Fee Receipt Logged', 
      message: isMarathi ? '₹ ४,५०० बँक-ट्रान्सफर फी जमा झाली.' : '₹4,500 bank transfer logged successfully.', 
      time: isMarathi ? '२ तासांपूर्वी' : '2 hours ago' 
    },
  ];

  const handleActionClick = (path) => {
    navigate(path);
  };

  return (
    <div className="admin-dash-container">
      {/* Dynamic Greeting & Branding Banner */}
      <div className="dash-greeting-banner">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '6px' }}>
            {isMarathi ? `सुस्वागतम, ${profile?.name || 'अॅडमिन'}! 👋` : `Welcome Back, ${profile?.name || 'Admin'}! 👋`}
          </h1>

        </div>

        
      </div>

      {/* Real-time Status Card Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard icon={<FiUsers />} label={isMarathi ? 'एकूण विद्यार्थी' : 'Total Students'} value={studentCount || 0} trend={studentCount > 0 ? (isMarathi ? "सक्रिय पटनोंदणी" : "Active register") : ""} />
        <StatCard icon={<FiUserCheck />} label={isMarathi ? 'एकूण शिक्षक' : 'Total Teachers'} value={teacherCount || 0} color="var(--success)" />
        <StatCard icon={<FiCalendar />} label={isMarathi ? 'आजची उपस्थिती' : 'Attendance Today'} value="96.4%" color="var(--warning)" />
        <StatCard icon={<FiFileText />} label={isMarathi ? 'आजचे फी संकलन' : 'Today Collections'} value="₹48,500" color="var(--accent)" />
      </div>

      {/* Live Fee Weekly Chart & Recent Notifications panel */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 2fr 1fr))', 
        gap: '1.5rem',
      }}>
        <div className="premium-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>
            {isMarathi ? 'साप्ताहिक फी संकलन आलेख' : 'Weekly Fee Collection Analytics'}
          </h3>
          <DashboardChart type="bar" data={feeData} dataKey="value" color="var(--success)" />
        </div>
        
        <NotificationPanel notifications={notifications} />
      </div>
    </div>
  );
};

export default AdminDashboard;
