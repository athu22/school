import React, { useState } from 'react';
import { FiPlus, FiGrid } from 'react-icons/fi';
import Button from '../../components/ui/Button';

const DivisionList = () => {
  const [divisions, setDivisions] = useState([
    { id: 1, name: 'A', className: '10th', studentCount: 45 },
    { id: 2, name: 'B', className: '10th', studentCount: 42 },
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)' }}>Divisions Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage class sections and divisions.</p>
        </div>
        <Button>
          <FiPlus /> Add New Division
        </Button>
      </div>

      <div className="premium-card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
              <th style={{ padding: '1rem' }}>Division Name</th>
              <th style={{ padding: '1rem' }}>Class</th>
              <th style={{ padding: '1rem' }}>Total Students</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {divisions.map((div) => (
              <tr key={div.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>Section {div.name}</td>
                <td style={{ padding: '1rem' }}>{div.className}</td>
                <td style={{ padding: '1rem' }}>{div.studentCount} Students</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DivisionList;
