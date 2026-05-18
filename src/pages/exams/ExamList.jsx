import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiBook, FiAward, FiFileText } from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { useExams } from '../../hooks/useExams';
import useAuthStore from '../../store/authStore';

const ExamList = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { exams, loading } = useExams(profile?.schoolId);

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}>Exams & Results</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage state-specific exam structures and marks entry.</p>
        </div>
        <Button onClick={() => navigate('/admin/exams/add')}>
          <FiPlus /> Schedule New Exam
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <p>Loading exams...</p>
        ) : exams.length > 0 ? exams.map((exam) => (
          <div key={exam.id} className="premium-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                borderRadius: '20px', 
                fontSize: '0.75rem', 
                background: 'var(--primary)15', 
                color: 'var(--primary)',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {exam.examType} Pattern
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{exam.academicYear}</span>
            </div>
            
            <h3 style={{ marginBottom: '1.25rem' }}>{exam.examName}</h3>
            
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <FiBook /> <span>Class {exam.className || 'All'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <FiAward /> <span>{exam.totalMarks} Marks</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button 
                variant="secondary" 
                style={{ flex: 1, fontSize: '0.75rem' }}
                onClick={() => navigate(`/admin/exams/mark-entry/${exam.id}`)}
              >
                <FiFileText /> Enter Marks
              </Button>
              <Button 
                style={{ flex: 1, fontSize: '0.75rem' }}
                onClick={() => navigate(`/admin/exams/results/${exam.id}`)}
              >
                View Results
              </Button>
            </div>
          </div>
        )) : (
          <div className="premium-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No exams scheduled yet.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExamList;
