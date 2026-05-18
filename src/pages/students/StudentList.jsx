import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiEye, 
  FiEdit2, 
  FiTrash2, 
  FiPrinter, 
  FiDownload, 
  FiUpload, 
  FiChevronLeft, 
  FiChevronRight, 
  FiUsers, 
  FiUser, 
  FiFileText 
} from 'react-icons/fi';
import { collection, query, where, onSnapshot, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import useAuthStore from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/ui/Button';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const fieldMapping = [
  { key: 'student_id', en: 'Student ID', mr: 'विद्यार्थी आयडी' },
  { key: 'roll_no', en: 'Roll Number', mr: 'रोल क्रमांक' },
  { key: 'register_no', en: 'Register Number', mr: 'रजिस्टर क्रमांक' },
  { key: 'book_no', en: 'Book Number', mr: 'पुस्तक क्रमांक' },
  { key: 'last_name', en: 'Surname', mr: 'आडनाव' },
  { key: 'first_name', en: 'First Name', mr: 'नाव' },
  { key: 'middle_name', en: 'Middle Name', mr: 'वडिलांचे नाव' },
  { key: 'class', en: 'Class', mr: 'वर्ग' },
  { key: 'division', en: 'Division', mr: 'तुकडी' },
  { key: 'medium', en: 'Medium', mr: 'माध्यम' },
  { key: 'mobile', en: 'Mobile', mr: 'मोबाईल' },
  { key: 'email', en: 'Email', mr: 'ईमेल' },
  { key: 'aadhaar_no', en: 'Aadhaar Number', mr: 'आधार क्रमांक' },
  { key: 'apaar_id', en: 'APAAR ID', mr: 'अपार आयडी' },
  { key: 'pen_id', en: 'PEN ID', mr: 'पेन आयडी' },
  { key: 'photo', en: 'Photo (Base64/URL)', mr: 'फोटो (Base64/URL)' },
  { key: 'address', en: 'Address', mr: 'पत्ता' },
  { key: 'city', en: 'City/Village', mr: 'शहर/गाव' },
  { key: 'taluka', en: 'Taluka', mr: 'तालुका' },
  { key: 'district', en: 'District', mr: 'जिल्हा' },
  { key: 'state', en: 'State', mr: 'राज्य' },
  { key: 'pincode', en: 'Pincode', mr: 'पिनकोड' },
  { key: 'dob', en: 'Date of Birth', mr: 'जन्म तारीख' },
  { key: 'dob_words', en: 'Date of Birth (Words)', mr: 'जन्म तारीख (अक्षरी)' },
  { key: 'gender', en: 'Gender', mr: 'लिंग' },
  { key: 'religion', en: 'Religion', mr: 'धर्म' },
  { key: 'caste', en: 'Caste', mr: 'जात' },
  { key: 'sub_caste', en: 'Sub-Caste', mr: 'पोटजात' },
  { key: 'caste_category', en: 'Category', mr: 'प्रवर्ग' },
  { key: 'nationality', en: 'Nationality', mr: 'राष्ट्रीयत्व' },
  { key: 'birth_place', en: 'Birth Place', mr: 'जन्म ठिकाण' },
  { key: 'mother_name', en: 'Mother Name', mr: 'आईचे नाव' },
  { key: 'father_name', en: 'Father Name', mr: 'वडिलांचे नाव' },
  { key: 'father_occupation', en: 'Father Occupation', mr: 'वडिलांचा व्यवसाय' },
  { key: 'mother_occupation', en: 'Mother Occupation', mr: 'आईचा व्यवसाय' },
  { key: 'father_mobile', en: 'Father Mobile', mr: 'वडिलांचा मोबाईल' },
  { key: 'blood_group', en: 'Blood Group', mr: 'रक्तगट' },
  { key: 'admission_date', en: 'Admission Date', mr: 'प्रवेश तारीख' },
  { key: 'prev_school_name', en: 'Previous School', mr: 'मागील शाळा' },
  { key: 'prev_school_address', en: 'Prev School Address', mr: 'मागील शाळेचा पत्ता' },
  { key: 'prev_school_lc_no', en: 'Prev School LC No', mr: 'मागील शाळेचा दाखला क्र.' },
  { key: 'prev_school_lc_date', en: 'Prev School LC Date', mr: 'मागील शाळेचा दाखला तारीख' },
  { key: 'mother_tongue', en: 'Mother Tongue', mr: 'मातृभाषा' },
  { key: 'identification_mark', en: 'Identification Mark', mr: 'ओळख खूण' },
  { key: 'handicap_type', en: 'Handicap Type', mr: 'अपंगत्व प्रकार' },
  { key: 'bank_name', en: 'Bank Name', mr: 'बँकेचे नाव' },
  { key: 'account_no', en: 'Account Number', mr: 'खाते क्रमांक' },
  { key: 'ifsc_code', en: 'IFSC Code', mr: 'आयएफएससी कोड' },
  { key: 'branch', en: 'Branch', mr: 'शाखा' },
  { key: 'minority', en: 'Minority', mr: 'अल्पसंख्याक' },
  { key: 'minority_type', en: 'Minority Type', mr: 'अल्पसंख्याक प्रकार' }
];

