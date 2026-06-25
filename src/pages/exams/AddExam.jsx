import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiShield, FiPlus, FiBook, FiAward, FiSettings } from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { addExam } from '../../services/examService';
import useAuthStore from '../../store/authStore';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';

const AddExam = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [isCustomExam, setIsCustomExam] = useState(false);
  
  const [formData, setFormData] = useState({
    examName: 'FA1',
    customExamName: '',
    examType: 'karnataka', // karnataka | maharashtra | custom
    academicYear: '2026-27',
    totalMarks: '',
    passingMarks: '',
    classId: ''
  });

  // Load Classes dynamically from Firestore
  useEffect(() => {
    if (!profile?.schoolId) return;

    const fetchClasses = async () => {
      try {
        const q = query(collection(db, 'classes'), where('schoolId', '==', profile.schoolId));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => (a.className || '').localeCompare(b.className || '', undefined, { numeric: true }));
        setClasses(list);

        if (list.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            classId: list[0].className || list[0].id 
          }));
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    fetchClasses();
  }, [profile?.schoolId]);

  // Handle totalMarks change to auto-calculate passing marks (35% standard)
  const handleTotalMarksChange = (val) => {
    const total = Number(val);
    const passing = total > 0 ? Math.ceil(total * 0.35) : '';
    setFormData(prev => ({
      ...prev,
      totalMarks: val,
      passingMarks: String(passing)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classId) return toast.error("Please select a classroom first.");
    
    const finalExamName = isCustomExam ? formData.customExamName.trim() : formData.examName;
    if (!finalExamName) return toast.error("Please enter a valid Exam Name.");

    setLoading(true);
    try {
      await addExam({
        ...formData,
        examName: finalExamName,
        schoolId: profile?.schoolId,
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks),
        className: formData.classId // Storing class ID / Name as className mapping
      });
      toast.success("Exam scheduled successfully!");
      navigate('/admin/exams');
    } catch (error) {
      toast.error("Failed to schedule exam");
    } finally {
      setLoading(false);
    }
  };

  const karnatakaExams = ["FA1", "FA2", "SA1", "FA3", "FA4", "SA2"];
  const maharashtraExams = ["Unit Test 1", "Semester 1", "Unit Test 2", "Semester 2", "Annual Exam"];

  return (
    <DashboardLayout>
      <button 
        onClick={() => navigate('/admin/exams')}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', marginBottom: '1.5rem', cursor: 'pointer', fontWeight: '600' }}
      >
        <FiArrowLeft /> Back to Exams
      </button>

      <div style={{ maxWidth: '800px', margin: 'auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '850', fontFamily: 'var(--font-heading)' }}>Schedule New Exam</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Configure standard CCE structures or register custom school evaluations.</p>
        </div>

        <form onSubmit={handleSubmit} className="premium-card" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* Exam Pattern */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exam System Pattern</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <div 
                  onClick={() => {
                    setIsCustomExam(false);
                    setFormData({...formData, examType: 'karnataka', examName: 'FA1'});
                  }}
                  style={{ 
                    flex: 1, padding: '1rem', borderRadius: '16px', cursor: 'pointer',
                    border: formData.examType === 'karnataka' ? '2.5px solid var(--primary)' : '1.5px solid var(--border)',
                    background: formData.examType === 'karnataka' ? 'var(--primary)05' : 'var(--background)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FiShield color={formData.examType === 'karnataka' ? 'var(--primary)' : 'var(--text-muted)'} size={20} />
                  <h4 style={{ marginTop: '0.5rem', fontWeight: '800' }}>Karnataka CCE Pattern</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>FA/SA standard state scale with dynamic CCE grades</p>
                </div>
                <div 
                  onClick={() => {
                    setIsCustomExam(false);
                    setFormData({...formData, examType: 'maharashtra', examName: 'Unit Test 1'});
                  }}
                  style={{ 
                    flex: 1, padding: '1rem', borderRadius: '16px', cursor: 'pointer',
                    border: formData.examType === 'maharashtra' ? '2.5px solid var(--primary)' : '1.5px solid var(--border)',
                    background: formData.examType === 'maharashtra' ? 'var(--primary)05' : 'var(--background)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FiShield color={formData.examType === 'maharashtra' ? 'var(--primary)' : 'var(--text-muted)'} size={20} />
                  <h4 style={{ marginTop: '0.5rem', fontWeight: '800' }}>Maharashtra Pattern</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Semester & Unit Test state scale with custom indices</p>
                </div>
              </div>
            </div>

            {/* Exam Selector or Custom entry */}
            <div className="form-group" style={{ gridColumn: isCustomExam ? 'span 1' : 'span 2' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Select Assessment Scope</label>
              <select 
                className="premium-input" 
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', marginTop: '0.5rem', outline: 'none' }}
                value={isCustomExam ? 'Custom' : formData.examName}
                onChange={(e) => {
                  if (e.target.value === 'Custom') {
                    setIsCustomExam(true);
                    setFormData({...formData, examName: ''});
                  } else {
                    setIsCustomExam(false);
                    setFormData({...formData, examName: e.target.value});
                  }
                }}
              >
                {formData.examType === 'karnataka' 
                  ? karnatakaExams.map(ex => <option key={ex} value={ex}>{ex}</option>) 
                  : maharashtraExams.map(ex => <option key={ex} value={ex}>{ex}</option>)
                }
                <option value="Custom">Register Custom Assessment...</option>
              </select>
            </div>

            {/* Custom Exam name text box */}
            {isCustomExam && (
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Custom Exam Name *</label>
                <input 
                  type="text"
                  required
                  className="premium-input" 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', marginTop: '0.5rem', outline: 'none' }}
                  placeholder="e.g. Weekly Evaluation Jan"
                  value={formData.customExamName}
                  onChange={(e) => setFormData({...formData, customExamName: e.target.value})}
                />
              </div>
            )}

            {/* Target Class dropdown */}
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Classroom</label>
              <select 
                className="premium-input" 
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', marginTop: '0.5rem', outline: 'none' }}
                value={formData.classId}
                onChange={(e) => setFormData({...formData, classId: e.target.value})}
              >
                {classes.length > 0 ? (
                  classes.map(c => (
                    <option key={c.id} value={c.className}>{c.className}</option>
                  ))
                ) : (
                  <option value="">No classrooms configured</option>
                )}
              </select>
            </div>

            {/* Academic Year */}
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic Session Year</label>
              <input 
                className="premium-input" 
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', marginTop: '0.5rem', outline: 'none' }}
                value={formData.academicYear}
                onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
              />
            </div>

            {/* Total Marks */}
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Maximum Scope Marks</label>
              <input 
                type="number" 
                required
                className="premium-input" 
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', marginTop: '0.5rem', outline: 'none' }}
                placeholder="e.g. 100"
                value={formData.totalMarks}
                onChange={(e) => handleTotalMarksChange(e.target.value)}
              />
            </div>

            {/* Passing Marks */}
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Passing Marks Minimum</label>
              <input 
                type="number" 
                required
                className="premium-input" 
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', marginTop: '0.5rem', outline: 'none' }}
                placeholder="e.g. 35"
                value={formData.passingMarks}
                onChange={(e) => setFormData({...formData, passingMarks: e.target.value})}
              />
            </div>

          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Button variant="secondary" type="button" onClick={() => navigate('/admin/exams')}>Cancel</Button>
            <Button type="submit" isLoading={loading}>Schedule Exam</Button>
          </div>
        </form>
      </div>

    </DashboardLayout>
  );
};

export default AddExam;
