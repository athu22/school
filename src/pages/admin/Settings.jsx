import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, updatePassword } from 'firebase/auth';
import { db } from '../../firebase/config';
import useAuthStore from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Building2, Save, KeyRound, Image as ImageIcon,
  CheckCircle, XCircle, Info, Sparkles, ShieldCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import './Settings.css';

const SettingsPage = () => {
  const { profile, setProfile } = useAuthStore();
  const { isMarathi } = useLanguage();
  
  // Form States
  const [formData, setFormData] = useState({ 
    name: '', 
    address: '', 
    board: '', 
    registration_code: '', 
    iso_certification: '',
    email: '', 
    phone: '', 
    logo: '', 
    institute_name: '', 
    est_date: '', 
    udise_code: '',
    village: '', 
    city: '', 
    taluka: '', 
    district: '', 
    pincode: '',
    board_type: '', 
    board_code: '', 
    medium: '', 
    slogan: '', 
    secondary_logo: '',
    hsc_index: '', 
    ssc_index: ''
  });

  const [passData, setPassData] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // Fetch school details from Firestore
  useEffect(() => {
    const fetchSchool = async () => {
      if (!profile?.schoolId) return;
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, 'schools', profile.schoolId));
        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            name: data.name || '',
            address: data.address || '',
            board: data.board || '',
            registration_code: data.registration_code || '',
            iso_certification: data.iso_certification || '',
            email: data.email || '',
            phone: data.phone || '',
            logo: data.logo || '',
            institute_name: data.institute_name || '',
            est_date: data.est_date || '',
            udise_code: data.udise_code || '',
            village: data.village || '',
            city: data.city || '',
            taluka: data.taluka || '',
            district: data.district || '',
            pincode: data.pincode || '',
            board_type: data.board_type || '',
            board_code: data.board_code || '',
            medium: data.medium || '',
            slogan: data.slogan || '',
            secondary_logo: data.secondary_logo || '',
            hsc_index: data.hsc_index || '',
            ssc_index: data.ssc_index || ''
          });
        }
      } catch (err) {
        console.error("Failed to load school profile:", err);
        toast.error(isMarathi ? "संस्था माहिती लोड करण्यास अडचण आली." : "Failed to load school profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchSchool();
  }, [profile?.schoolId]);

  // Base64 file converter
  const handleFileChange = (e, field = 'logo') => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        toast.error(isMarathi ? "फाइलचा आकार २MB पेक्षा जास्त नसावा!" : "File size must be under 2MB!");
        e.target.value = null;
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Update profile handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile?.schoolId) return;

    try {
      setLoading(true);
      if (formData.name.trim() === '') {
        toast.error(isMarathi ? 'शाळेचे नाव रिक्त असू शकत नाही.' : 'School Name cannot be empty.');
        return;
      }

      // Update in Firestore
      await setDoc(doc(db, 'schools', profile.schoolId), {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Update in Zustand Local Session Store
      if (profile) {
        setProfile({
          ...profile,
          schoolName: formData.name
        });
      }

      toast.success(isMarathi ? "संस्था माहिती यशस्वीरित्या जतन केली!" : "School profile updated successfully!");
    } catch (err) {
      console.error("Profile update failed:", err);
      toast.error(isMarathi ? "माहिती जतन करताना चूक झाली." : "Failed to update profile settings.");
    } finally {
      setLoading(false);
    }
  };

  // Change password handler via Firebase Authentication
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.newPass !== passData.confirmPass) {
      toast.error(isMarathi ? 'नवीन संकेतशब्द जुळत नाहीत!' : 'New passwords do not match!');
      return;
    }
    if (passData.newPass.length < 6) {
      toast.error(isMarathi ? 'संकेतशब्द किमान ६ अक्षरी असावा!' : 'Password must be at least 6 characters!');
      return;
    }

    try {
      setPassLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        await updatePassword(user, passData.newPass);
        toast.success(isMarathi ? "संकेतशब्द यशस्वीरित्या बदलला!" : "Password updated successfully!");
        setPassData({ oldPass: '', newPass: '', confirmPass: '' });
      } else {
        toast.error(isMarathi ? "सत्र अवैध आहे, कृपया पुन्हा लॉग इन करा." : "Session invalid, please re-login.");
      }
    } catch (err) {
      console.error("Password update failed:", err);
      if (err.code === 'auth/requires-recent-login') {
        toast.error(isMarathi 
          ? "सुरक्षेसाठी कृपया लॉग आउट करून पुन्हा लॉग इन करा आणि संकेतशब्द बदला." 
          : "For security, please log out, log back in, and try changing password again.");
      } else {
        toast.error(isMarathi ? "संकेतशब्द बदलताना चूक झाली." : "Failed to update password.");
      }
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="settings-page-wrapper">
      {/* Screen Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            {profile?.role === 'admin' 
              ? (isMarathi ? 'संस्था माहिती व सेटिंग्ज' : 'School Profile & Settings')
              : (isMarathi ? 'सुरक्षा सेटिंग्ज' : 'Security Settings')}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {profile?.role === 'admin'
              ? (isMarathi 
                  ? 'तुमच्या शाळेची बोर्ड जोडणी, UDISE कोड, एसएससी/एचएससी इंडेक्स क्रमांक आणि लोगोज नियंत्रित करा.' 
                  : "Manage board affiliation, UDISE credentials, secondary logos, index codes, and login credentials.")
              : (isMarathi 
                  ? 'तुमचा लॉगिन संकेतशब्द आणि सुरक्षा क्रेडेंशियल्स नियंत्रित करा.' 
                  : 'Manage your login credentials and security settings.')}
          </p>
        </div>
      </div>

      <div className="settings-grid-container">
        {/* Profile Card */}
        {profile?.role === 'admin' && (
          <div className="settings-premium-card profile-settings-card">
          <h3 className="settings-section-title">
            <Building2 size={24} /> 
            {isMarathi ? 'संस्था माहिती (School Profile)' : 'Institution & Board Profile'}
          </h3>
          
          <form onSubmit={handleUpdateProfile}>
            <div className="settings-modern-form-wrapper">
              {/* 1. General Profile Info Section */}
              <h4 className="settings-section-subtitle">
                {isMarathi ? '१. सामान्य माहिती (General Details)' : '1. General & Affiliation Details'}
              </h4>
              <div className="settings-section-grid">
                <div className="settings-form-group">
                  <label>{isMarathi ? 'शाळा ओळख क्रमांक (School ID)' : 'School ID'}</label>
                  <input type="text" value={profile?.schoolId || ''} disabled className="settings-input-field" style={{ cursor: 'not-allowed', fontWeight: 'bold' }} />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'संस्थेचे नाव' : 'Institution / Trust Name'}</label>
                  <input type="text" value={formData.institute_name} onChange={(e) => setFormData({ ...formData, institute_name: e.target.value })} placeholder="e.g. Vidya Prasarak Mandal" className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'शाळेचे पूर्ण नाव' : 'School Name'}</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'माध्यम (Medium)' : 'Medium'}</label>
                  <select value={formData.medium} onChange={(e) => setFormData({ ...formData, medium: e.target.value })} className="settings-input-field">
                    <option value="">Select Medium</option>
                    <option value="Marathi">{isMarathi ? 'मराठी' : 'Marathi'}</option>
                    <option value="Semi-English">{isMarathi ? 'सेमी-इंग्रजी' : 'Semi-English'}</option>
                    <option value="English">{isMarathi ? 'इंग्रजी' : 'English'}</option>
                    <option value="Urdu">{isMarathi ? 'उर्दू' : 'Urdu'}</option>
                    <option value="Hindi">{isMarathi ? 'हिंदी' : 'Hindi'}</option>
                  </select>
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'शाळेचे ब्रीदवाक्य / घोषवाक्य' : 'School Motto / Slogan'}</label>
                  <input type="text" value={formData.slogan} onChange={(e) => setFormData({ ...formData, slogan: e.target.value })} placeholder="e.g. ज्ञानं परमं बलम्" className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'स्थापना वर्ष' : 'Establishment Date'}</label>
                  <input type="text" value={formData.est_date} onChange={(e) => setFormData({ ...formData, est_date: e.target.value })} placeholder="e.g. 1995" className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'ISO प्रमाणपत्र' : 'ISO Certification Code'}</label>
                  <input type="text" value={formData.iso_certification} onChange={(e) => setFormData({ ...formData, iso_certification: e.target.value })} placeholder="e.g. ISO 9001:2015 CERTIFIED" className="settings-input-field" />
                </div>
              </div>

              {/* 2. Board & Academic Credentials */}
              <h4 className="settings-section-subtitle">
                {isMarathi ? '२. बोर्ड व शैक्षणिक तपशील (Board & Academic)' : '2. Board & Academic Details'}
              </h4>
              <div className="settings-section-grid">
                <div className="settings-form-group">
                  <label>{isMarathi ? 'बोर्ड प्रकार' : 'Board Type'}</label>
                  <select value={formData.board_type} onChange={(e) => setFormData({ ...formData, board_type: e.target.value })} className="settings-input-field">
                    <option value="">Select Board Type</option>
                    <option value="SSC">SSC</option>
                    <option value="HSC">HSC</option>
                    <option value="SSC & HSC">SSC & HSC</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'बोर्ड कोड / अनुक्रमांक' : 'Board Code'}</label>
                  <input type="text" value={formData.board_code} onChange={(e) => setFormData({ ...formData, board_code: e.target.value })} placeholder="e.g. S-1234" className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'बोर्ड संलग्नता' : 'Board Affiliation Name'}</label>
                  <input type="text" value={formData.board} onChange={(e) => setFormData({ ...formData, board: e.target.value })} placeholder="e.g. MAHARASHTRA STATE BOARD" className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'एस.एस.सी. इंडेक्स' : 'SSC Index No'}</label>
                  <input type="text" value={formData.ssc_index} onChange={(e) => setFormData({ ...formData, ssc_index: e.target.value })} placeholder="e.g. S-14.02.022" className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'एच.एस.सी. इंडेक्स' : 'HSC Index No'}</label>
                  <input type="text" value={formData.hsc_index} onChange={(e) => setFormData({ ...formData, hsc_index: e.target.value })} placeholder="e.g. J-14.02.008" className="settings-input-field" />
                </div>
              </div>

              {/* 3. Contact & Regional Details */}
              <h4 className="settings-section-subtitle">
                {isMarathi ? '३. संपर्क व पत्ता (Contact & Location)' : '3. Contact & Location Details'}
              </h4>
              <div className="settings-section-grid">
                <div className="settings-form-group">
                  <label>{isMarathi ? 'शाळेचा ई-मेल' : 'School Email Address'}</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'संपर्क क्रमांक / फोन' : 'School Phone / Landline'}</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'यु-डायस कोड' : 'UDISE Code'}</label>
                  <input type="text" value={formData.udise_code} onChange={(e) => setFormData({ ...formData, udise_code: e.target.value })} placeholder="e.g. 27020218709" className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'नोंदणी क्रमांक' : 'Registration No'}</label>
                  <input type="text" value={formData.registration_code} onChange={(e) => setFormData({ ...formData, registration_code: e.target.value })} placeholder="e.g. Reg-5690" className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'गाव' : 'Village'}</label>
                  <input type="text" value={formData.village} onChange={(e) => setFormData({ ...formData, village: e.target.value })} className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'शहर / तालुका' : 'City'}</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'तालुका' : 'Taluka'}</label>
                  <input type="text" value={formData.taluka} onChange={(e) => setFormData({ ...formData, taluka: e.target.value })} className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'जिल्हा' : 'District'}</label>
                  <input type="text" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className="settings-input-field" />
                </div>
                <div className="settings-form-group">
                  <label>{isMarathi ? 'पिनकोड' : 'Pincode'}</label>
                  <input type="text" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} className="settings-input-field" />
                </div>
                <div className="settings-form-group span-full-width">
                  <label>{isMarathi ? 'शाळेचा पूर्ण पत्ता' : 'Physical Full Address'}</label>
                  <textarea 
                    value={formData.address} 
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                    placeholder={isMarathi ? 'शाळेचा पूर्ण पत्ता येथे लिहा...' : 'Enter school postal physical address...'}
                    rows={2}
                    className="settings-input-field"
                    style={{ height: 'auto' }}
                  ></textarea>
                </div>
              </div>

              {/* 4. Branding & Logos Upload */}
              <h4 className="settings-section-subtitle">
                {isMarathi ? '४. शाळेचे लोगोज (School Branding Logos)' : '4. School Branding Logos'}
              </h4>
              <div className="logo-upload-modern-grid">
                <div className="logo-uploader-container">
                  <label className="logo-uploader-label">
                    <ImageIcon size={18} />
                    {isMarathi ? 'शाळेचा अधिकृत लोगो (School Logo)' : 'Primary School Logo'}
                  </label>
                  <div className="logo-dropzone-box" onClick={() => document.getElementById('primaryLogoInput').click()}>
                    {formData.logo ? (
                      <img src={formData.logo} alt="School Logo" className="logo-preview-image" />
                    ) : (
                      <span className="logo-empty-text">{isMarathi ? 'लोगो लोड करा (+)' : 'Upload Primary Logo (+)'}</span>
                    )}
                  </div>
                  <input 
                    id="primaryLogoInput"
                    type="file" 
                    accept="image/png, image/jpeg" 
                    onChange={(e) => handleFileChange(e, 'logo')} 
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button" 
                    className="settings-logo-btn" 
                    onClick={() => document.getElementById('primaryLogoInput').click()}
                  >
                    {isMarathi ? 'फाइल निवडा' : 'Choose File'}
                  </button>
                </div>

                <div className="logo-uploader-container">
                  <label className="logo-uploader-label">
                    <ImageIcon size={18} />
                    {isMarathi ? 'संस्थेचा लोगो (Secondary Logo)' : 'Secondary Logo'}
                  </label>
                  <div className="logo-dropzone-box" onClick={() => document.getElementById('secondaryLogoInput').click()}>
                    {formData.secondary_logo ? (
                      <img src={formData.secondary_logo} alt="Institution Logo" className="logo-preview-image" />
                    ) : (
                      <span className="logo-empty-text">{isMarathi ? 'लोगो लोड करा (+)' : 'Upload Secondary Logo (+)'}</span>
                    )}
                  </div>
                  <input 
                    id="secondaryLogoInput"
                    type="file" 
                    accept="image/png, image/jpeg" 
                    onChange={(e) => handleFileChange(e, 'secondary_logo')} 
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button" 
                    className="settings-logo-btn" 
                    onClick={() => document.getElementById('secondaryLogoInput').click()}
                  >
                    {isMarathi ? 'फाइल निवडा' : 'Choose File'}
                  </button>
                </div>
              </div>
            </div>

            <div className="settings-bottom-actions">
              <button 
                type="submit" 
                disabled={loading}
                className="settings-save-btn"
              >
                <Save size={18} />
                {isMarathi ? 'बदल जतन करा' : 'Save Institution Profile'}
              </button>
            </div>
          </form>
        </div>
        )}

        {/* Change Password Security Card */}
        <div className="settings-premium-card security-settings-card">
          <h3 className="settings-section-title security-title">
            <KeyRound size={22} /> 
            {isMarathi ? 'सुरक्षा आणि संकेतशब्द' : 'Security & Credentials'}
          </h3>
          
          <form onSubmit={handleChangePassword}>
            <div className="settings-form-group">
              <label>{isMarathi ? 'नवीन संकेतशब्द (New Password)' : 'New Password'}</label>
              <input 
                type="password" 
                value={passData.newPass} 
                onChange={(e) => setPassData({ ...passData, newPass: e.target.value })} 
                required 
                placeholder="Enter at least 6 characters"
                className="settings-input-field" 
              />
            </div>
            
            <div className="settings-form-group">
              <label>{isMarathi ? 'संकेतशब्दाची पुष्टी करा' : 'Confirm New Password'}</label>
              <input 
                type="password" 
                value={passData.confirmPass} 
                onChange={(e) => setPassData({ ...passData, confirmPass: e.target.value })} 
                required 
                className="settings-input-field" 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={passLoading}
              className="settings-security-btn"
            >
              <ShieldCheck size={18} />
              {isMarathi ? 'संकेतशब्द बदला' : 'Update Access Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
