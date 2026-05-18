import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Button from '../../components/ui/Button';
import { FiPlus, FiSearch, FiBriefcase, FiMapPin, FiMail, FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { createNewUser } from '../../services/authService';

const Schools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    schoolId: '',
    adminName: '',
    email: '',
    password: '',
    address: '',
    city: ''
  });

  // Realtime Fetch
  React.useEffect(() => {
    const q = query(collection(db, 'schools'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchools(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddSchool = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.schoolId || !formData.email || !formData.password) {
      return toast.error("Please fill all required fields (Name, ID, Email, Password)");
    }

    setIsSubmitting(true);
    try {
      // 1. Create the School Admin Account first
      await createNewUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.adminName || formData.name + " Admin",
        schoolId: formData.schoolId,
        role: 'admin',
        schoolName: formData.name
      });

      // 2. Register the School Record
      await addDoc(collection(db, 'schools'), {
        name: formData.name,
        schoolId: formData.schoolId,
        adminName: formData.adminName,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        status: 'active',
        createdAt: serverTimestamp()
      });

      toast.success("School and Admin Account created successfully!");
      setShowModal(false);
      setFormData({ name: '', schoolId: '', adminName: '', email: '', password: '', address: '', city: '' });
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error registering school");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}>Manage Schools</h1>
          <p style={{ color: 'var(--text-muted)' }}>Register and manage school accounts globally.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <FiPlus /> Register New School
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <p>Loading schools...</p>
        ) : schools.length > 0 ? schools.map((school) => (
          <motion.div 
            whileHover={{ y: -5 }}
            key={school.id} 
            className="premium-card" 
            style={{ padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)15', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                <FiBriefcase />
              </div>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'var(--success)15', color: 'var(--success)', fontSize: '0.75rem', fontWeight: '600' }}>ACTIVE</span>
            </div>
            
            <h3 style={{ marginBottom: '0.5rem' }}>{school.name}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>School ID: <strong>{school.schoolId}</strong></p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <FiSearch size={14} /> <span>Admin: {school.adminName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <FiMail size={14} /> <span>{school.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <FiMapPin size={14} /> <span>{school.city}, {school.address}</span>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="premium-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <p>No schools registered yet.</p>
          </div>
        )}
      </div>

      {/* Register Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Register New School</h2>
            <form onSubmit={handleAddSchool} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>School Name *</label>
                <input required className="premium-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. ABC Public School" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Unique School ID *</label>
                  <input required className="premium-input" value={formData.schoolId} onChange={e => setFormData({...formData, schoolId: e.target.value})} placeholder="e.g. SCH001" />
                </div>
                <div className="form-group">
                  <label>Admin Name</label>
                  <input className="premium-input" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} placeholder="Full Name" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Admin Email *</label>
                  <input type="email" required className="premium-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="admin@school.com" />
                </div>
                <div className="form-group">
                  <label>Admin Password *</label>
                  <input type="password" required className="premium-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                </div>
              </div>
              <div className="form-group">
                <label>City & Address</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="premium-input" style={{ width: '40%' }} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="City" />
                  <input className="premium-input" style={{ flex: 1 }} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full Address" />
                </div>
              </div>
              
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Register School</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <style>{`
        .premium-input { width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); outline: none; margin-top: 0.4rem; }
        label { font-size: 0.8125rem; font-weight: 500; color: var(--text-muted); }
      `}</style>
    </div>
  );
};

export default Schools;
