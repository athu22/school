import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff, FiBriefcase } from 'react-icons/fi';
import { auth, db } from '../../firebase/config';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setProfile } = useAuthStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 2. Fetch User Data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await auth.signOut();
        toast.error("User record not found in system.");
        return;
      }

      const userData = userDoc.data();

      // 3. Verify School ID and Status
      if (userData.schoolId !== data.schoolId) {
        await auth.signOut();
        toast.error("Invalid School ID for this account.");
        return;
      }

      if (userData.status !== 'active') {
        await auth.signOut();
        toast.error("Your account is currently inactive.");
        return;
      }

      // 4. Update Store and Redirect
      setProfile(userData);
      toast.success(`Welcome back, ${userData.fullName}!`);

      // Redirect based on role
      switch (userData.role) {
        case 'super_admin':
          navigate('/super-admin/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        default:
          navigate('/');
      }

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to login. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      padding: '1.5rem'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass" 
        style={{
          width: '100%',
          maxWidth: '450px',
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>Portal Login</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)' }}>Enter your details to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* School ID */}
          <div className="form-group">
            <label style={{ display: 'block', color: '#fff', marginBottom: '0.5rem', fontSize: '0.875rem' }}>School ID</label>
            <div style={{ position: 'relative' }}>
              <FiBriefcase style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
              <input 
                {...register('schoolId', { required: 'School ID is required' })}
                type="text" 
                placeholder="e.g. SCH001"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>
            {errors.schoolId && <span style={{ color: '#fecaca', fontSize: '0.75rem' }}>{errors.schoolId.message}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label style={{ display: 'block', color: '#fff', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
              <input 
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                type="email" 
                placeholder="admin@school.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>
            {errors.email && <span style={{ color: '#fecaca', fontSize: '0.75rem' }}>{errors.email.message}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label style={{ display: 'block', color: '#fff', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
              <input 
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 2.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'rgba(255,255,255,0.6)' }}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && <span style={{ color: '#fecaca', fontSize: '0.75rem' }}>{errors.password.message}</span>}
          </div>

          <div style={{ textAlign: 'right' }}>
            <button 
              type="button" 
              onClick={() => navigate('/forgot-password')}
              style={{ background: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}
            >
              Forgot Password?
            </button>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            style={{ width: '100%', marginTop: '0.5rem', height: '3rem' }}
          >
            {isLoading ? 'Authenticating...' : 'Login to Dashboard'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
