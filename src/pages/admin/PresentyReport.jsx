import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import useAuthStore from '../../store/authStore';
import { useStudents } from '../../hooks/useStudents';
import { useLanguage } from '../../context/LanguageContext';
import { 
  FileSpreadsheet, Printer, TrendingUp, Users, 
  AlertTriangle, CheckCircle, RefreshCw, Info,
  Building, Calendar, Phone, Award
} from 'lucide-react';
import './PresentyReport.css';

const monthsListEn = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthsListMr = [
  'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 
  'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
];

const classesList = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
const sectionsList = ['A', 'B', 'C', 'D'];

const PresentyReport = () => {
  const { profile } = useAuthStore();
  const { isMarathi } = useLanguage();
  const { students } = useStudents(profile?.schoolId);

  // Filter States
  const [selectedClass, setSelectedClass] = useState('Class 5');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Attendance Records State
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [schoolData, setSchoolData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch school details for printed header
  useEffect(() => {
    const fetchSchool = async () => {
      if (!profile?.schoolId) return;
      try {
        const snap = await getDoc(doc(db, 'schools', profile.schoolId));
        if (snap.exists()) {
          setSchoolData(snap.data());
        }
      } catch (err) {
        console.error("Failed to load school details:", err);
      }
    };
    fetchSchool();
  }, [profile?.schoolId]);

  // Filter and sort students
  const filteredStudents = (students || []).filter(s => 
    s.class === selectedClass && 
    (s.section === selectedSection || s.division === selectedSection)
  ).sort((a, b) => {
    const rollA = parseInt(a.rollNumber || a.roll_no || 0);
    const rollB = parseInt(b.rollNumber || b.roll_no || 0);
    if (rollA && rollB) return rollA - rollB;
    return (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '');
  });

  const getDocId = () => {
    return `${profile?.schoolId}_${selectedClass.replace(/\s+/g, '')}_${selectedSection}_${selectedYear}_${selectedMonth}`;
  };

  // Fetch records
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!profile?.schoolId) return;
      try {
        setLoading(true);
        const docId = getDocId();
        const snap = await getDoc(doc(db, 'attendance', docId));
        if (snap.exists()) {
          setAttendanceRecords(snap.data().records || {});
        } else {
          setAttendanceRecords({});
        }
      } catch (err) {
        console.error("Failed to load attendance records:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [profile?.schoolId, selectedClass, selectedSection, selectedMonth, selectedYear]);

  // Calculations for Student list
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Compile statistics for each student
  const studentReportsList = filteredStudents.map((st, index) => {
    const studentDays = attendanceRecords[st.id] || {};
    let present = 0;
    let absent = 0;
    let leave = 0;

    daysArray.forEach(day => {
      const status = studentDays[day];
      if (status === 'P') present++;
      else if (status === 'A') absent++;
      else if (status === 'L') leave++;
    });

    const workingDays = present + absent + leave;
    const percent = workingDays > 0 ? Math.round((present / (present + absent)) * 100) : 0;
    const rollNo = st.rollNumber || st.roll_no || (index + 1);

    return {
      id: st.id,
      rollNo,
      name: st.fullName || st.name || 'Unnamed Student',
      workingDays,
      present,
      absent,
      leave,
      percent
    };
  });

  // Calculate aggregates
  const studentCount = studentReportsList.length;
  const averageAttendance = studentCount > 0 
    ? Math.round(studentReportsList.reduce((acc, curr) => acc + curr.percent, 0) / studentCount)
    : 0;

  const highPerformers = studentReportsList.filter(s => s.percent >= 90).length;
  const lowAttendance = studentReportsList.filter(s => s.percent < 75 && s.workingDays > 0).length;

  // CSV Exporter Handler
  const handleExportCSV = () => {
    if (studentReportsList.length === 0) return;
    
    // Define columns
    const headers = isMarathi
      ? ['हजेरी क्र.', 'विद्यार्थ्याचे नाव', 'एकूण दिवस', 'उपस्थित (P)', 'अनुपस्थित (A)', 'रजा (L)', 'टक्केवारी (%)', 'शेरा']
      : ['Roll No', 'Student Name', 'Total Days', 'Present (P)', 'Absent (A)', 'Leave (L)', 'Percentage (%)', 'Status'];

    const csvRows = [];
    csvRows.push(headers.join(','));

    studentReportsList.forEach(st => {
      const statusStr = st.percent >= 90 
        ? (isMarathi ? 'उत्कृष्ट' : 'Excellent') 
        : st.percent >= 75 
          ? (isMarathi ? 'सामान्य' : 'Normal') 
          : (isMarathi ? 'कमी उपस्थिती' : 'Low');

      const row = [
        st.rollNo,
        `"${st.name.replace(/"/g, '""')}"`,
        st.workingDays,
        st.present,
        st.absent,
        st.leave,
        `${st.percent}%`,
        statusStr
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Presenty_Report_${selectedClass}_${selectedSection}_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="presenty-report-container print-only-report">
      {/* Official Printed Header (A4 Style) */}
      <div className="print-header-block">
        <h2 style={{ fontSize: '1.65rem', fontWeight: '850', margin: '0 0 5px 0' }}>
          {schoolData?.name || profile?.schoolName || 'National Public School'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#333', margin: '0 0 5px 0' }}>
          {schoolData?.address || 'Sakri Road, Pimpalner, Dhule (424306)'} | Phone: {schoolData?.phone || '+91 94239 82959'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '10px' }}>
          <span>UDISE: {schoolData?.udise_code || '27020218709'}</span>
          <span>BOARD: {schoolData?.board || 'State Board'}</span>
          <span>INDEX NO: {schoolData?.index_no || 'S.27.09.005'}</span>
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '15px', textDecoration: 'underline' }}>
          {isMarathi ? `मासिक हजेरी अहवाल: ${monthsListMr[selectedMonth - 1]} - ${selectedYear}` : `Monthly Attendance Report Summary: ${monthsListEn[selectedMonth - 1]} - ${selectedYear}`}
        </h3>
        <p style={{ fontSize: '0.825rem', margin: '5px 0 0 0' }}>
          {isMarathi ? `इयत्ता: ${selectedClass} | तुकडी: ${selectedSection}` : `Class: ${selectedClass} | Section/Division: ${selectedSection}`}
        </p>
      </div>

      {/* Screen Page Header */}
      <div style={{ marginBottom: '20px' }} className="presenty-filter-bar">
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          {isMarathi ? 'मासिक हजेरी अहवाल (Presenty Report)' : 'Monthly Attendance Summary (Presenty Report)'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {isMarathi ? 'वर्गातील उपस्थितीचे सांख्यिकी विश्लेषण, टक्केवारी आणि प्रगती अहवाल.' : 'Verify class-wide attendance percentages, averages, high-performers, and low-attendance warnings.'}
        </p>
      </div>

      {/* Filter Options Bar */}
      <div className="presenty-filter-bar">
        <div className="filter-group">
          <label>{isMarathi ? 'इयत्ता (Class)' : 'Class / Std'}</label>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="filter-select"
          >
            {classesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label>{isMarathi ? 'तुकडी (Section)' : 'Section / Div'}</label>
          <select 
            value={selectedSection} 
            onChange={(e) => setSelectedSection(e.target.value)}
            className="filter-select"
          >
            {sectionsList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label>{isMarathi ? 'महिना (Month)' : 'Month'}</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="filter-select"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>
                {isMarathi ? monthsListMr[m-1] : monthsListEn[m-1]}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>{isMarathi ? 'वर्ष (Year)' : 'Year'}</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="filter-select"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
          <button 
            onClick={handleExportCSV} 
            disabled={loading || studentReportsList.length === 0}
            className="btn btn-primary" 
            style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <FileSpreadsheet size={18} />
            {isMarathi ? 'CSV मध्ये डाउनलोड करा' : 'Export to CSV'}
          </button>

          <button 
            onClick={handlePrint} 
            disabled={loading || studentReportsList.length === 0}
            className="btn btn-secondary" 
            style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <Printer size={18} />
            {isMarathi ? 'रिपोर्ट प्रिंट करा' : 'Print Report'}
          </button>
        </div>
      </div>

      {/* Aggregate Overview Grid */}
      <div className="report-stats-grid">
        <div className="report-stat-card">
          <span className="report-stat-lbl">{isMarathi ? 'एकूण पटसंख्या' : 'TOTAL ROSTER'}</span>
          <span className="report-stat-val" style={{ color: 'var(--accent-indigo)' }}>
            <Users size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            {studentCount}
          </span>
        </div>

        <div className="report-stat-card">
          <span className="report-stat-lbl">{isMarathi ? 'सरासरी उपस्थिती' : 'AVERAGE ATTENDANCE'}</span>
          <span className="report-stat-val" style={{ color: '#10b981' }}>
            <TrendingUp size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            {averageAttendance}%
          </span>
        </div>

        <div className="report-stat-card">
          <span className="report-stat-lbl">{isMarathi ? 'उत्कृष्ट उपस्थिती (>=९०%)' : 'EXCELLENT ATTENDANCE'}</span>
          <span className="report-stat-val" style={{ color: 'var(--accent-violet)' }}>
            <Award size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            {highPerformers}
          </span>
        </div>

        <div className="report-stat-card">
          <span className="report-stat-lbl">{isMarathi ? 'कमी उपस्थिती (<७५%)' : 'LOW ATTENDANCE'}</span>
          <span className="report-stat-val" style={{ color: '#ef4444' }}>
            <AlertTriangle size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            {lowAttendance}
          </span>
        </div>
      </div>

      {/* Main Roster Report Table */}
      <div className="report-table-wrapper">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '15px' }}>
            <RefreshCw size={32} className="spinning" style={{ color: 'var(--accent-indigo)' }} />
            <p style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{isMarathi ? 'अहवाल गोळा करत आहे...' : 'Compiling reports data...'}</p>
          </div>
        ) : studentReportsList.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '10px', textAlign: 'center' }}>
            <Info size={36} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ fontWeight: '750', margin: 0 }}>{isMarathi ? 'नोंदी सापडल्या नाहीत' : 'No Roster Registered'}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              {isMarathi 
                ? `${selectedClass} - तुकडी ${selectedSection} मधील विद्यार्थ्यांचा हजेरी अहवाल उपलब्ध नाही.` 
                : `No active monthly summaries available for ${selectedClass} Division ${selectedSection}.`}
            </p>
          </div>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>{isMarathi ? 'ह.क्र.' : 'Roll No'}</th>
                <th>{isMarathi ? 'विद्यार्थ्याचे नाव' : 'Student Name'}</th>
                <th style={{ textAlign: 'center' }}>{isMarathi ? 'एकूण दिवस' : 'Total Days'}</th>
                <th style={{ textAlign: 'center' }}>{isMarathi ? 'उपस्थित (P)' : 'Present (P)'}</th>
                <th style={{ textAlign: 'center' }}>{isMarathi ? 'अनुपस्थित (A)' : 'Absent (A)'}</th>
                <th style={{ textAlign: 'center' }}>{isMarathi ? 'रजा (L)' : 'Leave (L)'}</th>
                <th>{isMarathi ? 'टक्केवारी' : 'Percentage'}</th>
                <th>{isMarathi ? 'श्रेणी' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {studentReportsList.map((st) => {
                const isExcel = st.percent >= 90;
                const isLow = st.percent < 75 && st.workingDays > 0;
                
                let badgeClass = 'badge-normal';
                let statusText = isMarathi ? 'सामान्य' : 'Normal';
                let progressColor = 'var(--accent-indigo)';

                if (isExcel) {
                  badgeClass = 'badge-excellent';
                  statusText = isMarathi ? 'उत्कृष्ट' : 'Excellent';
                  progressColor = '#10b981';
                } else if (isLow) {
                  badgeClass = 'badge-low';
                  statusText = isMarathi ? 'कमी उपस्थिती' : 'Low';
                  progressColor = '#ef4444';
                }

                return (
                  <tr key={st.id}>
                    <td style={{ fontWeight: '700' }}>{st.rollNo}</td>
                    <td style={{ fontWeight: '700' }}>{st.name}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>{st.workingDays}</td>
                    <td style={{ textAlign: 'center', color: '#10b981', fontWeight: '700' }}>{st.present}</td>
                    <td style={{ textAlign: 'center', color: '#ef4444', fontWeight: '700' }}>{st.absent}</td>
                    <td style={{ textAlign: 'center', color: '#f59e0b', fontWeight: '700' }}>{st.leave}</td>
                    <td>
                      <div className="report-progress-bg">
                        <div 
                          className="report-progress-fill" 
                          style={{ width: `${st.percent}%`, background: progressColor }}
                        ></div>
                      </div>
                      <span style={{ fontWeight: '800' }}>{st.percent}%</span>
                    </td>
                    <td>
                      <span className={badgeClass}>{statusText}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Official Signatures Block for printed page */}
      <div className="print-signatures-block">
        <span>{isMarathi ? 'वर्गशिक्षकाची स्वाक्षरी' : 'Class Teacher Sign'}</span>
        <span>{isMarathi ? 'लिपिकाची स्वाक्षरी' : 'Clerk Sign'}</span>
        <span>{isMarathi ? 'मुख्याध्यापकाची स्वाक्षरी (शिक्का)' : 'Principal Signature & Stamp'}</span>
      </div>
    </div>
  );
};

export default PresentyReport;
