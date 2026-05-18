import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiShield } from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { addExam } from '../../services/examService';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';

const AddExam = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    examName: '',
    examType: 'karnataka', // default
    academicYear: '2026-27',
    totalMarks: '',
    passingMarks: '',
    classId: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addExam({
        ...formData,
        schoolId: profile?.schoolId,
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks)
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
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', color: 'var(--text-muted)', marginBottom: '1.5rem' }}
      >
        <FiArrowLeft /> Back to Exams
      </button>

      <div style={{ maxWidth: '800px' }}>
        <h1 style={{ fontSize: '1.875rem', marginBottom: '2rem' }}>Schedule New Exam</h1>

        <form onSubmit={handleSubmit} className="premium-card" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Exam System Pattern</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <div 
                  onClick={() => setFormData({...formData, examType: 'karnataka', examName: 'FA1'})}
                  style={{ 
                    flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: formData.examType === 'karnataka' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: formData.examType === 'karnataka' ? 'var(--primary)05' : 'var(--background)'
                  }}
                >
                  <FiShield color={formData.examType === 'karnataka' ? 'var(--primary)' : 'var(--text-muted)'} />
                  <h4 style={{ marginTop: '0.5rem' }}>Karnataka CCE</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FA/SA pattern with grades</p>
                </div>
                <div 
                  onClick={() => setFormData({...formData, examType: 'maharashtra', examName: 'Unit Test 1'})}
                  style={{ 
                    flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: formData.examType === 'maharashtra' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: formData.examType === 'maharashtra' ? 'var(--primary)05' : 'var(--background)'
                  }}
                >
                  <FiShield color={formData.examType === 'maharashtra' ? 'var(--primary)' : 'var(--text-muted)'} />
                  <h4 style={{ marginTop: '0.5rem' }}>Maharashtra</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semester & Unit Test pattern</p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Select Exam</label>
              <select 
                className="premium-input" 
                value={formData.examName}
                onChange={(e) => setFormData({...formData, examName: e.target.value})}
              >
                {formData.examType === 'karnataka' ? karnatakaExams.map(ex => <option key={ex} value={ex}>{ex}</option>) : maharashtraExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Academic Year</label>
              <input 
                className="premium-input" 
                value={formData.academicYear}
                onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Total Marks</label>
              <input 
                type="number" 
                className="premium-input" 
                placeholder="e.g. 100"
                value={formData.totalMarks}
                onChange={(e) => setFormData({...formData, totalMarks: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Passing Marks</label>
              <input 
                type="number" 
                className="premium-input" 
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

      <style>{`
        .premium-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--background);
          color: var(--text-main);
          outline: none;
          margin-top: 0.5rem;
        }
        label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-muted);
        }
      `}</style>
    </DashboardLayout>
  );
};

export default AddExam;
