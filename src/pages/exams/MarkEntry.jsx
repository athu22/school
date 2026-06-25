import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiSearch, FiLayers, FiInfo, FiCheckSquare } from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import { db } from '../../firebase/config';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import useAuthStore from '../../store/authStore';
import { fetchGradeConfiguration, fetchEnteredMarks, saveMarksBatch, calculateCCEGrade } from '../../services/examService';
import { toast } from 'react-toastify';

const MarkEntry = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  // Core States
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [gradesConfig, setGradesConfig] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  
  // Selection States
  const [selectedSubject, setSelectedSubject] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  
  // Table Data State
  const [gridData, setGridData] = useState([]);
  
  // Search / Loading States
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // References for keyboard navigation
  const inputRefs = useRef([]);

  // 1. Fetch Exam Registry & School Grading Configurations
  useEffect(() => {
    if (!profile?.schoolId || !examId) return;

    const initPage = async () => {
      setLoading(true);
      try {
        // Read exam config
        const examRef = doc(db, 'exams', examId);
        const examSnap = await getDoc(examRef);
        if (examSnap.exists()) {
          const examDetails = { id: examSnap.id, ...examSnap.data() };
          setExam(examDetails);
          setMaxMarks(examDetails.totalMarks || 100);
        } else {
          toast.error("Exam record not found");
          navigate('/admin/exams');
          return;
        }

        // Read CCE Grading Config
        const grades = await fetchGradeConfiguration(profile.schoolId);
        setGradesConfig(grades);

        // Fetch subjects assigned to school
        const subQ = query(collection(db, 'subjects'), where('schoolId', '==', profile.schoolId));
        const subSnap = await getDocs(subQ);
        const subItems = subSnap.docs.map(doc => doc.data());
        
        // Dynamic subject fallback
        const uniqueSubNames = [...new Set(subItems.map(s => s.subjectName))];
        const finalSubjects = uniqueSubNames.length > 0 
          ? uniqueSubNames 
          : ["English", "Mathematics", "Science", "Social Science", "Hindi", "Marathi", "Computer"];
        
        setSubjectsList(finalSubjects);
        setSelectedSubject(finalSubjects[0]);

      } catch (err) {
        console.error(err);
        toast.error("Initialization error");
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [profile?.schoolId, examId]);

  // 2. Fetch Students & Marks on Subject Selection change
  useEffect(() => {
    if (!profile?.schoolId || !exam || !selectedSubject) return;

    const fetchStudentsAndMarks = async () => {
      setLoading(true);
      try {
        // Query active students in this target class
        const studQ = query(
          collection(db, 'students'), 
          where('schoolId', '==', profile.schoolId),
          where('class', '==', exam.classId || exam.className) // Handles classId schema match
        );
        const studSnap = await getDocs(studQ);
        const studentProfiles = studSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort students by Roll Number numerically
        studentProfiles.sort((a, b) => {
          const rollA = parseInt(a.rollNumber || a.roll_no || 0, 10);
          const rollB = parseInt(b.rollNumber || b.roll_no || 0, 10);
          return rollA - rollB;
        });

        setStudents(studentProfiles);

        // Fetch any existing saved marks for this subject & exam to prepopulate
        const enteredMarks = await fetchEnteredMarks(profile.schoolId, examId, selectedSubject);
        const marksMap = {};
        enteredMarks.forEach(em => {
          marksMap[em.studentId] = em;
        });

        // Construct interactive double-entry grid list
        const grid = studentProfiles.map(student => {
          const existingMark = marksMap[student.id];
          const obtMarks = existingMark ? String(existingMark.obtainedMarks) : '';
          const percent = obtMarks !== '' && maxMarks > 0 ? (Number(obtMarks) / maxMarks) * 100 : 0;
          const grade = obtMarks !== '' ? calculateCCEGrade(percent, gradesConfig) : '-';
          
          return {
            studentId: student.id,
            studentName: student.fullName || student.name || 'Student',
            rollNumber: student.rollNumber || student.roll_no || '-',
            obtainedMarks: obtMarks,
            grade,
            remarks: existingMark ? existingMark.remarks : 'Satisfactory',
            isValid: true
          };
        });

        setGridData(grid);
        inputRefs.current = []; // Reset refs
      } catch (err) {
        console.error(err);
        toast.error("Failed to load students and marks");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndMarks();
  }, [profile?.schoolId, exam, selectedSubject, maxMarks, gradesConfig]);

  // 3. Obtained Marks Live Typing Mappings & Auto Calculations
  const handleObtainedMarksChange = (index, val) => {
    const updated = [...gridData];
    
    // Allow empty string for clearing out marks
    if (val === '') {
      updated[index].obtainedMarks = '';
      updated[index].grade = '-';
      updated[index].isValid = true;
      setGridData(updated);
      return;
    }

    const num = Number(val);
    const maxVal = Number(maxMarks);

    // Validation: cannot be negative or exceed max marks limit
    const isValid = !isNaN(num) && num >= 0 && num <= maxVal;
    
    updated[index].obtainedMarks = val;
    updated[index].isValid = isValid;

    if (isValid) {
      const percentage = (num / maxVal) * 100;
      updated[index].grade = calculateCCEGrade(percentage, gradesConfig);
      
      // Auto-assign smart standard remarks based on grade performance
      if (percentage >= 90) updated[index].remarks = 'Outstanding Performance!';
      else if (percentage >= 80) updated[index].remarks = 'Excellent Work!';
      else if (percentage >= 70) updated[index].remarks = 'Very Good Effort!';
      else if (percentage >= 60) updated[index].remarks = 'Good Progress!';
      else if (percentage >= 35) updated[index].remarks = 'Satisfactory';
      else updated[index].remarks = 'Needs Extra Attention / Tutoring';
    } else {
      updated[index].grade = 'Err';
    }

    setGridData(updated);
  };

  const handleRemarkChange = (index, val) => {
    const updated = [...gridData];
    updated[index].remarks = val;
    setGridData(updated);
  };

  // 4. Excel-style Keyboard Arrow & Enter Key Navigation
  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) prevInput.focus();
    }
  };

  // 5. Submit batch save
  const handleSaveMarks = async () => {
    // Validate all records first
    const hasErrors = gridData.some(row => !row.isValid);
    if (hasErrors) {
      return toast.error("Please resolve marks input errors (marks cannot exceed Maximum Marks limit).");
    }

    // Filter out rows where obtained marks are not typed (so we don't save blank cells)
    const marksToSave = gridData
      .filter(row => row.obtainedMarks !== '')
      .map(row => ({
        studentId: row.studentId,
        studentName: row.studentName,
        rollNumber: row.rollNumber,
        obtainedMarks: Number(row.obtainedMarks),
        totalMarks: Number(maxMarks),
        maxMarks: Number(maxMarks),
        remarks: row.remarks
      }));

    if (marksToSave.length === 0) {
      return toast.warning("No student marks have been typed. Please enter marks before saving.");
    }

    setIsSaving(true);
    try {
      await saveMarksBatch(profile?.schoolId, examId, selectedSubject, marksToSave, gradesConfig);
      toast.success(`Marks saved successfully for ${selectedSubject}! Results compiled and ranks computed!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to compile and batch set marks");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter grid list based on search bar
  const filteredGrid = gridData.filter(row => {
    const name = row.studentName.toLowerCase();
    const roll = String(row.rollNumber).toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || roll.includes(query);
  });

  return (
    <DashboardLayout>
      <div className="mark-entry-wrapper">
        <style>{`
          .mark-entry-wrapper {
            padding: 0.5rem;
            color: var(--text-main);
          }

          .flex-between {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 12px;
          }

          .back-nav-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 0.9rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            margin-bottom: 1.5rem;
            transition: color 0.2s ease;
          }

          .back-nav-btn:hover {
            color: var(--primary);
          }

          .excel-grid-card {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 1.75rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.01);
          }

          .excel-filters-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1.25rem;
            margin-bottom: 2rem;
            align-items: flex-end;
          }

          .form-group-sub {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .form-group-sub label {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-muted);
          }

          .premium-input-sub {
            padding: 0.75rem 1rem;
            border-radius: 12px;
            border: 1.5px solid var(--border);
            background: var(--background, #f8fafc);
            color: var(--text-main);
            font-size: 0.9rem;
            font-weight: 500;
            outline: none;
            transition: all 0.25s ease;
          }

          .premium-input-sub:focus {
            border-color: var(--primary);
            background: var(--card-bg);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
          }

          /* Excel Table Styles */
          .excel-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
          }

          .excel-table th {
            padding: 0.85rem 1rem;
            background: var(--background, #f8fafc);
            font-weight: 800;
            color: var(--text-muted);
            font-size: 0.8rem;
            text-transform: uppercase;
            border-bottom: 2px solid var(--border);
            text-align: left;
          }

          .excel-table td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--border);
            font-size: 0.875rem;
            vertical-align: middle;
          }

          .excel-row:hover {
            background: rgba(99, 102, 241, 0.02);
          }

          .excel-input {
            width: 100%;
            max-width: 120px;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            border: 1.5px solid var(--border);
            background: var(--background);
            color: var(--text-main);
            font-weight: 700;
            outline: none;
            transition: all 0.2s ease;
            text-align: center;
          }

          .excel-input:focus {
            border-color: var(--primary);
            background: var(--card-bg);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
          }

          .excel-input.error {
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.05);
            color: #ef4444;
          }

          .badge-grade-mini {
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-weight: 800;
            font-size: 0.75rem;
            text-transform: uppercase;
            display: inline-block;
          }

          .badge-success-gr { background: rgba(34, 197, 94, 0.1); color: #16a34a; }
          .badge-danger-gr { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

          .quick-alert {
            background: rgba(99, 102, 241, 0.05);
            border: 1.5px solid rgba(99, 102, 241, 0.15);
            padding: 1rem 1.25rem;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text-main);
            font-size: 0.9rem;
            margin-bottom: 2rem;
          }

          .quick-alert svg {
            color: var(--primary);
            flex-shrink: 0;
          }
        `}</style>

        {/* Top Back Action Header */}
        <button className="back-nav-btn" onClick={() => navigate('/admin/exams')}>
          <FiArrowLeft size={16} /> Back to Exams
        </button>

        <div className="flex-between">
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '850', fontFamily: 'var(--font-heading)' }}>
              Keyboard Fast Marks Entry Console
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              Exam: {exam?.examName} ({exam?.examType?.toUpperCase()}) | Target Class: {exam?.className || exam?.classId}
            </p>
          </div>
          
          <button 
            className="ledger-btn ledger-btn-primary" 
            onClick={handleSaveMarks} 
            disabled={isSaving || loading}
          >
            <FiSave /> {isSaving ? 'Compiling & Saving...' : 'Save & Compile Marks'}
          </button>
        </div>

        {/* Alert Guideline */}
        <div className="quick-alert">
          <FiInfo size={22} />
          <span>
            <strong>Excel-like navigation active:</strong> Use <strong>Arrow Keys (↑/↓)</strong> or <strong>Enter</strong> to instantly focus and shift input cells down/up chronologically! Grades and remarks evaluate live upon keystroke.
          </span>
        </div>

        <div className="excel-grid-card">
          
          {/* Dynamic Selection and Search Filter Bar */}
          <div className="excel-filters-bar">
            {/* Subject Select */}
            <div className="form-group-sub">
              <label>Select Marks Entry Subject</label>
              <select 
                className="premium-input-sub"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
              >
                {subjectsList.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Max Marks config */}
            <div className="form-group-sub">
              <label>Maximum Marks</label>
              <input 
                type="number" 
                className="premium-input-sub"
                value={maxMarks}
                onChange={e => setMaxMarks(Number(e.target.value))}
              />
            </div>

            {/* Search Student */}
            <div className="form-group-sub" style={{ gridColumn: 'span 2' }}>
              <label>Search Student Name or Roll Number</label>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Filter grid list..."
                  className="premium-input-sub"
                  style={{ width: '100%', paddingLeft: '2.2rem' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Interactive Data Entry Sheet */}
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Compiling database records and matching classroom indexes...
            </div>
          ) : filteredGrid.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="excel-table">
                <thead>
                  <tr>
                    <th style={{ width: '10%', textAlign: 'center' }}>Roll No</th>
                    <th style={{ width: '30%' }}>Student Full Name</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Maximum Marks</th>
                    <th style={{ width: '18%', textAlign: 'center' }}>Obtained Marks</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>CCE Grade</th>
                    <th>Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrid.map((row, idx) => (
                    <tr className="excel-row" key={row.studentId}>
                      <td style={{ textAlign: 'center', fontWeight: '800', color: 'var(--primary)' }}>
                        {row.rollNumber}
                      </td>
                      <td style={{ fontWeight: '700' }}>
                        {row.studentName}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>
                        {maxMarks}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="text"
                          ref={el => inputRefs.current[idx] = el}
                          className={`excel-input ${!row.isValid ? 'error' : ''}`}
                          placeholder="-"
                          value={row.obtainedMarks}
                          onChange={e => handleObtainedMarksChange(idx, e.target.value)}
                          onKeyDown={e => handleKeyDown(e, idx)}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge-grade-mini ${row.grade !== 'D' && row.grade !== 'Err' && row.grade !== '-' ? 'badge-success-gr' : 'badge-danger-gr'}`}>
                          {row.grade}
                        </span>
                      </td>
                      <td>
                        <input 
                          type="text"
                          className="premium-input-sub"
                          style={{ width: '100%', padding: '0.4rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem' }}
                          value={row.remarks}
                          onChange={e => handleRemarkChange(idx, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No students mapped under {exam?.className || exam?.classId}. Verify student registry rosters.
            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
};

export default MarkEntry;
