import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import DashboardLayout from '../../layouts/DashboardLayout';
import { FiArrowLeft, FiEdit2, FiPrinter, FiUser, FiPhone, FiBook, FiHome, FiInfo, FiGlobe, FiDollarSign } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from 'react-toastify';
import { locationTranslations } from '../../utils/locationTranslations';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isMarathi, language, setLanguage } = useLanguage();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.error("Error fetching student profile:", error);
        toast.error("Failed to load student profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, navigate]);

  const translateLoc = (name) => {
    if (!isMarathi || !name) return name;
    return locationTranslations[name] || name;
  };

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    try {
      const birthDate = new Date(dobString);
      const difference = Date.now() - birthDate.getTime();
      const ageDate = new Date(difference);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
        <div className="premium-card" style={{ padding: '2rem', textAlign: 'center' }}>Loading Student Profile...</div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button 
          onClick={() => navigate('/admin/students')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', border: 'none' }}
        >
          <FiArrowLeft /> Back to Students
        </button>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Language Switcher */}
          <div style={{ display: 'flex', gap: '0.25rem', padding: '3px', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginRight: '1rem' }}>
            <button
              onClick={() => setLanguage('en')}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: 'none',
                background: language === 'en' ? 'var(--primary)' : 'transparent',
                color: language === 'en' ? '#fff' : 'var(--text-muted)',
              }}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('mr')}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: 'none',
                background: language === 'mr' ? 'var(--primary)' : 'transparent',
                color: language === 'mr' ? '#fff' : 'var(--text-muted)',
              }}
            >
              मराठी
            </button>
          </div>

          <button 
            className="btn btn-outline"
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FiPrinter /> {isMarathi ? 'प्रिंट काढा' : 'Print Profile'}
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate(`/admin/students/edit/${student.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FiEdit2 /> {isMarathi ? 'माहिती संपादित करा' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Main Profile Sheet */}
      <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }} className="print-area">
        
        {/* Banner Card */}
        <div className="premium-card" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', borderLeft: '6px solid var(--primary)', background: 'linear-gradient(to right, var(--background), rgba(99, 102, 241, 0.03))' }}>
          <div style={{
            width: '130px',
            height: '160px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '2px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            background: 'var(--background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {student.photoURL ? (
              <img src={student.photoURL} alt={student.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <FiUser size={48} color="var(--text-muted)" />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <span style={{ 
              background: student.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: student.status === 'active' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '0.75rem'
            }}>
              {student.status || 'ACTIVE'}
            </span>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
              {student.fullName || `${student.last_name || ''} ${student.first_name || ''} ${student.middle_name || ''}`.trim()}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>{isMarathi ? 'वर्ग / तुकडी' : 'Class / Section'}</small>
                <strong style={{ fontSize: '1.1rem' }}>{student.class || '-'} (Sec {student.section || student.division || '-'})</strong>
              </div>
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>{isMarathi ? 'प्रवेश क्रमांक (Admission No)' : 'Admission ID'}</small>
                <strong style={{ fontSize: '1.1rem' }}>{student.student_id || student.admissionNumber || '-'}</strong>
              </div>
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>{isMarathi ? 'हजेरी क्रमांक (Roll No)' : 'Roll Number'}</small>
                <strong style={{ fontSize: '1.1rem' }}>{student.rollNumber || student.roll_no || '-'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Column Data Panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left Column: Quick Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Quick Demographics Card */}
            <div className="premium-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <FiUser color="var(--primary)" /> {isMarathi ? 'वैयक्तिक प्रोफाइल' : 'Personal Profile'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>{isMarathi ? 'लिंग (Gender)' : 'Gender'}</span>
                  <strong>{isMarathi ? (student.gender === 'Female' ? 'मुलगी (Female)' : (student.gender === 'Male' ? 'मुलगा (Male)' : 'इतर')) : student.gender}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>{isMarathi ? 'जन्म तारीख (DOB)' : 'Date of Birth'}</span>
                  <strong>{student.dob || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>{isMarathi ? 'वय (Age)' : 'Calculated Age'}</span>
                  <strong>{student.dob ? `${calculateAge(student.dob)} ${isMarathi ? 'वर्षे' : 'years'}` : '-'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>{isMarathi ? 'रक्त गट (Blood Group)' : 'Blood Group'}</span>
                  <strong>{student.bloodGroup || student.blood_group || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>{isMarathi ? 'आधार कार्ड क्रमांक' : 'Aadhaar Card No'}</span>
                  <strong>{student.aadhaar_no || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>{isMarathi ? 'अपार आयडी (APAAR ID)' : 'APAAR ID'}</span>
                  <strong>{student.apaar_id || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>{isMarathi ? 'पी.ई.एन. आयडी (PEN ID)' : 'PEN ID'}</span>
                  <strong>{student.pen_id || '-'}</strong>
                </div>
              </div>
            </div>

            {/* Contact Details Card */}
            <div className="premium-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <FiPhone color="var(--primary)" /> {isMarathi ? 'संपर्क माहिती' : 'Contact Details'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>{isMarathi ? 'मोबाईल क्रमांक' : 'Mobile Number'}</span>
                  <strong>{student.mobile || student.mobileNumber || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>{isMarathi ? 'ईमेल आयडी' : 'Email Address'}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', wordBreak: 'break-all' }}>{student.email || '-'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Detailed Grid Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Academic Section */}
            <div className="premium-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <FiBook color="var(--primary)" /> {isMarathi ? 'शैक्षणिक रेकॉर्ड' : 'Academic Profile'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'माध्यम (Medium)' : 'Medium of Instruction'}</small>
                  <strong>{student.medium || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'प्रवेश तारीख' : 'Admission Date'}</small>
                  <strong>{student.admissionDate || student.admission_date || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'रजिस्टर क्रमांक' : 'Register Number'}</small>
                  <strong>{student.register_no || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'पुस्तक क्रमांक' : 'Book Number'}</small>
                  <strong>{student.book_no || '-'}</strong>
                </div>
              </div>
            </div>

            {/* Demographics Detail Section */}
            <div className="premium-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <FiUser color="var(--primary)" /> {isMarathi ? 'सामाजिक व लोकसंख्याशास्त्र तपशील' : 'Demographics & Social Details'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'धर्म (Religion)' : 'Religion'}</small>
                  <strong>{student.religion || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'जात (Caste)' : 'Caste'}</small>
                  <strong>{student.caste || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'पोटजात (Sub Caste)' : 'Sub Caste'}</small>
                  <strong>{student.sub_caste || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'जात प्रवर्ग (Category)' : 'Caste Category'}</small>
                  <strong>{student.caste_category || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'अल्पसंख्याक प्रवर्ग' : 'Minority Status'}</small>
                  <strong>{student.minority === 'Yes' ? `${isMarathi ? 'हो' : 'Yes'} (${student.minority_type || '-'})` : (isMarathi ? 'नाही' : 'No')}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'राष्ट्रीयत्व (Nationality)' : 'Nationality'}</small>
                  <strong>{student.nationality || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'मातृभाषा' : 'Mother Tongue'}</small>
                  <strong>{student.mother_tongue || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'जन्मस्थळ' : 'Birth Place'}</small>
                  <strong>{student.birth_place || '-'}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'अपंगत्व प्रकार (Handicap)' : 'Handicap status'}</small>
                  <strong>{student.handicap_type === 'None' ? (isMarathi ? 'काहीही नाही' : 'None') : student.handicap_type}</strong>
                </div>
                {student.identification_mark && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'ओळख चिन्ह' : 'Identification Mark'}</small>
                    <strong>{student.identification_mark}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Address Info */}
            <div className="premium-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <FiHome color="var(--primary)" /> {isMarathi ? 'पत्ता तपशील' : 'Address Information'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1rem' }}>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'गाव / शहर' : 'City / Village'}</small>
                  <strong>{translateLoc(student.city) || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'तालुका' : 'Taluka'}</small>
                  <strong>{translateLoc(student.taluka) || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'जिल्हा' : 'District'}</small>
                  <strong>{translateLoc(student.district) || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'राज्य' : 'State'}</small>
                  <strong>{translateLoc(student.state) || '-'}</strong>
                </div>
              </div>
              <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '1rem' }}>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'संपूर्ण पत्ता' : 'Complete Address'}</small>
                <strong style={{ display: 'block', marginTop: '0.25rem', fontSize: '1rem' }}>
                  {student.address} {student.pincode && `- ${student.pincode}`}
                </strong>
              </div>
            </div>

            {/* Parents & Family Info */}
            <div className="premium-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <FiPhone color="var(--primary)" /> {isMarathi ? 'पालकांचा तपशील' : 'Parents / Guardian Information'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'वडिलांचे पूर्ण नाव' : "Father's Full Name"}</small>
                  <strong>{student.father_name || student.fatherName || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'वडिलांचा व्यवसाय' : "Father's Occupation"}</small>
                  <strong>{student.father_occupation || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'वडिलांचा फोन' : "Father's Contact"}</small>
                  <strong>{student.father_mobile || '-'}</strong>
                </div>
                <div style={{ gridColumn: 'span 2', borderTop: '1px dashed var(--border)', paddingTop: '1rem' }}>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'आईचे पूर्ण नाव' : "Mother's Full Name"}</small>
                  <strong>{student.mother_name || student.motherName || '-'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'आईचा व्यवसाय' : "Mother's Occupation"}</small>
                  <strong>{student.mother_occupation || '-'}</strong>
                </div>
              </div>
            </div>

            {/* Previous Schooling */}
            {(student.prev_school_name || student.prev_school_lc_no) && (
              <div className="premium-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <FiGlobe color="var(--primary)" /> {isMarathi ? 'मागील शाळा इतिहास' : 'Previous Academic History'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'पूर्वीच्या शाळेचे नाव' : 'Previous School Name'}</small>
                    <strong>{student.prev_school_name || '-'}</strong>
                  </div>
                  {student.prev_school_address && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'शाळेचा पत्ता' : 'School Address'}</small>
                      <strong>{student.prev_school_address}</strong>
                    </div>
                  )}
                  <div>
                    <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'दाखला क्रमांक (LC / TC)' : 'Leaving/TC Number'}</small>
                    <strong>{student.prev_school_lc_no || '-'}</strong>
                  </div>
                  <div>
                    <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'दाखला तारीख (LC Date)' : 'Leaving/TC Date'}</small>
                    <strong>{student.prev_school_lc_date || '-'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Bank details */}
            {(student.bank_name || student.account_no) && (
              <div className="premium-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <FiDollarSign color="var(--primary)" /> {isMarathi ? 'बँक खाते तपशील' : 'Bank Account Information'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                  <div>
                    <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'बँकेचे नाव' : 'Bank Name'}</small>
                    <strong>{student.bank_name || '-'}</strong>
                  </div>
                  <div>
                    <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'बँक शाखा' : 'Branch Name'}</small>
                    <strong>{student.branch || '-'}</strong>
                  </div>
                  <div>
                    <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'खाते क्रमांक' : 'Account Number'}</small>
                    <strong>{student.account_no || '-'}</strong>
                  </div>
                  <div>
                    <small style={{ color: 'var(--text-muted)', display: 'block' }}>{isMarathi ? 'आय.एफ.एस.सी कोड (IFSC)' : 'IFSC Code'}</small>
                    <strong style={{ textTransform: 'uppercase' }}>{student.ifsc_code || '-'}</strong>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .premium-card {
            border: 1px solid #ccc !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
          }
        }
      `}</style>
    </>
  );
};

export default StudentProfile;
