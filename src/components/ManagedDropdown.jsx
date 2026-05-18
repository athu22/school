import React, { useState, useEffect } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';

const ManagedDropdown = ({
  label,
  name,
  value = '',
  onChange,
  tableName,
  placeholder = 'Select option',
  extraOptions = [],
  required = false
}) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Default values for common fields to provide a rich out-of-the-box experience
  const defaultLists = {
    classes: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    divisions: ['A', 'B', 'C', 'D', 'E'],
    mediums: ['Marathi', 'English', 'Semi-English', 'Hindi'],
    religions: [
      'Hindu', 'Muslim', 'Jain', 'Christians', 'Hindu- Maratha', 'Hindu- Dhangar',
      'Sikh', 'Budhist', 'Hindu Tamboli', 'Hindu Vanjari', 'Christian Orthodox',
      'Hindu- Mali', 'Nav Boudha', 'Hindu kumbhar', 'Hindu Khatik', 'Mahadev Koli',
      'Deshashta Brahmin', 'Hindu Chambhar', 'Hindu Mahar'
    ],
    castes: ['Maratha', 'Mali', 'Dhangar', 'Chambhar', 'Mahar', 'Kumbhar', 'Brahmin', 'Koli', 'Vanjari'],
    banks: ['State Bank of India', 'Bank of Baroda', 'Bank of Maharashtra', 'HDFC Bank', 'ICICI Bank', 'Punjab National Bank'],
    languages: ['Marathi', 'English', 'Hindi', 'Gujarati', 'Kannada', 'Tamil', 'Telugu'],
    cities: ['Pune', 'Mumbai', 'Thane', 'Nagpur', 'Nashik', 'Kolhapur', 'Satara', 'Sangli', 'Solapur'],
    previous_schools: ['Z.P. School', 'New High School', 'Vidyalaya Pune', 'Saraswati Mandir']
  };

  const getOptions = () => {
    const list = defaultLists[tableName] || [];
    
    // Combine standard list, extra options, and filter unique items
    const allOptionsSet = new Set();
    const result = [];

    // Add extra options first
    extraOptions.forEach(opt => {
      const val = typeof opt === 'object' ? opt.value : opt;
      const lbl = typeof opt === 'object' ? opt.label : opt;
      if (val && !allOptionsSet.has(val.toLowerCase())) {
        allOptionsSet.add(val.toLowerCase());
        result.push({ value: val, label: lbl });
      }
    });

    // Add standard options
    list.forEach(opt => {
      if (opt && !allOptionsSet.has(opt.toLowerCase())) {
        allOptionsSet.add(opt.toLowerCase());
        result.push({ value: opt, label: opt });
      }
    });

    return result;
  };

  const options = getOptions();

  // Switch to custom mode if value is not in current list options
  useEffect(() => {
    if (value) {
      const exists = options.some(opt => opt.value.toLowerCase() === value.toLowerCase());
      if (!exists && value !== '') {
        setIsCustomMode(true);
        setCustomValue(value);
      }
    }
  }, [value, extraOptions]);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__ADD_NEW__') {
      setIsCustomMode(true);
      setCustomValue('');
      // Trigger change with empty string first
      onChange({ target: { name, value: '' } });
    } else {
      onChange({ target: { name, value: val } });
    }
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomValue(val);
    onChange({ target: { name, value: val } });
  };

  const exitCustomMode = () => {
    setIsCustomMode(false);
    setCustomValue('');
    onChange({ target: { name, value: '' } });
  };

  return (
    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-muted)' }}>
          {label} {required && <span style={{ color: 'var(--accent)' }}>*</span>}
        </label>
      </div>

      {!isCustomMode ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            name={name}
            value={value}
            onChange={handleSelectChange}
            required={required}
            className="premium-input"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--text-main)',
              outline: 'none'
            }}
          >
            <option value="">{placeholder}</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
              ➕ + Add Custom Option
            </option>
          </select>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            value={customValue}
            onChange={handleCustomChange}
            placeholder={`Enter custom ${label.toLowerCase()}`}
            required={required}
            className="premium-input"
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--primary)',
              background: 'var(--background)',
              color: 'var(--text-main)',
              outline: 'none'
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={exitCustomMode}
            title="Choose from list"
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)15',
              color: 'var(--accent)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '42px',
              width: '42px'
            }}
          >
            <FiX size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ManagedDropdown;
