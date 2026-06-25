import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiBook, FiAward, FiFileText, FiTrendingUp, 
  FiSliders, FiLayers, FiTrash2, FiEdit, FiSearch, FiCheck, FiInfo 
} from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { useExams } from '../../hooks/useExams';
import useAuthStore from '../../store/authStore';
import { 
  fetchSubjects, addSubject, deleteSubject, 
  fetchGradeConfiguration, saveGradeConfiguration, 
  DEFAULT_GRADES, calculateCCEGrade 
} from '../../services/examService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';

const ExamList = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  
  // Real-time hooks
  const { exams, loading: examsLoading } = useExams(profile?.schoolId);

  // Core States
  const [activeTab, setActiveTab] = useState('exams'); // exams | subjects | grades | analytics
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState(DEFAULT_GRADES);
  
  // Dynamic collections snapshot states for analytics
  const [allResults, setAllResults] = useState([]);
  const [analyticsClass, setAnalyticsClass] = useState('All');

  // Form states
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubClass, setNewSubClass] = useState('Class 1');
  const [isSavingSubject, setIsSavingSubject] = useState(false);
  const [isSavingGrades, setIsSavingGrades] = useState(false);

  // Fetch dynamic subjects & grades
  useEffect(() => {
    if (!profile?.schoolId) return;
    
    const loadSubjectsAndGrades = async () => {
      try {
        const subList = await fetchSubjects(profile.schoolId);
        setSubjects(subList);
        
        const grList = await fetchGradeConfiguration(profile.schoolId);
        setGrades(grList);
      } catch (err) {
        console.error(err);
      }
    };

    loadSubjectsAndGrades();
  }, [profile?.schoolId]);

  // Realtime load overall result aggregates for visual analytics
  useEffect(() => {
    if (!profile?.schoolId) return;

    const q = query(
      collection(db, "results"),
      where("schoolId", "==", profile.schoolId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data());
      setAllResults(items);
    });

    return () => unsubscribe();
  }, [profile?.schoolId]);

  // Create subject handler
  const handleAddSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return toast.error("Enter Subject Name");

    setIsSavingSubject(true);
    try {
      await addSubject({
        schoolId: profile?.schoolId,
        subjectName: newSubName.trim(),
        subjectCode: newSubCode.trim() || newSubName.trim().slice(0, 3).toUpperCase(),
        assignedClass: newSubClass
      });
      toast.success("Subject mapped to class successfully!");
      setNewSubName('');
      setNewSubCode('');
      
      // Reload list
      const subList = await fetchSubjects(profile.schoolId);
      setSubjects(subList);
    } catch (err) {
      toast.error("Error creating subject");
    } finally {
      setIsSavingSubject(false);
    }
  };

  // Delete subject handler
  const handleDeleteSub = async (subId) => {
    if (window.confirm("Delete this subject from mapped classes?")) {
      try {
        await deleteSubject(subId);
        toast.success("Subject mappings deleted!");
        setSubjects(subjects.filter(s => s.id !== subId));
      } catch (err) {
        toast.error("Error deleting subject");
      }
    }
  };

  // Grade Range modification handler
  const handleGradeRangeChange = (index, field, value) => {
    const updated = [...grades];
    updated[index][field] = Number(value);
    setGrades(updated);
  };

  const handleSaveGrades = async () => {
    setIsSavingGrades(true);
    try {
      await saveGradeConfiguration(profile?.schoolId, grades);
      toast.success("CCE customizable grade ranges updated!");
    } catch (err) {
      toast.error("Failed to update grade scales");
    } finally {
      setIsSavingGrades(false);
    }
  };

  // --- ANALYTICS CALCULATOR ---
  const getAnalyticsData = () => {
    const classResults = (analyticsClass === 'All' 
      ? allResults 
      : allResults.filter(r => r && r.class === analyticsClass)
    ).filter(Boolean);

    if (classResults.length === 0) return { toppers: [], passPct: 0, gradeDist: [], subPerformance: [] };

    // 1. Calculate Pass Rate
    const passCount = classResults.filter(r => r && r.status === 'PASS').length;
    const passPct = Math.round((passCount / classResults.length) * 100);

    // 2. Class Toppers List (Top 5)
    const toppers = [...classResults]
      .filter(r => r && r.totalObtained !== undefined)
      .sort((a, b) => (Number(b.totalObtained) || 0) - (Number(a.totalObtained) || 0))
      .slice(0, 5);

    // 3. Grade Distribution breakdown
    const gradeCounts = {};
    classResults.forEach(r => {
      if (r && r.grade) {
        gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1;
      }
    });
    const gradeDist = Object.keys(gradeCounts).map(g => ({
      name: `Grade ${g}`,
      value: gradeCounts[g]
    }));

    // 4. Subject-wise performance metrics
    const subSum = {};
    classResults.forEach(r => {
      if (r && r.subjectMarks) {
        Object.keys(r.subjectMarks).forEach(sub => {
          const detail = r.subjectMarks[sub];
          if (detail) {
            if (!subSum[sub]) {
              subSum[sub] = { name: sub, totalObtained: 0, totalMax: 0, count: 0 };
            }
            subSum[sub].totalObtained += Number(detail.obtainedMarks || 0);
            subSum[sub].totalMax += Number(detail.maxMarks || 0);
            subSum[sub].count += 1;
          }
        });
      }
    });

    const subPerformance = Object.keys(subSum).map(sub => {
      const metrics = subSum[sub];
      const avg = metrics.totalMax > 0 ? Math.round((metrics.totalObtained / metrics.totalMax) * 100) : 0;
      return {
        name: sub,
        "Average Marks %": avg
      };
    });

    return { toppers, passPct, gradeDist, subPerformance };
  };

  const { toppers, passPct, gradeDist, subPerformance } = getAnalyticsData();
  const uniqueClasses = [...new Set((allResults || []).filter(r => r && r.class).map(r => r.class))].sort();

  return (
    <DashboardLayout>
      <div className="exam-workspace-wrapper">
        <style>{`
          .exam-workspace-wrapper {
            padding: 0.5rem;
            color: var(--text-main);
          }

          /* Tabs Header Control */
          .workspace-tabs {
            display: flex;
            gap: 8px;
            background: var(--background, #f1f5f9);
            padding: 5px;
            border-radius: 14px;
            margin-bottom: 2rem;
            max-width: 600px;
            border: 1px solid var(--border);
          }

          .tab-trigger {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0.65rem 0.85rem;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.85rem;
            border: none;
            background: none;
            color: var(--text-muted);
            cursor: pointer;
            transition: all 0.25s ease;
          }

          .tab-trigger:hover {
            color: var(--text-main);
          }

          .tab-trigger.active {
            background: var(--card-bg, #ffffff);
            color: var(--primary);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          }

          .flex-between {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 12px;
          }

          .page-title h1 {
            font-size: 2rem;
            font-weight: 850;
            font-family: var(--font-heading);
            margin: 0;
          }

          .page-title p {
            color: var(--text-muted);
            margin-top: 4px;
            font-size: 0.95rem;
          }

          /* Exams Deck Card structure */
          .exams-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 1.5rem;
          }

          .exam-deck-card {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 1.75rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.01);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }

          .exam-deck-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(99, 102, 241, 0.05);
            border-color: rgba(99, 102, 241, 0.2);
          }

          .exam-badge {
            background: rgba(99, 102, 241, 0.08);
            color: var(--primary);
            padding: 0.25rem 0.65rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
          }

          /* Two pane splits */
          .two-pane-split {
            display: grid;
            grid-template-columns: 1.1fr 1.9fr;
            gap: 2rem;
            align-items: start;
          }

          @media (max-width: 1024px) {
            .two-pane-split {
              grid-template-columns: 1fr;
            }
          }

          .split-pane-card {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 1.75rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.01);
          }

          .split-pane-card h3 {
            font-size: 1.25rem;
            font-weight: 800;
            font-family: var(--font-heading);
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .sub-input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 1.25rem;
          }

          .sub-input-group label {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-muted);
          }

          .sub-input {
            padding: 0.65rem 0.85rem;
            border-radius: 10px;
            border: 1.5px solid var(--border);
            background: var(--background, #f8fafc);
            color: var(--text-main);
            font-size: 0.85rem;
            font-weight: 500;
            outline: none;
          }

          .sub-input:focus {
            border-color: var(--primary);
          }

          /* Mapped dynamic subjects list */
          .mapped-sub-table {
            width: 100%;
            border-collapse: collapse;
          }

          .mapped-sub-table th {
            padding: 0.85rem;
            font-weight: 700;
            font-size: 0.75rem;
            color: var(--text-muted);
            border-bottom: 2.5px solid var(--border);
            text-transform: uppercase;
          }

          .mapped-sub-table td {
            padding: 0.95rem 0.85rem;
            border-bottom: 1px solid var(--border);
            font-size: 0.85rem;
          }

          /* Range slider setup */
          .range-slider-row {
            display: grid;
            grid-template-columns: 1fr 2fr 2fr 1fr;
            gap: 1.25rem;
            align-items: center;
            padding: 1rem 0;
            border-bottom: 1px dashed var(--border);
          }

          .grade-badge-circle {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 0.9rem;
            background: rgba(99, 102, 241, 0.08);
            color: var(--primary);
          }

          /* Analytics Cards layout */
          .stats-deck {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          @media (max-width: 768px) {
            .stats-deck {
              grid-template-columns: 1fr;
            }
          }

          .stat-indicator {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 1.5rem;
            text-align: center;
          }

          .stat-indicator h4 {
            font-size: 0.8rem;
            color: var(--text-muted);
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 8px;
          }

          .stat-indicator p {
            font-size: 2.2rem;
            font-weight: 900;
            margin: 0;
            color: var(--primary);
          }

          .topper-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .topper-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.85rem 1.25rem;
            background: var(--background);
            border-radius: 12px;
            border: 1.5px solid var(--border);
          }
        `}</style>

        {/* Global tab controllers */}
        <div className="workspace-tabs">
          <button 
            className={`tab-trigger ${activeTab === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveTab('exams')}
          >
            <FiBook /> Scheduled Exams
          </button>
          <button 
            className={`tab-trigger ${activeTab === 'subjects' ? 'active' : ''}`}
            onClick={() => setActiveTab('subjects')}
          >
            <FiLayers /> Subject Desk
          </button>
          <button 
            className={`tab-trigger ${activeTab === 'grades' ? 'active' : ''}`}
            onClick={() => setActiveTab('grades')}
          >
            <FiSliders /> CCE Grade Configuration
          </button>
          <button 
            className={`tab-trigger ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FiTrendingUp /> CCE Analytics
          </button>
        </div>

        {/* ==================== TAB 1: EXAM REGISTRY ==================== */}
        {activeTab === 'exams' && (
          <div>
            <div className="flex-between">
              <div className="page-title">
                <h1>State Board Exam Workspace</h1>
                <p>Register school exams, manage assessments, enter marks, and generate digital CCE report cards.</p>
              </div>
              <Button onClick={() => navigate('/admin/exams/add')}>
                <FiPlus /> Schedule New Exam
              </Button>
            </div>

            <div className="exams-grid">
              {examsLoading ? (
                <div className="split-pane-card" style={{ gridColumn: 'span 3', padding: '3rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Loading scheduled exam registries...</p>
                </div>
              ) : exams.length > 0 ? (
                exams.map((exam) => (
                  <div key={exam.id} className="exam-deck-card">
                    
                    {/* Header badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
                      <span className="exam-badge">
                        {exam.examType} Pattern
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        AY: {exam.academicYear}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.35rem', fontWeight: '850', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
                      {exam.examName} Assessment
                    </h3>

                    {/* Meta information */}
                    <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        <FiLayers /> <span>Target Class: {exam.className || 'Class 1'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        <FiAward /> <span>Max Marks: {exam.totalMarks || 100}</span>
                      </div>
                    </div>

                    {/* Operational Actions */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="ledger-btn ledger-btn-secondary"
                        style={{ flex: 1, fontSize: '0.8rem', justifyContent: 'center' }}
                        onClick={() => navigate(`/admin/exams/mark-entry/${exam.id}`)}
                      >
                        <FiFileText /> Mark Entry
                      </button>
                      <button 
                        className="ledger-btn ledger-btn-primary"
                        style={{ flex: 1, fontSize: '0.8rem', justifyContent: 'center' }}
                        onClick={() => navigate(`/admin/exams/results/${exam.id}`)}
                      >
                        View Results
                      </button>
                    </div>

                  </div>
                ))
              ) : (
                <div className="split-pane-card" style={{ gridColumn: 'span 3', padding: '4rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>No exams scheduled. Click button above to schedule FA1, FA2, SA1, etc.!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: SUBJECT MANAGEMENT ==================== */}
        {activeTab === 'subjects' && (
          <div className="two-pane-split">
            
            {/* Left pane: Add subject form */}
            <div className="split-pane-card">
              <h3>
                <FiPlus /> Mapped New Subject
              </h3>

              <form onSubmit={handleAddSubjectSubmit}>
                <div className="sub-input-group">
                  <label>Subject Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Mathematics"
                    className="sub-input"
                    value={newSubName}
                    onChange={e => setNewSubName(e.target.value)}
                  />
                </div>

                <div className="sub-input-group">
                  <label>Subject Code / Abbreviation</label>
                  <input 
                    type="text" 
                    placeholder="e.g. MATH"
                    className="sub-input"
                    value={newSubCode}
                    onChange={e => setNewSubCode(e.target.value)}
                  />
                </div>

                <div className="sub-input-group">
                  <label>Assign to Class *</label>
                  <select 
                    className="sub-input"
                    value={newSubClass}
                    onChange={e => setNewSubClass(e.target.value)}
                  >
                    <option value="Class 1">Class 1</option>
                    <option value="Class 2">Class 2</option>
                    <option value="Class 3">Class 3</option>
                    <option value="Class 4">Class 4</option>
                    <option value="Class 5">Class 5</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={isSavingSubject} 
                  className="ledger-btn ledger-btn-primary"
                  style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
                >
                  {isSavingSubject ? 'Mapping subject...' : 'Map Subject Class-wise'}
                </button>
              </form>
            </div>

            {/* Right pane: list of subjects */}
            <div className="split-pane-card">
              <h3>
                <FiLayers /> Class-wise Subject Mappings
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table className="mapped-sub-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Subject Code</th>
                      <th style={{ textAlign: 'left' }}>Subject Name</th>
                      <th style={{ textAlign: 'left' }}>Assigned Class</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.length > 0 ? (
                      subjects.map(s => (
                        <tr key={s.id}>
                          <td><code>{s.subjectCode}</code></td>
                          <td style={{ fontWeight: '700' }}>{s.subjectName}</td>
                          <td><span className="exam-badge">{s.assignedClass}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className="exp-action-btn exp-action-delete"
                              onClick={() => handleDeleteSub(s.id)}
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No custom subjects mapped yet. Please map subjects to start marks entry.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 3: GRADE CONFIGURATION ==================== */}
        {activeTab === 'grades' && (
          <div className="split-pane-card" style={{ maxWidth: '800px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>
                <FiSliders /> Customizable Karnataka CCE Grade Ranges
              </h3>
              <button 
                className="ledger-btn ledger-btn-primary"
                onClick={handleSaveGrades}
                disabled={isSavingGrades}
              >
                {isSavingGrades ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>

            <div className="ledger-quick-info" style={{ marginBottom: '2.5rem' }}>
              <FiInfo size={20} />
              <span>Admins can adjust the min and max percentage thresholds below to configure custom school grading rules. Dynamic auto-grade mappings immediately adjust marks tables.</span>
            </div>

            {/* Slider List */}
            <div>
              {grades.map((gr, idx) => (
                <div className="range-slider-row" key={`gr-row-${idx}`}>
                  <div className="grade-badge-circle">{gr.grade}</div>
                  
                  {/* Min Percent */}
                  <div className="sub-input-group" style={{ marginBottom: 0 }}>
                    <label>Min Percentage %</label>
                    <input 
                      type="number"
                      className="sub-input"
                      value={gr.minPercent}
                      step="0.01"
                      onChange={e => handleGradeRangeChange(idx, 'minPercent', e.target.value)}
                    />
                  </div>

                  {/* Max Percent */}
                  <div className="sub-input-group" style={{ marginBottom: 0 }}>
                    <label>Max Percentage %</label>
                    <input 
                      type="number"
                      className="sub-input"
                      value={gr.maxPercent}
                      step="0.01"
                      onChange={e => handleGradeRangeChange(idx, 'maxPercent', e.target.value)}
                    />
                  </div>

                  {/* Remark */}
                  <div className="sub-input-group" style={{ marginBottom: 0 }}>
                    <label>Remarks</label>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                      {gr.remark}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ==================== TAB 4: CCE ANALYTICS ==================== */}
        {activeTab === 'analytics' && (
          <div>
            
            {/* Filter class for analytics */}
            <div className="flex-between">
              <div className="page-title">
                <h1>Dynamic Performance Analytics</h1>
                <p>Live visual assessment metrics, topping list, grade pie distributions, and subject-wise averages.</p>
              </div>

              {/* Class Dropdown */}
              <div className="sub-input-group" style={{ width: '180px', marginBottom: 0 }}>
                <label>Filter Analytics Class</label>
                <select 
                  className="sub-input"
                  value={analyticsClass}
                  onChange={e => setAnalyticsClass(e.target.value)}
                >
                  <option value="All">All Classes Combined</option>
                  {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Quick Metrics Indicators Deck */}
            <div className="stats-deck">
              <div className="stat-indicator">
                <h4>School Pass Rate %</h4>
                <p style={{ color: passPct >= 75 ? '#16a34a' : '#ef4444' }}>{passPct}%</p>
              </div>
              <div className="stat-indicator">
                <h4>Total Assessed Students</h4>
                <p>{allResults.filter(r => analyticsClass === 'All' || r.class === analyticsClass).length}</p>
              </div>
              <div className="stat-indicator">
                <h4>Active Grade Scopes</h4>
                <p style={{ color: '#a855f7' }}>{grades.length}</p>
              </div>
            </div>

            {/* Visual Charts splits */}
            <div className="two-pane-split" style={{ marginBottom: '2rem' }}>
              
              {/* Toppers Card */}
              <div className="split-pane-card">
                <h3>
                  <FiAward /> Merit Toppers (Top 5)
                </h3>

                <div className="topper-list">
                  {toppers.length > 0 ? toppers.map((top, idx) => (
                    <div className="topper-item" key={top.studentId}>
                      <div>
                        <span style={{ fontWeight: '900', marginRight: '10px', color: 'var(--primary)' }}>#{idx+1}</span>
                        <span style={{ fontWeight: '800' }}>{top.studentName}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Roll: {top.rollNumber} | Class: {top.class} ({top.section})
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: '900', color: '#16a34a', fontSize: '1rem' }}>{Math.round(top.percentage)}%</span>
                        <div className="exam-badge" style={{ marginTop: '2px', display: 'block', fontSize: '0.65rem' }}>
                          CCE Grade: {top.grade}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No topper records loaded. Verify student marks entry.</div>
                  )}
                </div>
              </div>

              {/* Subject wise average marks Bar chart */}
              <div className="split-pane-card">
                <h3>
                  <FiTrendingUp /> Subject-wise Class Averages %
                </h3>

                {subPerformance.length > 0 ? (
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer>
                      <BarChart data={subPerformance} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Average Marks %" fill="#6366f1" radius={[8, 8, 0, 0]}>
                          {subPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#16a34a'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
                    No subject performance aggregated yet. Enter subject marks.
                  </div>
                )}
              </div>

            </div>

            {/* Overall Grade breakdown Pie Chart */}
            <div className="split-pane-card" style={{ maxWidth: '600px', margin: 'auto' }}>
              <h3>Grade Breakdown Analytics</h3>

              {gradeDist.length > 0 ? (
                <div style={{ width: '100%', height: '280px' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={gradeDist}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {gradeDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ef4444'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No student distributions to display yet.</div>
              )}
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ExamList;
