import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiHome, FiBook, FiPhone, FiInfo, FiUpload, FiLock, FiGlobe, FiBriefcase, FiDollarSign } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import ManagedDropdown from '../ManagedDropdown';
import { indianStates, stateDistricts, districtTalukas, talukaCities } from '../../utils/locationData';
import { locationTranslations } from '../../utils/locationTranslations';
import { marathiFormatter } from '../../utils/marathiFormatter';

const StudentForm = ({ onSubmit, initialData, isLoading }) => {
  const { t, isMarathi, language, setLanguage } = useLanguage();

  const initialFormState = {
    student_id: '',
    admissionNumber: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    fullName: '',
    class: '',
    section: '',
    medium: '',
    rollNumber: '',
    register_no: '',
    book_no: '',
    mobileNumber: '',
    mobile: '',
    email: '',
    aadhaar_no: '',
    address: '',
    state: 'Maharashtra',
    district: '',
    taluka: '',
    city: '',
    pincode: '',
    dob: '',
    dob_words: '',
    gender: 'Male',
    religion: '',
    caste: '',
    sub_caste: '',
    nationality: 'Indian',
    birth_place: '',
    parent_name: '',
    mother_name: '',
    father_name: '',
    father_occupation: '',
    mother_occupation: '',
    father_mobile: '',
    bloodGroup: 'A+',
    admissionDate: new Date().toISOString().split('T')[0],
    photoURL: '',
    prev_school_name: '',
    prev_school_address: '',
    prev_school_lc_no: '',
    prev_school_lc_date: '',
    mother_tongue: 'Marathi',
    identification_mark: '',
    handicap_type: 'None',
    bank_name: '',
    account_no: '',
    ifsc_code: '',
    branch: '',
    minority: 'No',
    minority_type: '',
    caste_category: '',
    apaar_id: '',
    pen_id: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [activeSection, setActiveSection] = useState('academic');
  const [isOtherNationality, setIsOtherNationality] = useState(false);

  // Populate data when editing
  useEffect(() => {
    if (initialData) {
      const merged = { ...initialFormState, ...initialData };
      // Map legacy names to compatibility variables
      merged.student_id = merged.student_id || merged.admissionNumber || '';
      merged.admissionNumber = merged.student_id;
      merged.mobile = merged.mobile || merged.mobileNumber || '';
      merged.mobileNumber = merged.mobile;
      merged.rollNumber = merged.rollNumber || merged.roll_no || '';
      merged.section = merged.section || merged.division || '';
      merged.bloodGroup = merged.bloodGroup || merged.blood_group || 'A+';
      merged.admissionDate = merged.admissionDate || merged.admission_date || new Date().toISOString().split('T')[0];
      
      setFormData(merged);
      if (merged.photoURL) {
        setPhotoPreview(merged.photoURL);
      }
      if (merged.nationality && merged.nationality !== 'Indian') {
        setIsOtherNationality(true);
      }
    }
  }, [initialData]);

  const translateLoc = (name) => {
    if (!isMarathi || !name) return name;
    return locationTranslations[name] || name;
  };

  const dateToWords = (dateStr) => {
    if (!dateStr) return '';
    if (isMarathi) {
      return marathiFormatter.toDateInMarathiWords(dateStr);
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();

    const ones = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const getDayWords = (d) => {
      if (d < 10) return ones[d];
      if (d >= 10 && d < 20) return teens[d - 10];
      return tens[Math.floor(d / 10)] + (d % 10 !== 0 ? ' ' + ones[d % 10] : '');
    };

    const numToWords = (n) => {
      const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + numToWords(n % 100) : '');
      return numToWords(Math.floor(n / 1000)) + ' Thousand ' + numToWords(n % 1000);
    };

    return `${getDayWords(day)} ${month} ${numToWords(year)}`;
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Handle names to auto-update full name
    if (name === 'first_name' || name === 'middle_name' || name === 'last_name') {
      setFormData(prev => {
        const updated = { ...prev, [name]: value };
        const fullName = `${updated.last_name} ${updated.first_name} ${updated.middle_name}`.trim().replace(/\s+/g, ' ');
        return { ...updated, fullName, parent_name: updated.middle_name };
      });
      return;
    }

    if (name === 'mobile' || name === 'father_mobile' || name === 'mobileNumber') {
      value = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        mobileNumber: (name === 'mobile' || name === 'mobileNumber') ? value : prev.mobileNumber,
        mobile: (name === 'mobile' || name === 'mobileNumber') ? value : prev.mobile
      }));
      return;
    }

    if (name === 'student_id' || name === 'admissionNumber') {
      setFormData(prev => ({
        ...prev,
        student_id: value,
        admissionNumber: value
      }));
      return;
    }

    if (name === 'rollNumber') {
      setFormData(prev => ({
        ...prev,
        rollNumber: value,
        roll_no: value
      }));
      return;
    }

    if (name === 'section') {
      setFormData(prev => ({
        ...prev,
        section: value,
        division: value
      }));
      return;
    }

    if (name === 'aadhaar_no') {
      value = value.replace(/\D/g, '').slice(0, 12);
    }

    if (name === 'religion') {
      const minorityReligions = ['Muslim', 'मुस्लिम', 'Christian', 'ख्रिश्चन', 'Sikh', 'शीख', 'Buddhist', 'बौद्ध', 'Nav Boudha', 'नव बौद्ध', 'Jain', 'जैन', 'Parsi', 'पारसी'];
      const isMinority = minorityReligions.some(r => value.toLowerCase().includes(r.toLowerCase()));
      setFormData(prev => ({
        ...prev,
        [name]: value,
        minority: isMinority ? 'Yes' : 'No',
        minority_type: isMinority ? value : ''
      }));
      return;
    }

    if (name === 'state') {
      setFormData(prev => ({
        ...prev,
        state: value,
        district: '',
        taluka: '',
        city: ''
      }));
      return;
    }

    if (name === 'district') {
      setFormData(prev => ({
        ...prev,
        district: value,
        taluka: '',
        city: ''
      }));
      return;
    }

    if (name === 'taluka') {
      setFormData(prev => ({
        ...prev,
        taluka: value,
        city: ''
      }));
      return;
    }

    if (name === 'dob') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        dob_words: dateToWords(value)
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.student_id) {
      alert(isMarathi ? 'कृपया विद्यार्थी आयडी प्रविष्ट करा.' : 'Please enter Student ID.');
      setActiveSection('academic');
      return;
    }
    if (!formData.last_name || !formData.first_name || !formData.middle_name) {
      alert(isMarathi ? 'कृपया आडनाव, नाव आणि वडिलांचे नाव प्रविष्ट करा.' : 'Please enter surname, first name, and father/guardian name.');
      setActiveSection('personal');
      return;
    }
    if (!formData.dob) {
      alert(isMarathi ? 'कृपया जन्मतारीख निवडा.' : 'Please select Date of Birth.');
      setActiveSection('personal');
      return;
    }
    if (!formData.class) {
      alert(isMarathi ? 'कृपया वर्ग निवडा.' : 'Please select Class.');
      setActiveSection('academic');
      return;
    }

    onSubmit({ ...formData, photoFile: photo });
  };

  const sections = [
    { id: 'academic', title: isMarathi ? 'शैक्षणिक माहिती (Academic)' : 'Academic Info', icon: <FiBook /> },
    { id: 'personal', title: isMarathi ? 'वैयक्तिक माहिती (Personal)' : 'Personal Info', icon: <FiUser /> },
    { id: 'address', title: isMarathi ? 'पत्ता तपशील (Address)' : 'Address Details', icon: <FiHome /> },
    { id: 'parent', title: isMarathi ? 'पालकांचा तपशील (Parents)' : 'Parent Info', icon: <FiPhone /> },
    { id: 'prev_school', title: isMarathi ? 'मागील शाळा (Prev School)' : 'Previous School', icon: <FiGlobe /> },
    { id: 'bank', title: isMarathi ? 'बँक तपशील (Bank)' : 'Bank Details', icon: <FiDollarSign /> },
  ];

  const sectionIndex = sections.findIndex(s => s.id === activeSection);

  const nextSection = () => {
    if (sectionIndex < sections.length - 1) {
      setActiveSection(sections[sectionIndex + 1].id);
    }
  };

  const prevSection = () => {
    if (sectionIndex > 0) {
      setActiveSection(sections[sectionIndex - 1].id);
    }
  };

  return (
    <div className="premium-card animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Premium Language Switcher Toggle bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiInfo color="var(--primary)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {isMarathi ? 'नोंदणी फॉर्म मराठी व इंग्रजी दोन्हीमध्ये उपलब्ध आहे' : 'Registration form is fully responsive in English & Marathi'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', padding: '3px', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none',
              background: language === 'en' ? 'var(--primary)' : 'transparent',
              color: language === 'en' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('mr')}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none',
              background: language === 'mr' ? 'var(--primary)' : 'transparent',
              color: language === 'mr' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            मराठी
          </button>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Navigation Sidebar */}
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '220px' }}>
          {sections.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: activeSection === s.id ? 'var(--primary)' : 'var(--background)',
                color: activeSection === s.id ? '#fff' : 'var(--text-main)',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'var(--transition)',
                fontWeight: activeSection === s.id ? '600' : '500',
                boxShadow: activeSection === s.id ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {s.icon}
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Form Content Area */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', alignContent: 'start' }}
            >
              {/* ACADEMIC INFO TAB */}
              {activeSection === 'academic' && (
                <>
                  <div className="form-group">
                    <label>{t('students.studentId')} *</label>
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleChange}
                      placeholder="e.g. STU101"
                      className="premium-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.bookNo')}</label>
                    <input
                      type="text"
                      name="book_no"
                      value={formData.book_no}
                      onChange={handleChange}
                      placeholder="e.g. BK001"
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.registerNo')}</label>
                    <input
                      type="text"
                      name="register_no"
                      value={formData.register_no}
                      onChange={handleChange}
                      placeholder="e.g. REG001"
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.admissionDate')}</label>
                    <input
                      type="date"
                      name="admissionDate"
                      value={formData.admissionDate}
                      onChange={handleChange}
                      className="premium-input"
                      required
                    />
                  </div>

                  <ManagedDropdown
                    label={t('students.class')}
                    name="class"
                    value={formData.class}
                    onChange={handleChange}
                    tableName="classes"
                    placeholder={t('common.select')}
                    required
                  />

                  <ManagedDropdown
                    label={t('students.section')}
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    tableName="divisions"
                    placeholder={t('common.select')}
                  />

                  <ManagedDropdown
                    label={t('students.medium')}
                    name="medium"
                    value={formData.medium}
                    onChange={handleChange}
                    tableName="mediums"
                    placeholder={t('common.select')}
                  />

                  <div className="form-group">
                    <label>{t('students.rollNumber')}</label>
                    <input
                      type="text"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleChange}
                      placeholder="e.g. 12"
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{isMarathi ? 'अपार आयडी (APAAR ID)' : 'APAAR ID'}</label>
                    <input
                      type="text"
                      name="apaar_id"
                      value={formData.apaar_id || ''}
                      onChange={handleChange}
                      placeholder="Enter APAAR ID"
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{isMarathi ? 'पी.ई.एन. आयडी (PEN ID)' : 'PEN ID'}</label>
                    <input
                      type="text"
                      name="pen_id"
                      value={formData.pen_id || ''}
                      onChange={handleChange}
                      placeholder="Enter PEN ID"
                      className="premium-input"
                    />
                  </div>
                </>
              )}

              {/* PERSONAL INFO TAB */}
              {activeSection === 'personal' && (
                <>
                  {/* Photo Upload Row */}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px dashed var(--border)', paddingBottom: '1.5rem' }}>
                    <div style={{
                      width: '100px',
                      height: '120px',
                      border: '2px dashed var(--border)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--background)',
                      position: 'relative'
                    }}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <FiUser size={36} color="var(--text-muted)" />
                      )}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{isMarathi ? 'विद्यार्थ्याचा फोटो' : 'Student Photograph'}</h4>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isMarathi ? 'जेपीजी किंवा पीएनजी प्रकारातील फाईल निवडा' : 'Upload standard passport sized JPEG/PNG'}</p>
                      <label className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        <FiUpload /> {isMarathi ? 'फोटो अपलोड करा' : 'Upload Photo'}
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t('students.lastName')} *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder={isMarathi ? 'उदा. पाटील' : 'e.g. Patil'}
                      className="premium-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.firstName')} *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder={isMarathi ? 'उदा. अथर्व' : 'e.g. Atharv'}
                      className="premium-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.parentName')} *</label>
                    <input
                      type="text"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleChange}
                      placeholder={isMarathi ? 'उदा. रामेश्वर' : 'e.g. Rameshwar'}
                      className="premium-input"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>{isMarathi ? 'विद्यार्थ्याचे पूर्ण नाव (ऑटो)' : 'Student Full Name (Auto Preview)'}</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      disabled
                      className="premium-input"
                      style={{ background: 'var(--background)', fontWeight: 'bold', color: 'var(--text-muted)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.gender')}</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="premium-input">
                      <option value="Male">{t('students.male')}</option>
                      <option value="Female">{t('students.female')}</option>
                      <option value="Other">{t('students.other')}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t('students.dateOfBirth')} *</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="premium-input"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>{t('students.dateOfBirthWords')}</label>
                    <input
                      type="text"
                      name="dob_words"
                      value={formData.dob_words}
                      disabled
                      className="premium-input"
                      style={{ background: 'var(--background)', color: 'var(--text-muted)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.aadhaar_no')}</label>
                    <input
                      type="text"
                      name="aadhaar_no"
                      value={formData.aadhaar_no}
                      onChange={handleChange}
                      placeholder={t('students.aadhaarPlaceholder')}
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.parentPhone')}</label>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder={t('students.mobilePlaceholder')}
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.parentEmail')}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="parent@example.com"
                      className="premium-input"
                    />
                  </div>

                  <ManagedDropdown
                    label={t('students.religion')}
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    tableName="religions"
                    placeholder={t('common.select')}
                  />

                  <ManagedDropdown
                    label={t('students.caste')}
                    name="caste"
                    value={formData.caste}
                    onChange={handleChange}
                    tableName="castes"
                    placeholder={t('common.select')}
                  />

                  <div className="form-group">
                    <label>{t('students.subCaste')}</label>
                    <input
                      type="text"
                      name="sub_caste"
                      value={formData.sub_caste}
                      onChange={handleChange}
                      placeholder={t('students.subCaste')}
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.casteCategory')}</label>
                    <select name="caste_category" value={formData.caste_category} onChange={handleChange} className="premium-input">
                      <option value="">{t('common.select')}</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="VJ(A)">VJ(A)</option>
                      <option value="NT(B)">NT(B)</option>
                      <option value="NT(C)">NT(C)</option>
                      <option value="NT(D)">NT(D)</option>
                      <option value="OBC">OBC</option>
                      <option value="SBC">SBC</option>
                      <option value="SEBC">SEBC</option>
                      <option value="EWS">EWS</option>
                      <option value="OPEN">OPEN</option>
                    </select>
                  </div>

                  {formData.minority === 'Yes' && (
                    <div className="form-group">
                      <label>{isMarathi ? 'अल्पसंख्याक तपशील' : 'Minority Details'}</label>
                      <input
                        type="text"
                        name="minority_type"
                        value={formData.minority_type}
                        onChange={handleChange}
                        placeholder="e.g. Muslim"
                        className="premium-input"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>{t('students.nationality')}</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        style={{ flex: 1 }}
                        value={isOtherNationality ? 'Other' : formData.nationality}
                        onChange={(e) => {
                          if (e.target.value === 'Other') {
                            setIsOtherNationality(true);
                            setFormData(prev => ({ ...prev, nationality: '' }));
                          } else {
                            setIsOtherNationality(false);
                            setFormData(prev => ({ ...prev, nationality: e.target.value }));
                          }
                        }}
                        className="premium-input"
                      >
                        <option value="Indian">{isMarathi ? 'भारतीय' : 'Indian'}</option>
                        <option value="Other">{isMarathi ? 'इतर (Other)' : 'Other'}</option>
                      </select>
                      {isOtherNationality && (
                        <input
                          type="text"
                          name="nationality"
                          style={{ flex: 1 }}
                          value={formData.nationality}
                          onChange={handleChange}
                          placeholder={isMarathi ? 'देशाचे नाव' : 'Country Name'}
                          className="premium-input"
                        />
                      )}
                    </div>
                  </div>

                  <ManagedDropdown
                    label={isMarathi ? 'जन्मस्थळ गांव / शहर' : 'Birth Place (Village/City)'}
                    name="birth_place"
                    value={formData.birth_place}
                    onChange={handleChange}
                    tableName="cities"
                    placeholder={isMarathi ? 'उदा. पुणे' : 'e.g. Pune'}
                  />

                  <div className="form-group">
                    <label>{t('students.bloodGroup')}</label>
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="premium-input">
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <ManagedDropdown
                    label={isMarathi ? 'मातृभाषा' : 'Mother Tongue'}
                    name="mother_tongue"
                    value={formData.mother_tongue}
                    onChange={handleChange}
                    tableName="languages"
                    placeholder={t('common.select')}
                  />

                  <div className="form-group">
                    <label>{isMarathi ? 'ओळख चिन्ह' : 'Identification Mark'}</label>
                    <input
                      type="text"
                      name="identification_mark"
                      value={formData.identification_mark}
                      onChange={handleChange}
                      placeholder={isMarathi ? 'ओळख खूण' : 'e.g. mole on hand'}
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{isMarathi ? 'अपंगत्व प्रकार' : 'Handicap Type'}</label>
                    <select name="handicap_type" value={formData.handicap_type} onChange={handleChange} className="premium-input">
                      <option value="None">{isMarathi ? 'काहीही नाही' : 'None'}</option>
                      <option value="Physical">{isMarathi ? 'शारीरिक' : 'Physical'}</option>
                      <option value="Visual">{isMarathi ? 'दृष्टीदोष' : 'Visual'}</option>
                      <option value="Hearing">{isMarathi ? 'श्रवणदोष' : 'Hearing'}</option>
                      <option value="Other">{isMarathi ? 'इतर' : 'Other'}</option>
                    </select>
                  </div>
                </>
              )}

              {/* ADDRESS DETAILS TAB */}
              {activeSection === 'address' && (
                <>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>{isMarathi ? 'पूर्ण पत्ता' : 'Complete Address'} *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      placeholder="Street address, House No, Locality..."
                      className="premium-input"
                      style={{ height: '90px', resize: 'none' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.state')} *</label>
                    <select name="state" value={formData.state} onChange={handleChange} required className="premium-input">
                      {indianStates.map(st => (
                        <option key={st} value={st}>{translateLoc(st)}</option>
                      ))}
                    </select>
                  </div>

                  <ManagedDropdown
                    label={t('students.district')}
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    tableName="districts"
                    placeholder={t('common.select')}
                    extraOptions={stateDistricts[formData.state]?.map(d => ({ value: d, label: translateLoc(d) })) || []}
                  />

                  <ManagedDropdown
                    label={t('students.taluka')}
                    name="taluka"
                    value={formData.taluka}
                    onChange={handleChange}
                    tableName="talukas"
                    placeholder={t('common.select')}
                    extraOptions={districtTalukas[formData.district]?.map(t => ({ value: t, label: translateLoc(t) })) || []}
                  />

                  <ManagedDropdown
                    label={t('students.cityVillage')}
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    tableName="cities"
                    placeholder={t('common.select')}
                    extraOptions={talukaCities[formData.taluka]?.map(c => ({ value: c, label: translateLoc(c) })) || []}
                  />

                  <div className="form-group">
                    <label>{isMarathi ? 'पिनकोड' : 'Pincode'}</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="411001"
                      className="premium-input"
                    />
                  </div>
                </>
              )}

              {/* PARENTS INFO TAB */}
              {activeSection === 'parent' && (
                <>
                  <div className="form-group">
                    <label>{t('students.fatherName')}</label>
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                      <input
                        type="text"
                        name="father_name"
                        value={formData.father_name || `${formData.first_name} ${formData.middle_name} ${formData.last_name}`.trim()}
                        onChange={handleChange}
                        placeholder="Father's full name"
                        className="premium-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t('students.fatherOccupation')}</label>
                    <input
                      type="text"
                      name="father_occupation"
                      value={formData.father_occupation}
                      onChange={handleChange}
                      placeholder="e.g. Business / Service"
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.fatherMobile')}</label>
                    <input
                      type="text"
                      name="father_mobile"
                      value={formData.father_mobile}
                      onChange={handleChange}
                      placeholder="10 digit mobile"
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.motherName')}</label>
                    <input
                      type="text"
                      name="mother_name"
                      value={formData.mother_name}
                      onChange={handleChange}
                      placeholder="Mother's full name"
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.motherOccupation')}</label>
                    <input
                      type="text"
                      name="mother_occupation"
                      value={formData.mother_occupation}
                      onChange={handleChange}
                      placeholder="e.g. Homemaker / Teacher"
                      className="premium-input"
                    />
                  </div>
                </>
              )}

              {/* PREVIOUS SCHOOL DETAILS TAB */}
              {activeSection === 'prev_school' && (
                <>
                  <div style={{ gridColumn: 'span 2' }}>
                    <ManagedDropdown
                      label={isMarathi ? 'पूर्वीच्या शाळेचे नाव' : 'Previous School Name'}
                      name="prev_school_name"
                      value={formData.prev_school_name}
                      onChange={handleChange}
                      tableName="previous_schools"
                      placeholder={isMarathi ? 'शाळा निवडा / प्रविष्ट करा' : 'Select or type previous school'}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>{isMarathi ? 'पूर्वीच्या शाळेचा पत्ता' : 'Previous School Address'}</label>
                    <input
                      type="text"
                      name="prev_school_address"
                      value={formData.prev_school_address}
                      onChange={handleChange}
                      placeholder="City/Village address of previous school"
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{isMarathi ? 'शाळा सोडल्याचा दाखला क्र. (LC / TC No)' : 'LC / Transfer Certificate No'}</label>
                    <input
                      type="text"
                      name="prev_school_lc_no"
                      value={formData.prev_school_lc_no}
                      onChange={handleChange}
                      placeholder="LC number"
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{isMarathi ? 'दाखला तारीख (LC / TC Date)' : 'LC / Transfer Certificate Date'}</label>
                    <input
                      type="date"
                      name="prev_school_lc_date"
                      value={formData.prev_school_lc_date}
                      onChange={handleChange}
                      className="premium-input"
                    />
                  </div>
                </>
              )}

              {/* BANK DETAILS TAB */}
              {activeSection === 'bank' && (
                <>
                  <ManagedDropdown
                    label={isMarathi ? 'बँकेचे नाव' : 'Bank Name'}
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    tableName="banks"
                    placeholder={isMarathi ? 'बँक निवडा' : 'Select bank'}
                  />

                  <div className="form-group">
                    <label>{t('students.accountNo')}</label>
                    <input
                      type="text"
                      name="account_no"
                      value={formData.account_no}
                      onChange={handleChange}
                      placeholder="Account number"
                      className="premium-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.ifscCode')}</label>
                    <input
                      type="text"
                      name="ifsc_code"
                      value={formData.ifsc_code}
                      onChange={handleChange}
                      placeholder="e.g. SBIN0001234"
                      className="premium-input"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('students.branch')}</label>
                    <input
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      placeholder="Branch name"
                      className="premium-input"
                    />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Action Buttons at the Bottom */}
          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <button
              type="button"
              onClick={prevSection}
              disabled={sectionIndex === 0}
              className="btn btn-outline"
              style={{ padding: '0.65rem 1.25rem', opacity: sectionIndex === 0 ? 0.4 : 1, cursor: sectionIndex === 0 ? 'not-allowed' : 'pointer' }}
            >
              &larr; {isMarathi ? 'मागे' : 'Previous'}
            </button>

            <div style={{ display: 'flex', gap: '1rem' }}>
              {sectionIndex < sections.length - 1 ? (
                <button
                  type="button"
                  onClick={nextSection}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  {isMarathi ? 'पुढे' : 'Next'} &rarr;
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 2rem', fontWeight: 'bold' }}
                >
                  {isLoading ? (isMarathi ? 'जतन होत आहे...' : 'Saving...') : (initialData ? t('students.updateStudent') : t('students.registerStudent'))}
                </button>
              )}
            </div>
          </div>

        </div>

      </form>

      <style>{`
        .premium-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--background);
          color: var(--text-main);
          outline: none;
          transition: var(--transition);
        }
        .premium-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default StudentForm;
