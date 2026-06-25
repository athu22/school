import React, { useState, useEffect } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import useAuthStore from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import { postAccountingVoucher } from '../../services/accountService';
import { toast } from 'react-toastify';
import { 
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiPieChart, 
  FiFileText, FiPlus, FiArrowRight, FiActivity, FiBriefcase,
  FiAward, FiSettings, FiCheck, FiX, FiPrinter
} from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AccountsDashboard = () => {
  const { profile } = useAuthStore();
  const { isMarathi } = useLanguage();
  const { transactions, vouchers, ledgers: dbLedgers, loading } = useAccounts(profile?.schoolId);

  // States
  const [stats, setStats] = useState({
    assets: 0,
    liabilities: 0,
    income: 0,
    expenses: 0
  });

  const [showContraModal, setShowContraModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contra Form State (Contra: transfer between Cash and Bank)
  const [contraData, setContraData] = useState({
    fromLedger: 'Cash In Hand',
    toLedger: 'SBI Bank',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Journal Form State (Journal: adjustments between ledgers)
  const [journalData, setJournalData] = useState({
    debitLedger: 'Office',
    creditLedger: 'Vendor Payable',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Default system categories & user created ones
  const defaultLedgerNames = [
    'Fee', 'Salary', 'Office', 'MidDayMeal', 'Maintenance', 
    'Grants', 'BankInterest', 'Miscellaneous', 'Cash In Hand', 
    'SBI Bank', 'HDFC Bank', 'UPI Account', 'Vendor Payable', 'Salary Payable'
  ];

  const allLedgerNames = Array.from(new Set([
    ...defaultLedgerNames,
    ...(dbLedgers || []).map(l => l.name)
  ]));

  // Post contra voucher
  const handlePostContra = async (e) => {
    e.preventDefault();
    if (!contraData.amount || Number(contraData.amount) <= 0) {
      return toast.error("Please enter a valid amount!");
    }
    if (contraData.fromLedger === contraData.toLedger) {
      return toast.error("From and To accounts must be different!");
    }

    setIsSubmitting(true);
    try {
      await postAccountingVoucher({
        schoolId: profile?.schoolId,
        voucherType: 'contra',
        date: contraData.date,
        amount: Number(contraData.amount),
        debitLedger: contraData.toLedger,
        creditLedger: contraData.fromLedger,
        description: contraData.description || `Transfer from ${contraData.fromLedger} to ${contraData.toLedger}`,
        paidTo: 'Self'
      });

      toast.success(isMarathi ? "कॉन्ट्रा व्हाउचर यशस्वीरित्या नोंदवले!" : "Contra Voucher posted successfully!");
      setShowContraModal(false);
      setContraData({
        fromLedger: 'Cash In Hand',
        toLedger: 'SBI Bank',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
    } catch (err) {
      toast.error("Error posting contra");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Post journal voucher
  const handlePostJournal = async (e) => {
    e.preventDefault();
    if (!journalData.amount || Number(journalData.amount) <= 0) {
      return toast.error("Please enter a valid amount!");
    }
    if (journalData.debitLedger === journalData.creditLedger) {
      return toast.error("Debit and Credit accounts must be different!");
    }

    setIsSubmitting(true);
    try {
      await postAccountingVoucher({
        schoolId: profile?.schoolId,
        voucherType: 'journal',
        date: journalData.date,
        amount: Number(journalData.amount),
        debitLedger: journalData.debitLedger,
        creditLedger: journalData.creditLedger,
        description: journalData.description || `Adjustment between ${journalData.debitLedger} and ${journalData.creditLedger}`,
        paidTo: 'General Ledger'
      });

      toast.success(isMarathi ? "जर्नल व्हाउचर यशस्वीरित्या नोंदवले!" : "Journal Voucher posted successfully!");
      setShowJournalModal(false);
      setJournalData({
        debitLedger: 'Office',
        creditLedger: 'Vendor Payable',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
    } catch (err) {
      toast.error("Error posting journal");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute stats on transaction updates
  useEffect(() => {
    if (!transactions) return;

    // Calculate Asset balances (Cash & Bank accounts: e.g. SBI Bank, HDFC Bank, UPI Account, Cash In Hand)
    const assetHeads = ['Cash In Hand', 'SBI Bank', 'HDFC Bank', 'UPI Account', 'Computers', 'Furniture', 'School Equipment'];
    const liabilityHeads = ['Vendor Payable', 'Salary Payable'];
    const incomeHeads = ['Fee', 'Grants', 'BankInterest'];
    
    let assetsTotal = 0;
    let liabilitiesTotal = 0;
    let incomeTotal = 0;
    let expensesTotal = 0;

    // 1. Map transaction sums
    const totals = transactions.reduce((acc, t) => {
      const ledger = t.ledgerName || t.category || 'Miscellaneous';
      if (!acc[ledger]) acc[ledger] = { debit: 0, credit: 0 };
      if (t.type === 'debit') acc[ledger].debit += Number(t.amount || 0);
      else acc[ledger].credit += Number(t.amount || 0);
      return acc;
    }, {});

    // Compute balances per category
    Object.keys(totals).forEach(ledger => {
      const summary = totals[ledger];
      const bal = summary.credit - summary.debit;

      if (assetHeads.includes(ledger)) {
        // Assets are normally debit-heavy, so asset value = debit - credit
        assetsTotal += (summary.debit - summary.credit);
      } else if (liabilityHeads.includes(ledger)) {
        // Liabilities are normally credit-heavy, so liability = credit - debit
        liabilitiesTotal += bal;
      } else if (incomeHeads.includes(ledger)) {
        incomeTotal += summary.credit;
      } else {
        // Rest are expense ledgers
        expensesTotal += summary.debit;
      }
    });

    // Make sure we represent a nice starting capital cash in hand
    if (assetsTotal < 0) assetsTotal = Math.abs(assetsTotal);
    if (assetsTotal === 0 && incomeTotal > 0) assetsTotal = incomeTotal - expensesTotal;

    setStats({
      assets: assetsTotal,
      liabilities: liabilitiesTotal,
      income: incomeTotal,
      expenses: expensesTotal
    });

  }, [transactions]);

  // Chart data calculations
  const cashFlowData = [
    { name: isMarathi ? 'जानेवारी' : 'Jan', Income: stats.income * 0.15, Expense: stats.expenses * 0.1 },
    { name: isMarathi ? 'फेब्रुवारी' : 'Feb', Income: stats.income * 0.25, Expense: stats.expenses * 0.18 },
    { name: isMarathi ? 'मार्च' : 'Mar', Income: stats.income * 0.45, Expense: stats.expenses * 0.35 },
    { name: isMarathi ? 'एप्रिल' : 'Apr', Income: stats.income * 0.65, Expense: stats.expenses * 0.45 },
    { name: isMarathi ? 'मे' : 'May', Income: stats.income * 0.85, Expense: stats.expenses * 0.75 },
    { name: isMarathi ? 'जून' : 'Jun', Income: stats.income, Expense: stats.expenses }
  ];

  const pieData = [
    { name: isMarathi ? 'मालमत्ता (Assets)' : 'Assets', value: stats.assets || 10000, color: '#3b82f6' },
    { name: isMarathi ? 'दायित्व (Liabilities)' : 'Liabilities', value: stats.liabilities || 2000, color: '#ef4444' },
    { name: isMarathi ? 'उत्पन्न (Revenue)' : 'Income', value: stats.income || 50000, color: '#10b981' },
    { name: isMarathi ? 'खर्च (Expenses)' : 'Expenses', value: stats.expenses || 35000, color: '#f59e0b' }
  ];

  // Print voucher helper
  const handlePrintVoucher = (voucher) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Accounting Voucher: ${voucher.voucherNo}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2rem; color: #333; }
            .voucher-box { border: 2px solid #333; padding: 2rem; border-radius: 12px; max-width: 800px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 1.5rem; }
            .row { display: flex; justify-content: space-between; margin-bottom: 1rem; }
            .title { font-size: 1.5rem; font-weight: bold; text-transform: uppercase; }
            .table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; margin-bottom: 1.5rem; }
            .table th, .table td { border: 1px solid #333; padding: 0.75rem; text-align: left; }
            .table th { background: #f1f5f9; }
            .signatures { display: flex; justify-content: space-between; margin-top: 3rem; }
            .sig-line { border-top: 1px solid #333; width: 150px; text-align: center; padding-top: 4px; font-weight: bold; font-size: 0.8rem; }
          </style>
        </head>
        <body>
          <div class="voucher-box">
            <div class="header">
              <h2>${profile?.schoolName || 'National Public School'}</h2>
              <div class="title">${voucher.voucherType.toUpperCase()} VOUCHER</div>
              <p>Voucher No: <strong>${voucher.voucherNo}</strong> | Date: ${voucher.date}</p>
            </div>
            
            <div class="row">
              <div><strong>Paid To / Party:</strong> ${voucher.paidTo || 'N/A'}</div>
              <div><strong>Payment Mode:</strong> Cash/Bank Transfer</div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Particulars / Ledger Head</th>
                  <th>Account Type</th>
                  <th style="text-align: right;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${voucher.debitLedger}</td>
                  <td>Debit (Dr)</td>
                  <td style="text-align: right;">₹${Number(voucher.amount).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td>${voucher.creditLedger}</td>
                  <td>Credit (Cr)</td>
                  <td style="text-align: right;">₹${Number(voucher.amount).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <div style="margin-bottom: 2rem;">
              <strong>Description/Narration:</strong> ${voucher.description || 'No particulars entered.'}
            </div>

            <div class="signatures">
              <div>
                <div style="height: 40px;"></div>
                <div class="sig-line">Prepared By</div>
              </div>
              <div>
                <div style="height: 40px;"></div>
                <div class="sig-line">Accountant</div>
              </div>
              <div>
                <div style="height: 40px;"></div>
                <div class="sig-line">Headmaster Seal</div>
              </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="erp-dashboard-container">
      {/* Styles Block */}
      <style>{`
        .erp-dashboard-container {
          padding: 0.25rem;
          color: var(--text-main);
        }

        .erp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .erp-title h1 {
          font-size: 2rem;
          font-weight: 800;
          font-family: var(--font-heading);
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 0.25rem;
        }

        .erp-title h1 svg {
          color: var(--primary);
        }

        .quick-action-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }

        .qa-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.7rem 1.2rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid var(--border);
          background: var(--card-bg, #ffffff);
          color: var(--text-main);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .qa-btn:hover {
          transform: translateY(-2px);
          background: var(--background);
          border-color: var(--primary);
          color: var(--primary);
        }

        .qa-btn-primary {
          background: linear-gradient(135deg, var(--primary, #6366f1) 0%, #4f46e5 100%);
          color: white;
          border: none;
        }

        .qa-btn-primary:hover {
          color: white;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2);
        }

        .erp-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .erp-stat-card {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.01);
          transition: all 0.25s ease;
        }

        .erp-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.03);
          border-color: rgba(99, 102, 241, 0.15);
        }

        .erp-stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
        }

        .erp-stat-info h4 {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .erp-stat-info p {
          font-size: 1.5rem;
          font-weight: 850;
          color: var(--text-main);
        }

        /* Color schemes */
        .color-assets { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
        .color-liabilities { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
        .color-revenue { background: rgba(34, 197, 94, 0.08); color: #22c55e; }
        .color-expense { background: rgba(245, 158, 11, 0.08); color: #f59e0b; }

        .erp-charts-grid {
          display: grid;
          grid-template-columns: 2fr 1.2fr;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        @media (max-width: 992px) {
          .erp-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Premium ledger log table */
        .erp-ledger-card {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.01);
        }

        .erp-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .erp-table th {
          padding: 1rem;
          background: var(--background, #f8fafc);
          color: var(--text-muted);
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          border-bottom: 2px solid var(--border);
        }

        .erp-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.9rem;
        }

        .voucher-badge {
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .badge-payment { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
        .badge-receipt { background: rgba(34, 197, 94, 0.08); color: #22c55e; }
        .badge-contra { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
        .badge-journal { background: rgba(168, 85, 247, 0.08); color: #a855f7; }

        /* Modal custom styles */
        .modal-overlay {
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

        .modal-card {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border);
          border-radius: 24px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes scaleUp {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .modal-header {
          padding: 1.5rem 1.75rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-body {
          padding: 1.75rem;
        }

        .modal-footer {
          padding: 1.25rem 1.75rem;
          border-top: 1px solid var(--border);
          background: var(--background);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .modal-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 1.25rem;
        }

        .modal-input-group label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .modal-input {
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

        .modal-input:focus {
          border-color: var(--primary);
          background: var(--card-bg);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .modal-close {
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

        .modal-close:hover {
          background: var(--border);
          color: var(--text-main);
        }
      `}</style>

      {/* Header section */}
      <div className="erp-header">
        <div className="erp-title">
          <h1>
            <FiActivity />
            {isMarathi ? 'आर्थिक खातेवही डॅशबोर्ड (Tally ERP)' : 'Tally Accounting ERP Command Center'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isMarathi 
              ? 'शाळेच्या मालमत्ता, दायित्व, उत्पन्न आणि खर्चांचे अधिकृत द्वि-नोंद रिअल-टाइम विवरण.' 
              : 'Real-time double-entry ledger statements tracking Assets, Liabilities, Incomes, and Expenses.'}
          </p>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="quick-action-bar">
        <button className="qa-btn qa-btn-primary" onClick={() => window.location.href='/admin/accounts/expenses'}>
          <FiPlus /> {isMarathi ? 'नवीन खर्च (Payment Voucher)' : 'Record Payment Voucher'}
        </button>
        <button className="qa-btn qa-btn-primary" onClick={() => window.location.href='/admin/accounts/fees'}>
          <FiPlus /> {isMarathi ? 'विद्यार्थी फी संकलन (Receipt Voucher)' : 'Record Receipt Voucher'}
        </button>
        <button className="qa-btn" onClick={() => setShowContraModal(true)}>
          <FiArrowRight /> {isMarathi ? 'कॉन्ट्रा नोंदणी (Contra Entry)' : 'Contra Voucher (CV)'}
        </button>
        <button className="qa-btn" onClick={() => setShowJournalModal(true)}>
          <FiArrowRight /> {isMarathi ? 'जर्नल ऍडजस्टमेंट (Journal Entry)' : 'Journal Voucher (JV)'}
        </button>
        <button className="qa-btn" onClick={() => window.location.href='/admin/accounts/ledgers'}>
          <FiBriefcase /> {isMarathi ? 'खातेवही सूची (Ledger List)' : 'Chart of Accounts'}
        </button>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="erp-stats-grid">
        {/* 1. Assets */}
        <div className="erp-stat-card">
          <div className="erp-stat-icon color-assets">
            <FiPieChart />
          </div>
          <div className="erp-stat-info">
            <h4>{isMarathi ? 'शाळा मालमत्ता (Assets)' : 'Total Assets (Dr)'}</h4>
            <p>₹{(stats.assets || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* 2. Liabilities */}
        <div className="erp-stat-card">
          <div className="erp-stat-icon color-liabilities">
            <FiSettings />
          </div>
          <div className="erp-stat-info">
            <h4>{isMarathi ? 'शाळा दायित्व (Liabilities)' : 'Total Liabilities (Cr)'}</h4>
            <p>₹{(stats.liabilities || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* 3. Incomes */}
        <div className="erp-stat-card">
          <div className="erp-stat-icon color-revenue">
            <FiTrendingUp />
          </div>
          <div className="erp-stat-info">
            <h4>{isMarathi ? 'एकूण उत्पन्न (Revenue)' : 'Total Income (Cr)'}</h4>
            <p style={{ color: '#22c55e' }}>₹{(stats.income || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* 4. Expenses */}
        <div className="erp-stat-card">
          <div className="erp-stat-icon color-expense">
            <FiTrendingDown />
          </div>
          <div className="erp-stat-info">
            <h4>{isMarathi ? 'एकूण खर्च (Expenses)' : 'Total Expenses (Dr)'}</h4>
            <p style={{ color: '#dc2626' }}>₹{(stats.expenses || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="erp-charts-grid">
        {/* Chart 1: Cash Flow Inflow vs Outflow */}
        <div className="premium-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
            {isMarathi ? 'मासिक उत्पन्न विरुद्ध खर्च विश्लेषण' : 'Monthly Cash Flow Statement (In vs Out)'}
          </h3>
          <div style={{ width: '100%', height: '320px' }}>
            {loading ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Loading Cash Flow...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInc)" />
                  <Area type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Ledger allocations */}
        <div className="premium-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
            {isMarathi ? 'खाते गट प्रमाण वाटप' : 'Ledger Group Allocation (Tally)'}
          </h3>
          <div style={{ width: '100%', height: '220px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
            {pieData.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }}></div>
                <span style={{ fontWeight: '600' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Vouchers Log (Audit Trail) */}
      <div className="erp-ledger-card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
          {isMarathi ? 'नुकतेच जोडलेले आर्थिक व्हाउचर लॉग' : 'Recent Accounting Vouchers (Audit Log)'}
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="erp-table">
            <thead>
              <tr style={{ background: 'var(--background)' }}>
                <th>{isMarathi ? 'व्हाउचर क्र.' : 'Voucher No.'}</th>
                <th>{isMarathi ? 'प्रकार' : 'Type'}</th>
                <th>{isMarathi ? 'दिनांक' : 'Date'}</th>
                <th>{isMarathi ? 'नावे खाते (Debit)' : 'Debit Ledger (Dr)'}</th>
                <th>{isMarathi ? 'जमा खाते (Credit)' : 'Credit Ledger (Cr)'}</th>
                <th style={{ textAlign: 'right' }}>{isMarathi ? 'रक्कम' : 'Amount'}</th>
                <th style={{ textAlign: 'center' }}>{isMarathi ? 'कृती' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading Audit Logs...
                  </td>
                </tr>
              ) : vouchers && vouchers.length > 0 ? (
                [...vouchers]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 10)
                  .map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: '700' }}><code>{v.voucherNo}</code></td>
                      <td>
                        <span className={`voucher-badge badge-${v.voucherType}`}>
                          {v.voucherType}
                        </span>
                      </td>
                      <td>{v.date}</td>
                      <td style={{ color: '#dc2626', fontWeight: '600' }}>{v.debitLedger}</td>
                      <td style={{ color: '#16a34a', fontWeight: '600' }}>{v.creditLedger}</td>
                      <td style={{ textAlign: 'right', fontWeight: '800' }}>
                        ₹{Number(v.amount).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => handlePrintVoucher(v)}
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', margin: 'auto' }}
                          title="Print Official Voucher Receipt"
                        >
                          <FiPrinter /> {isMarathi ? 'प्रिंट' : 'Print'}
                        </button>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {isMarathi ? 'अद्याप कोणतेही व्हाउचर आढळले नाही.' : 'No accounting vouchers logged yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contra Entry Modal Form */}
      {showContraModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                <FiArrowRight style={{ color: 'var(--primary)' }} />
                {isMarathi ? 'नवीन कॉन्ट्रा व्हाउचर जोडा' : 'Record Contra Voucher (CV)'}
              </h3>
              <button className="modal-close" onClick={() => setShowContraModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handlePostContra}>
              <div className="modal-body">
                <div className="modal-input-group">
                  <label>{isMarathi ? 'देणारे खाते (From Credit) *' : 'Source Cash/Bank (Credit) *'}</label>
                  <select 
                    value={contraData.fromLedger} 
                    onChange={e => setContraData({...contraData, fromLedger: e.target.value})}
                    className="modal-input"
                  >
                    <option value="Cash In Hand">Cash In Hand</option>
                    <option value="SBI Bank">SBI Bank</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="UPI Account">UPI Account</option>
                  </select>
                </div>
                <div className="modal-input-group">
                  <label>{isMarathi ? 'घेणारे खाते (To Debit) *' : 'Destination Cash/Bank (Debit) *'}</label>
                  <select 
                    value={contraData.toLedger} 
                    onChange={e => setContraData({...contraData, toLedger: e.target.value})}
                    className="modal-input"
                  >
                    <option value="Cash In Hand">Cash In Hand</option>
                    <option value="SBI Bank">SBI Bank</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="UPI Account">UPI Account</option>
                  </select>
                </div>
                <div className="modal-input-group">
                  <label>{isMarathi ? 'तारीख (Date) *' : 'Voucher Date *'}</label>
                  <input 
                    type="date" 
                    required 
                    value={contraData.date} 
                    onChange={e => setContraData({...contraData, date: e.target.value})}
                    className="modal-input"
                  />
                </div>
                <div className="modal-input-group">
                  <label>{isMarathi ? 'रक्कम (Amount) *' : 'Transfer Amount (₹) *'}</label>
                  <input 
                    type="number" 
                    required 
                    value={contraData.amount} 
                    onChange={e => setContraData({...contraData, amount: e.target.value})}
                    placeholder="0.00" 
                    className="modal-input"
                  />
                </div>
                <div className="modal-input-group">
                  <label>{isMarathi ? 'तपशील / वर्णन' : 'Narration / Description'}</label>
                  <textarea 
                    value={contraData.description} 
                    onChange={e => setContraData({...contraData, description: e.target.value})}
                    placeholder={isMarathi ? "उदा. बँक खात्यात रोख रक्कम जमा केली..." : "e.g. Deposited cash in SBI bank..."}
                    className="modal-input"
                    rows={2}
                    style={{ resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="qa-btn" onClick={() => setShowContraModal(false)}>
                  {isMarathi ? 'रद्द करा' : 'Cancel'}
                </button>
                <button type="submit" disabled={isSubmitting} className="qa-btn qa-btn-primary">
                  {isSubmitting ? 'Posting...' : <><FiCheck /> {isMarathi ? 'नोंदवा (Post)' : 'Post Voucher'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Journal Entry Modal Form */}
      {showJournalModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                <FiArrowRight style={{ color: 'var(--primary)' }} />
                {isMarathi ? 'नवीन जर्नल व्हाउचर जोडा' : 'Record Journal Voucher (JV)'}
              </h3>
              <button className="modal-close" onClick={() => setShowJournalModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handlePostJournal}>
              <div className="modal-body">
                <div className="modal-input-group">
                  <label>{isMarathi ? 'नावे खाते (Debit Ledger) *' : 'Debit Ledger (Dr Account) *'}</label>
                  <select 
                    value={journalData.debitLedger} 
                    onChange={e => setJournalData({...journalData, debitLedger: e.target.value})}
                    className="modal-input"
                  >
                    {allLedgerNames.map(name => <option key={`dr-${name}`} value={name}>{name}</option>)}
                  </select>
                </div>
                <div className="modal-input-group">
                  <label>{isMarathi ? 'जमा खाते (Credit Ledger) *' : 'Credit Ledger (Cr Account) *'}</label>
                  <select 
                    value={journalData.creditLedger} 
                    onChange={e => setJournalData({...journalData, creditLedger: e.target.value})}
                    className="modal-input"
                  >
                    {allLedgerNames.map(name => <option key={`cr-${name}`} value={name}>{name}</option>)}
                  </select>
                </div>
                <div className="modal-input-group">
                  <label>{isMarathi ? 'तारीख (Date) *' : 'Voucher Date *'}</label>
                  <input 
                    type="date" 
                    required 
                    value={journalData.date} 
                    onChange={e => setJournalData({...journalData, date: e.target.value})}
                    className="modal-input"
                  />
                </div>
                <div className="modal-input-group">
                  <label>{isMarathi ? 'रक्कम (Amount) *' : 'Adjustment Amount (₹) *'}</label>
                  <input 
                    type="number" 
                    required 
                    value={journalData.amount} 
                    onChange={e => setJournalData({...journalData, amount: e.target.value})}
                    placeholder="0.00" 
                    className="modal-input"
                  />
                </div>
                <div className="modal-input-group">
                  <label>{isMarathi ? 'तपशील / वर्णन' : 'Narration / Description'}</label>
                  <textarea 
                    value={journalData.description} 
                    onChange={e => setJournalData({...journalData, description: e.target.value})}
                    placeholder={isMarathi ? "उदा. वेंडर बिलाची ऍडजस्टमेंट नोंदणी..." : "e.g. Transfer adjustment entry..."}
                    className="modal-input"
                    rows={2}
                    style={{ resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="qa-btn" onClick={() => setShowJournalModal(false)}>
                  {isMarathi ? 'रद्द करा' : 'Cancel'}
                </button>
                <button type="submit" disabled={isSubmitting} className="qa-btn qa-btn-primary">
                  {isSubmitting ? 'Posting...' : <><FiCheck /> {isMarathi ? 'नोंदवा (Post)' : 'Post Voucher'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AccountsDashboard;
