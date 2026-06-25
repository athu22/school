import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiPrinter, FiDownload, FiSearch, FiAward, 
  FiEye, FiX, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import useAuthStore from '../../store/authStore';
import { fetchAggregatedResults } from '../../services/examService';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ResultList = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  // Core States
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('All');

  // Modal Report Card State
  const [selectedResult, setSelectedResult] = useState(null);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [isDownloadingSingle, setIsDownloadingSingle] = useState(false);
  const [isDownloadingBulk, setIsDownloadingBulk] = useState(false);

  // General selector states (when accessed without direct examId)
  const [allExams, setAllExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(examId || '');

  // 1. Fetch Exam Registry & Computed Results Aggregations
  useEffect(() => {
    if (!profile?.schoolId) return;

    const initResults = async () => {
      setLoading(true);
      try {
        // Load all exams in school anyway for selector fallback
        const examsQ = query(collection(db, "exams"), where("schoolId", "==", profile.schoolId));
        const examsSnap = await getDocs(examsQ);
        const examsList = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllExams(examsList);

        const activeExamId = selectedExamId || examId || (examsList.length > 0 ? examsList[0].id : '');
        if (activeExamId) {
          setSelectedExamId(activeExamId);
          const examRef = doc(db, "exams", activeExamId);
          const examSnap = await getDoc(examRef);
          if (examSnap.exists()) {
            setExam({ id: examSnap.id, ...examSnap.data() });
            const resData = await fetchAggregatedResults(profile.schoolId, activeExamId);
            setResults(resData);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load results registry");
      } finally {
        setLoading(false);
      }
    };

    initResults();
  }, [profile?.schoolId, examId, selectedExamId]);

  // Filters logic
  const filteredResults = results.filter(r => {
    const name = r.studentName.toLowerCase();
    const roll = String(r.rollNumber).toLowerCase();
    const adm = String(r.admissionNumber).toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || roll.includes(query) || adm.includes(query);

    const matchesSection = selectedSection === 'All' || r.section === selectedSection;
    return matchesSearch && matchesSection;
  });

  const sectionsList = ['All', ...new Set((results || []).map(r => r.section))].filter(Boolean);

  // 2. Export dynamic class CSV sheet summary
  const handleExportCSVSummary = () => {
    const csvHeaders = ["Roll No", "Admission No", "Student Name", "Class", "Section", "Total Marks", "Percentage", "CCE Grade", "Status", "Rank"];
    const csvRows = filteredResults.map(r => [
      r.rollNumber,
      r.admissionNumber,
      r.studentName,
      r.class,
      r.section,
      `${r.totalObtained}/${r.totalMax}`,
      `${Math.round(r.percentage)}%`,
      r.grade,
      r.status,
      r.rank
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exam?.examName}_Class_${exam?.className}_Results_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("CSV Summary exported!");
  };

  // 3. Single report card PDF Generator
  const handleDownloadSinglePDF = async (resObj) => {
    setIsDownloadingSingle(true);
    try {
      const element = document.getElementById(`report-card-print-${resObj.studentId}`);
      if (!element) return toast.error("Report card element not ready");

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`ReportCard_${resObj.studentName.replace(/\s+/g, '_')}_${exam?.examName}.pdf`);
      toast.success("Report card PDF generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloadingSingle(false);
    }
  };

  // 4. Bulk printable layout launcher
  const handleBulkPrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="results-wrapper">
        <style>{`
          .results-wrapper {
            padding: 0.5rem;
            color: var(--text-main);
          }

          .flex-between {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 20px;
          }

          /* Premium Button Styles */
          .ledger-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 0.65rem 1.25rem;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1.5px solid transparent;
          }

          .ledger-btn-primary {
            background: var(--primary, #4f46e5);
            color: #ffffff;
            border-color: var(--primary, #4f46e5);
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
          }

          .ledger-btn-primary:hover {
            background: var(--primary-hover, #4338ca);
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(79, 70, 229, 0.25);
          }

          .ledger-btn-secondary {
            background: var(--card-bg, #ffffff);
            color: var(--text-main, #0f172a);
            border-color: var(--border, #e2e8f0);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
          }

          .ledger-btn-secondary:hover {
            background: var(--background, #f8fafc);
            border-color: var(--text-muted, #94a3b8);
            transform: translateY(-1px);
          }

          /* Empty State Styles */
          .empty-state-box {
            background: var(--card-bg, #ffffff);
            border: 2px dashed var(--border, #e2e8f0);
            border-radius: 24px;
            padding: 4rem 2rem;
            text-align: center;
            color: var(--text-muted, #64748b);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-top: 1rem;
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

          .results-grid-card {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 1.75rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.01);
          }

          .results-filter-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

          /* Results Table */
          .results-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
          }

          .results-table th {
            padding: 0.95rem 1.25rem;
            background: var(--background, #f8fafc);
            font-weight: 800;
            color: var(--text-muted);
            font-size: 0.8rem;
            text-transform: uppercase;
            border-bottom: 2px solid var(--border);
            text-align: left;
          }

          .results-table td {
            padding: 0.95rem 1.25rem;
            border-bottom: 1px solid var(--border);
            font-size: 0.875rem;
            vertical-align: middle;
          }

          .results-row:hover {
            background: rgba(99, 102, 241, 0.02);
          }

          /* Status Badges */
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 0.25rem 0.65rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
          }

          .status-pass { background: rgba(34, 197, 94, 0.1); color: #16a34a; }
          .status-fail { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

          /* Modal Styling */
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1500;
            padding: 1.5rem;
          }

          .modal-content-card {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border);
            border-radius: 24px;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
          }

          .modal-header {
            padding: 1.25rem 1.75rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          /* PIXEL-PERFECT REPORT CARD STYLING */
          .report-card-designer {
            width: 210mm; /* standard A4 width aspect */
            background: #ffffff;
            color: #1e293b;
            padding: 20px;
            border: 10px double #475569;
            box-sizing: border-box;
            font-family: 'Times New Roman', Times, serif;
            margin: auto;
          }

          .report-header-banner {
            text-align: center;
            border-bottom: 3px solid #1e293b;
            padding-bottom: 12px;
            margin-bottom: 15px;
          }

          .report-school-title {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
          }

          .report-school-meta {
            font-size: 11px;
            font-weight: bold;
            color: #475569;
            margin: 4px 0 0 0;
          }

          .student-info-strip {
            display: grid;
            grid-template-columns: repeat(4, 1fr) auto;
            gap: 10px;
            margin-bottom: 15px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
          }

          .student-photo-frame {
            width: 60px;
            height: 60px;
            border: 1.5px solid #475569;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #e2e8f0;
            overflow: hidden;
          }

          .report-marks-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 12px;
          }

          .report-marks-table th {
            border: 1.5px solid #1e293b;
            padding: 6px 8px;
            background: #e2e8f0;
            font-weight: bold;
            text-align: center;
          }

          .report-marks-table td {
            border: 1px solid #475569;
            padding: 6px 8px;
            text-align: center;
          }

          .report-summary-box {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            border: 1.5px solid #1e293b;
            background: #f1f5f9;
            padding: 10px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 25px;
            text-align: center;
          }

          .report-signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            font-size: 12px;
            font-weight: bold;
            border-top: 1px dashed #475569;
            padding-top: 20px;
          }

          /* PRINT TARGET STYLES - Crucial to format report cards perfectly on paper */
          @media print {
            body * {
              visibility: hidden;
            }
            .bulk-printable-area, .bulk-printable-area * {
              visibility: visible;
            }
            .bulk-printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .report-card-designer {
              border: 10px double #000 !important;
              box-shadow: none !important;
              margin-bottom: 0 !important;
              page-break-after: always !important; /* Forces A4 page breaks */
            }
          }

          .bulk-printable-area {
            display: none;
          }
        `}</style>

        {/* Global Back Link */}
        <button className="back-nav-btn" onClick={() => navigate('/admin/exams')}>
          <FiArrowLeft size={16} /> Back to Exams
        </button>

        <div className="flex-between">
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '850', fontFamily: 'var(--font-heading)' }}>
              CCE Results & Academic Ranks
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              Roster: {exam?.examName} Assessment | Targets: Class {exam?.className}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="ledger-btn ledger-btn-secondary" onClick={handleExportCSVSummary}>
              <FiDownload /> Export CSV
            </button>
            <button className="ledger-btn ledger-btn-primary" onClick={handleBulkPrint}>
              <FiPrinter /> Bulk Print Report Cards
            </button>
          </div>
        </div>

        {/* Overall Results Table Registry */}
        <div className="results-grid-card">
          
          <div className="results-filter-bar">
            {/* Search Student */}
            <div className="form-group-sub" style={{ gridColumn: 'span 2' }}>
              <label>Search Student</label>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search name, roll or admission ID..."
                  className="premium-input-sub"
                  style={{ width: '100%', paddingLeft: '2.2rem' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Select Assessment Dropdown */}
            {allExams.length > 0 && (
              <div className="form-group-sub">
                <label>Select Assessment</label>
                <select 
                  className="premium-input-sub"
                  value={selectedExamId}
                  onChange={e => setSelectedExamId(e.target.value)}
                >
                  {allExams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.examName} ({ex.className || 'All'}) - {ex.academicYear}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter Section */}
            <div className="form-group-sub">
              <label>Filter Section</label>
              <select 
                className="premium-input-sub"
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
              >
                {sectionsList.map(sec => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Fetching computed rank matrix and compiling grades...
            </div>
          ) : filteredResults.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="results-table">
                <thead>
                  <tr>
                    <th style={{ width: '10%' }}>Rank</th>
                    <th style={{ width: '12%' }}>Roll Number</th>
                    <th style={{ width: '30%' }}>Student Name</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Total Marks</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>Percentage</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Grade</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Status</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Report Card</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map(res => (
                    <tr className="results-row" key={res.studentId}>
                      <td style={{ fontWeight: '900', color: res.status === 'PASS' ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {res.status === 'PASS' ? `#${res.rank}` : 'N/A'}
                      </td>
                      <td style={{ fontWeight: '800' }}>
                        {res.rollNumber}
                      </td>
                      <td style={{ fontWeight: '750' }}>
                        {res.studentName}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Adm: {res.admissionNumber} | Div: {res.section}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '700' }}>
                        {res.totalObtained} / {res.totalMax}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '850', color: 'var(--primary)' }}>
                        {Math.round(res.percentage)}%
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '900' }}>
                        {res.grade}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${res.status === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                          {res.status === 'PASS' ? <FiCheckCircle /> : <FiAlertCircle />} {res.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="exp-action-btn exp-action-view"
                          style={{ padding: '4px 8px', borderRadius: '6px' }}
                          onClick={() => {
                            setSelectedResult(res);
                            setShowReportCardModal(true);
                          }}
                        >
                          <FiEye size={15} /> Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-box">
              <FiAward size={48} style={{ color: 'var(--primary)', opacity: 0.7, marginBottom: '0.5rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>No Assessment Records Found</h3>
              <p style={{ maxWidth: '400px', fontSize: '0.9rem', margin: '0 auto', lineHeight: '1.5' }}>
                Please configure class subjects and submit student marks in the exam center to view dynamic aggregates and print progress report cards.
              </p>
            </div>
          )}

        </div>

        {/* ==================== INDIVIDUAL REPORT CARD VIEW MODAL ==================== */}
        {showReportCardModal && selectedResult && (
          <div className="modal-overlay">
            <div className="modal-content-card">
              
              {/* Header */}
              <div className="modal-header">
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                  CCE Report Card: {selectedResult.studentName}
                </h3>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="ledger-btn ledger-btn-secondary" 
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={() => handleDownloadSinglePDF(selectedResult)}
                    disabled={isDownloadingSingle}
                  >
                    <FiDownload /> {isDownloadingSingle ? 'Publishing...' : 'Publish PDF'}
                  </button>
                  <button className="ledger-close-btn" onClick={() => setShowReportCardModal(false)}>
                    <FiX />
                  </button>
                </div>
              </div>

              {/* Modal Body: Pixel Perfect Report Card Preview */}
              <div style={{ padding: '2rem', overflowY: 'auto' }}>
                <div className="report-card-designer" id={`report-card-print-${selectedResult.studentId}`}>
                  
                  {/* Header */}
                  <div className="report-header-banner">
                    <h2 className="report-school-title">{profile?.schoolName || 'NATIONAL HIGHER PUBLIC SCHOOL'}</h2>
                    <p className="report-school-meta">
                      Affiliation Code: STATE CCE | UDISE Code: {profile?.udiseCode || '29302194812'} | AY: {exam?.academicYear}
                    </p>
                    <h3 style={{ margin: '8px 0 0 0', textTransform: 'uppercase', fontStyle: 'italic', fontSize: '14px' }}>
                      Official Progress Report Card ({exam?.examName})
                    </h3>
                  </div>

                  {/* Student Details Strip */}
                  <div className="student-info-strip">
                    <div>
                      <div style={{ color: '#64748b', fontSize: '10px' }}>STUDENT NAME</div>
                      <div>{selectedResult.studentName}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '10px' }}>ROLL NUMBER</div>
                      <div>{selectedResult.rollNumber}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '10px' }}>CLASS & SECTION</div>
                      <div>{selectedResult.class} - {selectedResult.section}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '10px' }}>ADMISSION ID</div>
                      <div>{selectedResult.admissionNumber}</div>
                    </div>
                    
                    {/* Student Photo block */}
                    <div className="student-photo-frame">
                      {selectedResult.photoURL ? (
                        <img src={selectedResult.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '9px', textAlign: 'center', color: '#64748b' }}>PHOTO</span>
                      )}
                    </div>
                  </div>

                  {/* Subjects Marks Ledger Table */}
                  <table className="report-marks-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40%', textAlign: 'left' }}>Subject / Curriculum Scope</th>
                        <th style={{ width: '15%' }}>Max Marks</th>
                        <th style={{ width: '15%' }}>Obtained</th>
                        <th style={{ width: '15%' }}>CCE Grade</th>
                        <th>Subject Remarks / Progress notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResult.subjectMarks && Object.keys(selectedResult.subjectMarks).map(sub => {
                        const sm = selectedResult.subjectMarks[sub];
                        return (
                          <tr key={sub}>
                            <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{sub}</td>
                            <td>{sm.maxMarks}</td>
                            <td style={{ fontWeight: 'bold' }}>{sm.obtainedMarks}</td>
                            <td style={{ fontWeight: 'bold', color: sm.isPassed ? '#1e293b' : '#ef4444' }}>{sm.grade}</td>
                            <td>{sm.remarks || 'Satisfactory'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Bottom Aggregates summary box */}
                  <div className="report-summary-box">
                    <div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>GRAND TOTAL</div>
                      <div>{selectedResult.totalObtained} / {selectedResult.totalMax}</div>
                    </div>
                    <div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>PERCENTAGE %</div>
                      <div>{Math.round(selectedResult.percentage)}%</div>
                    </div>
                    <div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>OVERALL GRADE</div>
                      <div style={{ color: 'var(--primary)', fontSize: '16px' }}>{selectedResult.grade}</div>
                    </div>
                    <div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>CLASS RANK</div>
                      <div style={{ fontSize: '16px' }}>{selectedResult.status === 'PASS' ? `#${selectedResult.rank}` : 'N/A'}</div>
                    </div>
                  </div>

                  {/* CCE Grading Scale Chart Reference for Parent validation */}
                  <div style={{ border: '1px solid #cbd5e1', padding: '6px 12px', fontSize: '10px', borderRadius: '4px', background: '#f8fafc', marginBottom: '25px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold' }}>CCE GRADING REFERENCE SCALE:</span>
                    <span>A+: 91-100% | A: 81-90% | B+: 71-80% | B: 61-70% | C+: 51-60% | C: 35-50% | D: Below 35% (Fail)</span>
                  </div>

                  {/* Verification Signatures */}
                  <div className="report-signatures">
                    <div style={{ width: '150px', textAlign: 'center' }}>
                      <div style={{ height: '25px' }}></div>
                      <div style={{ borderTop: '1px solid #1e293b', paddingTop: '4px' }}>Class Teacher</div>
                    </div>
                    <div style={{ width: '150px', textAlign: 'center' }}>
                      <div style={{ height: '25px' }}></div>
                      <div style={{ borderTop: '1px solid #1e293b', paddingTop: '4px' }}>School Seal / Exam Head</div>
                    </div>
                    <div style={{ width: '150px', textAlign: 'center' }}>
                      <div style={{ height: '25px' }}></div>
                      <div style={{ borderTop: '1px solid #1e293b', paddingTop: '4px' }}>Principal</div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== BULK PRINT TARGET SHEETS ==================== */}
        <div className="bulk-printable-area">
          {filteredResults.map(res => (
            <div className="report-card-designer" key={`bulk-${res.studentId}`} style={{ marginBottom: '40px' }}>
              {/* Header */}
              <div className="report-header-banner">
                <h2 className="report-school-title">{profile?.schoolName || 'NATIONAL HIGHER PUBLIC SCHOOL'}</h2>
                <p className="report-school-meta">
                  Affiliation Code: STATE CCE | UDISE Code: {profile?.udiseCode || '29302194812'} | AY: {exam?.academicYear}
                </p>
                <h3 style={{ margin: '8px 0 0 0', textTransform: 'uppercase', fontStyle: 'italic', fontSize: '14px' }}>
                  Official Progress Report Card ({exam?.examName})
                </h3>
              </div>

              {/* Student Details Strip */}
              <div className="student-info-strip">
                <div>
                  <div style={{ color: '#64748b', fontSize: '10px' }}>STUDENT NAME</div>
                  <div>{res.studentName}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '10px' }}>ROLL NUMBER</div>
                  <div>{res.rollNumber}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '10px' }}>CLASS & SECTION</div>
                  <div>{res.class} - {res.section}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '10px' }}>ADMISSION ID</div>
                  <div>{res.admissionNumber}</div>
                </div>
                
                {/* Student Photo block */}
                <div className="student-photo-frame">
                  {res.photoURL ? (
                    <img src={res.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '9px', textAlign: 'center', color: '#64748b' }}>PHOTO</span>
                  )}
                </div>
              </div>

              {/* Subjects Marks Ledger Table */}
              <table className="report-marks-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%', textAlign: 'left' }}>Subject / Scope</th>
                    <th style={{ width: '15%' }}>Max Marks</th>
                    <th style={{ width: '15%' }}>Obtained</th>
                    <th style={{ width: '15%' }}>CCE Grade</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {res.subjectMarks && Object.keys(res.subjectMarks).map(sub => {
                    const sm = res.subjectMarks[sub];
                    return (
                      <tr key={sub}>
                        <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{sub}</td>
                        <td>{sm.maxMarks}</td>
                        <td style={{ fontWeight: 'bold' }}>{sm.obtainedMarks}</td>
                        <td style={{ fontWeight: 'bold', color: sm.isPassed ? '#1e293b' : '#ef4444' }}>{sm.grade}</td>
                        <td>{sm.remarks || 'Satisfactory'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Bottom Aggregates summary box */}
              <div className="report-summary-box">
                <div>
                  <div style={{ color: '#475569', fontSize: '10px' }}>GRAND TOTAL</div>
                  <div>{res.totalObtained} / {res.totalMax}</div>
                </div>
                <div>
                  <div style={{ color: '#475569', fontSize: '10px' }}>PERCENTAGE %</div>
                  <div>{Math.round(res.percentage)}%</div>
                </div>
                <div>
                  <div style={{ color: '#475569', fontSize: '10px' }}>OVERALL GRADE</div>
                  <div style={{ color: 'var(--primary)', fontSize: '16px' }}>{res.grade}</div>
                </div>
                <div>
                  <div style={{ color: '#475569', fontSize: '10px' }}>CLASS RANK</div>
                  <div style={{ fontSize: '16px' }}>{res.status === 'PASS' ? `#${res.rank}` : 'N/A'}</div>
                </div>
              </div>

              {/* Verification Signatures */}
              <div className="report-signatures">
                <div style={{ width: '150px', textAlign: 'center' }}>
                  <div style={{ height: '25px' }}></div>
                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: '4px' }}>Class Teacher</div>
                </div>
                <div style={{ width: '150px', textAlign: 'center' }}>
                  <div style={{ height: '25px' }}></div>
                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: '4px' }}>School Seal</div>
                </div>
                <div style={{ width: '150px', textAlign: 'center' }}>
                  <div style={{ height: '25px' }}></div>
                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: '4px' }}>Principal</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ResultList;
