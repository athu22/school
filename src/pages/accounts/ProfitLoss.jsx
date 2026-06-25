import React, { useState, useEffect } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import useAuthStore from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { 
  FiActivity, FiArrowLeft, FiPrinter, FiDownload, 
  FiTrendingUp, FiTrendingDown, FiFileText, FiAward 
} from 'react-icons/fi';

const ProfitLoss = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { isMarathi } = useLanguage();
  const { transactions, loading } = useAccounts(profile?.schoolId);

  // States
  const [incomes, setIncomes] = useState({});
  const [expenses, setExpenses] = useState({});
  const [filterYear, setFilterYear] = useState('2026');

  // Trigger Calculations
  useEffect(() => {
    if (!transactions) return;

    const incomeMap = {};
    const expenseMap = {};

    transactions.forEach(t => {
      // Basic Year check
      const transYear = t.date ? t.date.split('-')[0] : '2026';
      if (transYear !== filterYear) return;

      const ledger = t.ledgerName || t.category || 'Miscellaneous';
      const amount = Number(t.amount || 0);

      if (t.type === 'credit') {
        incomeMap[ledger] = (incomeMap[ledger] || 0) + amount;
      } else {
        expenseMap[ledger] = (expenseMap[ledger] || 0) + amount;
      }
    });

    setIncomes(incomeMap);
    setExpenses(expenseMap);

  }, [transactions, filterYear]);

  // Grand Sum calculations
  const totalIncome = Object.values(incomes).reduce((sum, val) => sum + val, 0);
  const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
  const netProfit = totalIncome - totalExpenses;

  // Print helper
  const handlePrint = () => {
    window.print();
  };

  // CSV Export
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Financial Statement,Ledger Name,Amount (INR)\n";
    
    csvContent += "INCOMES,,\n";
    Object.keys(incomes).forEach(k => {
      csvContent += `INCOME,${k},${incomes[k]}\n`;
    });
    csvContent += `TOTAL INCOME,,${totalIncome}\n\n`;

    csvContent += "EXPENSES,,\n";
    Object.keys(expenses).forEach(k => {
      csvContent += `EXPENSE,${k},${expenses[k]}\n`;
    });
    csvContent += `TOTAL EXPENSES,,${totalExpenses}\n\n`;

    csvContent += `NET RESULT,${netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'},${Math.abs(netProfit)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Profit_Loss_Statement_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pl-module-wrapper">
      <style>{`
        .pl-module-wrapper {
          padding: 0.5rem;
          color: var(--text-main);
        }

        .pl-back-btn {
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

        .pl-back-btn:hover {
          color: var(--primary);
        }

        .pl-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }

        .pl-title h1 {
          font-size: 2rem;
          font-weight: 800;
          font-family: var(--font-heading);
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 0.25rem;
        }

        .pl-title h1 svg {
          color: var(--primary);
        }

        .pl-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .pl-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.25s ease;
          border: 1px solid var(--border);
          background: var(--card-bg, #ffffff);
          color: var(--text-main);
        }

        .pl-btn:hover {
          transform: translateY(-2px);
          background: var(--background);
        }

        .pl-btn-primary {
          background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
        }

        .pl-btn-primary:hover {
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
        }

        .pl-select {
          padding: 0.6rem 1rem;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          background: var(--card-bg);
          color: var(--text-main);
          font-weight: 600;
          font-size: 0.9rem;
        }

        /* Statement Grid */
        .pl-statement-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 768px) {
          .pl-statement-grid {
            grid-template-columns: 1fr;
          }
        }

        .statement-card {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
        }

        .statement-card h3 {
          font-size: 1.2rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid var(--border);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ledger-row {
          display: flex;
          justify-content: space-between;
          padding: 0.85rem 0;
          border-bottom: 1px dashed var(--border);
          font-size: 0.925rem;
        }

        .ledger-row:last-child {
          border-bottom: none;
        }

        .statement-total-row {
          display: flex;
          justify-content: space-between;
          padding-top: 1.25rem;
          margin-top: 1.25rem;
          border-top: 2.5px double var(--border);
          font-weight: 900;
          font-size: 1.15rem;
        }

        /* Result Panel */
        .result-panel {
          border-radius: 24px;
          padding: 2rem;
          text-align: center;
          margin-bottom: 2rem;
          border: 1px solid transparent;
        }

        .result-profit {
          background: rgba(34, 197, 94, 0.05);
          border-color: rgba(34, 197, 94, 0.15);
          color: #16a34a;
        }

        .result-loss {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.15);
          color: #dc2626;
        }

        /* Print styling */
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          .pl-print-area, .pl-print-area * {
            visibility: visible;
          }
          .pl-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }
          .pl-back-btn, .pl-header, .pl-actions, .pl-btn {
            display: none !important;
          }
          .statement-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .official-pl-print-header {
            display: block !important;
            text-align: center;
            border-bottom: 2.5px solid #000;
            padding-bottom: 0.75rem;
            margin-bottom: 2rem;
          }
        }

        .official-pl-print-header {
          display: none;
        }
      `}</style>

      {/* Back to dashboard */}
      <button className="pl-back-btn" onClick={() => navigate('/admin/accounts')}>
        <FiArrowLeft />
        <span>{isMarathi ? 'डॅशबोर्डवर परत जा' : 'Back to Accounts'}</span>
      </button>

      {/* Printable Area */}
      <div className="pl-print-area">
        
        {/* Printable Official Header */}
        <div className="official-pl-print-header">
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
            {profile?.schoolName || 'National Public School'}
          </h2>
          <p style={{ margin: '4px 0', fontSize: '1rem', fontWeight: 'bold' }}>
            {isMarathi ? 'नफा-तोटा व उत्पन्न-खर्च पत्रक (Profit & Loss Statement)' : 'Income Expenditure & Profit/Loss Statement'}
          </p>
          <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#333' }}>
            {isMarathi ? `वित्तीय वर्ष: ${filterYear}` : `Financial Assessment Year: ${filterYear}`}
          </p>
        </div>

        {/* Top Header */}
        <div className="pl-header">
          <div className="pl-title">
            <h1>
              <FiActivity />
              {isMarathi ? 'नफा व तोटा पत्रक (Profit & Loss)' : 'Income & Expenditure Sheet (P&L)'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {isMarathi 
                ? 'शाळेच्या सर्व उत्पन्न खाती आणि खर्च खात्यांचे संकलित वार्षिक नफा-तोटा विवरण.'
                : 'Consolidated profit-and-loss evaluation summarizing operational incomes and recurring expenses.'}
            </p>
          </div>
          <div className="pl-actions">
            <select 
              className="pl-select"
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
            <button className="pl-btn" onClick={handleExportCSV}>
              <FiDownload /> {isMarathi ? 'Excel निर्यात' : 'Export Excel'}
            </button>
            <button className="pl-btn pl-btn-primary" onClick={handlePrint}>
              <FiPrinter /> {isMarathi ? 'पत्रक प्रिंट करा' : 'Print Statement'}
            </button>
          </div>
        </div>

        {/* Big Balance Result Box */}
        <div className={`result-panel ${netProfit >= 0 ? 'result-profit' : 'result-loss'}`}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '850', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {netProfit >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
            {netProfit >= 0 
              ? (isMarathi ? `एकूण निव्वळ नफा (NET SURPLUS PROFIT): ₹${netProfit.toLocaleString('en-IN')}` : `NET SURPLUS PROFIT: ₹${netProfit.toLocaleString('en-IN')}`)
              : (isMarathi ? `एकूण निव्वळ तोटा (NET DEFICIT LOSS): ₹${Math.abs(netProfit).toLocaleString('en-IN')}` : `NET DEFICIT LOSS: ₹${Math.abs(netProfit).toLocaleString('en-IN')}`)}
          </h2>
        </div>

        {/* Balanced Statement Grid */}
        <div className="pl-statement-grid">
          
          {/* Income Statement Side */}
          <div className="statement-card">
            <h3 style={{ color: '#16a34a' }}>
              <FiTrendingUp />
              {isMarathi ? 'उत्पन्न बाजू (Revenue & Receipts)' : 'Revenue & Receipts (Cr)'}
            </h3>

            {loading ? (
              <div style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>Loading ledger values...</div>
            ) : Object.keys(incomes).length > 0 ? (
              Object.keys(incomes).map(key => (
                <div className="ledger-row" key={`inc-${key}`}>
                  <span style={{ fontWeight: '700' }}>{key}</span>
                  <span style={{ fontWeight: '600', color: '#16a34a' }}>₹{incomes[key].toLocaleString('en-IN')}</span>
                </div>
              ))
            ) : (
              <div className="ledger-row" style={{ color: 'var(--text-muted)' }}>
                {isMarathi ? 'कोणतेही उत्पन्न व्यवहार आढळले नाहीत.' : 'No credited income ledger entries recorded.'}
              </div>
            )}

            <div className="statement-total-row" style={{ color: '#16a34a' }}>
              <span>{isMarathi ? 'एकूण उत्पन्न (Total Revenue):' : 'Total Revenue (Cr):'}</span>
              <span>₹{totalIncome.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Expense Statement Side */}
          <div className="statement-card">
            <h3 style={{ color: '#dc2626' }}>
              <FiTrendingDown />
              {isMarathi ? 'खर्च बाजू (Expenses & Payments)' : 'Operating Expenditures (Dr)'}
            </h3>

            {loading ? (
              <div style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>Loading ledger values...</div>
            ) : Object.keys(expenses).length > 0 ? (
              Object.keys(expenses).map(key => (
                <div className="ledger-row" key={`exp-${key}`}>
                  <span style={{ fontWeight: '700' }}>{key}</span>
                  <span style={{ fontWeight: '600', color: '#dc2626' }}>₹{expenses[key].toLocaleString('en-IN')}</span>
                </div>
              ))
            ) : (
              <div className="ledger-row" style={{ color: 'var(--text-muted)' }}>
                {isMarathi ? 'कोणतेही खर्च व्यवहार आढळले नाहीत.' : 'No debited expense ledger entries recorded.'}
              </div>
            )}

            <div className="statement-total-row" style={{ color: '#dc2626' }}>
              <span>{isMarathi ? 'एकूण खर्च (Total Expenses):' : 'Total Expenditures (Dr):'}</span>
              <span>₹{totalExpenses.toLocaleString('en-IN')}</span>
            </div>
          </div>

        </div>

        {/* Printable Footer Seal Signatures */}
        <div style={{ display: 'none', justifyContent: 'space-between', marginTop: '5rem' }} className="pl-print-area">
          <div style={{ borderTop: '1px solid #000', width: '160px', textAlign: 'center', paddingTop: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            PREPARED BY
          </div>
          <div style={{ borderTop: '1px solid #000', width: '160px', textAlign: 'center', paddingTop: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            CHARTERED ACCOUNTANT
          </div>
          <div style={{ borderTop: '1px solid #000', width: '160px', textAlign: 'center', paddingTop: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            PRINCIPAL SIGNATURE
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProfitLoss;
