import React, { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { FiShoppingBag, FiCreditCard, FiCalendar, FiArrowLeft } from 'react-icons/fi';
import { addExpense } from '../../services/accountService';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const ExpenseEntry = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category: 'Salary',
    amount: '',
    description: '',
    paymentMode: 'Bank Transfer',
    expenseDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return toast.error("Please fill all details");

    setIsSubmitting(true);
    try {
      await addExpense({
        ...formData,
        schoolId: profile.schoolId,
        amount: Number(formData.amount)
      });
      toast.success("Expense recorded successfully!");
      setFormData({ ...formData, amount: '', description: '' });
    } catch (error) {
      toast.error("Error recording expense");
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
        <h1 style={{ fontSize: '1.875rem', marginBottom: '2rem' }}>Expense Management</h1>
        
        <div className="premium-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label><FiShoppingBag /> Category</label>
              <select 
                className="premium-input"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option>Salary</option>
                <option>Electricity Bill</option>
                <option>Rent</option>
                <option>Maintenance</option>
                <option>Stationery</option>
                <option>Events / Functions</option>
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
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Description / Note</label>
              <textarea 
                required 
                className="premium-input" 
                rows="3"
                placeholder="e.g. Monthly salary for staff"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label><FiCreditCard /> Payment Mode</label>
                <select 
                  className="premium-input"
                  value={formData.paymentMode}
                  onChange={e => setFormData({...formData, paymentMode: e.target.value})}
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
                  value={formData.expenseDate}
                  onChange={e => setFormData({...formData, expenseDate: e.target.value})}
                />
              </div>
            </div>

            <Button type="submit" isLoading={isSubmitting} variant="danger" style={{ marginTop: '1rem' }}>
              Record Expense
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

export default ExpenseEntry;