const StudentList = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { t, isMarathi, formatNumber } = useLanguage();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [paperSize, setPaperSize] = useState('a4');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    setSelectedStudents([]);
  }, [searchTerm, filterClass, currentPage]);

  // Realtime listeners for Students
  useEffect(() => {
    if (!profile?.schoolId) return;

    setLoading(true);
    const q = query(
      collection(db, 'students'),
      where('schoolId', '==', profile.schoolId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort classes locally: numerically by roll number, then alphabetically by name
      items.sort((a, b) => {
        const rollA = parseInt(a.rollNumber || a.roll_no || 0, 10);
        const rollB = parseInt(b.rollNumber || b.roll_no || 0, 10);
        if (rollA !== rollB) return rollA - rollB;
        
        const nameA = String(a.fullName || a.name || '').toLowerCase();
        const nameB = String(b.fullName || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setStudents(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.schoolId]);

  // Load Classes dynamically
  useEffect(() => {
    if (!profile?.schoolId) return;

    const fetchClasses = async () => {
      try {
        const q = query(collection(db, 'classes'), where('schoolId', '==', profile.schoolId));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => {
          const nameA = String(a.className || '');
          const nameB = String(b.className || '');
          return nameA.localeCompare(nameB, undefined, { numeric: true });
        });
        setClasses(list);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    fetchClasses();
  }, [profile?.schoolId]);

  const filteredStudents = students.filter(student => {
    const fullName = String(student.fullName || student.name || '').toLowerCase();
    const admissionNo = String(student.admissionNumber || student.student_id || '').toLowerCase();
    const rollNo = String(student.rollNumber || student.roll_no || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(search) || admissionNo.includes(search) || rollNo.includes(search);
    
    const matchesClass = !filterClass || student.class === filterClass;
    return matchesSearch && matchesClass;
  });

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handleDelete = async (studentId) => {
    if (window.confirm(isMarathi ? 'तुम्हाला हा विद्यार्थी हटवायचा आहे का?' : 'Are you sure you want to delete this student?')) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
        toast.success(isMarathi ? 'विद्यार्थी यशस्वीरित्या हटवला गेला!' : 'Student deleted successfully!');
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error(isMarathi ? 'विद्यार्थी हटवण्यात त्रुटी आली!' : 'Error deleting student!');
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(currentStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(studentId => studentId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return;
    
    if (window.confirm(isMarathi ? `तुम्हाला खात्री आहे की तुम्ही निवडलेले ${selectedStudents.length} विद्यार्थी हटवू इच्छिता?` : `Are you sure you want to delete ${selectedStudents.length} selected students?`)) {
      try {
        setLoading(true);
        for (const studentId of selectedStudents) {
          await deleteDoc(doc(db, 'students', studentId));
        }
        setSelectedStudents([]);
        toast.success(isMarathi ? 'निवडलेले विद्यार्थी यशस्वीरित्या हटवले गेले!' : 'Selected students deleted successfully!');
      } catch (error) {
        console.error('Error bulk deleting students:', error);
        toast.error(isMarathi ? 'विद्यार्थी हटवण्यात त्रुटी आली!' : 'Error deleting students!');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkDeleteAllFiltered = async () => {
    if (filteredStudents.length === 0) return;
    
    const confirmText = isMarathi 
      ? `धोकादायक कृती: तुम्ही यादीतील सर्व ${filteredStudents.length} विद्यार्थी कायमचे हटवणार आहात! पुढे जायचे आहे का?` 
      : `DANGER: You are about to permanently delete all ${filteredStudents.length} students in this list! Proceed?`;
      
    if (window.confirm(confirmText)) {
      const secondConfirm = prompt(
        isMarathi ? 'हटवण्यासाठी "DELETE" असे टाईप करा:' : 'Type "DELETE" to confirm:'
      );
      
      if (secondConfirm !== 'DELETE') {
        alert(isMarathi ? 'प्रक्रिया रद्द केली.' : 'Action cancelled.');
        return;
      }

      try {
        setLoading(true);
        for (const student of filteredStudents) {
          await deleteDoc(doc(db, 'students', student.id));
        }
        setSelectedStudents([]);
        toast.success(isMarathi ? 'सर्व विद्यार्थी यशस्वीरित्या हटवले गेले!' : 'All students deleted successfully!');
      } catch (error) {
        console.error('Error bulk deleting students:', error);
        toast.error(isMarathi ? 'विद्यार्थी हटवण्यात त्रुटी आली!' : 'Error deleting students!');
      } finally {
        setLoading(false);
      }
    }
  };

  const exportToCSV = () => {
    const headers = fieldMapping.map(f => isMarathi ? f.mr : f.en);

    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(student => fieldMapping.map(f => {
        let val = '';
        if (f.key === 'photo') {
          val = student.photoURL || student.photo || '';
        } else if (f.key === 'roll_no') {
          val = student.rollNumber || student.roll_no || '';
        } else if (f.key === 'student_id') {
          val = student.admissionNumber || student.student_id || '';
        } else if (f.key === 'mobile') {
          val = student.mobileNumber || student.mobile || '';
        } else if (f.key === 'division') {
          val = student.section || student.division || '';
        } else if (f.key === 'father_name') {
          val = student.fatherName || student.father_name || '';
        } else if (f.key === 'mother_name') {
          val = student.motherName || student.mother_name || '';
        } else if (f.key === 'blood_group') {
          val = student.bloodGroup || student.blood_group || '';
        } else if (f.key === 'admission_date') {
          val = student.admissionDate || student.admission_date || '';
        } else {
          val = student[f.key] || '';
        }
        return `"${val.toString().replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_full_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isMarathi ? 'डेटा यशस्वीरित्या एक्सपोर्ट झाला!' : 'Data exported successfully!');
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      if (lines.length <= 1) return;

      const csvHeaders = lines[0].split(',').map(h => h.replace(/^"(.*)"$/, '$1').trim());
      const studentsToImport = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = [];
        let current = '';
        let inQuotes = false;
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const student = {};
        csvHeaders.forEach((header, index) => {
          const mapping = fieldMapping.find(f => f.en === header || f.mr === header);
          if (mapping) {
            student[mapping.key] = values[index] || '';
          }
        });
        
        if (student.student_id || student.first_name) {
          studentsToImport.push(student);
        }
      }

      if (window.confirm(isMarathi ? `आपण ${studentsToImport.length} विद्यार्थी इम्पोर्ट करू इच्छिता?` : `Do you want to import ${studentsToImport.length} students?`)) {
        setLoading(true);
        let importedCount = 0;
        let errorCount = 0;

        try {
          // Pre-load existing students map
          const existingMap = {};
          const currentSnapshot = await getDocs(query(collection(db, 'students'), where('schoolId', '==', profile?.schoolId)));
          currentSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const idKey = String(data.student_id || data.admissionNumber || '').trim();
            if (idKey) {
              existingMap[idKey] = doc.id;
            }
          });

          for (const s of studentsToImport) {
            try {
              const studentId = s.student_id || `S${Date.now()}${Math.floor(Math.random()*100)}`;
              const fullName = `${s.last_name || ''} ${s.first_name || ''} ${s.middle_name || ''}`.trim() || s.name || 'Unnamed Student';

              // Map all CSV keys back to upgraded Firestore schema model
              const studentData = {
                schoolId: profile.schoolId,
                student_id: studentId,
                admissionNumber: studentId,
                roll_no: s.roll_no || '',
                rollNumber: s.roll_no || '',
                fullName: fullName,
                name: fullName,
                last_name: s.last_name || '',
                first_name: s.first_name || '',
                middle_name: s.middle_name || '',
                class: s.class || '',
                division: s.division || '',
                section: s.division || '',
                medium: s.medium || '',
                mobile: s.mobile || '',
                mobileNumber: s.mobile || '',
                email: s.email || '',
                aadhaar_no: s.aadhaar_no || '',
                apaar_id: s.apaar_id || '',
                pen_id: s.pen_id || '',
                photoURL: s.photo || '',
                address: s.address || '',
                city: s.city || '',
                taluka: s.taluka || '',
                district: s.district || '',
                state: s.state || '',
                pincode: s.pincode || '',
                dob: s.dob || '',
                dob_words: s.dob_words || '',
                gender: s.gender || 'Male',
                religion: s.religion || '',
                caste: s.caste || '',
                sub_caste: s.sub_caste || '',
                caste_category: s.caste_category || 'OPEN',
                nationality: s.nationality || 'Indian',
                birth_place: s.birth_place || '',
                mother_name: s.mother_name || '',
                motherName: s.mother_name || '',
                father_name: s.father_name || '',
                fatherName: s.father_name || '',
                father_occupation: s.father_occupation || '',
                mother_occupation: s.mother_occupation || '',
                father_mobile: s.father_mobile || '',
                blood_group: s.blood_group || 'A+',
                bloodGroup: s.blood_group || 'A+',
                admission_date: s.admission_date || '',
                admissionDate: s.admission_date || '',
                prev_school_name: s.prev_school_name || '',
                prev_school_address: s.prev_school_address || '',
                prev_school_lc_no: s.prev_school_lc_no || '',
                prev_school_lc_date: s.prev_school_lc_date || '',
                mother_tongue: s.mother_tongue || '',
                identification_mark: s.identification_mark || '',
                handicap_type: s.handicap_type || 'None',
                bank_name: s.bank_name || '',
                account_no: s.account_no || '',
                ifsc_code: s.ifsc_code || '',
                branch: s.branch || '',
                minority: s.minority || 'No',
                minority_type: s.minority_type || '',
                register_no: s.register_no || '',
                book_no: s.book_no || '',
                status: 'active'
              };

              const existingDocId = existingMap[studentId];

              if (existingDocId) {
                await updateDoc(doc(db, 'students', existingDocId), studentData);
              } else {
                await addDoc(collection(db, 'students'), studentData);
              }
              importedCount++;
            } catch (err) {
              console.error('Import error for row:', err);
              errorCount++;
            }
          }
          toast.success(isMarathi 
            ? `${importedCount} विद्यार्थी यशस्वीरित्या अपडेट केले! ${errorCount > 0 ? `(${errorCount} मध्ये त्रुटी आली)` : ''}`
            : `${importedCount} students updated/imported successfully! ${errorCount > 0 ? `(${errorCount} errors)` : ''}`
          );
        } catch (err) {
          console.error(err);
          toast.error("Import failed");
        } finally {
          setLoading(false);
        }
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const exportToPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const docPDF = new jsPDF('l', 'mm', paperSize);
      const pageWidth = docPDF.internal.pageSize.getWidth();
      const pageHeight = docPDF.internal.pageSize.getHeight();
      const schoolName = profile?.schoolName || 'SCHOOL MANAGEMENT SYSTEM';

      const reportDiv = document.createElement('div');
      reportDiv.style.position = 'fixed';
      reportDiv.style.left = '-10000px';
      reportDiv.style.top = '0';
      reportDiv.style.width = paperSize === 'a3' ? '1600px' : '1100px';
      reportDiv.style.backgroundColor = 'white';
      reportDiv.style.padding = '40px';
      
      const title = isMarathi ? 'विद्यार्थी यादी' : 'Student List';
      const classStr = filterClass ? ` (${isMarathi ? 'वर्ग' : 'Class'}: ${filterClass})` : '';
      
      reportDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px; color: #1e1b4b; font-family: sans-serif;">${schoolName.toUpperCase()}</h1>
          <h2 style="margin: 10px 0 0 0; color: #4338ca; font-family: sans-serif;">${title}${classStr}</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: ${paperSize === 'a3' ? '12px' : '10px'}; font-family: sans-serif;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #999; padding: 8px; text-align: center;">${isMarathi ? 'आयडी' : 'ID'}</th>
              <th style="border: 1px solid #999; padding: 8px; text-align: center;">${isMarathi ? 'रोल नंबर' : 'Roll No'}</th>
              <th style="border: 1px solid #999; padding: 8px;">${isMarathi ? 'नाव' : 'Name'}</th>
              <th style="border: 1px solid #999; padding: 8px; text-align: center;">${isMarathi ? 'वर्ग' : 'Class'}</th>
              <th style="border: 1px solid #999; padding: 8px; text-align: center;">${isMarathi ? 'तुकडी' : 'Div'}</th>
              <th style="border: 1px solid #999; padding: 8px; text-align: center;">${isMarathi ? 'लिंग' : 'Gender'}</th>
              <th style="border: 1px solid #999; padding: 8px; text-align: center;">${isMarathi ? 'जन्म तारीख' : 'DOB'}</th>
              <th style="border: 1px solid #999; padding: 8px; text-align: center;">${isMarathi ? 'मोबाईल' : 'Mobile'}</th>
              <th style="border: 1px solid #999; padding: 8px;">${isMarathi ? 'पत्ता' : 'Address'}</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map(s => `
              <tr>
                <td style="border: 1px solid #999; padding: 8px; text-align: center;">${s.student_id || s.admissionNumber || s.id}</td>
                <td style="border: 1px solid #999; padding: 8px; text-align: center;">${s.rollNumber || s.roll_no || '-'}</td>
                <td style="border: 1px solid #999; padding: 8px; font-weight: bold;">${s.fullName || s.name}</td>
                <td style="border: 1px solid #999; padding: 8px; text-align: center;">${s.class || '-'}</td>
                <td style="border: 1px solid #999; padding: 8px; text-align: center;">${s.section || s.division || '-'}</td>
                <td style="border: 1px solid #999; padding: 8px; text-align: center;">${s.gender || '-'}</td>
                <td style="border: 1px solid #999; padding: 8px; text-align: center;">${s.dob || '-'}</td>
                <td style="border: 1px solid #999; padding: 8px; text-align: center;">${s.mobileNumber || s.mobile || '-'}</td>
                <td style="border: 1px solid #999; padding: 8px; font-size: 9px;">${[s.address, s.taluka ? (isMarathi ? 'ता. ' + s.taluka : 'Tal. ' + s.taluka) : null, s.district ? (isMarathi ? 'जि. ' + s.district : 'Dist. ' + s.district) : null].filter(Boolean).join(', ') || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 30px; text-align: right; font-size: 12px; font-style: italic; font-family: sans-serif;">
          Total Students: ${filteredStudents.length}
        </div>
      `;
      
      document.body.appendChild(reportDiv);
      
      const canvas = await html2canvas(reportDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      docPDF.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        docPDF.addPage();
        docPDF.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      docPDF.save(`StudentList_${paperSize.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.removeChild(reportDiv);
      toast.success(isMarathi ? 'PDF यशस्वीरित्या डाऊनलोड झाली!' : 'PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Error generating PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
            {isMarathi ? 'विद्यार्थी यादी लोड करत आहे...' : 'Loading students...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiUsers size={24} />
            {isMarathi ? 'विद्यार्थी यादी' : 'Student List'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>{isMarathi ? 'शाळेतील सर्व विद्यार्थ्यांचे रेकॉर्ड मॅनेज करा.' : 'Manage records, registrations, and details of all students.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={paperSize} 
            onChange={(e) => setPaperSize(e.target.value)}
            className="premium-select"
            style={{ padding: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', minWidth: '110px' }}
          >
            <option value="a4">PDF: A4</option>
            <option value="a3">PDF: A3 (Large)</option>
          </select>
          <button onClick={exportToPDF} className="btn btn-primary" disabled={isGeneratingPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiFileText size={16} />
            {isGeneratingPDF ? (isMarathi ? 'प्रोसेसिंग...' : 'Processing...') : (isMarathi ? 'PDF एक्सपोर्ट' : 'Export PDF')}
          </button>
          <button onClick={exportToCSV} className="btn btn-outline" title={isMarathi ? 'CSV एक्सपोर्ट' : 'Export CSV'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.65rem' }}>
            <FiDownload size={16} />
          </button>
          <label className="btn btn-outline" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.65rem', margin: 0 }} title={isMarathi ? 'CSV इम्पोर्ट' : 'Import CSV'}>
            <FiUpload size={16} />
            <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'relative' }}>
              <FiSearch size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={isMarathi ? 'विद्यार्थी शोधा (नाव, आयडी, रोल नं)...' : 'Search students (name, ID, roll)...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--background)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ minWidth: '150px' }}>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="premium-select"
              style={{ width: '100%' }}
            >
              <option value="">{isMarathi ? 'सर्व वर्ग' : 'All Classes'}</option>
              {classes.map(cls => (
                <option key={cls.id || cls.className} value={cls.className}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {selectedStudents.length > 0 && (
              <button onClick={handleBulkDelete} className="btn btn-danger" style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiTrash2 size={16} />
                {isMarathi ? `${selectedStudents.length} हटवा` : `Delete ${selectedStudents.length}`}
              </button>
            )}
            {filteredStudents.length > 0 && selectedStudents.length === 0 && (
              <button onClick={handleBulkDeleteAllFiltered} className="btn btn-outline" style={{ padding: '0.65rem 1rem', borderColor: 'var(--accent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }} title={isMarathi ? 'सर्व फिल्टर केलेले विद्यार्थी हटवा' : 'Delete all filtered students'}>
                <FiTrash2 size={16} />
                {isMarathi ? 'सर्व हटवा' : 'Delete All'}
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Data Grid Table */}
        <div 
          className="premium-scroll" 
          style={{ 
            overflowX: 'auto', 
            maxWidth: '100%', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--background)' }}>
                <th style={{ padding: '1rem', textAlign: 'center', width: '45px', minWidth: '45px', position: 'sticky', left: 0, backgroundColor: 'var(--surface)', zIndex: 12, borderRight: '1px solid var(--border)', borderBottom: '2px solid var(--border)' }}>
                  <input 
                    type="checkbox" 
                    checked={currentStudents.length > 0 && selectedStudents.length === currentStudents.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'विद्यार्थी आयडी' : 'Student ID'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'फोटो' : 'Photo'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'नाव' : 'Name'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'रोल नं' : 'Roll'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'वर्ग' : 'Class'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'तुकडी' : 'Div'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'रजिस्टर नं' : 'Reg No'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'मोबाईल' : 'Mobile'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'आधार' : 'Aadhaar'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'जन्म तारीख' : 'DOB'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'धर्म' : 'Religion'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'जात' : 'Caste'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'प्रवर्ग' : 'Category'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'मागील शाळा' : 'Prev School'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'आईचे नाव' : 'Mother Name'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'वडील व्यवसाय' : 'Father Occ.'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'पालक मोबाईल' : 'Parent Mobile'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'बँक नाव' : 'Bank'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'खाते क्र.' : 'Account No'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'अपार आयडी' : 'APAAR ID'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'पेन आयडी' : 'PEN ID'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  {isMarathi ? 'पत्ता' : 'Address'}
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: 'var(--text-main)', position: 'sticky', right: 0, backgroundColor: 'var(--surface)', zIndex: 12, borderLeft: '2px solid var(--border)', borderBottom: '2px solid var(--border)', boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.08)' }}>
                  {isMarathi ? 'क्रिया' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.length > 0 ? (
                currentStudents.map((student) => {
                  const isSelected = selectedStudents.includes(student.id);
                  const cellBg = isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--surface)';
                  
                  return (
                    <tr key={student.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent' }}>
                      <td style={{ padding: '1rem', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: cellBg, zIndex: 10, borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleSelectStudent(student.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)', borderBottom: '1px solid var(--border)' }}>
                        {student.admissionNumber || student.student_id || '-'}
                      </td>
                      <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)' }}>
                        {student.photoURL || student.photo ? (
                          <img 
                            src={student.photoURL || student.photo} 
                            alt="" 
                            style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border)' }} 
                          />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiUser size={20} color="var(--text-muted)" />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '600', borderBottom: '1px solid var(--border)' }}>
                        {student.fullName || student.name || 'Unnamed Student'}
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.rollNumber || student.roll_no || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.class || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.section || student.division || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.register_no || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.mobileNumber || student.mobile || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.aadhaar_no || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.dob || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.religion || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.caste || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.caste_category || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.prev_school_name || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.motherName || student.mother_name || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.father_occupation || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.father_mobile || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.bank_name || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.account_no || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.apaar_id || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.pen_id || '-'}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{[student.address, student.taluka ? (isMarathi ? 'ता. ' + student.taluka : 'Tal. ' + student.taluka) : null, student.district ? (isMarathi ? 'जि. ' + student.district : 'Dist. ' + student.district) : null].filter(Boolean).join(', ') || '-'}</td>
                      <td style={{ padding: '1rem', position: 'sticky', right: 0, backgroundColor: cellBg, zIndex: 10, borderLeft: '2px solid var(--border)', borderBottom: '1px solid var(--border)', boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            className="btn btn-sm btn-outline"
                            title={isMarathi ? 'पाहा' : 'View'}
                            onClick={() => navigate(`/admin/students/profile/${student.id}`)}
                            style={{ padding: '0.25rem 0.5rem' }}
                          >
                            <FiEye size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            title={isMarathi ? 'संपादित करा' : 'Edit'}
                            onClick={() => navigate(`/admin/students/edit/${student.id}`)}
                            style={{ padding: '0.25rem 0.5rem' }}
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            title={isMarathi ? 'हटवा' : 'Delete'}
                            onClick={() => handleDelete(student.id)}
                            style={{ padding: '0.25rem 0.5rem' }}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="24" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {isMarathi ? 'कोणतेही विद्यार्थी सापडले नाहीत' : 'No students found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {isMarathi
                ? `${formatNumber(indexOfFirstStudent + 1)}-${formatNumber(Math.min(indexOfLastStudent, filteredStudents.length))} एकूण ${formatNumber(filteredStudents.length)} विद्यार्थी`
                : `Showing ${formatNumber(indexOfFirstStudent + 1)}-${formatNumber(Math.min(indexOfLastStudent, filteredStudents.length))} of ${formatNumber(filteredStudents.length)} students`
              }
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '0.5rem 1rem' }}
              >
                <FiChevronLeft size={16} />
                {isMarathi ? 'आधीचे' : 'Previous'}
              </button>

              <span style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 1rem',
                fontSize: '0.9rem',
                color: 'var(--text-main)'
              }}>
                {isMarathi ? 'पान' : 'Page'} {currentPage} {isMarathi ? 'पासून' : 'of'} {totalPages}
              </span>

              <button
                className="btn btn-outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '0.5rem 1rem' }}
              >
                {isMarathi ? 'पुढील' : 'Next'}
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .premium-select {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--background);
          color: var(--text-main);
          outline: none;
          min-width: 150px;
        }
        /* Custom premium scrollbar styling */
        .premium-scroll::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .premium-scroll::-webkit-scrollbar-track {
          background: var(--background);
          border-radius: var(--radius-md);
        }
        .premium-scroll::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: var(--radius-md);
          border: 2px solid var(--background);
        }
        .premium-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--primary);
        }
      `}</style>
    </>
  );
};

export default StudentList;
