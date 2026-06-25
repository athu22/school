import React, { useState, useEffect } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import useAuthStore from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { 
  FiBook, FiArrowLeft, FiPrinter, FiDownload, 
  FiSearch, FiFilter, FiCalendar, FiClock 
} from 'react-icons/fi';

const DayBook = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { isMarathi } = useLanguage();
  const { transactions, loading } = useAccounts(profile?.schoolId);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  // Handle CSV Export
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Voucher No,Date,Ledger Name,Type,Debit Amount,Credit Amount,Narration\n";

    filteredTransactions.forEach(t => {
      csvContent += `"${t.voucherNo || 'N/A'}","${t.date}","${t.ledgerName || t.category || 'N/A'}","${t.type}","${t.type === 'debit' ? t.amount : 0}","${t.type === 'credit' ? t.amount : 0}","${t.narration || t.description || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DayBook_Statement_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter transactions
  const filteredTransactions = (transactions || []).filter(t => {
    // 1. Date Range filter
    const matchesDate = t.date >= startDate && t.date <= endDate;

    // 2. Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (t.voucherNo || '').toLowerCase().includes(searchLower) ||
      (t.ledgerName || t.category || '').toLowerCase().includes(searchLower) ||
      (t.narration || t.description || '').toLowerCase().includes(searchLower);

    // 3. Voucher Type filter (extracted from voucherNo prefixes CV = contra, PV = payment, JV = journal, RV = receipt)
    let matchesType = true;
    if (filterType !== 'All') {
      const vNo = t.voucherNo || '';
      if (filterType === 'payment') matchesType = vNo.startsWith('PV');
      else if (filterType === 'contra') matchesType = vNo.startsWith('CV');
      else if (filterType === 'journal') matchesType = vNo.startsWith('JV');
      else if (filterType === 'receipt') matchesType = vNo.startsWith('RV');
    }

    return matchesDate && matchesSearch && matchesType;
  });

  // Calculate totals
  const totalDebit = filteredTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, curr) => sum + Number(curr.amount || 0), 0);

  const totalCredit = filteredTransactions
    .filter(t => t.type === 'credit')
    .reduce((sum, curr) => sum + Number(curr.amount || 0), 0);

  return (
    <div className="daybook-module-wrapper">
      <style>{`
        .daybook-module-wrapper {
          padding: 0.5rem;
          color: var(--text-main);
        }

        .daybook-back-btn {
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

        .daybook-back-btn:hover {
          color: var(--primary);
        }

        .daybook-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }

        .daybook-title h1 {
          font-size: 2rem;
          font-weight: 800;
          font-family: var(--font-heading);
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 0.25rem;
        }

        .daybook-title h1 svg {
          color: var(--primary);
        }

        .daybook-actions {
          display: flex;
          gap: 12px;
        }

        .daybook-btn {
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

        .daybook-btn:hover {
          transform: translateY(-2px);
          background: var(--background);
        }

        .daybook-btn-primary {
          background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
        }

        .daybook-btn-primary:hover {
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
        }

        /* Filter block */
        .daybook-filter-card {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01);
        }

        .filter-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-input-group label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .filter-input {
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          background: var(--background, #f8fafc);
          color: var(--text-main);
          font-size: 0.85rem;
          font-weight: 500;
          outline: none;
        }

        .filter-input:focus {
          border-color: var(--primary);
        }

        /* Table log card */
        .daybook-table-card {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.01);
        }

        .daybook-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .daybook-table th {
          padding: 1rem;
          background: var(--background, #f8fafc);
          color: var(--text-muted);
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          border-bottom: 2px solid var(--border);
        }

        .daybook-table td {
          padding: 1.1rem 1rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.9rem;
        }

        .daybook-table tr:hover {
          background: rgba(99, 102, 241, 0.01);
        }

        .badge-type {
          padding: 0.2rem 0.45rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .badge-dr { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
        .badge-cr { background: rgba(34, 197, 94, 0.08); color: #22c55e; }

        /* Print specifications */
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          .daybook-print-area, .daybook-print-area * {
            visibility: visible;
          }
          .daybook-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }
          .daybook-back-btn, .daybook-header, .daybook-filter-card, .daybook-btn {
            display: none !important;
          }
          .daybook-table-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .daybook-table th {
            background: #f1f5f9 !important;
            color: #000 !important;
            border-bottom: 1.5px solid #000 !important;
          }
          .daybook-table td {
            border-bottom: 1px solid #ddd !important;
          }
          .official-daybook-print-header {
            display: block !important;
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 0.75rem;
            margin-bottom: 2rem;
          }
        }

        .official-daybook-print-header {
          display: none;
        }
      `}</style>

      {/* Back button */}
      <button className="daybook-back-btn" onClick={() => navigate('/admin/accounts')}>
        <FiArrowLeft />
        <span>{isMarathi ? 'डॅशबोर्डवर परत जा' : 'Back to Accounts'}</span>
      </button>

      {/* Print area wrapper */}
      <div className="daybook-print-area">
        
        {/* Printable Official Header */}
        <div className="official-daybook-print-header">
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
            {profile?.schoolName || 'National Public School'}
          </h2>
          <p style={{ margin: '4px 0', fontSize: '1rem', fontWeight: 'bold' }}>
            {isMarathi ? 'मास्टर रोजनिशी (Day Book Statement)' : 'General Ledger Day Book'}
          </p>
          <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#333' }}>
            {isMarathi ? `कालावधी: ${startDate} ते ${endDate}` : `Period Range: ${startDate} to ${endDate}`}
          </p>
        </div>

        {/* Title area */}
        <div className="daybook-header">
          <div className="daybook-title">
            <h1>
              <FiBook />
              {isMarathi ? 'मास्टर रोजनिशी (Day Book)' : 'General Journal (Day Book)'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {isMarathi 
                ? 'निवडलेल्या तारखेच्या मर्यादेत सिस्टीममध्ये झालेले सर्व जमा-खर्च व्यवहार.'
                : 'Chronological double-entry listing of all ledger transactions within selected dates.'}
            </p>
          </div>
          <div className="daybook-actions">
            <button className="daybook-btn" onClick={handleExportCSV}>
              <FiDownload /> {isMarathi ? 'Excel डाउनलोड' : 'Export Excel'}
            </button>
            <button className="daybook-btn daybook-btn-primary" onClick={handlePrint}>
              <FiPrinter /> {isMarathi ? 'डे-बुक प्रिंट करा' : 'Print Day Book'}
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="daybook-filter-card">
          
          {/* Start Date */}
          <div className="filter-input-group">
            <label><FiCalendar /> {isMarathi ? 'आरंभ तारीख *' : 'Start Date *'}</label>
            <input 
              type="date" 
              required
              className="filter-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="filter-input-group">
            <label><FiCalendar /> {isMarathi ? 'अंतिम तारीख *' : 'End Date *'}</label>
            <input 
              type="date" 
              required
              className="filter-input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          {/* Voucher type */}
          <div className="filter-input-group">
            <label><FiFilter /> {isMarathi ? 'व्हाउचर प्रकार' : 'Voucher Type'}</label>
            <select 
              className="filter-input"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="All">{isMarathi ? 'सर्व प्रकार (All)' : 'All Vouchers'}</option>
              <option value="payment">{isMarathi ? 'पेमेंट (PV)' : 'Payment Voucher'}</option>
              <option value="receipt">{isMarathi ? 'रिसिप्ट (RV)' : 'Receipt Voucher'}</option>
              <option value="contra">{isMarathi ? 'कॉन्ट्रा (CV)' : 'Contra Voucher'}</option>
              <option value="journal">{isMarathi ? 'जर्नल (JV)' : 'Journal Voucher'}</option>
            </select>
          </div>

          {/* Global Search */}
          <div className="filter-input-group">
            <label><FiSearch /> {isMarathi ? 'शोध तपशील (Search)' : 'Particulars Search'}</label>
            <input 
              type="text" 
              placeholder={isMarathi ? "व्हाउचर क्र., खाते..." : "Search particulars..."}
              className="filter-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

        </div>

        {/* Ledger sheet table */}
        <div className="daybook-table-card">
          <div style={{ overflowX: 'auto' }}>
            <table className="daybook-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>{isMarathi ? 'दिनांक' : 'Date'}</th>
                  <th style={{ width: '20%' }}>{isMarathi ? 'व्हाउचर क्र.' : 'Voucher No.'}</th>
                  <th style={{ width: '30%' }}>{isMarathi ? 'तपशील / खाते प्रकार (Particulars)' : 'Ledger Account Particulars'}</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>{isMarathi ? 'नावे (Debit Dr)' : 'Debits (₹ Dr)'}</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>{isMarathi ? 'जमा (Credit Cr)' : 'Credits (₹ Cr)'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {isMarathi ? 'माहिती लोड होत आहे...' : 'Loading Journal entries...'}
                    </td>
                  </tr>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(t => (
                      <tr key={t.id}>
                        <td>{t.date}</td>
                        <td><code>{t.voucherNo || 'N/A'}</code></td>
                        <td>
                          <div style={{ fontWeight: '700' }}>{t.ledgerName || t.category}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '500' }}>
                            {t.narration || t.description || 'No narration details'}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: t.type === 'debit' ? '#dc2626' : 'inherit' }}>
                          {t.type === 'debit' ? `₹${Number(t.amount).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: t.type === 'credit' ? '#16a34a' : 'inherit' }}>
                          {t.type === 'credit' ? `₹${Number(t.amount).toLocaleString('en-IN')}` : '-'}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {isMarathi ? 'या तारखेदरम्यान कोणतेही व्यवहार सापडले नाहीत.' : 'No accounting entries posted in this range.'}
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredTransactions.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'var(--background)', fontWeight: '900', borderTop: '2px solid var(--border)' }}>
                    <td colSpan="3" style={{ padding: '1.25rem 1rem', textAlign: 'right', fontSize: '0.95rem' }}>
                      {isMarathi ? 'एकूण जमा-खर्च शिल्लक (Tallied Totals):' : 'Grand Balanced Totals:'}
                    </td>
                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right', color: '#dc2626', fontSize: '1rem' }}>
                      ₹{totalDebit.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right', color: '#16a34a', fontSize: '1rem' }}>
                      ₹{totalCredit.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Signature area for print */}
          <div style={{ display: 'none', justifyContent: 'space-between', marginTop: '4rem' }} className="daybook-print-area">
            <div style={{ borderTop: '1px solid #000', width: '150px', textAlign: 'center', paddingTop: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              PREPARED BY
            </div>
            <div style={{ borderTop: '1px solid #000', width: '150px', textAlign: 'center', paddingTop: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              AUDITOR
            </div>
            <div style={{ borderTop: '1px solid #000', width: '150px', textAlign: 'center', paddingTop: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              HEADMASTER SEAL
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DayBook;
