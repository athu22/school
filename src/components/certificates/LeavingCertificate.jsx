import React from 'react';

const LeavingCertificate = ({ student, school, certNo, remarks }) => {
  return (
    <div id="certificate-content" style={{ 
      width: '210mm', 
      height: '297mm', 
      padding: '20mm', 
      background: '#fff', 
      margin: 'auto',
      position: 'relative',
      border: '10px double var(--primary)',
      fontFamily: '"Times New Roman", Times, serif',
      color: '#000'
    }}>
      {/* Decorative Border */}
      <div style={{ position: 'absolute', inset: '5mm', border: '2px solid var(--primary)', pointerEvents: 'none' }}></div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--primary)', textTransform: 'uppercase' }}>{school?.name || 'Your School Name'}</h1>
        <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>{school?.address || 'School Address Line, City, State'}</p>
        <div style={{ width: '100px', height: '100px', margin: '1rem auto', background: 'var(--primary)15', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          LOGO
        </div>
        <h2 style={{ textDecoration: 'underline', marginTop: '1rem' }}>SCHOOL LEAVING CERTIFICATE</h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <span>Sl. No: <strong>{certNo}</strong></span>
        <span>Admission No: <strong>{student?.admissionNumber}</strong></span>
      </div>

      <div style={{ lineHeight: '2.5', fontSize: '1.2rem' }}>
        <p>This is to certify that Master/Miss <strong>{student?.fullName}</strong></p>
        <p>Son/Daughter of Shri <strong>{student?.fatherName}</strong> and Smt <strong>{student?.motherName}</strong></p>
        <p>was a student of this school in <strong>Class {student?.class}</strong> Section <strong>{student?.section}</strong>.</p>
        <p>His/Her Date of Birth as per office records is <strong>{student?.dob}</strong>.</p>
        <p>He/She has paid all dues to the school and has left the school on <strong>{new Date().toLocaleDateString()}</strong>.</p>
        <p>His/Her Character and Conduct during the period has been <strong>{remarks}</strong>.</p>
      </div>

      <div style={{ marginTop: '5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #000', width: '150px', marginBottom: '0.5rem' }}></div>
          <p>Office Clerk</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #000', width: '150px', marginBottom: '0.5rem' }}></div>
          <p>Class Teacher</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #000', width: '150px', marginBottom: '0.5rem' }}></div>
          <p style={{ fontWeight: 'bold' }}>Principal</p>
        </div>
      </div>

      {/* Watermark */}
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%) rotate(-45deg)', 
        fontSize: '8rem', 
        opacity: 0.05, 
        fontWeight: 'bold', 
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}>
        {school?.name || 'SCHOOL'}
      </div>
    </div>
  );
};

export default LeavingCertificate;
