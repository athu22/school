import React, { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { FiUser, FiCreditCard, FiCalendar, FiArrowLeft } from 'react-icons/fi';
import { useStudents } from '../../hooks/useStudents';
import { collectFee } from '../../services/accountService';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const FeeCollection = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { students } = useStudents(profile?.schoolId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '',
    feeType: 'Tuition Fee',
    amount: '',
    paymentMode: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const handleCollect = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.amount) return toast.error("Please fill all details");

    const student = students.find(s => s.id === formData.studentId);

    setIsSubmitting(true);
    try {
      await collectFee({
        ...formData,
        studentName: student.fullName,
        schoolId: profile.schoolId,
        amount: Number(formData.amount)
      });
      toast.success("Fee collected successfully!");
      setFormData({ ...formData, amount: '', studentId: '' });
    } catch (error) {
      toast.error("Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <button onClick={() => navigate('/admin/accounts')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <FiArrowLeft /> Back to Accounts
      </button>

      <div style={{ maxWidth: '600px' }}>
        <h1 style={{ fontSize: '1.875rem', marginBottom: '2rem' }}>Fee Collection</h1>

        <div className="premium-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleCollect} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label><FiUser /> Select Student</label>
              <select
                required
                className="premium-input"
                value={formData.studentId}
                onChange={e => setFormData({ ...formData, studentId: e.target.value })}
              >
                <option value="">Choose student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.admissionNumber})</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Fee Category</label>
                <select
                  className="premium-input"
                  value={formData.feeType}
                  onChange={e => setFormData({ ...formData, feeType: e.target.value })}
                >
                  <option>Tuition Fee</option>
                  <option>Exam Fee</option>
                  <option>Transport Fee</option>
                  <option>Admission Fee</option>
                  <option>Miscellaneous</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  required
                  className="premium-input"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label><FiCreditCard /> Mode</label>
                <select
                  className="premium-input"
                  value={formData.paymentMode}
                  onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                >
                  <option>Cash</option>
                  <option>UPI / Online</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              </div>
              <div className="form-group">
                <label><FiCalendar /> Date</label>
                <input
                  type="date"
                  required
                  className="premium-input"
                  value={formData.paymentDate}
                  onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" isLoading={isSubmitting} style={{ marginTop: '1rem' }}>
              Record Payment & Issue Receipt
            </Button>
          </form>
        </div>
      </div>

      <style>{`
        .premium-input { width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); margin-top: 0.5rem; }
        label { font-size: 0.875rem; font-weight: 500; color: var(--text-muted); display: flex; alignItems: center; gap: 0.5rem; }
      `}</style>
    </DashboardLayout>
  );
};

export default FeeCollection;
