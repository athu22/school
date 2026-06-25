import React, { useState, useEffect } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import useAuthStore from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import { addExpense, deleteExpense } from '../../services/accountService';
import { toast } from 'react-toastify';
import { 
  FiShoppingBag, FiCreditCard, FiCalendar, FiArrowLeft, FiPlus, 
  FiSearch, FiTrash2, FiPrinter, FiDownload, FiFileText, FiUpload, FiFilter 
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const ExpenseEntry = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { isMarathi } = useLanguage();
  
  // Real-time hooks
  const { expenses, ledgers: dbLedgers, loading } = useAccounts(profile?.schoolId);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterLedger, setFilterLedger] = useState('All');

  // Attachment upload simulation state
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    category: 'Electricity Bill',
    bankName: 'SBI Bank',
    amount: '',
    paidTo: '',
    paymentMode: 'Bank',
    expenseDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Default system expense ledgers
  const defaultExpenseCategories = [
    { value: 'Staff Salary', labelMarathi: 'कर्मचारी पगार (Staff Salary)', labelEnglish: 'Staff Salary' },
    { value: 'Electricity Bill', labelMarathi: 'वीज बिल (Electricity Bill)', labelEnglish: 'Electricity Bill' },
    { value: 'Water Bill', labelMarathi: 'पाणी बिल (Water Bill)', labelEnglish: 'Water Bill' },
    { value: 'Internet Bill', labelMarathi: 'इंटरनेट बिल (Internet)', labelEnglish: 'Internet Bill' },
    { value: 'Stationary', labelMarathi: 'लेखनसाहित्य (Stationary)', labelEnglish: 'Stationary' },
    { value: 'Maintenance', labelMarathi: 'दुरुस्ती व देखभाल (Maintenance)', labelEnglish: 'Maintenance' },
    { value: 'Transport Expense', labelMarathi: 'वाहतूक खर्च (Transport)', labelEnglish: 'Transport Expense' },
    { value: 'Fuel Expense', labelMarathi: 'इंधन खर्च (Fuel)', labelEnglish: 'Fuel Expense' },
    { value: 'Event Expense', labelMarathi: 'कार्यक्रम खर्च (Event)', labelEnglish: 'Event Expense' },
    { value: 'Printing Expense', labelMarathi: 'छपाई खर्च (Printing)', labelEnglish: 'Printing Expense' },
    { value: 'Cleaning Expense', labelMarathi: 'स्वच्छता खर्च (Cleaning)', labelEnglish: 'Cleaning Expense' },
    { value: 'Marketing Expense', labelMarathi: 'जाहिरात व विपणन (Marketing)', labelEnglish: 'Marketing Expense' }
  ];

  // Merge with any custom user created expense ledgers from database
  const [allExpenseCategories, setAllExpenseCategories] = useState([]);

  useEffect(() => {
    const dbExpenses = (dbLedgers || []).filter(l => l.type === 'debit').map(l => ({
      value: l.name,
      labelMarathi: `${l.name} (सानुकूल)`,
      labelEnglish: `${l.name} (Custom)`
    }));
    setAllExpenseCategories([...defaultExpenseCategories, ...dbExpenses]);
  }, [dbLedgers]);

  // Handle Mock Attachment Upload Selection
  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      setAttachmentPreview(URL.createObjectURL(file));
      toast.success(isMarathi ? "फाइल जोडली गेली!" : "Attachment added successfully!");
    }
  };

  // Submit Expense Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      return toast.error(isMarathi ? "कृपया वैध रक्कम प्रविष्ट करा!" : "Please enter a valid amount!");
    }
    if (!formData.paidTo.trim()) {
      return toast.error(isMarathi ? "कृपया देयक नाव भरा!" : "Please specify paid-to receiver!");
    }

    setIsSubmitting(true);
    try {
      // Simulate file upload URL if attachment selected
      const mockAttachmentUrl = attachmentPreview || '';

      await addExpense({
        schoolId: profile?.schoolId,
        category: formData.category,
        amount: Number(formData.amount),
        description: formData.description || `${formData.category} paid to ${formData.paidTo}`,
        paymentMode: formData.paymentMode,
        bankName: formData.paymentMode === 'Cash' ? 'Cash In Hand' : formData.bankName,
        paidTo: formData.paidTo,
        expenseDate: formData.expenseDate,
        attachmentUrl: mockAttachmentUrl
      });

      toast.success(isMarathi ? "खर्चाची नोंद आणि पेमेंट व्हाउचर यशस्वीरित्या जोडले!" : "Expense posted & double-entry voucher completed!");
      
      // Reset form
      setFormData({
        category: 'Electricity Bill',
        bankName: 'SBI Bank',
        amount: '',
        paidTo: '',
        paymentMode: 'Bank',
        expenseDate: new Date().toISOString().split('T')[0],
        description: ''
      });
      setAttachment(null);
      setAttachmentPreview('');
    } catch (err) {
      console.error(err);
      toast.error(isMarathi ? "खर्च जोडताना चूक झाली." : "Error posting expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Expense & Reversal of double entry transactions
  const handleDelete = async (exp) => {
    if (window.confirm(isMarathi ? `आपण खात्रीने व्हाउचर ${exp.voucherNo} हटवू इच्छिता?` : `Are you sure you want to reverse voucher ${exp.voucherNo}?`)) {
      try {
        await deleteExpense(exp.id, exp.voucherNo);
        toast.success(isMarathi ? "व्हाउचर यशस्वीरित्या उलटवून हटवले!" : "Accounting entries reversed successfully!");
      } catch (err) {
        toast.error("Error deleting expense");
      }
    }
  };

  // Print voucher helper
  const handlePrintVoucher = (exp) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Voucher: ${exp.voucherNo}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2.5rem; color: #333; }
            .voucher-box { border: 2.5px solid #222; padding: 2.5rem; border-radius: 16px; max-width: 800px; margin: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2.5px solid #222; padding-bottom: 1.25rem; margin-bottom: 1.5rem; }
            .row { display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 0.95rem; }
            .title { font-size: 1.6rem; font-weight: 900; letter-spacing: 1px; color: #dc2626; text-transform: uppercase; margin: 8px 0; }
            .table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; margin-bottom: 1.5rem; }
            .table th, .table td { border: 1.5px solid #222; padding: 0.9rem; text-align: left; }
            .table th { background: #f8fafc; font-weight: bold; }
            .signatures { display: flex; justify-content: space-between; margin-top: 3.5rem; }
            .sig-line { border-top: 1.5px solid #222; width: 160px; text-align: center; padding-top: 6px; font-weight: 800; font-size: 0.8rem; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="voucher-box">
            <div class="header">
              <h2 style="margin:0; font-size: 1.8rem; text-transform:uppercase;">${profile?.schoolName || 'National Public School'}</h2>
              <div class="title">PAYMENT VOUCHER</div>
              <p style="margin: 4px 0;">Voucher No: <strong>${exp.voucherNo}</strong> | Date: ${exp.expenseDate}</p>
            </div>
            
            <div class="row">
              <div><strong>Paid To (Party / Person):</strong> ${exp.paidTo}</div>
              <div><strong>Payment Mode:</strong> ${exp.paymentMode} (${exp.bankName || 'Cash In Hand'})</div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Particulars / Ledger Account</th>
                  <th>Posting Type</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${exp.category}</td>
                  <td>Debit (Dr - Expense)</td>
                  <td style="text-align: right; font-weight: bold;">₹${Number(exp.amount).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td>${exp.bankName === 'Cash In Hand' ? 'Cash In Hand' : (exp.bankName || 'SBI Bank')}</td>
                  <td>Credit (Cr - Asset Cash/Bank)</td>
                  <td style="text-align: right; font-weight: bold;">₹${Number(exp.amount).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <div style="margin-bottom: 2.5rem; font-size: 0.95rem;">
              <strong>Particulars Description:</strong> ${exp.description || 'N/A'}
            </div>

            <div class="signatures">
              <div>
                <div style="height: 45px;"></div>
                <div class="sig-line">Receiver Signature</div>
              </div>
              <div>
                <div style="height: 45px;"></div>
                <div class="sig-line">Accountant</div>
              </div>
              <div>
                <div style="height: 45px;"></div>
                <div class="sig-line">Principal Seal</div>
              </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Voucher No,Expense Date,Expense Category,Paid To,Payment Mode,Bank Account,Amount,Description\n";

    filteredExpenses.forEach(exp => {
      csvContent += `"${exp.voucherNo}","${exp.expenseDate}","${exp.category}","${exp.paidTo}","${exp.paymentMode}","${exp.bankName || 'Cash'}","${exp.amount}","${exp.description}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Expenses_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters logic
  const filteredExpenses = (expenses || []).filter(exp => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (exp.voucherNo || '').toLowerCase().includes(searchLower) ||
      (exp.category || '').toLowerCase().includes(searchLower) ||
      (exp.paidTo || '').toLowerCase().includes(searchLower) ||
      (exp.description || '').toLowerCase().includes(searchLower);

    // Ledger Category filter
    const matchesLedger = filterLedger === 'All' || exp.category === filterLedger;

    // Monthly filter
    let matchesMonth = true;
    if (filterMonth !== 'All') {
      const expMonth = exp.expenseDate ? exp.expenseDate.substring(0, 7) : ''; // YYYY-MM
      matchesMonth = expMonth === filterMonth;
    }

    return matchesSearch && matchesLedger && matchesMonth;
  });

  // Calculate stats
  const totalExpenseAmount = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="expense-page-wrapper">
      <style>{`
        .expense-page-wrapper {
          padding: 0.5rem;
          color: var(--text-main);
        }

        .expense-top-nav {
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

        .expense-top-nav:hover {
          color: var(--primary);
        }

        .expense-layout-grid {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .expense-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        .expense-form-card {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
        }

        .expense-form-card h2 {
          font-size: 1.35rem;
          font-weight: 800;
          margin-bottom: 1.75rem;
          color: var(--text-main);
          font-family: var(--font-heading);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .expense-form-card h2 svg {
          color: var(--primary);
        }

        .exp-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 1.25rem;
        }

        .exp-input-group label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .exp-input {
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

        .exp-input:focus {
          border-color: var(--primary);
          background: var(--card-bg);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .exp-btn-submit {
          width: 100%;
          padding: 0.85rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .exp-btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35);
        }

        .workspace-card {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 1.75rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
        }

        /* Filter header */
        .workspace-filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .workspace-filters {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .workspace-search {
          position: relative;
          flex-grow: 1;
          max-width: 320px;
        }

        .workspace-search input {
          width: 100%;
          padding: 0.65rem 1rem 0.65rem 2.25rem;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          background: var(--background);
          color: var(--text-main);
          font-size: 0.85rem;
          outline: none;
        }

        .workspace-search svg {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .exp-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .exp-table th {
          padding: 0.9rem;
          background: var(--background, #f8fafc);
          color: var(--text-muted);
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          border-bottom: 2px solid var(--border);
        }

        .exp-table td {
          padding: 1rem 0.9rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.85rem;
        }

        .exp-action-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .exp-action-btn:hover {
          background: var(--border);
          color: var(--primary);
        }

        .exp-action-delete:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }

        .upload-dashed-box {
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 1.25rem;
          text-align: center;
          cursor: pointer;
          background: var(--background);
          transition: all 0.25s ease;
        }

        .upload-dashed-box:hover {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.02);
        }
      `}</style>

      {/* Back button link */}
      <button className="expense-top-nav" onClick={() => navigate('/admin/accounts')}>
        <FiArrowLeft />
        <span>{isMarathi ? 'खातेवही डॅशबोर्डवर परत जा' : 'Back to Accounts'}</span>
      </button>

      <div className="expense-layout-grid">
        
        {/* Left Pane: Record Expense form */}
        <div className="expense-form-card">
          <h2>
            <FiShoppingBag />
            {isMarathi ? 'नवीन खर्च व्हाउचर नोंदवा' : 'Record Payment Voucher'}
          </h2>

          <form onSubmit={handleSubmit}>
            
            {/* Expense Date */}
            <div className="exp-input-group">
              <label>{isMarathi ? 'खर्चाची तारीख *' : 'Expense Date *'}</label>
              <input 
                type="date" 
                required 
                className="exp-input"
                value={formData.expenseDate}
                onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
              />
            </div>

            {/* Expense Ledger Category selection */}
            <div className="exp-input-group">
              <label>{isMarathi ? 'खर्चाचे खाते श्रेणी (Debited Account) *' : 'Expense Category Ledger (Debit) *'}</label>
              <select
                className="exp-input"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {allExpenseCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {isMarathi ? cat.labelMarathi : cat.labelEnglish}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Source Cash/Bank ledger selection */}
            <div className="exp-input-group">
              <label>{isMarathi ? 'जमा खाते (Credited Account) *' : 'Source Cash/Bank (Credit) *'}</label>
              <select
                className="exp-input"
                value={formData.paymentMode}
                onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
              >
                <option value="Cash">{isMarathi ? 'रोख शिल्लक (Cash In Hand)' : 'Cash In Hand'}</option>
                <option value="Bank">{isMarathi ? 'बँक खाते (SBI Bank)' : 'SBI Bank Account'}</option>
                <option value="UPI">{isMarathi ? 'युपीआय (UPI Account)' : 'UPI Wallet'}</option>
                <option value="Cheque">{isMarathi ? 'बँक धनादेश (HDFC Bank - Cheque)' : 'HDFC Bank (Cheque)'}</option>
              </select>
            </div>

            {/* Dynamic Bank Account Sub Selection */}
            {formData.paymentMode !== 'Cash' && (
              <div className="exp-input-group">
                <label>{isMarathi ? 'विशिष्ट बँक निवडा *' : 'Select Specific Bank Account *'}</label>
                <select
                  className="exp-input"
                  value={formData.bankName}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                >
                  <option value="SBI Bank">SBI Bank (A/c: 3824****)</option>
                  <option value="HDFC Bank">HDFC Bank (A/c: 9051****)</option>
                  <option value="UPI Account">UPI Business Account</option>
                </select>
              </div>
            )}

            {/* Amount */}
            <div className="exp-input-group">
              <label>{isMarathi ? 'रक्कम (₹) *' : 'Expense Amount (₹) *'}</label>
              <input 
                type="number" 
                required 
                placeholder="0.00"
                className="exp-input"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            {/* Paid To Receiver */}
            <div className="exp-input-group">
              <label>{isMarathi ? 'देयक व्यक्ती/वेंडरचे नाव *' : 'Paid To (Vendor Name) *'}</label>
              <input 
                type="text" 
                required 
                placeholder={isMarathi ? "उदा. महावितरण वीज वितरण" : "e.g. MSEB Electricity Board"}
                className="exp-input"
                value={formData.paidTo}
                onChange={e => setFormData({ ...formData, paidTo: e.target.value })}
              />
            </div>

            {/* Short Narration Description */}
            <div className="exp-input-group">
              <label>{isMarathi ? 'तपशील / स्पष्टीकरण' : 'Particulars / Description'}</label>
              <textarea 
                rows={2}
                placeholder={isMarathi ? "खर्चाचे संक्षिप्त स्पष्टीकरण प्रविष्ट करा..." : "Enter short description for this voucher entry..."}
                className="exp-input"
                style={{ resize: 'none', fontFamily: 'inherit' }}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Simulated Attachment Upload Selector */}
            <div className="exp-input-group" style={{ marginBottom: '1.75rem' }}>
              <label>{isMarathi ? 'बिल / पावती प्रत जोडा' : 'Bill Receipt Attachment (PDF/Image)'}</label>
              <input 
                type="file" 
                id="expense-file-picker"
                style={{ display: 'none' }} 
                accept="image/*,application/pdf"
                onChange={handleAttachmentChange}
              />
              <div 
                className="upload-dashed-box"
                onClick={() => document.getElementById('expense-file-picker').click()}
              >
                <FiUpload style={{ color: 'var(--primary)', marginBottom: '4px' }} size={18} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  {attachment ? attachment.name : (isMarathi ? 'फाइल निवडण्यासाठी क्लिक करा' : 'Click to select bill image/pdf')}
                </p>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="exp-btn-submit">
              {isSubmitting ? (
                isMarathi ? 'व्हाउचर बुक होत आहे...' : 'Posting Voucher...'
              ) : (
                <>
                  <FiPlus />
                  {isMarathi ? 'खर्च आणि पेमेंट व्हाउचर नोंदवा' : 'Post Payment Voucher'}
                </>
              )}
            </button>

          </form>
        </div>

        {/* Right Pane: Live Expense Vouchers Sheet */}
        <div className="workspace-card">
          
          <div className="workspace-filter-header">
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '850', margin: 0, fontFamily: 'var(--font-heading)' }}>
                {isMarathi ? 'खर्च व्हाउचर खातेवही' : 'Expense Vouchers Sheet'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                {isMarathi 
                  ? `एकूण खर्चाचे प्रमाण: ₹${totalExpenseAmount.toLocaleString('en-IN')}` 
                  : `Total Filtered Expenses: ₹${totalExpenseAmount.toLocaleString('en-IN')}`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="exp-action-btn" onClick={handleExportCSV} title="Export to Excel Spreadsheet">
                <FiDownload /> CSV
              </button>
            </div>
          </div>

          {/* Table Filters */}
          <div className="workspace-filters">
            
            {/* Global Search box */}
            <div className="workspace-search">
              <FiSearch />
              <input 
                type="text" 
                placeholder={isMarathi ? "व्हाउचर, वेंडर, खाते शोधा..." : "Search voucher, vendor, ledger..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Monthly filter */}
            <select 
              className="exp-input" 
              style={{ width: 'auto', padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
            >
              <option value="All">{isMarathi ? 'सर्व महिने' : 'All Months'}</option>
              <option value="2026-05">{isMarathi ? 'मे २०२६' : 'May 2026'}</option>
              <option value="2026-06">{isMarathi ? 'जून २०२६' : 'June 2026'}</option>
            </select>

            {/* Ledger Category filter */}
            <select 
              className="exp-input" 
              style={{ width: 'auto', padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              value={filterLedger}
              onChange={e => setFilterLedger(e.target.value)}
            >
              <option value="All">{isMarathi ? 'सर्व खाते प्रकार' : 'All Ledgers'}</option>
              {allExpenseCategories.map(cat => (
                <option key={`filter-${cat.value}`} value={cat.value}>
                  {isMarathi ? cat.labelMarathi : cat.labelEnglish}
                </option>
              ))}
            </select>

          </div>

          {/* Vouchers Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="exp-table">
              <thead>
                <tr>
                  <th>{isMarathi ? 'व्हाउचर' : 'Voucher'}</th>
                  <th>{isMarathi ? 'तारीख' : 'Date'}</th>
                  <th>{isMarathi ? 'खर्च श्रेणी' : 'Ledger Account'}</th>
                  <th>{isMarathi ? 'देयक' : 'Paid To'}</th>
                  <th>{isMarathi ? 'पेमेंट मोड' : 'Mode'}</th>
                  <th style={{ textAlign: 'right' }}>{isMarathi ? 'रक्कम' : 'Amount'}</th>
                  <th style={{ textAlign: 'center' }}>{isMarathi ? 'कृती' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {isMarathi ? 'खर्च विवरण लोड होत आहे...' : 'Loading Expenses Vouchers...'}
                    </td>
                  </tr>
                ) : filteredExpenses.length > 0 ? (
                  filteredExpenses
                    .sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate))
                    .map(exp => (
                      <tr key={exp.id}>
                        <td style={{ fontWeight: '700' }}><code>{exp.voucherNo}</code></td>
                        <td>{exp.expenseDate}</td>
                        <td style={{ fontWeight: '600' }}>{exp.category}</td>
                        <td>{exp.paidTo}</td>
                        <td>{exp.paymentMode}</td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: '#dc2626' }}>
                          ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              className="exp-action-btn"
                              onClick={() => handlePrintVoucher(exp)}
                              title="Print Official Payment Slip"
                            >
                              <FiPrinter size={15} />
                            </button>
                            <button 
                              className="exp-action-btn exp-action-delete"
                              onClick={() => handleDelete(exp)}
                              title="Reverse Double-Entry Transaction"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {isMarathi ? 'कोणतेही खर्च व्हाउचर सापडले नाही.' : 'No matching payment vouchers logged.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ExpenseEntry;
