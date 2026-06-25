import React, { useState, useEffect } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import useAuthStore from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import { addCustomLedger } from '../../services/accountService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
  FiList, FiPlus, FiFolder, FiTrendingUp, FiTrendingDown, 
  FiBookmark, FiPrinter, FiX, FiCheck, FiInfo, FiLayers, FiArrowLeft
} from 'react-icons/fi';

const LedgerList = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { isMarathi } = useLanguage();
  const { transactions, ledgers: dbLedgers, loading } = useAccounts(profile?.schoolId);

  // States
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'debit', // debit = Expense/Payment, credit = Income/Receipt
    openingBalance: '',
    description: ''
  });

  // Default system ledgers
  const defaultLedgers = [
    { name: 'Fee', type: 'credit', labelMarathi: 'विद्यार्थी फी संकलन', labelEnglish: 'Student Fee Collection', isSystem: true },
    { name: 'Salary', type: 'debit', labelMarathi: 'कर्मचारी वेतन (पगार)', labelEnglish: 'Staff Salary Expense', isSystem: true },
    { name: 'Office', type: 'debit', labelMarathi: 'कार्यालयीन प्रशासकीय खर्च', labelEnglish: 'Office & Admin Expense', isSystem: true },
    { name: 'MidDayMeal', type: 'debit', labelMarathi: 'शालेय पोषण आहार खर्च', labelEnglish: 'Mid-Day Meal Expense', isSystem: true },
    { name: 'Maintenance', type: 'debit', labelMarathi: 'शाळा इमारत व साहित्य देखभाल', labelEnglish: 'School Maintenance', isSystem: true },
    { name: 'Grants', type: 'credit', labelMarathi: 'शासकीय अनुदान (Grants)', labelEnglish: 'Government Grants', isSystem: true },
    { name: 'BankInterest', type: 'credit', labelMarathi: 'बँक व्याज जमा (Interest)', labelEnglish: 'Bank Interest Received', isSystem: true },
    { name: 'Miscellaneous', type: 'both', labelMarathi: 'किरकोळ जमा-खर्च (इतर)', labelEnglish: 'Miscellaneous Ledger', isSystem: true }
  ];

  // Combined master list of ledgers
  const [allLedgers, setAllLedgers] = useState([]);

  useEffect(() => {
    // 1. Group transaction sums by category
    const transactionSummary = (transactions || []).reduce((acc, t) => {
      const cat = t.category || t.ledgerName || 'Miscellaneous';
      if (!acc[cat]) {
        acc[cat] = { debit: 0, credit: 0 };
      }
      if (t.type === 'debit') {
        acc[cat].debit += Number(t.amount || 0);
      } else {
        acc[cat].credit += Number(t.amount || 0);
      }
      return acc;
    }, {});

    // 2. Map system ledgers with transaction summaries
    const systemMapped = defaultLedgers.map(l => {
      const summary = transactionSummary[l.name] || { debit: 0, credit: 0 };
      return {
        id: `sys-${l.name}`,
        name: l.name,
        displayName: isMarathi ? l.labelMarathi : l.labelEnglish,
        type: l.type,
        openingBalance: 0,
        debit: summary.debit,
        credit: summary.credit,
        isSystem: true
      };
    });

    // 3. Map Firestore custom ledgers with transaction summaries
    const dbMapped = (dbLedgers || []).map(l => {
      const summary = transactionSummary[l.name] || { debit: 0, credit: 0 };
      const opBal = Number(l.openingBalance || 0);
      
      // Calculate dynamic debits/credits including initial opening balance values
      let currentDebit = summary.debit;
      let currentCredit = summary.credit;

      if (l.type === 'debit') {
        currentDebit += opBal;
      } else {
        currentCredit += opBal;
      }

      return {
        id: l.id,
        name: l.name,
        displayName: l.name,
        type: l.type,
        openingBalance: opBal,
        debit: currentDebit,
        credit: currentCredit,
        description: l.description,
        isSystem: false
      };
    });

    // 4. Find any transaction categories that don't belong to system or db ledgers (auto-created dynamically)
    const existingLedgerNames = new Set([
      ...defaultLedgers.map(l => l.name),
      ...(dbLedgers || []).map(l => l.name)
    ]);

    const dynamicMapped = [];
    Object.keys(transactionSummary).forEach(cat => {
      if (!existingLedgerNames.has(cat)) {
        const summary = transactionSummary[cat];
        dynamicMapped.push({
          id: `dyn-${cat}`,
          name: cat,
          displayName: cat,
          type: summary.credit >= summary.debit ? 'credit' : 'debit',
          openingBalance: 0,
          debit: summary.debit,
          credit: summary.credit,
          isSystem: false,
          isDynamic: true
        });
      }
    });

    setAllLedgers([...systemMapped, ...dbMapped, ...dynamicMapped]);

  }, [transactions, dbLedgers, isMarathi]);

  // Handle Create Ledger Form Submission
  const handleCreateLedger = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.error(isMarathi ? "कृपया खाते नाव प्रविष्ट करा!" : "Please enter ledger name!");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        schoolId: profile?.schoolId,
        name: formData.name.trim(),
        type: formData.type,
        openingBalance: Number(formData.openingBalance || 0),
        description: formData.description || 'Custom User Created Ledger Head',
        createdBy: profile?.uid || 'Admin'
      };

      await addCustomLedger(payload);
      toast.success(isMarathi ? "नवीन खाते यशस्वीरित्या जोडले गेले!" : "New ledger head created successfully!");
      setShowModal(false);
      
      // Reset form
      setFormData({
        name: '',
        type: 'debit',
        openingBalance: '',
        description: ''
      });
    } catch (err) {
      console.error(err);
      toast.error(isMarathi ? "खाते जोडताना त्रुटी आली!" : "Error creating ledger!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ledger-module-container">
      {/* Dynamic styling block */}
      <style>{`
        .ledger-module-container {
          padding: 0.5rem;
          color: var(--text-main);
        }

        .ledger-back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: var(--text-muted);
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          transition: color 0.2s ease;
        }

        .ledger-back-btn:hover {
          color: var(--primary);
        }

        .ledger-header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .ledger-title-wrapper h1 {
          font-size: 2rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-main);
          font-family: var(--font-heading);
          margin-bottom: 0.25rem;
        }

        .ledger-title-wrapper h1 svg {
          color: var(--primary);
        }

        .ledger-actions {
          display: flex;
          gap: 12px;
        }

        .ledger-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.25s ease;
          border: 1px solid transparent;
        }

        .ledger-btn-primary {
          background: linear-gradient(135deg, var(--primary, #6366f1) 0%, #4f46e5 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
        }

        .ledger-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
        }

        .ledger-btn-secondary {
          background: var(--card-bg, #ffffff);
          color: var(--text-main);
          border: 1px solid var(--border);
        }

        .ledger-btn-secondary:hover {
          background: var(--background);
          transform: translateY(-2px);
        }

        /* Stats bar */
        .ledger-quick-info {
          background: rgba(99, 102, 241, 0.04);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 2rem;
          color: var(--text-main);
          font-size: 0.9rem;
        }

        .ledger-quick-info svg {
          color: var(--primary);
          flex-shrink: 0;
        }

        /* Ledger Table styles */
        .ledger-grid-card {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 1.75rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
        }

        .ledger-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .ledger-table th {
          padding: 1rem;
          background: var(--background, #f8fafc);
          color: var(--text-muted);
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          border-bottom: 2px solid var(--border);
        }

        .ledger-table td {
          padding: 1.1rem 1rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.9rem;
          color: var(--text-main);
        }

        .ledger-table tr:hover {
          background: rgba(99, 102, 241, 0.02);
        }

        .ledger-type-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          display: inline-block;
        }

        .ledger-badge-credit { background: rgba(34, 197, 94, 0.08); color: #16a34a; }
        .ledger-badge-debit { background: rgba(239, 68, 68, 0.08); color: #dc2626; }
        .ledger-badge-both { background: rgba(168, 85, 247, 0.08); color: #a855f7; }

        .system-badge {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          margin-left: 8px;
        }

        .custom-badge {
          background: rgba(99, 102, 241, 0.1);
          color: #4f46e5;
          border: 1px solid rgba(99, 102, 241, 0.2);
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          margin-left: 8px;
        }

        /* Modal styling */
        .ledger-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 1.5rem;
        }

        .ledger-modal {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border);
          border-radius: 24px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: ledger-scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes ledger-scaleIn {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .ledger-modal-header {
          padding: 1.5rem 1.75rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ledger-modal-header h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ledger-modal-body {
          padding: 1.75rem;
        }

        .ledger-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 1.25rem;
        }

        .ledger-input-group label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .ledger-input {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 1.5px solid var(--border);
          background: var(--background, #f8fafc);
          color: var(--text-main);
          font-size: 0.9rem;
          font-weight: 500;
          outline: none;
          transition: all 0.25s ease;
        }

        .ledger-input:focus {
          border-color: var(--primary);
          background: var(--card-bg);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .ledger-modal-footer {
          padding: 1.25rem 1.75rem;
          border-top: 1px solid var(--border);
          background: var(--background);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .ledger-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.2rem;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .ledger-close-btn:hover {
          background: var(--border);
          color: var(--text-main);
        }

        /* Printable optimization */
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          .ledger-print-area, .ledger-print-area * {
            visibility: visible;
          }
          .ledger-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }
          .ledger-back-btn, .ledger-header-section, .ledger-actions, .ledger-btn, .ledger-quick-info {
            display: none !important;
          }
          .ledger-grid-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .ledger-table th {
            background: #f1f5f9 !important;
            border-bottom: 1.5px solid #000 !important;
            color: #000 !important;
          }
          .ledger-table td {
            border-bottom: 1px solid #ddd !important;
            color: #000 !important;
          }
          .ledger-official-print-header {
            display: block !important;
            text-align: center;
            margin-bottom: 1.5rem;
            border-bottom: 2px solid #000;
            padding-bottom: 0.5rem;
          }
        }

        .ledger-official-print-header {
          display: none;
        }
      `}</style>

      {/* Back button */}
      <button className="ledger-back-btn" onClick={() => navigate('/admin/accounts')}>
        <FiArrowLeft />
        <span>{isMarathi ? 'डॅशबोर्डवर परत जा' : 'Back to Accounts'}</span>
      </button>

      {/* Main Printable Area Wrapper */}
      <div className="ledger-print-area">
        
        {/* Printable Official Header */}
        <div className="ledger-official-print-header">
          <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
            {profile?.schoolName || 'National Public School'}
          </h2>
          <p style={{ margin: '4px 0', fontSize: '0.9rem', fontWeight: '700' }}>
            {isMarathi ? 'खातेवही तक्ता (Chart of Accounts)' : 'Chart of Accounts & Ledger Balance Sheet'}
          </p>
          <p style={{ margin: '2px 0', fontSize: '0.8rem', color: '#333' }}>
            {isMarathi ? `मुद्रित दिनांक: ${new Date().toLocaleDateString('mr-IN')}` : `Printed Date: ${new Date().toLocaleDateString()}`}
          </p>
        </div>

        {/* Top Header Section */}
        <div className="ledger-header-section">
          <div className="ledger-title-wrapper">
            <h1>
              <FiList />
              {isMarathi ? 'खातेवही सूची (Chart of Accounts)' : 'Chart of Accounts'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {isMarathi 
                ? 'शाळेचे सर्व अधिकृत आणि वापरकर्ता-निर्मित (Custom) खाते प्रकार आणि त्यांच्या एकूण शिल्लक रकमा.'
                : 'Master ledger list of all system-defined and custom accounts with active debit/credit closing balances.'}
            </p>
          </div>
          <div className="ledger-actions">
            <button className="ledger-btn ledger-btn-secondary" onClick={handlePrint}>
              <FiPrinter /> {isMarathi ? 'प्रिंट काढा' : 'Print list'}
            </button>
            <button className="ledger-btn ledger-btn-primary" onClick={() => setShowModal(true)}>
              <FiPlus /> {isMarathi ? 'नवीन खाते तयार करा' : 'Create New Ledger'}
            </button>
          </div>
        </div>

        {/* Quick Information Alert */}
        <div className="ledger-quick-info">
          <FiInfo size={20} />
          <span>
            {isMarathi 
              ? 'टीप: येथे दर्शवलेली एकूण जमा (Credit) आणि एकूण खर्च (Debit) यामध्ये प्रत्येक खात्याच्या सुरुवातीच्या शिलकीचा (Opening Balance) समावेश केलेला आहे.'
              : 'Note: The Total Credit and Debit values shown below reflect all combined transactions plus the opening balances specified during ledger creation.'}
          </span>
        </div>

        {/* Ledger Master Dashboard Grid Card */}
        <div className="ledger-grid-card">
          <table className="ledger-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>{isMarathi ? 'खात्याचे नाव (Ledger Head)' : 'Account / Ledger Name'}</th>
                <th style={{ width: '15%', textAlign: 'center' }}>{isMarathi ? 'खाते प्रकार' : 'Ledger Type'}</th>
                <th style={{ width: '15%', textAlign: 'right' }}>{isMarathi ? 'एकूण जमा (+ Cr)' : 'Total Credits (Cr)'}</th>
                <th style={{ width: '15%', textAlign: 'right' }}>{isMarathi ? 'एकूण खर्च (- Dr)' : 'Total Debits (Dr)'}</th>
                <th style={{ width: '20%', textAlign: 'right' }}>{isMarathi ? 'अखेरची शिल्लक (Balance)' : 'Closing Balance'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {isMarathi ? 'खातेवही माहिती लोड होत आहे...' : 'Loading Chart of Accounts...'}
                  </td>
                </tr>
              ) : allLedgers.length > 0 ? (
                allLedgers.map((ledger) => {
                  const balance = ledger.credit - ledger.debit;
                  return (
                    <tr key={ledger.id}>
                      <td style={{ fontWeight: '700', display: 'flex', alignItems: 'center' }}>
                        <span>{ledger.displayName}</span>
                        {ledger.isSystem ? (
                          <span className="system-badge">{isMarathi ? 'सिस्टीम' : 'System'}</span>
                        ) : (
                          <span className="custom-badge">{isMarathi ? 'वापरकर्ता' : 'Custom'}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`ledger-type-badge ledger-badge-${ledger.type}`}>
                          {ledger.type === 'credit' 
                            ? (isMarathi ? 'जमा (Income)' : 'Receipt') 
                            : ledger.type === 'debit' 
                              ? (isMarathi ? 'खर्च (Expense)' : 'Payment') 
                              : (isMarathi ? 'दोन्ही (Both)' : 'Both')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: '600' }}>
                        ₹{ledger.credit.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: '600' }}>
                        ₹{ledger.debit.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '0.95rem' }}>
                        ₹{Math.abs(balance).toLocaleString('en-IN')}
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', marginLeft: '4px', color: balance >= 0 ? '#16a34a' : '#dc2626' }}>
                          {balance >= 0 ? 'Cr' : 'Dr'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {isMarathi ? 'कोणतेही खाते सापडले नाही.' : 'No active ledger accounts found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Create Custom Ledger Modal Form */}
      {showModal && (
        <div className="ledger-modal-overlay">
          <div className="ledger-modal">
            
            {/* Modal Header */}
            <div className="ledger-modal-header">
              <h3>
                <FiLayers style={{ color: 'var(--primary)' }} />
                {isMarathi ? 'नवीन खाते प्रकार तयार करा' : 'Create New Account Head'}
              </h3>
              <button className="ledger-close-btn" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateLedger}>
              <div className="ledger-modal-body">
                
                {/* Ledger Name Input */}
                <div className="ledger-input-group">
                  <label>{isMarathi ? 'खात्याचे नाव (Ledger Name) *' : 'Ledger Account Name *'}</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    placeholder={isMarathi ? "उदा. क्रीडा निधी खाते (Sports Fund)" : "e.g. Sports Equipment Fund"}
                    className="ledger-input" 
                  />
                </div>

                {/* Ledger Type Select Dropdown */}
                <div className="ledger-input-group">
                  <label>{isMarathi ? 'खाते श्रेणी प्रकार (Type) *' : 'Account Category Type *'}</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })} 
                    className="ledger-input"
                  >
                    <option value="debit">{isMarathi ? 'खर्च / देयक (Debit - Payment)' : 'Debit Ledger (Expenses/Asset)'}</option>
                    <option value="credit">{isMarathi ? 'जमा / उत्पन्न (Credit - Receipt)' : 'Credit Ledger (Incomes/Capital)'}</option>
                  </select>
                </div>

                {/* Initial Opening Balance */}
                <div className="ledger-input-group">
                  <label>{isMarathi ? 'आरंभीची शिल्लक (Opening Balance)' : 'Opening Balance (₹)'}</label>
                  <input 
                    type="number" 
                    value={formData.openingBalance} 
                    onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })} 
                    placeholder="0.00" 
                    className="ledger-input" 
                  />
                </div>

                {/* Description Input */}
                <div className="ledger-input-group">
                  <label>{isMarathi ? 'खात्याचा संक्षिप्त तपशील / वर्णन' : 'Ledger Description / Narration'}</label>
                  <textarea 
                    rows={3} 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    placeholder={isMarathi ? "खात्याचे संक्षिप्त वर्णन लिहा..." : "Write a brief details about this account head..."} 
                    className="ledger-input" 
                    style={{ resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="ledger-modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="ledger-btn ledger-btn-secondary"
                >
                  {isMarathi ? 'रद्द करा' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="ledger-btn ledger-btn-primary"
                >
                  {isSubmitting ? (
                    isMarathi ? 'तयार होत आहे...' : 'Creating...'
                  ) : (
                    <>
                      <FiCheck />
                      {isMarathi ? 'खाते तयार करा' : 'Create Ledger'}
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default LedgerList;
