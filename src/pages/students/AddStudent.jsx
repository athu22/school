import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import StudentForm from '../../components/students/StudentForm';
import { addStudent } from '../../services/studentService';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';

const AddStudent = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const studentData = {
        ...data,
        schoolId: profile?.schoolId,
        photoFile: undefined // Handled by service
      };
      
      await addStudent(studentData, data.photoFile);
      toast.success("Student admission successful!");
      navigate('/admin/students');
    } catch (error) {
      console.error(error);
      toast.error("Failed to add student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}>New Student Admission</h1>
        <p style={{ color: 'var(--text-muted)' }}>Complete the form below to register a new student.</p>
      </div>

      <StudentForm onSubmit={handleSubmit} isLoading={loading} />
    </>
  );
};

export default AddStudent;
