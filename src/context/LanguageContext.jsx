import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    'students.studentId': 'Student Admission ID',
    'students.bookNo': 'Book No',
    'students.registerNo': 'Register No',
    'students.admissionDate': 'Admission Date',
    'students.lastName': 'Last Name (Surname)',
    'students.firstName': 'First Name',
    'students.parentName': 'Father / Guardian Name',
    'students.gender': 'Gender',
    'students.male': 'Male',
    'students.female': 'Female',
    'students.other': 'Other',
    'students.aadhaar_no': 'Aadhaar Card No',
    'students.aadhaarPlaceholder': '12 digit Aadhaar',
    'students.parentPhone': 'Parent Contact No',
    'students.mobilePlaceholder': '10 digit mobile number',
    'students.parentEmail': 'Email Address',
    'students.dateOfBirth': 'Date of Birth',
    'students.dateOfBirthWords': 'Date of Birth in Words',
    'students.religion': 'Religion',
    'students.caste': 'Caste',
    'students.subCaste': 'Sub Caste',
    'students.casteCategory': 'Caste Category',
    'students.nationality': 'Nationality',
    'students.bloodGroup': 'Blood Group',
    'students.class': 'Class / Standard',
    'students.section': 'Division / Section',
    'students.medium': 'Medium of Instruction',
    'students.rollNumber': 'Roll Number',
    'students.addressDetails': 'Address Details',
    'students.state': 'State',
    'students.district': 'District',
    'students.taluka': 'Taluka',
    'students.cityVillage': 'City / Village',
    'students.prevSchoolDetails': 'Previous School Details',
    'students.otherDetails': 'Other Details',
    'students.parentsDetails': 'Parents details',
    'students.bankDetails': 'Bank Details',
    'students.fatherName': "Father's Full Name",
    'students.fatherOccupation': "Father's Occupation",
    'students.fatherMobile': "Father's Mobile",
    'students.motherName': "Mother's Full Name",
    'students.motherOccupation': "Mother's Occupation",
    'students.accountNo': 'Account Number',
    'students.ifscCode': 'IFSC Code',
    'students.branch': 'Branch Name',
    'students.updateStudent': 'Update Student Info',
    'students.registerStudent': 'Register Student',
    'common.cancel': 'Cancel',
    'common.select': '-- Select --'
  },
  mr: {
    'students.studentId': 'विद्यार्थी आयडी (Student ID)',
    'students.bookNo': 'पुस्तक क्रमांक (Book No)',
    'students.registerNo': 'रजिस्टर क्रमांक (Register No)',
    'students.admissionDate': 'प्रवेश तारीख',
    'students.lastName': 'आडनाव (Surname)',
    'students.firstName': 'नाव (First Name)',
    'students.parentName': 'वडिलांचे / पालकांचे नाव',
    'students.gender': 'लिंग (Gender)',
    'students.male': 'मुलगा (Male)',
    'students.female': 'मुलगी (Female)',
    'students.other': 'इतर (Other)',
    'students.aadhaar_no': 'आधार कार्ड क्रमांक',
    'students.aadhaarPlaceholder': '१२ अंकी आधार क्रमांक',
    'students.parentPhone': 'पालकांचा मोबाईल क्र.',
    'students.mobilePlaceholder': '१० अंकी मोबाईल क्रमांक',
    'students.parentEmail': 'ईमेल पत्ता',
    'students.dateOfBirth': 'जन्म तारीख (DOB)',
    'students.dateOfBirthWords': 'जन्म तारीख अक्षरी',
    'students.religion': 'धर्म (Religion)',
    'students.caste': 'जात (Caste)',
    'students.subCaste': 'पोटजात (Sub Caste)',
    'students.casteCategory': 'जात प्रवर्ग (Category)',
    'students.nationality': 'राष्ट्रीयत्व (Nationality)',
    'students.bloodGroup': 'रक्त गट (Blood Group)',
    'students.class': 'वर्ग / इयत्ता (Class)',
    'students.section': 'तुकडी (Division)',
    'students.medium': 'माध्यम (Medium)',
    'students.rollNumber': 'हजेरी क्रमांक (Roll No)',
    'students.addressDetails': 'पत्ता तपशील (Address Details)',
    'students.state': 'राज्य (State)',
    'students.district': 'जिल्हा (District)',
    'students.taluka': 'तालुका (Taluka)',
    'students.cityVillage': 'गाव / शहर (City/Village)',
    'students.prevSchoolDetails': 'पूर्वीच्या शाळेचा तपशील',
    'students.otherDetails': 'इतर तपशील (Other Details)',
    'students.parentsDetails': 'पालकांची माहिती (Parents Details)',
    'students.bankDetails': 'बँक तपशील (Bank Details)',
    'students.fatherName': 'वडिलांचे पूर्ण नाव',
    'students.fatherOccupation': 'वडिलांचा व्यवसाय',
    'students.fatherMobile': 'वडिलांचा मोबाईल क्रमांक',
    'students.motherName': 'आईचे नाव',
    'students.motherOccupation': 'आईचा व्यवसाय',
    'students.accountNo': 'बँक खाते क्रमांक',
    'students.ifscCode': 'आय.एफ.एस.सी कोड',
    'students.branch': 'शाखा (Branch)',
    'students.updateStudent': 'माहिती अपडेट करा',
    'students.registerStudent': 'विद्यार्थी नोंदणी करा',
    'common.cancel': 'रद्द करा',
    'common.select': '-- निवडा --'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // 'en' or 'mr'

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const isMarathi = language === 'mr';

  const formatNumber = (num) => {
    return num;
  };

  const formatDate = (dateStr) => {
    return dateStr;
  };

  const translateData = (data, field) => {
    return data;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isMarathi, formatNumber, formatDate, translateData }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // If not wrapped, return simple fallback functions
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key) => {
        const fallbacks = {
          'students.studentId': 'Student ID',
          'students.bookNo': 'Book No',
          'students.registerNo': 'Register No',
          'students.admissionDate': 'Admission Date',
          'students.lastName': 'Last Name',
          'students.firstName': 'First Name',
          'students.parentName': 'Father/Guardian Name',
          'students.gender': 'Gender',
          'students.male': 'Male',
          'students.female': 'Female',
          'students.other': 'Other',
          'students.aadhaar_no': 'Aadhaar No',
          'students.parentPhone': 'Parent Contact No',
          'students.parentEmail': 'Email',
          'students.dateOfBirth': 'Date of Birth',
          'students.dateOfBirthWords': 'Date of Birth in Words',
          'students.religion': 'Religion',
          'students.caste': 'Caste',
          'students.subCaste': 'Sub Caste',
          'students.casteCategory': 'Caste Category',
          'students.nationality': 'Nationality',
          'students.bloodGroup': 'Blood Group',
          'students.class': 'Class',
          'students.section': 'Section',
          'students.medium': 'Medium',
          'students.rollNumber': 'Roll Number',
          'students.addressDetails': 'Address Details',
          'students.state': 'State',
          'students.district': 'District',
          'students.taluka': 'Taluka',
          'students.cityVillage': 'City/Village',
          'students.prevSchoolDetails': 'Previous School Details',
          'students.otherDetails': 'Other Details',
          'students.parentsDetails': 'Parents Details',
          'students.bankDetails': 'Bank Details',
          'students.fatherName': "Father's Name",
          'students.fatherOccupation': "Father's Occupation",
          'students.fatherMobile': "Father's Mobile",
          'students.motherName': "Mother's Name",
          'students.motherOccupation': "Mother's Occupation",
          'students.accountNo': 'Account No',
          'students.ifscCode': 'IFSC Code',
          'students.branch': 'Branch Name',
          'students.updateStudent': 'Update Student Info',
          'students.registerStudent': 'Register Student',
          'common.cancel': 'Cancel',
          'common.select': '-- Select --'
        };
        return fallbacks[key] || key;
      },
      isMarathi: false,
      formatNumber: (n) => n,
      formatDate: (d) => d,
      translateData: (d) => d
    };
  }
  return context;
};
