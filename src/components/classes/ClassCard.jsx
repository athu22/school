import React from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiLayers, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const ClassCard = ({ classData }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="premium-card"
      style={{ padding: '1.5rem', cursor: 'pointer' }}
      onClick={() => navigate(`/admin/classes/${classData.id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          borderRadius: '12px', 
          background: 'var(--primary)15', 
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          fontWeight: '700'
        }}>
          {classData.className}
        </div>
        <span style={{ 
          fontSize: '0.75rem', 
          padding: '0.25rem 0.625rem', 
          borderRadius: '20px', 
          background: 'var(--background)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)'
        }}>
          {classData.academicYear}
        </span>
      </div>

      <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Class {classData.className}</h3>
      
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <FiUsers />
          <span>{classData.totalStudents || 0} Students</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <FiLayers />
          <span>{classData.divisionsCount || 0} Divisions</span>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: '600' }}>
        View Details <FiArrowRight />
      </div>
    </motion.div>
  );
};

export default ClassCard;
