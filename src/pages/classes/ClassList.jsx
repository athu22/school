import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch } from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import ClassCard from '../../components/classes/ClassCard';
import { useClasses } from '../../hooks/useClasses';
import useAuthStore from '../../store/authStore';
import { addClass } from '../../services/classService';
import { toast } from 'react-toastify';

const ClassList = () => {
  const { profile } = useAuthStore();
  const { classes, loading } = useClasses(profile?.schoolId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName) return toast.error("Class name is required");

    setIsSubmitting(true);
    try {
      await addClass({
        className: newClassName,
        displayName: `Class ${newClassName}`,
        academicYear: academicYear,
        schoolId: profile?.schoolId
      });
      toast.success("Class added successfully");
      setShowAddModal(false);
      setNewClassName('');
    } catch (error) {
      toast.error("Failed to add class");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}>Class Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Structure your school by creating classes and divisions.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <FiPlus /> Create New Class
        </Button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {loading ? (
          <p>Loading classes...</p>
        ) : classes.length > 0 ? classes.map((cls) => (
          <ClassCard key={cls.id} classData={cls} />
        )) : (
          <div className="premium-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No classes found. Start by creating your first class.</p>
          </div>
        )}
      </div>

      {/* Add Class Modal (Simplified) */}
      {showAddModal && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="premium-card" 
            style={{ width: '400px', padding: '2rem' }}
          >
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Class</h2>
            <form onSubmit={handleAddClass}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Class Name</label>
                <input 
                  type="text" 
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. 10 or Nursery"
                  style={{ 
                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border)', background: 'var(--background)' 
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Academic Year</label>
                <input 
                  type="text" 
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="e.g. 2026-27"
                  style={{ 
                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border)', background: 'var(--background)' 
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Create Class</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ClassList;
