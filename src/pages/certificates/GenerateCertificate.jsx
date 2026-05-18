import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import { locationTranslations } from '../../utils/locationTranslations';
import { marathiFormatter } from '../../utils/marathiFormatter';
import { useStudents } from '../../hooks/useStudents';
import useAuthStore from '../../store/authStore';
import { saveCertificateHistory } from '../../services/certificateService';
import ManagedDropdown from '../../components/ManagedDropdown';
import { Save, Download, FileText, Search, ChevronDown, Printer } from 'lucide-react';

const religionTranslations = {
  'Hindu': 'हिंदू', 'Muslim': 'मुस्लिम', 'Jain': 'जैन', 'Christians': 'ख्रिश्चन', 'Sikh': 'शीख', 'Budhist': 'बौद्ध',
  'Hindu- Maratha': 'हिंदू- मराठा', 'Hindu- Dhangar': 'हिंदू- धनगर', 'Hindu Tamboli': 'हिंदू तांबोळी',
  'Hindu Vanjari': 'हिंदू वंजारी', 'Nav Boudha': 'नव बौद्ध', 'Hindu- Mali': 'हिंदू- माळी',
  'Mahadev Koli': 'महादेव कोळी', 'Hindu Chambhar': 'हिंदू चांभार', 'Hindu Mahar': 'हिंदू महार'
};
const nationalityTranslations = { 'Indian': 'भारतीय', 'Other': 'इतर' };

/* ==========================================
   1. MAIN EDITOR CONTAINER
   ========================================== */
const GenerateCertificate = () => {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') || 'Bonafide';

  return (
    <CertificateEditor defaultType={typeParam} />
  );
};

