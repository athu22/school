import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import useAuthStore from '../../store/authStore';
import { useStudents } from '../../hooks/useStudents';
import { useClasses } from '../../hooks/useClasses';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Users, Search, Filter, Printer, CreditCard,
  CheckCircle, XCircle, Info, Sparkles, Phone, MapPin, Award
} from 'lucide-react';
import './IDCards.css';

const themesList = [
  { id: 'blue', name: 'Sky Blue', color: '#0284c7' },
  { id: 'gold', name: 'Royal Gold', color: '#ca8a04' },
  { id: 'crimson', name: 'Crimson Red', color: '#dc2626' },
  { id: 'emerald', name: 'Emerald', color: '#059669' },
  { id: 'gradient', name: 'Nebula', color: 'linear-gradient(135deg, #6366f1, #a855f7)' },
  { id: 'dark', name: 'Sleek Dark', color: '#1e293b' }
];

const IDCards = () => {
  const { profile } = useAuthStore();
  const { isMarathi } = useLanguage();
  
  // Firestore hooks
  const { students, loading: studentsLoading } = useStudents(profile?.schoolId);
  const { classes } = useClasses(profile?.schoolId);

  // States
  const [schoolData, setSchoolData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  // Customization Options
  const [cardFormat, setCardFormat] = useState('horizontal'); // 'horizontal' or 'vertical'
  const [cardTheme, setCardTheme] = useState('blue'); // 'blue', 'gold', 'crimson', 'emerald', 'gradient', 'dark'
  const [cardLayout, setCardLayout] = useState('standard'); // 'standard', 'glass', 'bold', 'minimal'
  const [printBackPage, setPrintBackPage] = useState(true); // Toggle front & back or front only

  // Fetch school details from Firestore
  useEffect(() => {
    const fetchSchool = async () => {
      if (!profile?.schoolId) return;
      try {
        const snap = await getDoc(doc(db, 'schools', profile.schoolId));
        if (snap.exists()) {
          setSchoolData(snap.data());
        }
      } catch (err) {
        console.error("Failed to load school profile:", err);
      }
    };
    fetchSchool();
  }, [profile?.schoolId]);

  // Extract unique divisions from loaded students
  const divisions = Array.from(new Set(
    (students || [])
      .filter(s => !filterClass || s.class === filterClass)
      .map(s => s.section || s.division)
      .filter(Boolean)
  )).sort();

  // Filter student list
  const filteredStudents = (students || []).filter(st => {
    const matchesSearch = 
      (st.fullName || st.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.rollNumber || st.roll_no || '').toString().includes(searchTerm);
    
    const matchesClass = !filterClass || st.class === filterClass;
    const matchesDiv = !filterDivision || (st.section === filterDivision || st.division === filterDivision);
    
    return matchesSearch && matchesClass && matchesDiv;
  }).sort((a, b) => {
    const rollA = parseInt(a.rollNumber || a.roll_no || 0);
    const rollB = parseInt(b.rollNumber || b.roll_no || 0);
    if (rollA && rollB) return rollA - rollB;
    return (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '');
  });

  const handleSelectStudent = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Card Front Sub-Component
  const IDCardFront = ({ student }) => {
    const name = student.fullName || student.name || 'Student Name';
    const roll = student.rollNumber || student.roll_no || '-';
    const dob = student.dob || student.dateOfBirth || '-';
    const phone = student.mobile || student.parentMobile || student.fatherMobile || '-';
    const blood = student.bloodGroup || student.blood_group || '-';
    const stdClass = student.class || '-';
    const div = student.section || student.division || '-';
    const address = student.address || student.currentAddress || '-';

    return (
      <div className={`id-card-item front ${cardFormat} theme-${cardTheme} layout-${cardLayout}`}>
        {/* Card Header */}
        <div className="id-card-header">
          <div className="card-logo-container">
            {schoolData?.logo ? (
              <img src={schoolData.logo} alt="Logo" className="card-logo-img" />
            ) : (
              <span>{schoolData?.name?.charAt(0) || profile?.schoolName?.charAt(0) || 'S'}</span>
            )}
          </div>
          <div className="card-header-titles">
            <span className="card-school-name">{schoolData?.name || profile?.schoolName || 'School Name'}</span>
            <span className="card-school-addr">{schoolData?.address || 'School Location Address'}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="id-card-body-block">
          {/* Photo Segment */}
          <div className="card-photo-frame">
            <div className="student-card-img">
              {student.photo || student.profilePicture ? (
                <img src={student.photo || student.profilePicture} alt={name} />
              ) : (
                <Users size={cardFormat === 'vertical' ? 36 : 28} style={{ color: '#cbd5e1' }} />
              )}
            </div>
            <div className="student-id-lbl">ID: {student.id?.slice(0, 6).toUpperCase()}</div>
          </div>

          {/* Details Segment */}
          <div className="card-details-block">
            <div className="card-st-name">{name}</div>
            
            <div className="card-detail-row">
              <span className="card-detail-lbl">{isMarathi ? 'अनुक्रमांक / Roll:' : 'Roll No:'}</span>
              <span className="card-detail-val">{roll}</span>
            </div>

            <div className="card-detail-row">
              <span className="card-detail-lbl">{isMarathi ? 'इयत्ता / Class:' : 'Class (Div):'}</span>
              <span className="card-detail-val">{stdClass} ({div})</span>
            </div>

            <div className="card-detail-row">
              <span className="card-detail-lbl">{isMarathi ? 'जन्मतारीख / DOB:' : 'DOB:'}</span>
              <span className="card-detail-val">{dob}</span>
            </div>

            <div className="card-detail-row">
              <span className="card-detail-lbl">{isMarathi ? 'रक्तगट / Blood:' : 'Blood Group:'}</span>
              <span className="card-detail-val">{blood}</span>
            </div>

            <div className="card-detail-row">
              <span className="card-detail-lbl">{isMarathi ? 'संपर्क / Mobile:' : 'Phone:'}</span>
              <span className="card-detail-val">{phone}</span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="id-card-footer">
          <span className="card-footer-addr">{address}</span>
          <div className="card-sig-line">
            <div className="sig-h-bar"></div>
            <span>{isMarathi ? 'मुख्याध्यापक' : 'Principal'}</span>
          </div>
        </div>
      </div>
    );
  };

  // Card Back Sub-Component
  const IDCardBack = ({ student }) => {
    const parentPhone = student.parentMobile || student.fatherMobile || student.mobile || '-';
    const address = student.address || student.currentAddress || '-';

    return (
      <div className={`id-card-item back ${cardFormat} theme-${cardTheme} layout-${cardLayout}`}>
        <div className="back-card-header">
          <span className="back-school-title">{schoolData?.name || profile?.schoolName || 'School Name'}</span>
          <div className="back-info-sub">{isMarathi ? 'महत्वाच्या सूचना' : 'IMPORTANT INSTRUCTIONS'}</div>
        </div>

        <ul className="back-instructions-list">
          <li>{isMarathi ? '१. ओळखपत्र गळ्यात घालणे बंधनकारक आहे.' : '1. Wearing this ID card daily is mandatory.'}</li>
          <li>{isMarathi ? '२. ओळखपत्र हरवल्यास कार्यालयात त्वरित कळवावे.' : '2. Report loss of this card to office immediately.'}</li>
          <li>{isMarathi ? '३. कार्ड न बदलल्यास दंड आकारला जाऊ शकतो.' : '3. ID card is non-transferable.'}</li>
        </ul>

        <div className="back-emergency-box">
          <div className="back-emergency-title">{isMarathi ? 'आणीबाणी संपर्क (Emergency Contact)' : 'EMERGENCY CONTACTS'}</div>
          <div className="back-emergency-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <Phone size={8} style={{ color: '#dc2626' }} />
              <strong>{parentPhone}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '4px' }}>
              <MapPin size={8} style={{ color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
              <span style={{ fontSize: '5px' }}>{address}</span>
            </div>
          </div>
        </div>

        <div className="back-footer-copyright">
          {isMarathi ? 'शैक्षणिक वर्ष : २०२५ - २०२६' : 'Academic Year: 2025 - 2026'}
        </div>
      </div>
    );
  };

  return (
    <div className="id-cards-container">
      {/* Page Screen Header */}
      <div className="page-header no-print" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            <CreditCard size={24} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle' }} />
            {isMarathi ? 'ओळखपत्र बिल्डर (ID Card Builder)' : 'Premium ID Card Builder'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {isMarathi 
              ? 'विद्यार्थ्यांसाठी आकर्षक ओळखपत्रे डिझाईन करा आणि थेट A4 शीटवर प्रिंट करा.' 
              : 'Design stunning double-sided student ID cards with custom styles, layouts and colors.'}
          </p>
        </div>

        {/* Global Print Action */}
        <button 
          onClick={handlePrint} 
          disabled={selectedStudents.length === 0}
          className="btn btn-primary"
          style={{ padding: '10px 22px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
        >
          <Printer size={18} />
          {isMarathi ? 'ओळखपत्र प्रिंट करा' : 'Print ID Cards'}
        </button>
      </div>

      {/* Configuration Customizer Bar */}
      <div className="builder-config-bar no-print">
        {/* 1. Format Selection */}
        <div className="config-group">
          <label>{isMarathi ? 'रचना (Format)' : 'Card Format'}</label>
          <div className="config-btn-group">
            <button 
              className={`config-tab-btn ${cardFormat === 'horizontal' ? 'active' : ''}`}
              onClick={() => setCardFormat('horizontal')}
            >
              {isMarathi ? 'आडवे (Landscape)' : 'Horizontal'}
            </button>
            <button 
              className={`config-tab-btn ${cardFormat === 'vertical' ? 'active' : ''}`}
              onClick={() => setCardFormat('vertical')}
            >
              {isMarathi ? 'उभे (Portrait)' : 'Vertical'}
            </button>
          </div>
        </div>

        {/* 2. Border Layout Style */}
        <div className="config-group">
          <label>{isMarathi ? 'बॉर्डर स्टाईल' : 'Border Style'}</label>
          <div className="config-btn-group">
            <button 
              className={`config-tab-btn ${cardLayout === 'standard' ? 'active' : ''}`}
              onClick={() => setCardLayout('standard')}
            >
              Std
            </button>
            <button 
              className={`config-tab-btn ${cardLayout === 'glass' ? 'active' : ''}`}
              onClick={() => setCardLayout('glass')}
            >
              Glass
            </button>
            <button 
              className={`config-tab-btn ${cardLayout === 'bold' ? 'active' : ''}`}
              onClick={() => setCardLayout('bold')}
            >
              Bold
            </button>
            <button 
              className={`config-tab-btn ${cardLayout === 'minimal' ? 'active' : ''}`}
              onClick={() => setCardLayout('minimal')}
            >
              Minimal
            </button>
          </div>
        </div>

        {/* 3. Theme Colors */}
        <div className="config-group">
          <label>{isMarathi ? 'थीम रंग' : 'Card Theme'}</label>
          <div className="theme-dots-wrap">
            {themesList.map(th => (
              <div 
                key={th.id}
                title={th.name}
                className={`theme-dot-item ${cardTheme === th.id ? 'active' : ''}`}
                style={{ background: th.color }}
                onClick={() => setCardTheme(th.id)}
              />
            ))}
          </div>
        </div>

        {/* 4. Backside Toggle */}
        <div className="config-group">
          <label>{isMarathi ? 'मागील बाजू (Back)' : 'Double Sided'}</label>
          <div className="config-btn-group">
            <button 
              className={`config-tab-btn ${printBackPage ? 'active' : ''}`}
              onClick={() => setPrintBackPage(true)}
            >
              {isMarathi ? 'होय (Yes)' : 'Yes'}
            </button>
            <button 
              className={`config-tab-btn ${!printBackPage ? 'active' : ''}`}
              onClick={() => setPrintBackPage(false)}
            >
              {isMarathi ? 'नाही (No)' : 'No'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Builder Area */}
      <div className="id-cards-main-layout no-print">
        {/* Left Side: Roster Filter & List */}
        <div className="students-selector-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 10px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            {isMarathi ? 'विद्यार्थी यादी निवडा' : 'Select Roster'}
          </h3>

          {/* Filter Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                value={filterClass} 
                onChange={(e) => { setFilterClass(e.target.value); setFilterDivision(''); }}
                className="form-control" 
                style={{ fontSize: '0.8rem', padding: '6px' }}
              >
                <option value="">{isMarathi ? 'सर्व वर्ग' : 'All Classes'}</option>
                {classes.map(c => <option key={c.id} value={c.className}>{c.className}</option>)}
              </select>

              <select 
                value={filterDivision} 
                onChange={(e) => setFilterDivision(e.target.value)}
                className="form-control" 
                style={{ fontSize: '0.8rem', padding: '6px' }}
                disabled={!filterClass}
              >
                <option value="">{isMarathi ? 'तुकडी' : 'Division'}</option>
                {divisions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder={isMarathi ? 'नावाने किंवा ह.क्र. शोधा...' : 'Search by name or roll...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ fontSize: '0.8rem', padding: '6px 30px 6px 10px' }}
              />
              <Search size={14} style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Roster Table */}
          <div className="selector-table-wrapper">
            {studentsLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {isMarathi ? 'विद्यार्थी सापडले नाहीत' : 'No students found'}
              </div>
            ) : (
              <table className="selector-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}>
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0} 
                      />
                    </th>
                    <th>{isMarathi ? 'नाव' : 'Name'}</th>
                    <th style={{ width: '80px' }}>{isMarathi ? 'इयत्ता' : 'Class'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(st => (
                    <tr 
                      key={st.id} 
                      onClick={() => handleSelectStudent(st.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedStudents.includes(st.id)}
                          onChange={() => handleSelectStudent(st.id)}
                        />
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {st.rollNumber || st.roll_no ? `${st.rollNumber || st.roll_no}. ` : ''}
                        {st.fullName || st.name}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {st.class}-{st.section || st.division || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Live Preview Pane */}
        <div className="preview-pane-card">
          <div style={{ display: 'flex', width: '100%', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-indigo)', marginRight: '8px' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
              {isMarathi ? 'ओळखपत्र थेट पूर्वावलोकन (Live Preview)' : 'Real-time Live Card Preview'}
            </h3>
            <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.08)', color: 'var(--accent-indigo)', padding: '2px 8px', borderRadius: '30px', fontWeight: 'bold', marginLeft: 'auto' }}>
              {selectedStudents.length} Selected
            </span>
          </div>

          <div className="preview-grid-flow">
            {selectedStudents.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '10px', color: 'var(--text-muted)', width: '100%', gridColumn: '1 / -1' }}>
                <Info size={32} />
                <h4 style={{ fontWeight: '750', margin: 0 }}>{isMarathi ? 'पूर्वावलोकन उपलब्ध नाही' : 'No Preview Selected'}</h4>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>{isMarathi ? 'पूर्वावलोकन पाहण्यासाठी डावीकडील यादीतून विद्यार्थी निवडा.' : 'Select one or more students from the roster list on the left to see live previews.'}</p>
              </div>
            ) : (
              students
                .filter(s => selectedStudents.includes(s.id))
                .map(student => (
                  <div key={student.id} className="preview-pair-container">
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', width: '100%', textAlign: 'center', paddingBottom: '4px', marginBottom: '6px' }}>
                      {student.fullName || student.name}
                    </div>
                    {/* Front */}
                    <IDCardFront student={student} />
                    
                    {/* Back */}
                    {printBackPage && (
                      <>
                        <div style={{ height: '6px' }}></div>
                        <IDCardBack student={student} />
                      </>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Official A4 Print Layout container (Hidden on screen) */}
      <div className="print-only-container">
        {students
          .filter(s => selectedStudents.includes(s.id))
          .map(student => (
            <React.Fragment key={student.id}>
              {/* Front Page */}
              <IDCardFront student={student} />

              {/* Back Page (Appended right next if enabled) */}
              {printBackPage && <IDCardBack student={student} />}
            </React.Fragment>
          ))}
      </div>
    </div>
  );
};

export default IDCards;
