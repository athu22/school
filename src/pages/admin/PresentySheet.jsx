import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import useAuthStore from '../../store/authStore';
import { useStudents } from '../../hooks/useStudents';
import { useLanguage } from '../../context/LanguageContext';
import { 
  CalendarCheck, Save, Printer, UserCheck, 
  ChevronRight, RefreshCw, Grid, CheckCircle2,
  AlertTriangle, Info
} from 'lucide-react';
import './PresentySheet.css';

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

const PresentySheet = () => {
  const { profile } = useAuthStore();
  const { isMarathi } = useLanguage();
  const { students } = useStudents(profile?.schoolId);

  // Filter States
  const [selectedClass, setSelectedClass] = useState('Class 5');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-indexed (Jan = 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Attendance Records State
  // Format: { [studentId]: { [day]: 'P' | 'A' | 'L' | '-' } }
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const printRef = useRef(null);

  // Filter Students matching class and division standard
  const filteredStudents = (students || []).filter(s => 
    s.class === selectedClass && 
    (s.section === selectedSection || s.division === selectedSection)
  ).sort((a, b) => {
    // Sort by roll number if available, else by name
    const rollA = parseInt(a.rollNumber || a.roll_no || 0);
    const rollB = parseInt(b.rollNumber || b.roll_no || 0);
    if (rollA && rollB) return rollA - rollB;
    return (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '');
  });

  // Calculate days in the selected month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDocId = () => {
    return `${profile?.schoolId}_${selectedClass.replace(/\s+/g, '')}_${selectedSection}_${selectedYear}_${selectedMonth}`;
  };

  // Fetch attendance records from Firestore on filter change
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
        console.error("Error loading attendance ledger:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [profile?.schoolId, selectedClass, selectedSection, selectedMonth, selectedYear]);

  // Toggle Day Attendance: Unmarked (-) -> Present (P) -> Absent (A) -> Leave (L) -> Unmarked (-)
  const handleCellToggle = (studentId, day) => {
    const currentStatus = attendanceRecords[studentId]?.[day] || '-';
    let nextStatus = 'P';
    if (currentStatus === 'P') nextStatus = 'A';
    else if (currentStatus === 'A') nextStatus = 'L';
    else if (currentStatus === 'L') nextStatus = '-';
    else nextStatus = 'P';

    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [day]: nextStatus
      }
    }));
  };

  // Bulk Actions
  const handleBulkMark = (status) => {
    if (filteredStudents.length === 0) return;
    const recordsUpdate = { ...attendanceRecords };
    
    filteredStudents.forEach(st => {
      const studentDays = recordsUpdate[st.id] || {};
      daysArray.forEach(day => {
        studentDays[day] = status;
      });
      recordsUpdate[st.id] = studentDays;
    });

    setAttendanceRecords(recordsUpdate);
  };

  const handleClearSheet = () => {
    if (!window.confirm(isMarathi ? 'तुम्हाला खात्री आहे की संपूर्ण हजेरी कोरी करायची आहे?' : 'Are you sure you want to clear the entire register?')) return;
    const recordsUpdate = { ...attendanceRecords };
    filteredStudents.forEach(st => {
      recordsUpdate[st.id] = {};
    });
    setAttendanceRecords(recordsUpdate);
  };

  // Save to Firebase Firestore
  const handleSaveAttendance = async () => {
    if (!profile?.schoolId) return;
    try {
      setSaving(true);
      const docId = getDocId();
      await setDoc(doc(db, 'attendance', docId), {
        schoolId: profile.schoolId,
        class: selectedClass,
        section: selectedSection,
        year: selectedYear,
        month: selectedMonth,
        records: attendanceRecords,
        updatedAt: new Date().toISOString()
      });
      alert(isMarathi ? 'मासिक हजेरी यशस्वीरित्या जतन झाली!' : 'Monthly attendance register saved successfully!');
    } catch (err) {
      console.error("Failed to save attendance:", err);
      alert(isMarathi ? 'हजेरी जतन करताना अडचण आली.' : 'Failed to save attendance records.');
    } finally {
      setSaving(false);
    }
  };

  // Print Register Handler
  const handlePrintRegister = () => {
    window.print();
  };

  // Calculations for Student Rows
  const getStudentStats = (studentId) => {
    const studentDays = attendanceRecords[studentId] || {};
    let present = 0;
    let absent = 0;
    let leave = 0;
    
    daysArray.forEach(day => {
      const status = studentDays[day];
      if (status === 'P') present++;
      else if (status === 'A') absent++;
      else if (status === 'L') leave++;
    });

    const totalDaysMarked = present + absent;
    const percent = totalDaysMarked > 0 ? Math.round((present / totalDaysMarked) * 100) : 0;

    return { present, absent, leave, percent };
  };

  return (
    <div className="presenty-sheet-container print-only-register">
      {/* Page Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          {isMarathi ? 'मासिक हजेरी पत्रक (Presenty Sheet)' : 'Monthly Attendance Register (Presenty Sheet)'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {isMarathi ? 'वर्गातील विद्यार्थ्यांची संपूर्ण हजेरी व्यवस्थापित करा आणि रेकॉर्ड जतन करा.' : 'Manage daily roll calls, count attendance, and sync registers with cloud backups.'}
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
            onClick={handleSaveAttendance} 
            disabled={saving || loading || filteredStudents.length === 0}
            className="btn btn-primary" 
            style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <Save size={18} />
            {saving ? (isMarathi ? 'जतन होत आहे...' : 'Saving...') : (isMarathi ? 'रजिस्टर जतन करा' : 'Save Register')}
          </button>

          <button 
            onClick={handlePrintRegister} 
            disabled={loading || filteredStudents.length === 0}
            className="btn btn-secondary" 
            style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <Printer size={18} />
            {isMarathi ? 'प्रिंट काढा' : 'Print Register'}
          </button>
        </div>
      </div>

      {/* Bulk and Helper Controls */}
      <div className="presenty-actions-panel">
        <div className="bulk-actions-group">
          <span style={{ fontSize: '0.825rem', fontWeight: '800', color: 'var(--text-muted)' }}>
            {isMarathi ? 'जलद कृती (Bulk Action) :' : 'Quick Actions :'}
          </span>
          <button 
            onClick={() => handleBulkMark('P')} 
            disabled={filteredStudents.length === 0}
            className="btn btn-success" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UserCheck size={14} />
            {isMarathi ? 'सर्व उपस्थित (P)' : 'Mark All Present'}
          </button>
          <button 
            onClick={() => handleBulkMark('A')} 
            disabled={filteredStudents.length === 0}
            className="btn btn-danger" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isMarathi ? 'सर्व अनुपस्थित (A)' : 'Mark All Absent'}
          </button>
          <button 
            onClick={handleClearSheet} 
            disabled={filteredStudents.length === 0}
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
          >
            {isMarathi ? 'कोरे करा' : 'Clear Register'}
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }}></span>
            P = {isMarathi ? 'उपस्थित' : 'Present'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444', display: 'inline-block' }}></span>
            A = {isMarathi ? 'अनुपस्थित' : 'Absent'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f59e0b', display: 'inline-block' }}></span>
            L = {isMarathi ? 'रजा' : 'Leave'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(0,0,0,0.05)', display: 'inline-block' }}></span>
            - = {isMarathi ? 'नोंद नाही' : 'Unmarked'}
          </span>
        </div>
      </div>

      {/* Main Ledger Scroll Grid */}
      <div className="attendance-grid-wrapper" ref={printRef}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '15px' }}>
            <RefreshCw size={32} className="spinning" style={{ color: 'var(--accent-indigo)' }} />
            <p style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{isMarathi ? 'नोंदी शोधत आहे...' : 'Loading attendance data...'}</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '10px', textAlign: 'center' }}>
            <Info size={36} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ fontWeight: '750', margin: 0 }}>{isMarathi ? 'विद्यार्थी सापडले नाहीत' : 'No Students Registered'}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              {isMarathi 
                ? `${selectedClass} - तुकडी ${selectedSection} मध्ये अद्याप विद्यार्थी नोंदणी केलेले नाहीत.` 
                : `No active students found registered under ${selectedClass} Division ${selectedSection}.`}
            </p>
          </div>
        ) : (
          <table className="presenty-table">
            <thead>
              <tr>
                <th className="sticky-col-roll">{isMarathi ? 'ह.क्र.' : 'Roll'}</th>
                <th className="sticky-col-name">{isMarathi ? 'विद्यार्थ्याचे नाव' : 'Student Name'}</th>
                
                {/* Dynamically Render Days 1 to 31 */}
                {daysArray.map(day => (
                  <th key={day} style={{ minWidth: '35px' }}>{day}</th>
                ))}
                
                <th style={{ background: '#e0f2fe', color: '#0369a1' }} className="summary-col">P</th>
                <th style={{ background: '#fee2e2', color: '#b91c1c' }} className="summary-col">A</th>
                <th style={{ background: '#fef3c7', color: '#b45309' }} className="summary-col">L</th>
                <th style={{ background: 'rgba(99, 102, 241, 0.08)' }} className="summary-col-pct">%</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((st, index) => {
                const { present, absent, leave, percent } = getStudentStats(st.id);
                const rollNo = st.rollNumber || st.roll_no || (index + 1);
                
                return (
                  <tr key={st.id}>
                    <td className="sticky-col-roll">{rollNo}</td>
                    <td className="sticky-col-name">{st.fullName || st.name || 'Unnamed Student'}</td>
                    
                    {/* Render Interactive Cells for each day */}
                    {daysArray.map(day => {
                      const status = attendanceRecords[st.id]?.[day] || '-';
                      let cellClass = 'cell-unmarked';
                      if (status === 'P') cellClass = 'cell-present';
                      else if (status === 'A') cellClass = 'cell-absent';
                      else if (status === 'L') cellClass = 'cell-leave';

                      return (
                        <td 
                          key={day} 
                          onClick={() => handleCellToggle(st.id, day)}
                          className={`attendance-cell ${cellClass}`}
                        >
                          {status}
                        </td>
                      );
                    })}

                    <td style={{ background: 'rgba(16, 185, 129, 0.05)', fontWeight: 'bold' }}>{present}</td>
                    <td style={{ background: 'rgba(239, 68, 68, 0.05)', fontWeight: 'bold' }}>{absent}</td>
                    <td style={{ background: 'rgba(245, 158, 11, 0.05)', fontWeight: 'bold' }}>{leave}</td>
                    <td className="summary-col-pct" style={{ fontWeight: '800', color: percent >= 75 ? '#10b981' : '#ef4444' }}>
                      {percent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Security Info Panel */}
      <div style={{ padding: '15px', background: 'rgba(99, 102, 241, 0.04)', border: '1px solid var(--border)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <CheckCircle2 size={18} style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          {isMarathi 
            ? 'नोंद: हजेरीतील प्रत्येक बदल ऑटो-मार्क होतो. सर्व रेकॉर्ड्स अंतिम जतन करण्यासाठी वर उजवीकडील "रजिस्टर जतन करा" बटणावर नक्की क्लिक करा.'
            : 'Operational Tip: Attendance entries are saved locally as you click. Click the glowing "Save Register" button to commit records to secure cloud backups.'}
        </span>
      </div>
    </div>
  );
};

export default PresentySheet;