const CertificateEditor = ({ defaultType = 'Bonafide' }) => {
  const { profile } = useAuthStore();
  const { students } = useStudents(profile?.schoolId);
  const { isMarathi } = useLanguage();
  
  const [schoolData, setSchoolData] = useState(null);

  // Initialize schoolData from cache if available
  useEffect(() => {
    const cached = window.localStorage.getItem('school');
    if (cached) {
      try {
        setSchoolData(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch school details from Firestore
  useEffect(() => {
    const fetchSchool = async () => {
      if (profile?.schoolId) {
        try {
          const snap = await getDoc(doc(db, 'schools', profile.schoolId));
          if (snap.exists()) {
            const data = snap.data();
            setSchoolData(data);
            window.localStorage.setItem('school', JSON.stringify(data));
          }
        } catch (e) {
          console.error("Failed to fetch school details from Firestore:", e);
        }
      }
    };
    fetchSchool();
  }, [profile?.schoolId]);

  const [formData, setFormData] = useState({
    school_name: 'National Public School',
    student_id: '',
    certificate_type: defaultType,
    certificate_language: isMarathi ? 'mr' : 'en',
    class: '',
    date: new Date().toISOString().split('T')[0],
    purpose: '',
    academic_year: '',
    admission_date: '',
    leaving_date: '',
    reason: isMarathi ? 'पालकाची बदली' : 'Transferred by Parents',
    conduct: isMarathi ? 'चांगली' : 'Good',
    design_style: 'Style 1',
    management_name: '',
    mother_tongue: isMarathi ? 'मराठी' : 'Marathi',
    prev_school_info: '',
    progress: isMarathi ? 'चांगली' : 'Good',
    studying_standard: '',
    studying_since: '',
    remark: '',
    from_village: '',
    to_village: isMarathi ? 'पिंपळनेर' : 'Pimpalner',
    aadhaar_no: '',
    apaar_id: '',
    pen_id: '',
    studying_since_words: '',
    studying_since_figures: ''
  });

  // Dynamically populate default school fields once schoolData is loaded
  useEffect(() => {
    if (schoolData) {
      setFormData(prev => ({
        ...prev,
        school_name: prev.school_name && prev.school_name !== 'National Public School' ? prev.school_name : (schoolData.name || 'National Public School'),
        management_name: prev.management_name ? prev.management_name : (schoolData.management_name || schoolData.institute_name || '')
      }));
    }
  }, [schoolData]);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState(false);
  const [loading, setLoading] = useState(false);

  const previewRef = useRef(null);
  const isSensitive = formData.certificate_type === 'LC' || formData.certificate_type === 'TC';

  // Sync certificate type when URL query parameter updates
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      certificate_type: defaultType
    }));
    // Re-lock sensitive documents when type changes
    setIsUnlocked(false);
    setPassword('');
    setPassError(false);
  }, [defaultType]);

  const getSelectedStudent = () => {
    if (!students) return null;
    return students.find(s => s.id === formData.student_id);
  };

  // Sync Student Data into Form Fields when selected
  useEffect(() => {
    if (formData.student_id && students) {
      const student = getSelectedStudent();
      if (student) {
        const translate = (val, mapping = locationTranslations) => {
          if (!isMarathi || !val) return val;
          return mapping[val] || val;
        };

        const sBirthPlace = student.birthPlace || student.birth_place || student.place_of_birth || '';
        const sTaluka = student.taluka || '';
        const sDistrict = student.district || '';
        const sReligion = student.religion || '';
        const sCaste = student.caste || '';
        const sSubCaste = student.subCaste || student.sub_caste || '';
        const sNationality = student.nationality || 'Indian';
        const sAadhaar = student.aadhaarNo || student.aadhaar_no || '';
        const sApaar = student.apaarId || student.apaar_id || '';
        const sPen = student.penId || student.pen_id || '';
        const sAdmissionDate = student.admissionDate || student.admission_date || '';

        setFormData(prev => ({
          ...prev,
          class: student.class || prev.class || '',
          admission_date: prev.admission_date || sAdmissionDate || '',
          dob_words: prev.dob_words || '',
          place_of_birth: translate(sBirthPlace),
          taluka: translate(sTaluka),
          district: translate(sDistrict),
          student_caste: (translate(sReligion, religionTranslations) || '') + (sCaste ? ` - ${sCaste}` : '') + (sSubCaste ? ` (${sSubCaste})` : ''),
          nationality: translate(sNationality, nationalityTranslations) || (isMarathi ? 'भारतीय' : 'Indian'),
          last_exam: student.last_exam || '',
          from_village: translate(student.cityVillage || student.address || ''),
          academic_year: prev.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          aadhaar_no: sAadhaar || '',
          apaar_id: sApaar || '',
          pen_id: sPen || '',
          mother_tongue: prev.mother_tongue || (isMarathi ? 'मराठी' : 'Marathi'),
          reason: prev.reason || (isMarathi ? 'पालकाची बदली' : 'Transferred by Parents'),
          conduct: prev.conduct || (isMarathi ? 'चांगली' : 'Good'),
          progress: prev.progress || (isMarathi ? 'चांगली' : 'Good')
        }));
      }
    }
  }, [formData.student_id, students, isMarathi]);

  const getRefCode = () => {
    const type = formData.certificate_type;
    if (type === 'Bonafide') return 'BON';
    if (type === 'LC') return 'LC';
    if (type === 'TC') return 'TC';
    if (type === 'Character') return 'CHAR';
    if (type === 'BusPass') return 'BP';
    return 'CERT';
  };

  const handleSave = async () => {
    if (!formData.student_id) return alert(isMarathi ? 'कृपया प्रथम विद्यार्थी निवडा.' : 'Select a student first.');
    const student = getSelectedStudent();
    try {
      setLoading(true);
      const refNo = formData.id_manual || `${getRefCode()}/${new Date().getFullYear()}/${student.admissionNumber || student.register_no || student.id}`;
      
      const certificateData = {
        schoolId: profile?.schoolId,
        studentId: formData.student_id,
        studentName: student.fullName || student.name || 'Unnamed Student',
        certificateNumber: refNo,
        certificateType: formData.certificate_type,
        date: formData.date,
        data: JSON.stringify(formData)
      };

      await saveCertificateHistory(certificateData);
      alert(isMarathi ? 'प्रमाणपत्र यशस्वीरित्या जतन झाले!' : 'Certificate generated and saved successfully!');
    } catch (err) {
      console.error('Error saving certificate', err);
      alert(isMarathi ? 'प्रमाणपत्र जतन करण्यात अडचण आली.' : 'Failed to save certificate records.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!formData.student_id || !previewRef.current) return alert('Select a student first.');
    const student = getSelectedStudent();
    setLoading(true);
    
    try {
      const originalElement = previewRef.current;
      const clone = originalElement.cloneNode(true);
      clone.style.transform = 'none';
      clone.style.position = 'fixed';
      clone.style.top = '-10000px';
      clone.style.left = '-10000px';
      clone.style.scale = '1';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        windowHeight: 1131
      });
      
      document.body.removeChild(clone);
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${formData.certificate_type}_${(student.fullName || student.name).replace(/\s+/g, '_')}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!formData.student_id || !previewRef.current) return alert('Select a student first.');
    const content = previewRef.current.outerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    document.body.appendChild(iframe);
    
    let styles = '';
    for (const node of [...document.querySelectorAll('style, link[rel="stylesheet"]')]) {
      styles += node.outerHTML;
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print Certificate</title>
          ${styles}
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; padding: 0; background: white; display: flex; justify-content: center; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    if (password === 'school@123') {
      setIsUnlocked(true);
      setPassError(false);
    } else {
      setPassError(true);
    }
  };

  if (isSensitive && !isUnlocked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', padding: '20px' }}>
        <div className="premium-card" style={{ maxWidth: '420px', width: '100%', textAlign: 'center', padding: '2.5rem', border: '1px solid var(--border)' }}>
          <div style={{ background: '#fef2f2', color: '#dc2626', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', boxShadow: '0 4px 10px rgba(220, 38, 38, 0.1)' }}>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 style={{ marginBottom: '0.75rem', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{isMarathi ? 'प्रवेश प्रतिबंधित' : 'Access Restricted'}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
             {isMarathi 
               ? 'दाखला (LC) किंवा टी.सी. हे अत्यंत संवेदनशील दस्तऐवज आहेत. पुढे जाण्यासाठी मास्टर पासवर्ड प्रविष्ट करा.'
               : 'Leaving Certificate (LC) & T.C. are highly sensitive documents. Please enter the master password to continue.'}
          </p>
          <form onSubmit={handleUnlock}>
            <div style={{ marginBottom: '1rem' }}>
                <input 
                  type="password" 
                  placeholder={isMarathi ? 'मास्टर पासवर्ड' : 'Enter Master Password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '1.1rem', padding: '12px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
                  autoFocus
                />
                {passError && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '6px', fontWeight: '600' }}>{isMarathi ? 'चुकीचा पासवर्ड. पुन्हा प्रयत्न करा.' : 'Incorrect password. Try again.'}</p>}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 'bold' }}>
              {isMarathi ? 'एडिटर अनलॉक करा' : 'Unlock Editor'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}>
          {isMarathi ? 'प्रमाणपत्र जनरेटर (लाईव्ह प्रिव्ह्यू)' : 'Certificate Generator (Live Preview)'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {isMarathi ? 'विद्यार्थी प्रमाणपत्रे तयार आणि प्रिंट करा.' : 'Generate, customize, and print official student certificates.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: '650px', alignItems: 'stretch' }}>
        
        {/* LEFT SIDE: FORM */}
        <div style={{ flex: '0 0 420px', display: 'flex', flexDirection: 'column' }}>
          <CertificateForm 
            formData={formData} 
            setFormData={setFormData}
            studentOptions={students || []}
            onSave={handleSave}
            onDownloadPdf={handleDownloadPdf}
            onPrint={handlePrint}
            loading={loading}
          />
        </div>

        {/* RIGHT SIDE: LIVE PREVIEW */}
        <div 
          style={{ 
            flex: 1, 
            backgroundColor: 'var(--background)', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            overflow: 'auto',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{ 
            width: '800px',
            height: '1131px',
            transform: 'scale(0.8)', 
            transformOrigin: 'top center',
            boxShadow: 'var(--shadow-xl)',
            backgroundColor: '#fff',
            flexShrink: 0,
            marginBottom: '200px'
          }}>
            <CertificatePreview 
              formData={formData} 
              student={getSelectedStudent()} 
              previewRef={previewRef}
              schoolData={schoolData}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

/* ==========================================
   2. CERTIFICATE SIDEBAR INPUT FORM
   ========================================== */
const CertificateForm = ({ formData, setFormData, studentOptions, onSave, onDownloadPdf, onPrint, loading }) => {
  const { isMarathi } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync search input with selected student name
  useEffect(() => {
    if (formData.student_id && studentOptions.length > 0) {
      const selected = studentOptions.find(s => s.id.toString() === formData.student_id.toString());
      if (selected && !searchTerm && !isOpen) {
        setSearchTerm(selected.fullName || selected.name || '');
      }
    }
  }, [formData.student_id, studentOptions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter students based on search query
  const filteredStudents = studentOptions.filter(s => {
    const sName = String(s.fullName || s.name || '').toLowerCase();
    const sRoll = String(s.rollNumber || s.roll_no || '');
    const sReg = String(s.admissionNumber || s.register_no || '');
    
    return sName.includes(searchTerm.toLowerCase()) ||
           sRoll.includes(searchTerm) ||
           sReg.includes(searchTerm);
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const isBonafide = formData.certificate_type === 'Bonafide' || formData.certificate_type === 'Character';

  return (
    <div className="premium-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem', background: 'var(--surface)' }}>
      <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px', fontSize: '1.1rem', fontWeight: '700' }}>
        <FileText size={20} color="var(--primary)" />
        {isMarathi ? (
          formData.certificate_type === 'LC' ? 'दाखला (L.C.) तपशील' : 
          formData.certificate_type === 'TC' ? 'बदलीचा दाखला (T.C.) तपशील' : 
          `${formData.certificate_type} तपशील`
        ) : (
          `${formData.certificate_type} Details`
        )}
      </h3>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
        
        {/* Certificate Type Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '750', color: 'var(--primary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {isMarathi ? 'प्रमाणपत्र प्रकार निवडा' : 'Select Certificate Type'}
          </label>
          <select 
            name="certificate_type" 
            value={formData.certificate_type || 'Bonafide'} 
            onChange={(e) => {
              setFormData(prev => ({
                ...prev,
                certificate_type: e.target.value
              }));
            }} 
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid var(--primary)', background: 'var(--background)', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            <option value="Bonafide">{isMarathi ? 'बोनाफाईड प्रमाणपत्र (Bonafide)' : 'Bonafide Certificate'}</option>
            <option value="LC">{isMarathi ? 'शाळा सोडल्याचा दाखला (L.C.)' : 'Leaving Certificate (L.C.)'}</option>
            <option value="TC">{isMarathi ? 'बदलीचा दाखला (T.C.)' : 'Transfer Certificate (T.C.)'}</option>
            <option value="Nirgam">{isMarathi ? 'निर्गम उतारा (General Register Extract)' : 'General Register (Nirgam) Extract'}</option>
            <option value="Character">{isMarathi ? 'चारित्र्य प्रमाणपत्र (Character)' : 'Character Certificate'}</option>
            <option value="BusPass">{isMarathi ? 'बस पास सवलत पत्र (Bus Pass)' : 'Bus Pass Concession'}</option>
          </select>
        </div>
        
        {/* Style & Management settings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>{isMarathi ? 'डिझाइन स्टाईल' : 'Design Style'}</label>
            <select name="design_style" value={formData.design_style} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '0.8rem' }}>
              <option value="Style 1">{isMarathi ? 'स्टाईल १: प्रोफेशनल' : 'Style 1: Professional'}</option>
              <option value="Style 2">{isMarathi ? 'स्टाईल २: मॉडर्न' : 'Style 2: Modern'}</option>
              <option value="Style 3">{isMarathi ? 'स्टाईल ३: इलेगंट' : 'Style 3: Elegant'}</option>
              <option value="Style 4">{isMarathi ? 'स्टाईल ४: क्लासिक' : 'Style 4: Classic'}</option>
              <option value="Style 5">{isMarathi ? 'स्टाईल ५: प्रीमियम' : 'Style 5: Premium'}</option>
              <option value="Style 6">{isMarathi ? 'स्टाईल ६: ट्रॅडिशनल पिंक' : 'Style 6: Traditional Pink'}</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>{isMarathi ? 'संचलित (संस्था)' : 'Management Name'}</label>
            <input
              type="text"
              name="management_name"
              value={formData.management_name || ''}
              onChange={handleChange}
              placeholder="e.g. Sanchalit Name"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>{isMarathi ? 'शाळेचे नाव' : 'School Name'}</label>
            <input
              type="text"
              name="school_name"
              value={formData.school_name || ''}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '0.8rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>{isMarathi ? 'जावक क्रमांक (Cert ID)' : 'Certificate ID'}</label>
            <input
              type="text"
              name="id_manual"
              value={formData.id_manual || ''}
              onChange={handleChange}
              placeholder="e.g. 340"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>{isMarathi ? 'प्रमाणपत्र भाषा' : 'Language'}</label>
            <select name="certificate_language" value={formData.certificate_language || (isMarathi ? 'mr' : 'en')} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '0.8rem' }}>
              <option value="en">English (इंग्रजी)</option>
              <option value="mr">Marathi (मराठी)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Search & Select Student Dropdown */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>{isMarathi ? 'विद्यार्थी निवडा' : 'Select Student'}</label>
          <div style={{ position: 'relative' }}>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0 10px',
                backgroundColor: 'var(--background)',
                cursor: 'text'
              }}
              onClick={() => setIsOpen(true)}
            >
              <Search size={14} color="var(--text-muted)" style={{ marginRight: '6px' }} />
              <input
                type="text"
                placeholder={isMarathi ? 'शोधा...' : 'Search pupil name...'}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  padding: '8px 0',
                  fontSize: '0.8rem',
                  background: 'transparent',
                  color: 'var(--text-main)'
                }}
              />
              <ChevronDown size={14} color="var(--text-muted)" style={{ marginLeft: '6px', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} />
            </div>

            {isOpen && (
              <div 
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  marginTop: '4px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(s => {
                    const sName = s.fullName || s.name || 'Unnamed';
                    const sRoll = s.rollNumber || s.roll_no || '-';
                    const sClass = s.class || '-';
                    const sReg = s.admissionNumber || s.register_no || '-';
                    
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setFormData({ ...formData, student_id: s.id.toString() });
                          setSearchTerm(sName);
                          setIsOpen(false);
                        }}
                        style={{
                          padding: '8px 10px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: formData.student_id === s.id.toString() ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                          fontSize: '0.8rem'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--background)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = formData.student_id === s.id.toString() ? 'rgba(99, 102, 241, 0.08)' : 'transparent'}
                      >
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{sName}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Roll: {sRoll} | Class: {sClass} | GR: {sReg}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {isMarathi ? 'विद्यार्थी सापडले नाहीत' : 'No students found'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <ManagedDropdown
              label={isMarathi ? 'विद्यार्थ्याची इयत्ता' : 'Student Class'}
              name="class"
              value={formData.class}
              onChange={handleChange}
              tableName="classes"
              placeholder={isMarathi ? 'उदा. १०वी अ' : "e.g. 10th A"}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>{isMarathi ? 'दिनांक (Issue Date)' : 'Date of Issue'}</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* ==========================================
           3. SPECIFIC DETAILS ACCORDING TO TYPE
           ========================================== */}
        <div style={{ margin: '12px 0', padding: '12px', backgroundColor: 'rgba(99, 102, 241, 0.04)', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>
            {isBonafide 
              ? (isMarathi ? 'बोनाफाईड / चारित्र्य माहिती' : 'Bonafide / Character Specific Details') 
              : formData.certificate_type === 'BusPass'
                ? (isMarathi ? 'बस पास सवलत पत्र माहिती' : 'Bus Pass Specific Details')
                : (isMarathi ? 'एल.सी. / टी.सी. माहिती' : 'LC / TC Specific Details')}
          </h4>

          {isBonafide ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>{isMarathi ? 'शैक्षणिक वर्ष' : 'Academic Year'}</label>
                  <input
                    type="text"
                    name="academic_year"
                    value={formData.academic_year || ''}
                    onChange={handleChange}
                    placeholder="e.g. 2026-2027"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>{isMarathi ? 'जन्मतारीख अक्षरी' : 'DOB in Words'}</label>
                  <input
                    type="text"
                    name="dob_words"
                    value={formData.dob_words || ''}
                    onChange={handleChange}
                    placeholder="e.g. First January"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Place of Birth</label>
                  <input
                    type="text"
                    name="place_of_birth"
                    value={formData.place_of_birth || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Taluka</label>
                  <input
                    type="text"
                    name="taluka"
                    value={formData.taluka || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>District</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>Caste of Student</label>
                  <input
                    type="text"
                    name="student_caste"
                    value={formData.student_caste || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>{isMarathi ? 'शेवटची परीक्षा' : 'Last Exam'}</label>
                  <input
                    type="text"
                    name="last_exam"
                    value={formData.last_exam || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>{isMarathi ? 'देण्याचा हेतू' : 'Purpose'}</label>
                  <input
                    type="text"
                    name="purpose"
                    value={formData.purpose || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                  />
                </div>
              </div>
            </>
          ) : formData.certificate_type === 'BusPass' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>From (गांव)</label>
                  <input
                    type="text"
                    name="from_village"
                    value={formData.from_village || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>To (येण्याकरिता)</label>
                  <input
                    type="text"
                    name="to_village"
                    value={formData.to_village || 'Pimpalner'}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>{isMarathi ? 'शैक्षणिक वर्ष' : 'Academic Year'}</label>
                <input
                  type="text"
                  name="academic_year"
                  value={formData.academic_year || ''}
                  onChange={handleChange}
                  placeholder="e.g. 2026-2027"
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                />
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>{isMarathi ? 'प्रवेश दिनांक' : 'Admission Date'}</label>
                  <input
                    type="date"
                    name="admission_date"
                    value={formData.admission_date}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                  />
                </div>
                <div>
                   <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>{isMarathi ? 'आधार क्रमांक' : 'Aadhaar'}</label>
                   <input
                     type="text"
                     name="aadhaar_no"
                     value={formData.aadhaar_no || ''}
                     onChange={handleChange}
                     maxLength={12}
                     style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                   />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                   <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>APAAR ID</label>
                   <input
                     type="text"
                     name="apaar_id"
                     value={formData.apaar_id || ''}
                     onChange={handleChange}
                     style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                   />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>PEN ID</label>
                  <input
                    type="text"
                    name="pen_id"
                    value={formData.pen_id || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600' }}>{isMarathi ? 'सोडल्याचा दिनांक' : 'Leaving Date'}</label>
                  <input
                    type="date"
                    name="leaving_date"
                    value={formData.leaving_date}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.75rem' }}
                  />
                </div>
                <div>
                  <ManagedDropdown
                    label={isMarathi ? 'सोडण्याचे कारण' : 'Reason'}
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    tableName="reasons_leaving"
                    placeholder="e.g. Higher Education"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <ManagedDropdown
                    label={isMarathi ? 'वर्तणूक' : 'Conduct'}
                    name="conduct"
                    value={formData.conduct}
                    onChange={handleChange}
                    tableName="conducts"
                    placeholder="e.g. Good"
                  />
                </div>
                <div>
                  <ManagedDropdown
                    label={isMarathi ? 'मातृभाषा' : 'Mother Tongue'}
                    name="mother_tongue"
                    value={formData.mother_tongue || ''}
                    onChange={handleChange}
                    tableName="languages"
                    placeholder="e.g. Marathi"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <ManagedDropdown
                  label={isMarathi ? 'यापूर्वीची शाळा व इयत्ता' : 'Previous School & Std'}
                  name="prev_school_info"
                  value={formData.prev_school_info || ''}
                  onChange={handleChange}
                  tableName="previous_schools"
                  placeholder="e.g. Z.P. School"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <ManagedDropdown
                    label={isMarathi ? 'सोडतेवेळची इयत्ता' : 'Leaving Std'}
                    name="studying_standard"
                    value={formData.studying_standard || ''}
                    onChange={handleChange}
                    tableName="classes"
                    placeholder="e.g. 10th"
                  />
                </div>
                <div>
                  <ManagedDropdown
                    label={isMarathi ? 'कधीपासून शिकत होता' : 'Studying since'}
                    name="studying_since"
                    value={formData.studying_since || ''}
                    onChange={handleChange}
                    tableName="studying_since_dates"
                    placeholder="e.g. 15 June 2016"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <ManagedDropdown
                    label={isMarathi ? 'अक्षरी (Words)' : 'In Words'}
                    name="studying_since_words"
                    value={formData.studying_since_words || ''}
                    onChange={handleChange}
                    tableName="studying_since_words"
                    placeholder="e.g. Two Thousand"
                  />
                </div>
                <div>
                  <ManagedDropdown
                    label={isMarathi ? 'अंकी (Figures)' : 'In Figures'}
                    name="studying_since_figures"
                    value={formData.studying_since_figures || ''}
                    onChange={handleChange}
                    tableName="studying_since_figures"
                    placeholder="e.g. 2016"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <ManagedDropdown
                    label={isMarathi ? 'प्रगती' : 'Progress'}
                    name="progress"
                    value={formData.progress}
                    onChange={handleChange}
                    tableName="progress_remarks"
                    placeholder="e.g. Good"
                  />
                </div>
                <div>
                  <ManagedDropdown
                    label={isMarathi ? 'शेरा (Remark)' : 'Remark'}
                    name="remark"
                    value={formData.remark || ''}
                    onChange={handleChange}
                    tableName="certificate_remarks"
                    placeholder="Enter Remark"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Buttons bar */}
      <div style={{ marginTop: '15px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '10px' }}
          onClick={onSave}
          disabled={!formData.student_id || loading}
        >
          {loading ? (isMarathi ? 'जतन...' : 'Saving...') : (isMarathi ? 'जतन करा' : 'Save')}
        </button>
        <button
          className="btn btn-outline"
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '10px', color: 'var(--text-main)', borderColor: 'var(--border)' }}
          onClick={onPrint}
          disabled={!formData.student_id || loading}
        >
          <Printer size={14} style={{ marginRight: '4px' }} /> {isMarathi ? 'प्रिंट' : 'Print'}
        </button>
        <button
          className="btn btn-outline"
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '10px', color: 'var(--text-main)', borderColor: 'var(--border)' }}
          onClick={onDownloadPdf}
          disabled={!formData.student_id || loading}
        >
          <Download size={14} style={{ marginRight: '4px' }} /> PDF
        </button>
      </div>
    </div>
  );
};

/* ==========================================
   4. LIVE A4 CERTIFICATE RENDERER
   ========================================== */
const CertificatePreview = ({ formData, student, previewRef, schoolData: passedSchoolData }) => {
  const type = formData.certificate_type || 'Bonafide';
  const design = formData.design_style || 'Style 1';
  const isMarathi = formData.certificate_language === 'mr';

  const isBonafide = type === 'Bonafide';
  const isLC = type === 'LC';
  const isTC = type === 'TC' || type === 'Transfer';
  const isNirgam = type === 'Nirgam';
  const isCharacter = type === 'Character';
  const isBusPass = type === 'BusPass';

  const isStyle1 = design === 'Style 1';
  const isStyle2 = design === 'Style 2';
  const isStyle3 = design === 'Style 3';
  const isStyle4 = design.includes('Style 4');
  const isStyle5 = design.includes('Style 5');
  const isStyle6 = design.includes('Style 6');

  const getTheme = () => {
    if (isBonafide) return { primary: '#1e3a8a', secondary: '#3b82f6', bg: '#eff6ff' };
    if (isLC) return { primary: '#991b1b', secondary: '#ef4444', bg: '#fef2f2' };
    if (isTC) return { primary: '#166534', secondary: '#22c55e', bg: '#f0fdf4' };
    if (isNirgam) return { primary: '#334155', secondary: '#64748b', bg: '#f8fafc' };
    if (isCharacter) return { primary: '#854d0e', secondary: '#eab308', bg: '#fefce8' };
    if (isStyle6) return { primary: '#d92055', secondary: '#f72585', bg: '#fff1f2' };
    if (isBusPass) return { primary: '#0369a1', secondary: '#0ea5e9', bg: '#f0f9ff' };
    return { primary: '#1e3a8a', secondary: '#3b82f6', bg: '#eff6ff' };
  };

  const theme = getTheme();

  const translateVal = (val, mapping) => {
    if (!isMarathi || !val) return val;
    return mapping[val] || locationTranslations[val] || val;
  };

  const getTitle = () => {
    if (isBonafide) return isMarathi ? 'बोनाफाईड प्रमाणपत्र' : 'BONAFIDE CERTIFICATE';
    if (isLC) return isMarathi ? 'शाळा सोडल्याचे प्रमाणपत्र' : 'SCHOOL LEAVING CERTIFICATE';
    if (isTC) return isMarathi ? 'बदलीचे प्रमाणपत्र' : 'TRANSFER CERTIFICATE (T.C.)';
    if (isNirgam) return isMarathi ? 'निर्गम उतारा' : 'GENERAL REGISTER (NIRGAM) EXTRACT';
    if (isCharacter) return isMarathi ? 'चारित्र्य प्रमाणपत्र' : 'CHARACTER CERTIFICATE';
    if (isBusPass) return isMarathi ? 'बस पास सवलत पत्र' : 'BUS PASS CONCESSION LETTER';
    return type.toUpperCase();
  };

  const getRefCode = () => {
    if (isBonafide) return 'BON';
    if (isLC) return 'LC';
    if (isTC) return 'TC';
    if (isNirgam) return 'GR';
    if (isCharacter) return 'CHAR';
    if (isBusPass) return 'BP';
    return 'CERT';
  };

  // Safe normalize student details mapping both camelCase and snake_case properties
  const st = student || {
    id: 0,
    fullName: '[STUDENT NAME]',
    name: '[STUDENT NAME]',
    rollNumber: '[ROLL NO]',
    roll_no: '[ROLL NO]',
    class: '[CLASS]',
    dob: '2000-01-01',
    address: '[STUDENT ADDRESS]',
    admissionDate: '2020-01-01',
    admission_date: '2020-01-01',
    admissionNumber: '[REG NO]',
    register_no: '[REG NO]'
  };

  const sName = st.fullName || st.name || '';
  const sReg = st.admissionNumber || st.register_no || '';
  const sRoll = st.rollNumber || st.roll_no || '';
  const sMother = st.motherName || st.mother_name || '';
  const sBirthPlace = st.birthPlace || st.birth_place || st.place_of_birth || '';
  const sTaluka = st.taluka || '';
  const sDistrict = st.district || '';
  const sReligion = st.religion || '';
  const sCaste = st.caste || '';
  const sSubCaste = st.subCaste || st.sub_caste || '';
  const sNationality = st.nationality || 'Indian';
  const sAadhaar = st.aadhaarNo || st.aadhaar_no || '';
  const sApaar = st.apaarId || st.apaar_id || '';
  const sPen = st.penId || st.pen_id || '';
  const sDob = st.dob || '';

  const previewStyle = {
    fontFamily: isStyle2 ? 'Arial, sans-serif' : (isStyle3 ? 'Georgia, serif' : 'serif'),
    width: '210mm',
    height: '297mm',
    backgroundColor: '#fff',
    color: '#000',
    padding: isStyle6 ? '5mm 20mm 15mm 15mm' : '20mm',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
    border: isStyle5 ? `8px solid ${theme.primary}` : (isStyle6 ? `4px double ${theme.primary}` : 'none'),
    margin: '0 auto',
    boxShadow: '0 0 20px rgba(0,0,0,0.1)'
  };

  const borderOuter = {
    position: 'absolute',
    top: '5mm',
    left: '5mm',
    right: '5mm',
    bottom: '5mm',
    border: isStyle2 ? `1.5pt solid ${theme.primary}` : (isStyle4 ? `4pt double ${theme.primary}` : (isStyle6 ? `1.5pt solid ${theme.primary}` : `3pt double ${theme.primary}`)),
    pointerEvents: 'none',
    display: (isStyle5 || isStyle6) ? 'none' : 'block'
  };

  const borderInner = {
    position: 'absolute',
    top: '30px',
    left: '30px',
    right: '30px',
    bottom: '30px',
    border: isStyle3 ? `1px dashed ${theme.primary}` : (isStyle6 ? `1px solid ${theme.primary}` : `1px solid ${theme.secondary}`),
    pointerEvents: 'none',
    opacity: isStyle6 ? 1 : 0.5,
    display: (isStyle2 || isStyle5 || isStyle6) ? 'none' : 'block'
  };

  const headerStyle = {
    textAlign: isStyle2 ? 'left' : 'center',
    marginBottom: '40px',
    borderBottom: isStyle2 ? `4px solid ${theme.primary}` : `2px solid ${theme.primary}`,
    paddingBottom: '20px',
    display: 'flex',
    flexDirection: isStyle2 ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: isStyle2 ? 'space-between' : 'center',
    gap: '20px'
  };

  const schoolData = passedSchoolData || (window.localStorage.getItem('school')
    ? JSON.parse(window.localStorage.getItem('school'))
    : {});

  const board = schoolData.board || 'AFFILIATED TO STATE EDUCATION BOARD';
  const address = schoolData.address || 'SCHOOL ADDRESS NOT SET';
  const logo = schoolData.logo || null;
  const managementFallback = schoolData.institute_name || 'Vidhayak Samiti Pimpalner Sanchalit';

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .certificate-print-container {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: always;
            overflow: visible !important;
          }
          .certificate-print-container * {
             print-color-adjust: exact;
             -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
      <div
        ref={previewRef}
        style={previewStyle}
        className="certificate-print-container"
      >
      <div style={borderOuter} />
      <div style={borderInner} />

      {/* Central Logo Watermark */}
      {logo && (
        <div style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.08,
          pointerEvents: 'none',
          zIndex: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%'
        }}>
          <img
            src={logo}
            alt="Watermark"
            style={{
              width: isStyle5 ? '500px' : '400px',
              height: isStyle5 ? '500px' : '400px',
              objectFit: 'contain',
              filter: 'grayscale(100%)'
            }}
          />
        </div>
      )}

      {/* Fallback Text Watermark */}
      {!logo && (isStyle1 || isStyle3 || isStyle5) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-45deg)',
          fontSize: isStyle5 ? '160px' : '120px',
          fontWeight: '900',
          color: theme.primary,
          opacity: 0.05,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 0
        }}>
          {isStyle5 ? 'PREMIUM' : 'OFFICIAL SEAL'}
        </div>
      )}

      {/* Header Section */}
      <div style={{ ...headerStyle, borderBottom: isStyle6 ? 'none' : headerStyle.borderBottom, marginBottom: isStyle6 ? '2px' : headerStyle.marginBottom }}>
        {isStyle2 ? (
          <>
            <div>
              <h2 style={{ fontSize: '32px', margin: 0, fontWeight: 'bold', color: theme.primary }}>
                {formData.school_name || schoolData.name || 'NATIONAL PUBLIC SCHOOL'}
              </h2>
              <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>{board} | {address}</p>
            </div>
            {logo && <img src={logo} alt="Logo" style={{ height: '80px' }} />}
          </>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '5px', width: '100%' }}>
              {isStyle6 ? (
                <div style={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  
                  {/* Logo top-left corner */}
                  <div style={{ position: 'absolute', left: '-20px', top: '-12px', zIndex: 2 }}>
                    {logo ? (
                      <img src={logo} alt="Logo" style={{ height: '165px', width: '165px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '100px', height: '100px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>LOGO</div>
                    )}
                  </div>

                  {/* Management Name on top */}
                  <div style={{ textAlign: 'center', marginBottom: '2px', width: '100%', paddingLeft: '150px' }}>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
                      {formData.management_name || schoolData.management_name || managementFallback}
                    </p>
                  </div>

                  {/* Main Header with School Name */}
                  <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '110px' }}>
                    <div style={{ textAlign: 'center', flex: 1, padding: '0 20px 0 170px' }}>
                      <h1 style={{ fontSize: '26px', margin: '0', fontWeight: '800', color: '#ff0000', lineHeight: '1.2', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                        {formData.school_name || schoolData.name || 'राष्ट्रीय पब्लिक स्कूल विद्यालय, पिंपळनेर'}
                      </h1>
                      <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#000' }}>
                        ता. {translateVal(schoolData.taluka, locationTranslations) || 'साक्री'} जि. {translateVal(schoolData.district, locationTranslations) || 'धुळे'} - {schoolData.pincode || '424306'} यु-डायस क्र. : {schoolData.udise_code || '27020218709'}
                      </p>
                    </div>
                  </div>

                  <div style={{ borderTop: '1.5px solid #000', width: '100%', margin: '5px 0' }} />

                  {/* Two-column Info Grid with Vertical Separator */}
                  <div style={{ display: 'flex', width: '100%', gap: '0', fontSize: '14px', borderBottom: '1.5px solid #000', paddingBottom: '5px', marginBottom: '3px' }}>
                    <div style={{ flex: 1.1, paddingRight: '15px', display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                      <div style={{ display: 'flex' }}><span style={{ minWidth: '115px', fontWeight: 'bold' }}>{isMarathi ? 'फोन नं. :' : 'Phone No. :'}</span> <span>{schoolData.phone || '02561-223059'}</span></div>
                      <div style={{ display: 'flex' }}><span style={{ minWidth: '115px', fontWeight: 'bold' }}>{isMarathi ? 'शाळा मान्यता क्र. :' : 'Reg. Code :'}</span> <span style={{ fontSize: '12.5px', whiteSpace: 'nowrap' }}>{schoolData.registration_code || '-'}</span></div>
                      <div style={{ display: 'flex' }}><span style={{ minWidth: '115px', fontWeight: 'bold' }}>{isMarathi ? 'माध्यम :' : 'Medium :'}</span> <span>{translateVal(schoolData.medium, locationTranslations) || 'मराठी'}</span></div>
                    </div>

                    <div style={{ width: '1.5px', backgroundColor: '#000', alignSelf: 'stretch', margin: '0 5px' }} />

                    <div style={{ flex: 1.2, paddingLeft: '15px', display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                      <div style={{ display: 'flex' }}><span style={{ minWidth: '85px', fontWeight: 'bold' }}>{isMarathi ? 'ई मेल :' : 'Email :'}</span> <span style={{ fontSize: '13px' }}>{schoolData.email || 'nsppatilpimpalner@gmail.com'}</span></div>
                      <div style={{ display: 'flex' }}><span style={{ minWidth: '85px', fontWeight: 'bold' }}>{isMarathi ? 'बोर्ड :' : 'Board :'}</span> <span>{isMarathi ? 'नाशिक' : (schoolData.board || 'Nashik')}</span></div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <div style={{ display: 'flex', gap: '5px' }}><span style={{ minWidth: '85px', fontWeight: 'bold' }}>{isMarathi ? 'इंडेक्स नं. :' : 'Index No. :'}</span> <span>{schoolData.hsc_index || 'J.14.02.008'} (HSC)</span></div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <div style={{ display: 'flex', gap: '5px' }}><span style={{ minWidth: '85px', fontWeight: 'bold' }}>{isMarathi ? 'इंडेक्स नं. :' : 'Index No. :'}</span> <span>{schoolData.ssc_index || 'S.14.02.002'} (SSC)</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Banner Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
                    {isLC && (
                      <div style={{
                        background: theme.primary,
                        color: 'white',
                        padding: '2px 60px',
                        fontSize: '22px',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        ✱ शाळा सोडल्याचे प्रमाणपत्र ✱
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      width: '100%',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #000',
                      paddingBottom: '5px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '16px', color: theme.primary, fontWeight: 'bold' }}>{isMarathi ? 'अ. क्र.' : 'Sr. No.'}</span>
                        <span style={{ fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold', fontFamily: 'serif', padding: '0 5px' }}>{formData.id_manual || '900'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '15px', color: '#000', fontWeight: 'bold' }}>{isMarathi ? 'जनरल रजि. क्र.' : 'General Reg. No.'}</span>
                        <div style={{ border: '1px solid #000', minWidth: '110px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '16px', color: '#000', fontWeight: 'bold' }}>{sReg}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {logo && <img src={logo} alt="Logo" style={{ height: isStyle5 ? '110px' : '90px' }} />}
                  <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: isStyle5 ? '44px' : '38px', margin: 0, fontWeight: 'bold', color: theme.primary, letterSpacing: isStyle3 ? '2px' : 'normal', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                      {formData.school_name || schoolData.name || 'NATIONAL PUBLIC SCHOOL'}
                    </h2>
                    <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: 'bold', color: '#666' }}>{board}</p>
                  </div>
                </>
              )}
            </div>
            {!isStyle6 && <p style={{ margin: 0, fontSize: '14px', color: '#444' }}>{address}</p>}
          </div>
        )}
      </div>

      {isStyle6 && !isLC && (
        <div style={{
          borderBottom: `2px solid ${theme.primary}`,
          borderTop: `2px solid ${theme.primary}`,
          padding: '4px 0',
          marginBottom: '15px',
          color: theme.primary,
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          width: '100%'
        }}>
          {isMarathi ? '(बोनाफाईड / उत्तीर्ण / चारित्र्य / प्रथम प्रयत्न)' : '(Bonafide / Passing / Character / First Attempt)'}
        </div>
      )}

      {/* Ref and Certificate Ribbon Section */}
      {!isStyle6 && (
        <>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            padding: '6px 10px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: isStyle2 ? theme.primary : '#000',
            position: 'relative'
          }}>
            <div style={{ flex: 1, textAlign: 'left' }}>
              जावक क्र: {formData.id_manual || `${getRefCode()}/${new Date().getFullYear()}/${sReg || st.id}`}
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              {isMarathi ? 'दिनांक' : 'Date'}: {formData.date?.split('-').reverse().join('-')}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: isStyle5 ? '60px' : '40px' }}>
            <div style={{
              display: 'inline-block',
              padding: '10px 40px',
              border: isStyle2 ? `none` : `2px solid ${theme.primary}`,
              borderBottom: isStyle2 ? `4px solid ${theme.primary}` : `2px solid ${theme.primary}`,
              backgroundColor: isStyle2 ? 'transparent' : theme.bg,
              color: theme.primary,
              fontSize: isStyle5 ? '32px' : '24px',
              fontWeight: 'bold',
              borderRadius: isStyle2 ? '0' : '4px',
              textTransform: 'uppercase'
            }}>
              {getTitle()}
            </div>
          </div>
        </>
      )}

      {/* Content Section */}
      <div style={{
        fontSize: isStyle6 ? '19px' : (isStyle5 ? '21px' : (isStyle4 ? '18px' : '19px')),
        lineHeight: isStyle6 ? '1.6' : '2',
        zIndex: 1,
        position: 'relative',
        padding: isStyle5 ? '0 40px' : '0',
        color: isStyle6 ? theme.primary : '#000'
      }}>

        {(isBonafide || isCharacter) ? (
          <div style={{
            textAlign: isStyle6 ? 'left' : (isStyle2 ? 'left' : 'justify'),
            padding: isStyle6 ? '0 10px' : '0 20px',
            marginTop: isStyle6 ? '20px' : '0'
          }}>
            {isStyle6 ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {isMarathi ? (
                  <>
                    <p style={{ margin: 0, lineHeight: '1.5' }}>
                      दाखला देण्यात येतो की, विद्यार्थी / विद्यार्थिनी <span style={{ borderBottom: '1pt dashed #444', color: '#000', display: 'inline-block', minWidth: '400px', padding: '0 10px', fontWeight: 'bold', wordBreak: 'break-word', verticalAlign: 'bottom' }}>{sName}</span>
                    </p>
                    <p style={{ margin: 0 }}>
                      आमच्या शाळेचा / महाविद्यालयाचा बोनाफाईड विद्यार्थी असून,
                    </p>
                    <p style={{ margin: 0 }}>
                      इयत्ता <span style={{ borderBottom: '1pt dashed #444', color: '#000', padding: '0 10px', minWidth: '200px', display: 'inline-block', fontWeight: 'bold' }}>{formData.class || st.class}</span> मध्ये सन २०<span style={{ borderBottom: '1pt dashed #444', color: '#000', padding: '0 5px', minWidth: '35px', display: 'inline-block', textAlign: 'center' }}>{isMarathi ? marathiFormatter.toMarathiNumber(formData.academic_year?.split('-')[0]?.trim()?.slice(-2) || '26') : (formData.academic_year?.split('-')[0]?.trim()?.slice(-2) || '26')}</span> -२०<span style={{ borderBottom: '1pt dashed #444', color: '#000', padding: '0 5px', minWidth: '35px', display: 'inline-block', textAlign: 'center' }}>{isMarathi ? marathiFormatter.toMarathiNumber(formData.academic_year?.split('-')[1]?.trim()?.slice(-2) || '27') : (formData.academic_year?.split('-')[1]?.trim()?.slice(-2) || '27')}</span>
                    </p>
                    <p style={{ margin: 0 }}>
                      या शैक्षणिक वर्षात शिकत आहे / होता.
                    </p>
                    <p style={{ margin: 0 }}>
                      त्याची / तिची जनरल रजिस्टर प्रमाणे जन्म तारीख <span style={{ borderBottom: '1pt dashed #444', color: '#000', padding: '0 10px', minWidth: '130px', display: 'inline-block', textAlign: 'center', fontWeight: 'bold' }}>{isMarathi ? marathiFormatter.formatDate(sDob) : sDob?.split('-').reverse().join('-')}</span> असून,
                    </p>
                    <p style={{ margin: 0, fontSize: '15px' }}>
                      जन्म तारीख अक्षरी : <span style={{ borderBottom: '1pt dashed #444', color: '#000', padding: '0 10px', width: '70%', display: 'inline-block', minHeight: '22px' }}>{marathiFormatter.toDateInMarathiWords(sDob) || formData.dob_words || '[जन्मतारीख अक्षरी]'}</span>
                    </p>
                    <p style={{ margin: 0 }}>
                      जन्मस्थळ <span style={{ borderBottom: '1pt dashed #444', color: '#000', padding: '0 10px', minWidth: '180px', display: 'inline-block' }}>{sBirthPlace || '-'}</span> तालुका <span style={{ borderBottom: '1pt dashed #444', color: '#000', padding: '0 10px', minWidth: '150px', display: 'inline-block' }}>{sTaluka || '-'}</span>
                    </p>
                    <p style={{ margin: 0 }}>
                      जिल्हा <span style={{ borderBottom: '1pt dashed #444', color: '#000', padding: '0 10px', minWidth: '180px', display: 'inline-block' }}>{sDistrict || '-'}</span> असून विद्यार्थ्याची जात
                    </p>
                    <p style={{ margin: 0 }}>
                      <span style={{ borderBottom: '1pt dashed #444', color: '#000', padding: '0 10px', minWidth: '300px', display: 'inline-block', fontWeight: 'bold' }}>{formData.student_caste || st.caste || '-'}</span> ही आहे.
                    </p>
                    <p style={{ margin: 0 }}>
                      तो / ती आमच्या विद्यालयातून <span style={{ borderBottom: '1pt dashed #444', color: '#000', padding: '0 10px', minWidth: '150px', display: 'inline-block' }}>{formData.last_exam || st.last_exam || '-'}</span> ची परीक्षा
                    </p>
                    <p style={{ margin: 0 }}>
                      फेब्रुवारी / मार्च / एप्रिल २०<span style={{ borderBottom: '1pt dashed #444', color: '#000', padding: '0 5px', minWidth: '35px', display: 'inline-block', textAlign: 'center' }}>{isMarathi ? marathiFormatter.toMarathiNumber(formData.date?.split('-')[0]?.slice(-2) || new Date().getFullYear().toString().slice(-2)) : (formData.date?.split('-')[0]?.slice(-2) || new Date().getFullYear().toString().slice(-2))}</span> मध्ये उत्तीर्ण झाला / झाली आहे.
                    </p>
                    <p style={{ margin: 0 }}>
                      त्याची / तिची वर्तणूक चांगली आहे.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, lineHeight: '1.5' }}>
                      This is to Certify that Mr. / Ms. <span style={{ borderBottom: '1px solid #edafc1', color: '#2563eb', display: 'inline-block', minWidth: '450px', padding: '0 10px', fontWeight: 'bold', wordBreak: 'break-word', verticalAlign: 'bottom' }}>{sName.toUpperCase()}</span>
                    </p>

                    <p style={{ textAlign: 'right', margin: 0 }}>
                      is / was bonafide student of this College/School
                    </p>

                    <p style={{ margin: 0 }}>
                      Studying in <span style={{ borderBottom: '1px solid #edafc1', color: '#2563eb', padding: '0 10px', minWidth: '280px', display: 'inline-block', fontWeight: 'bold' }}>{formData.class || st.class}</span> Class During the year 20<span style={{ borderBottom: '1px solid #edafc1', color: '#2563eb', padding: '0 5px', minWidth: '35px', display: 'inline-block', textAlign: 'center' }}>{formData.academic_year?.split('-')[0]?.trim()?.slice(-2) || '26'}</span> -20<span style={{ borderBottom: '1px solid #edafc1', color: '#2563eb', padding: '0 5px', minWidth: '35px', display: 'inline-block', textAlign: 'center' }}>{formData.academic_year?.split('-')[1]?.trim()?.slice(-2) || '27'}</span>
                    </p>

                    <p style={{ margin: 0 }}>
                      His / her date of birth is <span style={{ borderBottom: '1px solid #edafc1', color: '#2563eb', padding: '0 10px', minWidth: '130px', display: 'inline-block', textAlign: 'center', fontWeight: 'bold' }}>{sDob?.split('-').reverse().join('-')}</span> inwords
                    </p>
                    <p style={{ margin: 0, fontSize: '15px' }}>
                      <span style={{ borderBottom: '1px solid #edafc1', color: '#2563eb', padding: '0 10px', width: '100%', display: 'inline-block', minHeight: '22px' }}>{formData.dob_words || (sDob ? sDob.split('-').reverse().join('-') : '[DOB IN WORDS]')}</span>
                    </p>

                    <p style={{ margin: 0 }}>
                      Place of birth is <span style={{ borderBottom: '1px solid #edafc1', color: '#2563eb', padding: '0 10px', minWidth: '220px', display: 'inline-block' }}>{sBirthPlace || '-'}</span> Tal. <span style={{ borderBottom: '1px solid #edafc1', color: '#2563eb', padding: '0 10px', minWidth: '150px', display: 'inline-block' }}>{sTaluka || '-'}</span>
                    </p>

                    <p style={{ margin: 0 }}>
                      Dist. <span style={{ borderBottom: '1px solid #edafc1', color: '#2563eb', padding: '0 10px', minWidth: '180px', display: 'inline-block' }}>{sDistrict || '-'}</span> and caste of student is
                    </p>
                    <p style={{ margin: 0 }}>
                      <span style={{ borderBottom: '1px solid #edafc1', color: '#2563eb', padding: '0 10px', minWidth: '300px', display: 'inline-block', fontWeight: 'bold' }}>{formData.student_caste || st.caste || '-'}</span>
                    </p>

                    <p style={{ margin: 0 }}>
                      He / She Passed his / her <span style={{ borderBottom: '1px solid #edafc1', color: '#2563eb', padding: '0 10px', minWidth: '250px', display: 'inline-block' }}>{formData.last_exam || st.last_exam || '-'}</span> Examination
                    </p>

                    <p style={{ margin: 0 }}>
                      held in Feb / March / April 20<span style={{ borderBottom: '1px solid #edafc1', color: '#2563eb', padding: '0 5px', minWidth: '35px', display: 'inline-block', textAlign: 'center' }}>{formData.date?.split('-')[0]?.slice(-2) || new Date().getFullYear().toString().slice(-2)}</span> and was placed in {sTaluka || schoolData.city || schoolData.taluka || 'pimpalner'}
                    </p>

                    <p style={{ margin: 0 }}>
                      to best of my Knowledge. he / she bears a good moral character.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {isMarathi ? (
                  <>
                    <p style={{ textIndent: isStyle2 ? '0' : '50px' }}>
                      प्रमाणित करण्यात येते की, कुमार / कुमारी <span style={{ borderBottom: '2px solid #000', fontWeight: 'bold', padding: '0 10px' }}>{sName}</span>
                      {isBonafide ? ' हा / ही या शाळेचा / महाविद्यालयाचा बोनाफाईड विद्यार्थी आहे.' : ' हा / ही या शाळेचा / महाविद्यालयाचा विद्यार्थी आहे / होता.'}
                    </p>
                    <p>
                      तो / ती सध्या इयत्ता <span style={{ fontWeight: 'bold' }}>{formData.class || st.class}</span> मध्ये शैक्षणिक वर्ष
                      <span style={{ fontWeight: 'bold' }}> {formData.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}</span> करीता शिकत आहे.
                    </p>
                    <p>
                      जनरल रजिस्टर प्रमाणे त्याची / तिची जन्म तारीख <span style={{ fontWeight: 'bold' }}>{sDob?.split('-').reverse().join('-')}</span> आहे.
                    </p>
                    <p style={{ marginTop: '20px' }}>
                      त्याची / तिची वर्तणूक <strong>{formData.conduct === 'Good' ? 'चांगली' : formData.conduct}</strong> आहे.
                    </p>
                    <p style={{ marginTop: isStyle5 ? '60px' : '40px' }}>
                      आम्ही त्याच्या / तिच्या पुढील भविष्यासाठी शुभेच्छा देतो.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ textIndent: isStyle2 ? '0' : '50px' }}>
                      This is to certify that Master / Miss <span style={{ borderBottom: '2px solid #000', fontWeight: 'bold', padding: '0 10px' }}>{sName.toUpperCase()}</span>
                      {isBonafide ? ' is a bonafide student of this school / college.' : ' is/was a student of this school / college.'}
                    </p>
                    <p>
                      He/She is presently studying in Class <span style={{ fontWeight: 'bold' }}>{formData.class || st.class}</span> for the academic year
                      <span style={{ fontWeight: 'bold' }}> {formData.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}</span>.
                    </p>
                    <p>
                      As per the General Register, his/her date of birth is <span style={{ fontWeight: 'bold' }}>{sDob?.split('-').reverse().join('-')}</span>.
                    </p>
                    <p style={{ marginTop: '20px' }}>
                      During his/her stay, his/her conduct has been observed to be <strong>{formData.conduct || 'GOOD'}</strong>.
                    </p>
                    <p style={{ marginTop: isStyle5 ? '60px' : '40px' }}>
                      We wish him/her all the best for his/her future endeavors.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        ) : isBusPass ? (
          <div style={{ textAlign: 'left', padding: '0 20px', color: '#000', fontSize: '18px', lineHeight: '2.2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontWeight: 'bold' }}>
              <span>जावक क्र. {formData.id_manual || '____'}</span>
              <span>दिनांक: {formData.date?.split('-').reverse().join('-')}</span>
            </div>
            <div style={{ marginBottom: '30px' }}>
              <p style={{ margin: 0 }}>महाशय,</p>
              <p style={{ margin: 0 }}>नियंत्रक सो.,</p>
              <p style={{ margin: 0 }}>एस. टी. महामंडळ, {schoolData.taluka || 'पिंपळनेर'}, ता. {schoolData.taluka || 'साक्री'} जि. {schoolData.district || 'धुळे'}</p>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '40px', fontWeight: 'bold', fontSize: '22px' }}>
              विषय - विद्यार्थ्यां स एस. टी. पास सवलत मिळणेबाबत.
            </div>

            <div style={{ textIndent: '50px' }}>
              महाशय, वरील विषयानुसार निवेदन की, विद्यार्थी / विद्यार्थिनी <span style={{ borderBottom: '1px solid #000', padding: '0 10px', fontWeight: 'bold' }}>{sName}</span> आमच्या विद्यालयात सन २०<span style={{ borderBottom: '1px solid #000', padding: '0 5px' }}>{formData.academic_year?.split('-')[0]?.slice(-2) || '25'}</span> -२०<span style={{ borderBottom: '1px solid #000', padding: '0 5px' }}>{formData.academic_year?.split('-')[1]?.slice(-2) || '26'}</span> या शैक्षणिक वर्षात इयत्ता <span style={{ borderBottom: '1px solid #000', padding: '0 10px', fontWeight: 'bold' }}>{formData.class || st.class}</span> या वर्गात प्रवेश घेतलेला आहे. त्यास / तिला <span style={{ borderBottom: '1px solid #000', padding: '0 10px', fontWeight: 'bold' }}>{formData.from_village || '-'}</span> ते {formData.to_village || 'पिंपळनेर'} येण्यासाठी व परतीच्या प्रवासासाठी एस. टी. पास सवलत द्यावी, हि विनंती.
            </div>

            <div style={{ marginTop: '100px', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 40px 0' }}>मुख्याध्यापक</p>
                <p style={{ margin: 0, fontSize: '14px', maxWidth: '300px' }}>{formData.school_name || schoolData.name || 'SCHOOL NAME'}</p>
                <p style={{ margin: 0, fontSize: '14px' }}>{schoolData.taluka || '[TALUKA]'}, ता. {schoolData.taluka || '[TALUKA]'} जि. {schoolData.district || '[DIST]'}</p>
              </div>
            </div>
          </div>
        ) : (isLC && isStyle6) ? (
          <div style={{ textAlign: 'left', padding: '0 5px', fontSize: '11pt', color: '#000', lineHeight: '1.4' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: theme.primary, width: '200px', whiteSpace: 'nowrap' }}>अपार आयडी (APAAR ID) :</span>
                <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
                    {(sApaar || '                    ').slice(0, 20).split('').map((char, i, arr) => (
                      <div key={i} style={{ minWidth: '7.5mm', width: '7.5mm', height: '7.5mm', border: '1px solid #000', borderRight: i === arr.length - 1 ? '1px solid #000' : 'none', textAlign: 'center', fontSize: '12pt', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', flexShrink: 0 }}>{char}</div>
                    ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: theme.primary, width: '200px', whiteSpace: 'nowrap' }}>पी.ई.एन. आयडी (PEN ID) :</span>
                <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
                  {(sPen || '                    ').slice(0, 20).split('').map((char, i) => (
                    <div key={i} style={{ minWidth: '26px', width: '26px', height: '26px', border: '1px solid #000', marginLeft: i === 0 ? '0' : '-1px', textAlign: 'center', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', flexShrink: 0 }}>{char}</div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: theme.primary, width: '200px', whiteSpace: 'nowrap' }}>स्टुडंट आय. डी. :</span>
                <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
                  {(st.student_id || '                    ').slice(0, 20).split('').map((char, i) => (
                    <div key={i} style={{ minWidth: '26px', width: '26px', height: '26px', border: '1px solid #000', marginLeft: i === 0 ? '0' : '-1px', textAlign: 'center', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', flexShrink: 0 }}>{char}</div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: theme.primary, width: '200px', whiteSpace: 'nowrap' }}>यु. आय. डी. नं. (आधार क्रमांक) :</span>
                <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
                  {(sAadhaar || '            ').slice(0, 12).split('').map((char, i) => (
                    <div key={i} style={{ minWidth: '26px', width: '26px', height: '26px', border: '1px solid #000', marginLeft: i === 0 ? '0' : '-1px', textAlign: 'center', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', flexShrink: 0 }}>{char}</div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '14.2px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={{ width: '200px', color: theme.primary, fontWeight: 'bold', flexShrink: 0 }}>१) विद्यार्थ्याचे संपूर्ण नांव - </span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: '600', fontSize: '15px', color: '#000', paddingLeft: '10px', wordBreak: 'break-word', lineHeight: '1.4' }}>{sName}</span>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '200px', color: theme.primary, fontWeight: 'bold' }}>२) आईचे नांव - </span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>{sMother || '-'}</span>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '200px', color: theme.primary, fontWeight: 'bold' }}>३) धर्म - जात (पोट जात) - </span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>
                  {translateVal(sReligion, religionTranslations) || '-'} - {sCaste || '-'} {sSubCaste ? `(${sSubCaste})` : ''}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>४) राष्ट्रीयत्व - </span>
                <span style={{ width: '180px', borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>
                  {translateVal(sNationality, nationalityTranslations) || 'भारतीय'}
                </span>
                <span style={{ paddingLeft: '40px', color: theme.primary, fontWeight: 'bold' }}>मातृभाषा - </span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>
                  {translateVal(formData.mother_tongue, locationTranslations) || 'मराठी'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ paddingRight: '10px', color: theme.primary, fontWeight: 'bold', whiteSpace: 'nowrap' }}>५) जन्मस्थळ गांव / शहर</span>
                <span style={{ width: '220px', borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>
                  {translateVal(sBirthPlace, locationTranslations) || '-'}
                </span>
                <span style={{ paddingLeft: '10px', paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>तालुका</span>
                <span style={{ width: '150px', borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>
                  {translateVal(sTaluka, locationTranslations) || '-'}
                </span>
                <span style={{ paddingLeft: '10px', paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>जि.</span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>
                  {translateVal(sDistrict, locationTranslations) || '-'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '-4px' }}>
                <span style={{ paddingLeft: '30px', paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>देश - </span>
                <span style={{ width: '180px', borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>
                  {isMarathi ? 'भारत' : (st.country || 'India')}
                </span>
                <span style={{ paddingLeft: '40px', paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>राज्य - </span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>
                  {translateVal(st.state, locationTranslations) || 'महाराष्ट्र'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>६) इ. सनाप्रमाणे जन्म दिनांक (महिना, वर्ष)</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ display: 'flex', border: '1px solid #000' }}>
                    {(sDob ? sDob.split('-')[2] : '  ').padEnd(2, ' ').split('').map((char, i) => (
                      <div key={`d${i}`} style={{ width: '21px', height: '22px', borderLeft: i === 0 ? 'none' : '1px solid #000', textAlign: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{char}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', border: '1px solid #000' }}>
                    {(sDob ? sDob.split('-')[1] : '  ').padEnd(2, ' ').split('').map((char, i) => (
                      <div key={`m${i}`} style={{ width: '21px', height: '22px', borderLeft: i === 0 ? 'none' : '1px solid #000', textAlign: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{char}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', border: '1px solid #000' }}>
                    {(sDob ? sDob.split('-')[0] : '    ').padEnd(4, ' ').split('').map((char, i) => (
                      <div key={`y${i}`} style={{ width: '21px', height: '22px', borderLeft: i === 0 ? 'none' : '1px solid #000', textAlign: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{char}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '-4px' }}>
                <span style={{ paddingLeft: '30px', paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>जन्म दिनांक अक्षरी - </span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>
                  {isMarathi ? marathiFormatter.toDateInMarathiWords(sDob) : (formData.dob_words || '-')}
                </span>
              </div>

              <div style={{ display: 'flex' }}>
                <span style={{ paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>७) या पूर्वीची शाळा व इयत्ता - </span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>{formData.prev_school_info || '-'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>८) या शाळेत प्रवेश घेतल्याचा दिनांक - </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ display: 'flex', border: '1px solid #000' }}>
                    {(formData.admission_date ? formData.admission_date.split('-')[2] : '  ').padEnd(2, ' ').split('').map((char, i) => (
                      <div key={`ad${i}`} style={{ width: '21px', height: '22px', borderLeft: i === 0 ? 'none' : '1px solid #000', textAlign: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{char}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', border: '1px solid #000' }}>
                    {(formData.admission_date ? formData.admission_date.split('-')[1] : '  ').padEnd(2, ' ').split('').map((char, i) => (
                      <div key={`am${i}`} style={{ width: '21px', height: '22px', borderLeft: i === 0 ? 'none' : '1px solid #000', textAlign: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{char}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', border: '1px solid #000' }}>
                    {(formData.admission_date ? formData.admission_date.split('-')[0] : '    ').padEnd(4, ' ').split('').map((char, i) => (
                      <div key={`ay${i}`} style={{ width: '21px', height: '22px', borderLeft: i === 0 ? 'none' : '1px solid #000', textAlign: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{char}</div>
                    ))}
                  </div>
                </div>
                <span style={{ paddingLeft: '20px', paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>इयत्ता - </span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>{formData.class || st.class || '-'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>९) अभ्यासातील प्रगती</span>
                <span style={{ width: '200px', borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px', textAlign: 'center' }}>{formData.progress || 'चांगली'}</span>
                <span style={{ paddingLeft: '30px', paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>वर्तणूक - </span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px', textAlign: 'center' }}>{formData.conduct || 'चांगली'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>१०) शाळा सोडल्याचा दिनांक - </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ display: 'flex', border: '1px solid #000' }}>
                    {(formData.leaving_date ? formData.leaving_date.split('-')[2] : '  ').padEnd(2, ' ').split('').map((char, i) => (
                      <div key={`ld${i}`} style={{ width: '21px', height: '22px', borderLeft: i === 0 ? 'none' : '1px solid #000', textAlign: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{char}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', border: '1px solid #000' }}>
                    {(formData.leaving_date ? formData.leaving_date.split('-')[1] : '  ').padEnd(2, ' ').split('').map((char, i) => (
                      <div key={`lm${i}`} style={{ width: '21px', height: '22px', borderLeft: i === 0 ? 'none' : '1px solid #000', textAlign: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{char}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', border: '1px solid #000' }}>
                    {(formData.leaving_date ? formData.leaving_date.split('-')[0] : '    ').padEnd(4, ' ').split('').map((char, i) => (
                      <div key={`ly${i}`} style={{ width: '21px', height: '22px', borderLeft: i === 0 ? 'none' : '1px solid #000', textAlign: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{char}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>११) कोणत्या इयत्तेत शिकत होता व केव्हापासून (अक्षरी व अंकी)</span>
                <span style={{ paddingLeft: '10px', paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>इयत्ता - </span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px', textAlign: 'center' }}>{formData.studying_standard || '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ paddingLeft: '30px', paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>अक्षरी - </span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>{formData.studying_since_words || formData.studying_since || '-'}</span>
                <span style={{ paddingLeft: '20px', paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>अंकी - </span>
                <span style={{ width: '150px', borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px', textAlign: 'center' }}>{formData.studying_since_figures || '-'}</span>
              </div>

              <div style={{ display: 'flex', marginTop: '4px' }}>
                <span style={{ paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>१२) शाळा सोडल्याचे कारण - </span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>{formData.reason || '-'}</span>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ paddingRight: '10px', color: theme.primary, fontWeight: 'bold' }}>१३) शेरा - </span>
                <span style={{ flex: 1, borderBottom: '1pt dashed #444', fontWeight: 'bold', color: '#000', paddingLeft: '10px' }}>{formData.remark || '-'}</span>
              </div>
            </div>

            <p style={{ marginTop: '5px', marginBottom: '25px', fontSize: '13.2px', fontStyle: 'italic', fontWeight: 'bold', textAlign: 'center', letterSpacing: '0.4px' }}>
              दाखला देण्यात येतो की, वरील माहिती शाळेतील जनरल रजिस्टर नं. १ प्रमाणे आहे.
            </p>

            <div style={{
              marginTop: '50px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14.2px',
              fontWeight: 'bold',
              paddingTop: '8px',
              borderTop: `1px solid ${theme.bg}`,
              color: theme.primary
            }}>
              <div style={{ textAlign: 'center' }}>
                <span>दिनांक : <span style={{ color: '#000', fontWeight: 'bold' }}>{formData.date?.split('-').reverse().join('-')}</span></span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span>लेखनिक</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span>प्राचार्य / मुख्याध्यापक</span>
              </div>
            </div>

            <p style={{
              marginTop: '20px',
              borderTop: `1px solid ${theme.primary}`,
              fontSize: '10.5px',
              textAlign: 'center',
              paddingTop: '3px',
              color: theme.primary,
              fontWeight: 'bold'
            }}>
              टिप- शाळा सोडल्याचे दाखल्यामध्ये अनाधिकृतरीत्या बदल केल्यास संबंधितांवर कायदेशीर कारवाई करण्यात येईल.
            </p>
          </div>
        ) : (
          <div style={{ padding: '0 30px' }}>
            {[
              { label: isMarathi ? '१. विद्यार्थ्याचे नाव' : '1. Name of the Pupil', value: sName.toUpperCase() },
              { label: isMarathi ? '२. जनरल रजि. क्र.' : '2. Register No', value: sReg || 'N/A' },
              { label: isMarathi ? '३. आधार क्रमांक' : '3. Aadhaar Number', value: sAadhaar || 'N/A' },
              { label: isMarathi ? '४. आईचे नाव' : '4. Mother\'s Name', value: sMother || '-' },
              { label: isMarathi ? '५. जन्म तारीख' : '5. Date of Birth', value: sDob?.split('-').reverse().join('-') },
              { label: isMarathi ? '६. धर्म आणि जात' : '6. Religion & Caste', value: `${sReligion || '-'} / ${sCaste || '-'}` },
              { label: isMarathi ? '७. प्रवेशाचा दिनांक' : '7. Date of Admission', value: formData.admission_date?.split('-').reverse().join('-') || st.admission_date?.split('-').reverse().join('-') },
              { label: isMarathi ? '८. शिकत असलेली इयत्ता' : '8. Class Studied', value: formData.class || st.class },
              { label: isMarathi ? '९. शाळा सोडल्याचा दिनांक' : '9. Date of Leaving', value: formData.leaving_date?.split('-').reverse().join('-') || formData.date?.split('-').reverse().join('-') },
              { label: isMarathi ? '१०. शाळा सोडल्याचे कारण' : '10. Reason for Leaving', value: formData.reason },
              { label: isMarathi ? '११. वर्तणूक' : '11. General Conduct', value: formData.conduct }
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', marginBottom: isStyle2 ? '15px' : '10px' }}>
                <div style={{ width: '260px', fontSize: '17px', color: isStyle2 ? theme.primary : '#000' }}>{row.label}</div>
                <div style={{
                  flex: 1,
                  borderBottom: isStyle2 ? `2px solid ${theme.bg}` : '1pt dashed #888',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  paddingLeft: '10px'
                }}>{row.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Signature Section */}
      {!(isLC && isStyle6 || isBusPass) && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50px',
          right: '50px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontWeight: 'bold',
          fontSize: '16px',
          color: '#000'
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            {isStyle6 ? (
              <div style={{ textAlign: 'left' }}>
                {isMarathi ? 'स्थळ' : 'Place'} : <span style={{ fontWeight: '600' }}>{translateVal(schoolData.city || schoolData.taluka, locationTranslations) || 'पिंपळनेर'}</span><br />
                {isMarathi ? 'दिनांक' : 'Date'} : <span style={{ fontWeight: '600' }}>{isMarathi ? marathiFormatter.formatDate(formData.date || new Date()) : (formData.date?.split('-').reverse().join('-'))}</span>
              </div>
            ) : (
              <>
                <div style={{ width: '120px', borderTop: `1.5px solid ${isStyle2 ? theme.primary : '#000'}`, marginBottom: '8px', margin: '0 auto' }}></div>
                {isStyle1 ? (isMarathi ? 'तयार करणार' : 'Prepared By') : (isMarathi ? 'लेखनिक' : 'Clerk')}
              </>
            )}
          </div>

          {isStyle6 && (
            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{ margin: 0 }}>{isMarathi ? 'लेखनिक' : 'Clerk'}</p>
            </div>
          )}

          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ width: isStyle6 ? '100%' : '180px', borderTop: isStyle6 ? 'none' : `1.5px solid ${isStyle2 ? theme.primary : '#000'}`, marginBottom: '8px', margin: '0 auto' }}></div>
            {isStyle6 ? (
              <div style={{ textAlign: 'right' }}>
                {isMarathi ? 'प्राचार्य / मुख्याध्यापक' : 'Head Master / Principal'}
              </div>
            ) : (
              <span>{isMarathi ? 'प्राचार्य / मुख्याध्यापक' : 'Principal / Headmaster'}<br /><span style={{ fontSize: '12px', fontWeight: 'normal' }}>({isMarathi ? 'स्वाक्षरी आणि शिक्का' : 'Signature & School Seal'})</span></span>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default GenerateCertificate;
