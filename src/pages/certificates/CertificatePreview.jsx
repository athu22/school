import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { FiDownload, FiPrinter, FiArrowLeft } from 'react-icons/fi';
import LeavingCertificate from '../../components/certificates/LeavingCertificate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveCertificateHistory } from '../../services/certificateService';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';

const CertificatePreview = () => {
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [student, setStudent] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  const studentId = searchParams.get('studentId');
  const type = searchParams.get('type') || 'Leaving Certificate';
  const remarks = searchParams.get('remarks') || 'Good';
  const certNo = `CERT-${Date.now().toString().slice(-6)}`;

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId || !profile?.schoolId) return;

      const sSnap = await getDoc(doc(db, 'students', studentId));
      const schSnap = await getDoc(doc(db, 'schools', profile.schoolId));

      if (sSnap.exists()) setStudent(sSnap.data());
      if (schSnap.exists()) setSchool(schSnap.data());

      setLoading(false);
    };
    fetchData();
  }, [studentId, profile?.schoolId]);

  const handleDownload = async () => {
    const element = document.getElementById('certificate-content');
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${type}_${student?.fullName}.pdf`);

    // Save to History
    await saveCertificateHistory({
      certificateNumber: certNo,
      certificateType: type,
      studentId: studentId,
      studentName: student?.fullName,
      schoolId: profile.schoolId,
      remarks: remarks
    });

    toast.success("Certificate generated and history saved!");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <DashboardLayout><p>Loading Preview...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/admin/certificates')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', color: 'var(--text-muted)' }}>
          <FiArrowLeft /> Back
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button variant="secondary" onClick={handlePrint}><FiPrinter /> Print</Button>
          <Button onClick={handleDownload}><FiDownload /> Download PDF</Button>
        </div>
      </div>

      <div style={{ background: 'var(--background)', padding: '2rem', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        <LeavingCertificate
          student={student}
          school={school}
          certNo={certNo}
          remarks={remarks}
        />
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-content, #certificate-content * { visibility: visible; }
          #certificate-content { position: absolute; left: 0; top: 0; width: 210mm; height: 297mm; }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default CertificatePreview;
