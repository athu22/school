import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { FiPlus, FiPrinter, FiSearch, FiFileText } from 'react-icons/fi';
import { getCertificateHistory } from '../../services/certificateService';
import useAuthStore from '../../store/authStore';

const CertificateDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profile?.schoolId) return;
    const unsubscribe = getCertificateHistory(profile.schoolId, (data) => {
      setHistory(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [profile?.schoolId]);

  const filteredHistory = history.filter(h => 
    h.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}>Certificate Engine</h1>
          <p style={{ color: 'var(--text-muted)' }}>Generate and manage official school certificates.</p>
        </div>
        <Button onClick={() => navigate('/admin/certificates/generate')}>
          <FiPlus /> Generate Certificate
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="premium-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <FiFileText size={32} color="var(--primary)" />
          <h2 style={{ marginTop: '1rem', fontSize: '1.5rem' }}>{history.length}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Total Generated</p>
        </div>
        {/* Add more metric cards if needed */}
      </div>

      <div className="premium-card">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by student name or certificate no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
            />
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Certificate No</th>
              <th style={{ padding: '1rem' }}>Student Name</th>
              <th style={{ padding: '1rem' }}>Type</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : filteredHistory.length > 0 ? filteredHistory.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>{item.createdAt?.toDate().toLocaleDateString()}</td>
                <td style={{ padding: '1rem' }}><strong>{item.certificateNumber}</strong></td>
                <td style={{ padding: '1rem' }}>{item.studentName}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'var(--primary)15', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '600' }}>
                    {item.certificateType}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button onClick={() => navigate(`/admin/certificates/preview/${item.id}`)} style={{ color: 'var(--primary)', background: 'none' }}><FiPrinter /></button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No certificates generated yet (0)</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CertificateDashboard;
