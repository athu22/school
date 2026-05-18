import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { updateStudent } from '../../services/studentService';
import DashboardLayout from '../../layouts/DashboardLayout';
import StudentForm from '../../components/students/StudentForm';
import { FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';

const EditStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const docRef = doc(db, 'students', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStudent({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Student record not found!");
          navigate('/admin/students');
        }
      } catch (error) {
        console.error("Error fetching student:", error);
        toast.error("Failed to load student record.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, navigate]);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      const studentData = { ...data };
      const photoFile = data.photoFile;
      
      await updateStudent(id, studentData, photoFile);
      toast.success("Student updated successfully!");
      navigate('/admin/students');
    } catch (error) {
      console.error(error);
      toast.error("Failed to update student. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate('/admin/students')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', color: 'var(--text-muted)', marginBottom: '1rem', cursor: 'pointer', border: 'none' }}
        >
          <FiArrowLeft /> Back to Students
        </button>
        <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}>Edit Student Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>Modify student details below. Fields are available in both English and Marathi.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="premium-card" style={{ padding: '2rem', textAlign: 'center' }}>Loading Student Details...</div>
        </div>
      ) : (
        <StudentForm initialData={student} onSubmit={handleSubmit} isLoading={saving} />
      )}
    </>
  );
};

export default EditStudent;
