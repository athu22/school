import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Hooks & Store
import { useAuthInit } from './hooks/useAuthInit';
import useAuthStore from './store/authStore';

// Components
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import Schools from './pages/super-admin/Schools';
import Admins from './pages/super-admin/Admins';
import AdminDashboard from './pages/admin/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';

// Student Pages
import StudentList from './pages/students/StudentList';
import AddStudent from './pages/students/AddStudent';
import EditStudent from './pages/students/EditStudent';
import StudentProfile from './pages/students/StudentProfile';

// Class Pages
import ClassList from './pages/classes/ClassList';
import ClassDetails from './pages/classes/ClassDetails';
import DivisionList from './pages/classes/DivisionList';

// Exam Pages
import ExamList from './pages/exams/ExamList';
import AddExam from './pages/exams/AddExam';
import MarkEntry from './pages/exams/MarkEntry';
import ResultList from './pages/exams/ResultList';

// Certificate Pages
import CertificateDashboard from './pages/certificates/CertificateDashboard';
import GenerateCertificate from './pages/certificates/GenerateCertificate';
import CertificatePreview from './pages/certificates/CertificatePreview';
import PresentySheet from './pages/admin/PresentySheet';
import PresentyReport from './pages/admin/PresentyReport';
import IDCards from './pages/admin/IDCards';
import Settings from './pages/admin/Settings';

// Accounting Pages
import AccountsDashboard from './pages/accounts/Dashboard';
import FeeCollection from './pages/accounts/FeeCollection';
import ExpenseEntry from './pages/accounts/ExpenseEntry';
import DayBook from './pages/accounts/DayBook';
import ProfitLoss from './pages/accounts/ProfitLoss';
import CashBook from './pages/accounts/CashBook';
import LedgerList from './pages/accounts/LedgerList';
import BalanceSheet from './pages/accounts/BalanceSheet';

function App() {
  // Initialize Auth State
  useAuthInit();

  const { profile, loading } = useAuthStore();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--background)' }}>
        <div className="premium-card">Loading System...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!profile ? <Login /> : <Navigate to={`/${profile.role}/dashboard`} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Super Admin Routes */}
          <Route path="/super-admin" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['super_admin']}>
                <DashboardLayout />
              </RoleRoute>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="schools" element={<Schools />} />
            <Route path="admins" element={<Admins />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </RoleRoute>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />

            {/* Student Routes */}
            <Route path="students" element={<StudentList />} />
            <Route path="students/add" element={<AddStudent />} />
            <Route path="students/edit/:id" element={<EditStudent />} />
            <Route path="students/profile/:id" element={<StudentProfile />} />
            
            {/* Attendance Route */}
            <Route path="attendance" element={<PresentySheet />} />
            <Route path="attendance/report" element={<PresentyReport />} />
            
            {/* ID Card Route */}
            <Route path="id-cards" element={<IDCards />} />

            {/* Class Routes */}
            <Route path="classes" element={<ClassList />} />
            <Route path="classes/:id" element={<ClassDetails />} />
            <Route path="divisions" element={<DivisionList />} />

            {/* Exam Routes */}
            <Route path="exams" element={<ExamList />} />
            <Route path="exams/add" element={<AddExam />} />
            <Route path="exams/mark-entry/:id" element={<MarkEntry />} />
            <Route path="exams/results/:id" element={<ResultList />} />
            <Route path="results" element={<ResultList />} />

            {/* Certificate Routes */}
            <Route path="certificates" element={<CertificateDashboard />} />
            <Route path="certificates/generate" element={<GenerateCertificate />} />
            <Route path="certificates/preview/:id" element={<CertificatePreview />} />

            {/* Accounting Routes */}
            <Route path="accounts" element={<AccountsDashboard />} />
            <Route path="accounts/fees" element={<FeeCollection />} />
            <Route path="accounts/expenses" element={<ExpenseEntry />} />
            <Route path="accounts/day-book" element={<DayBook />} />
            <Route path="accounts/profit-loss" element={<ProfitLoss />} />
            <Route path="accounts/cash-book" element={<CashBook />} />
            <Route path="accounts/ledgers" element={<LedgerList />} />
            <Route path="accounts/balance-sheet" element={<BalanceSheet />} />
            
            {/* School Profile Settings */}
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Teacher Routes */}
          <Route path="/teacher/*" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['teacher']}>
                <Routes>
                  <Route path="dashboard" element={<TeacherDashboard />} />
                </Routes>
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<div style={{ padding: '2rem' }}>404 - Page Not Found</div>} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </Router>
  );
}

export default App;
