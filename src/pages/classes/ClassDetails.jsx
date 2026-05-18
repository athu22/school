import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import DashboardLayout from '../../layouts/DashboardLayout';
import { FiArrowLeft, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import { useDivisions } from '../../hooks/useClasses';
import { addDivision, deleteDivision } from '../../services/classService';
import { toast } from 'react-toastify';
import StatCard from '../../components/dashboard/StatCard';

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { divisions, loading: divsLoading } = useDivisions(id);
  
  const [showAddDiv, setShowAddDiv] = useState(false);
  const [newDivName, setNewDivName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClass = async () => {
      const docRef = doc(db, 'classes', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setClassData({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    fetchClass();
  }, [id]);

  const handleAddDiv = async (e) => {
    e.preventDefault();
    if (!newDivName) return toast.error("Division name required");
    setIsSubmitting(true);
    try {
      await addDivision({
        classId: id,
        className: classData.className,
        divisionName: newDivName,
        schoolId: classData.schoolId
      });
      toast.success("Division added");
      setNewDivName('');
      setShowAddDiv(false);
    } catch (error) {
      toast.error("Error adding division");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDiv = async (divId) => {
    if (window.confirm("Delete this division?")) {
      try {
        await deleteDivision(divId);
        toast.success("Division deleted");
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  if (loading) return <DashboardLayout><p>Loading...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate('/admin/classes')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', color: 'var(--text-muted)', marginBottom: '1rem' }}
        >
          <FiArrowLeft /> Back to Classes
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.875rem' }}>Class {classData.className} Details</h1>
          <Button onClick={() => setShowAddDiv(true)}><FiPlus /> Add Division</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard icon={<FiUsers />} label="Total Students" value={classData.totalStudents || 0} />
        <StatCard icon={<FiPlus />} label="Total Divisions" value={divisions.length} color="var(--success)" />
        <StatCard icon={<FiUsers />} label="Academic Year" value={classData.academicYear} color="var(--warning)" />
      </div>

      <div className="premium-card">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <h3>Divisions</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
              <th style={{ padding: '1rem' }}>Division Name</th>
              <th style={{ padding: '1rem' }}>Student Strength</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {divsLoading ? (
              <tr><td colSpan="3" style={{ padding: '1rem' }}>Loading divisions...</td></tr>
            ) : divisions.map(div => (
              <tr key={div.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: '600' }}>Division {div.divisionName}</td>
                <td style={{ padding: '1rem' }}>{div.totalStudents || 0} Students</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button onClick={() => handleDeleteDiv(div.id)} style={{ color: 'var(--accent)', background: 'none' }}><FiTrash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Division Modal */}
      {showAddDiv && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div className="premium-card" style={{ width: '400px', padding: '2rem' }}>
            <h2>New Division for Class {classData.className}</h2>
            <form onSubmit={handleAddDiv} style={{ marginTop: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Division Name</label>
                <input 
                  type="text" 
                  value={newDivName}
                  onChange={(e) => setNewDivName(e.target.value)}
                  placeholder="e.g. A or B"
                  className="premium-input"
                  style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setShowAddDiv(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Add Division</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ClassDetails;
